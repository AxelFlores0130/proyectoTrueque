# routes_solicitudes.py 
from sqlalchemy import text
from decimal import Decimal
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, Solicitud, Producto, Usuario

# Blueprint con prefijo /api/solicitudes
bp_solicitudes = Blueprint("solicitudes", __name__, url_prefix="/api/solicitudes")
bp_sol = bp_solicitudes     # alias para app.py
bp = bp_solicitudes         # alias opcional


def _owner_of_product(id_usuario: int, id_producto: int) -> bool:
    p = Producto.query.get(id_producto)
    return p is not None and p.id_usuario == id_usuario


# ------------------------------------------------
# CREAR SOLICITUD (MATCH)
# ------------------------------------------------
# ------------------------------------------------
# CREAR SOLICITUD (MATCH)
# ------------------------------------------------
@bp_solicitudes.route("", methods=["POST"])
@jwt_required()
def crear_solicitud():
    """
    Crea una solicitud de intercambio.

    Body JSON:
    {
      "id_producto_objetivo": number,
      "id_producto_ofrece": number | null,
      "mensaje": string | null,
      "diferencia_propuesta": number | null
    }
    """
    current_raw = get_jwt_identity()
    try:
        id_actual = int(current_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Token inválido"}), 401

    data = request.get_json() or {}
    print("DEBUG payload recibido en /api/solicitudes:", data)

    id_producto_objetivo = data.get("id_producto_objetivo")
    id_producto_ofrece = data.get("id_producto_ofrece")
    mensaje = data.get("mensaje") or "Me interesa tu producto"

    # ----- diferencia_propuesta -----
    raw_diff = data.get("diferencia_propuesta")
    print("DEBUG raw_diff recibido:", raw_diff, type(raw_diff))

    if raw_diff in (None, "", "null"):
        diferencia_propuesta = None
    else:
        try:
            diferencia_propuesta = float(raw_diff)
        except (TypeError, ValueError):
            print("DEBUG error parseando diferencia_propuesta")
            return jsonify({
                "error": "diferencia_propuesta inválida",
                "valor_recibido": raw_diff
            }), 400

    print("DEBUG diferencia_propuesta parseada:", diferencia_propuesta, type(diferencia_propuesta))

    if not id_producto_objetivo:
        return jsonify({"error": "Falta id_producto_objetivo"}), 400

    # Producto objetivo
    prod_obj = Producto.query.get(id_producto_objetivo)
    if not prod_obj:
        return jsonify({"error": "Producto objetivo no existe"}), 404

    # No puedes solicitar tu propio producto
    if prod_obj.id_usuario == id_actual:
        return jsonify({"error": "No puedes solicitar tu propio producto"}), 400

    # Si ofrece producto, verificar que sea suyo
    if id_producto_ofrece:
        if not _owner_of_product(id_actual, id_producto_ofrece):
            return jsonify({"error": "No eres dueño del producto que ofreces"}), 403

    ahora = datetime.utcnow()

    # Creamos con el ORM (incluyendo diferencia_propuesta)
    nueva = Solicitud(
        id_solicitante=id_actual,
        id_producto_objetivo=id_producto_objetivo,
        id_producto_ofrece=id_producto_ofrece,
        mensaje=mensaje,
        ubicacion=prod_obj.ubicacion,
        fecha_propuesta=ahora,
        diferencia_propuesta=diferencia_propuesta,
        estado="pendiente",
        confirmo_solicitante=True,
        confirmo_receptor=False,
        creado=ahora,
    )

    db.session.add(nueva)
    # flush para asegurar que ya tenga id_solicitud asignado
    db.session.flush()
    print("DEBUG ORM antes de commit -> id:", nueva.id_solicitud,
          "dif:", nueva.diferencia_propuesta)

    # Fallback: forzamos el valor con un UPDATE directo
    if diferencia_propuesta is not None:
        db.session.execute(
            text("""
                UPDATE solicitudes
                SET diferencia_propuesta = :dif
                WHERE id_solicitud = :id
            """),
            {"dif": diferencia_propuesta, "id": nueva.id_solicitud}
        )
        print("DEBUG UPDATE manual aplicado con diferencia_propuesta:", diferencia_propuesta)

    db.session.commit()

    # Comprobación directa en DB
    valor_db = db.session.execute(
        text("SELECT diferencia_propuesta FROM solicitudes WHERE id_solicitud = :id"),
        {"id": nueva.id_solicitud}
    ).scalar()
    print("DEBUG valor en DB despues de commit:", valor_db, type(valor_db))

    return jsonify(nueva.to_card(id_actual)), 201



# ------------------------------------------------
# LISTAR SOLICITUDES RECIBIDAS
# ------------------------------------------------
@bp_solicitudes.route("/recibidas", methods=["GET"])
@jwt_required()
def listar_recibidas():
    current_raw = get_jwt_identity()
    try:
        id_actual = int(current_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Token inválido"}), 401

    # solicitudes donde el producto objetivo es mío
    solicitudes = (
        Solicitud.query
        .join(Producto, Solicitud.id_producto_objetivo == Producto.id_producto)
        .filter(Producto.id_usuario == id_actual)
        .order_by(Solicitud.creado.desc())
        .all()
    )

    data = [s.to_card(id_actual) for s in solicitudes]
    return jsonify(data), 200


# ------------------------------------------------
# LISTAR SOLICITUDES ENVIADAS
# ------------------------------------------------
@bp_solicitudes.route("/enviadas", methods=["GET"])
@jwt_required()
def listar_enviadas():
    current_raw = get_jwt_identity()
    try:
        id_actual = int(current_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Token inválido"}), 401

    solicitudes = (
        Solicitud.query
        .filter(Solicitud.id_solicitante == id_actual)
        .order_by(Solicitud.creado.desc())
        .all()
    )

    data = [s.to_card(id_actual) for s in solicitudes]
    return jsonify(data), 200


# ------------------------------------------------
# ACEPTAR SOLICITUD
# ------------------------------------------------
@bp_solicitudes.route("/<int:id_solicitud>/aceptar", methods=["PUT"])
@jwt_required()
def aceptar_solicitud(id_solicitud: int):
    current_raw = get_jwt_identity()
    try:
        id_actual = int(current_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Token inválido"}), 401

    s = Solicitud.query.get_or_404(id_solicitud)
    prod_obj = Producto.query.get(s.id_producto_objetivo)

    # Solo el dueño del producto objetivo puede aceptar
    if not prod_obj or prod_obj.id_usuario != id_actual:
        return jsonify({"error": "No autorizado"}), 403

    s.estado = "aceptado"
    s.confirmo_receptor = True
    db.session.commit()

    return jsonify(s.to_card(id_actual)), 200


# ------------------------------------------------
# RECHAZAR SOLICITUD
# ------------------------------------------------
@bp_solicitudes.route("/<int:id_solicitud>/rechazar", methods=["PUT"])
@jwt_required()
def rechazar_solicitud(id_solicitud: int):
    current_raw = get_jwt_identity()
    try:
        id_actual = int(current_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Token inválido"}), 401

    s = Solicitud.query.get_or_404(id_solicitud)
    prod_obj = Producto.query.get(s.id_producto_objetivo)

    if not prod_obj or prod_obj.id_usuario != id_actual:
        return jsonify({"error": "No autorizado"}), 403

    s.estado = "rechazado"
    db.session.commit()

    return jsonify(s.to_card(id_actual)), 200


# ------------------------------------------------
# CANCELAR SOLICITUD (solicitante)
# ------------------------------------------------
@bp_solicitudes.route("/<int:id_solicitud>/cancelar", methods=["PUT"])
@jwt_required()
def cancelar_solicitud(id_solicitud: int):
    current_raw = get_jwt_identity()
    try:
        id_actual = int(current_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Token inválido"}), 401

    s = Solicitud.query.get_or_404(id_solicitud)

    if s.id_solicitante != id_actual:
        return jsonify({"error": "Solo el solicitante puede cancelar"}), 403

    s.estado = "cancelado"
    db.session.commit()

    return jsonify(s.to_card(id_actual)), 200
