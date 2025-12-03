from flask import Blueprint, request, jsonify
from models import db, Usuario
from flask_jwt_extended import create_access_token
from datetime import timedelta
from werkzeug.security import check_password_hash

bp_auth = Blueprint("bp_auth", __name__, url_prefix="/api/auth")

def _verify_password(stored: str, provided: str) -> bool:
    if not stored:
        return False
    s = (stored or "").strip()
    p = (provided or "").strip()
    # Si parece hash conocido -> validar con check_password_hash
    if s.startswith("pbkdf2:") or s.startswith("$2") or "argon2" in s or "scrypt" in s:
        try:
            return check_password_hash(s, p)
        except Exception:
            return False
    # Si no parece hash -> comparar texto plano
    return s == p

@bp_auth.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True, silent=True) or {}
    correo = (data.get("correo") or data.get("email") or "").strip().lower()
    pwd = (data.get("contrasena") or data.get("password") or "").strip()

    # Buscar usuario por correo (case-insensitive)
    u = Usuario.query.filter(Usuario.correo.ilike(correo)).first()

    # Validar existencia, contraseña y verificado=1/True
    if not u or not _verify_password(u.contrasena, pwd) or not (u.verificado == 1 or u.verificado is True):
        return jsonify({"msg": "Credenciales inválidas"}), 401

    token = create_access_token(identity=u.id_usuario, expires_delta=timedelta(days=7))
    return jsonify({
        "token": token,
        "usuario": {
            "id_usuario": u.id_usuario,
            "nombre_completo": u.nombre_completo,
            "correo": u.correo,
            "rol": (u.rol or "cliente"),
            "verificado": bool(u.verificado),
        }
    })
