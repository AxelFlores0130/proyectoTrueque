from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash
from models import db, Usuario

# Blueprint principal de auth
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# Aliases por si app.py importa con otro nombre
bp_auth = auth_bp
bp = auth_bp


def _password_matches(stored: str | None, provided: str) -> bool:
    """
    Compara la contraseña proporcionada contra la almacenada.
    - Si la almacenada tiene pinta de hash (pbkdf2, bcrypt, argon2, etc.), usa check_password_hash.
    - Si no, compara texto plano.
    """
    if not stored:
        return False

    s = stored.strip()

    # Prefijos típicos de hashes
    hash_prefixes = (
        "pbkdf2:",         # generate_password_hash por defecto
        "scrypt:",
        "sha256$",
        "argon2",
        "$2b$", "$2a$",    # bcrypt
        "bcrypt$",
    )

    try:
        if s.startswith(hash_prefixes):
            return check_password_hash(s, provided)
    except Exception:
        # si falla el check, caemos a comparación directa
        pass

    # Comparación texto plano
    return s == provided


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Login por correo + contrasena (campo 'contrasena' de la BD).
    Body JSON:
      { "correo": "...", "contrasena": "..." }
    """
    data = request.get_json() or {}
    correo = data.get("correo")
    contrasena = data.get("contrasena")  # <-- debe ser 'contrasena' como en la BD

    if not correo or not contrasena:
        return jsonify({"error": "Faltan correo o contrasena"}), 400

    usuario: Usuario | None = Usuario.query.filter_by(correo=correo).first()
    if not usuario:
        return jsonify({"error": "Credenciales inválidas"}), 401

    if not _password_matches(usuario.contrasena, contrasena):
        return jsonify({"error": "Credenciales inválidas"}), 401

    # identity = id_usuario (entero), como tú lo usas en el resto de la app
    access_token = create_access_token(identity=str(usuario.id_usuario))

    user_payload = {
        "id_usuario": usuario.id_usuario,
        "nombre_completo": usuario.nombre_completo,
        "correo": usuario.correo,
        "telefono": usuario.telefono,
        "rol": usuario.rol,
        "verificado": usuario.verificado,
        "fecha_registro": usuario.fecha_registro.isoformat() if usuario.fecha_registro else None,
    }

    return jsonify({"token": access_token, "usuario": user_payload}), 200


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Registro básico:
      - nombre_completo
      - correo
      - telefono (opcional)
      - contrasena
      - rol (opcional, por defecto 'cliente')
    Guarda contrasena tal cual la recibe (texto plano), para que coincida con lo que insertes en SQL.
    """
    data = request.get_json() or {}

    nombre = data.get("nombre_completo")
    correo = data.get("correo")
    telefono = data.get("telefono")
    contrasena = data.get("contrasena")
    rol = data.get("rol") or "cliente"

    if not nombre or not correo or not contrasena:
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    # Validar rol
    if rol not in ("cliente", "administrador"):
        rol = "cliente"

    # Verificar que no exista el correo
    if Usuario.query.filter_by(correo=correo).first():
        return jsonify({"error": "El correo ya está registrado"}), 400

    nuevo = Usuario(
        nombre_completo=nombre,
        correo=correo,
        telefono=telefono,
        contrasena=contrasena,  # texto plano para que coincida con lo que usas en tus inserts
        rol=rol,
        verificado=1,
    )

    db.session.add(nuevo)
    db.session.commit()

    return jsonify({"message": "Usuario registrado correctamente"}), 201


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """
    Devuelve los datos del usuario logueado (a partir del JWT).
    """
    current_id_str = get_jwt_identity()
    try:
        current_id = int(current_id_str)
    except (TypeError, ValueError):
        return jsonify({"error": "Token inválido"}), 401

    usuario: Usuario | None = Usuario.query.get(current_id)
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404

    user_payload = {
        "id_usuario": usuario.id_usuario,
        "nombre_completo": usuario.nombre_completo,
        "correo": usuario.correo,
        "telefono": usuario.telefono,
        "rol": usuario.rol,
        "verificado": usuario.verificado,
        "fecha_registro": usuario.fecha_registro.isoformat() if usuario.fecha_registro else None,
    }
    return jsonify(user_payload), 200
