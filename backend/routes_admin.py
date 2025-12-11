# routes_admin.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Usuario, Categoria, Intercambio, HistorialIntercambio, Producto

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

def _require_admin() -> Usuario | None:
    """
    Obtiene el usuario del token y valida que sea administrador.
    Tu token guarda identity como string, así que lo convertimos a int.
    """
    current_id_str = get_jwt_identity()
    try:
        current_id = int(current_id_str)
    except (TypeError, ValueError):
        return None

    usuario: Usuario | None = Usuario.query.get(current_id)
    if not usuario or usuario.rol != "administrador":
        return None
    return usuario


# ================= USUARIOS ===================

@admin_bp.route("/usuarios", methods=["GET"])
@jwt_required()
def admin_get_usuarios():
    admin = _require_admin()
    if not admin:
        return jsonify({"error": "No autorizado"}), 403

    # Todos los clientes; si quieres incluir admins, quita el filter_by
    usuarios = Usuario.query.filter_by(rol="cliente").all()

    data = []
    for u in usuarios:
        data.append({
            "id_usuario": u.id_usuario,
            "nombre_completo": u.nombre_completo,
            "correo": u.correo,
            "telefono": u.telefono,
            "fecha_registro": u.fecha_registro.isoformat() if u.fecha_registro else None,
            "verificado": u.verificado,
            "rol": u.rol,
        })
    return jsonify(data), 200


@admin_bp.route("/usuarios/<int:id_usuario>/verificado", methods=["PATCH"])
@jwt_required()
def admin_update_verificado(id_usuario: int):
    admin = _require_admin()
    if not admin:
        return jsonify({"error": "No autorizado"}), 403

    body = request.get_json() or {}
    verificado = body.get("verificado")  # booleano esperado

    usuario = Usuario.query.get_or_404(id_usuario)
    usuario.verificado = 1 if verificado else 0
    db.session.commit()

    return jsonify({
        "id_usuario": usuario.id_usuario,
        "verificado": usuario.verificado
    }), 200


@admin_bp.route("/usuarios/<int:id_usuario>/historial", methods=["GET"])
@jwt_required()
def admin_historial_usuario(id_usuario: int):
    admin = _require_admin()
    if not admin:
        return jsonify({"error": "No autorizado"}), 403

    # Ajusta estos campos a como realmente se llaman en tu modelo Intercambio
    intercambios = Intercambio.query.filter(
        (Intercambio.id_usuario_solicitante == id_usuario) |
        (Intercambio.id_usuario_receptor == id_usuario)
    ).all()

    resultado = []
    for it in intercambios:
        historial = HistorialIntercambio.query.filter_by(
            id_intercambio=it.id_intercambio
        ).order_by(HistorialIntercambio.fecha_cambio.desc()).all()

        producto_obj = Producto.query.get(it.id_producto_objetivo)
        producto_ofr = Producto.query.get(getattr(it, "id_producto_ofrece", None)) if getattr(it, "id_producto_ofrece", None) else None

        resultado.append({
            "id_intercambio": it.id_intercambio,
            "estado_actual": it.estado,
            "creado": it.creado.isoformat() if getattr(it, "creado", None) else None,
            "producto_objetivo": producto_obj.titulo if producto_obj else None,
            "producto_ofrece": producto_ofr.titulo if producto_ofr else None,
            "historial": [
                {
                    "id_historial": h.id_historial,
                    "estado": h.estado,
                    "fecha_cambio": h.fecha_cambio.isoformat() if h.fecha_cambio else None,
                    "comentario": h.comentario,
                }
                for h in historial
            ]
        })

    return jsonify(resultado), 200


# ================= CATEGORÍAS ===================

@admin_bp.route("/categorias", methods=["GET"])
@jwt_required()
def admin_get_categorias():
    admin = _require_admin()
    if not admin:
        return jsonify({"error": "No autorizado"}), 403

    categorias = Categoria.query.order_by(Categoria.id_categoria).all()
    data = [{
        "id_categoria": c.id_categoria,
        "nombre": c.nombre,
        "descripcion": c.descripcion
    } for c in categorias]
    return jsonify(data), 200


@admin_bp.route("/categorias", methods=["POST"])
@jwt_required()
def admin_create_categoria():
    admin = _require_admin()
    if not admin:
        return jsonify({"error": "No autorizado"}), 403

    body = request.get_json() or {}
    nombre = body.get("nombre")
    descripcion = body.get("descripcion")

    if not nombre:
        return jsonify({"error": "El nombre es obligatorio"}), 400

    nueva = Categoria(nombre=nombre, descripcion=descripcion)
    db.session.add(nueva)
    db.session.commit()

    return jsonify({
        "id_categoria": nueva.id_categoria,
        "nombre": nueva.nombre,
        "descripcion": nueva.descripcion
    }), 201
