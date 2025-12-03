# routes_solicitudes.py

from decimal import Decimal
from sqlalchemy import text
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from models import db, Solicitud, Producto, Usuario, Notificacion, Intercambio

# Blueprint con prefijo /api/solicitudes
bp_solicitudes = Blueprint("solicitudes", __name__, url_prefix="/api/solicitudes")
bp_sol = bp_solicitudes      # alias para app.py
bp = bp_solicitudes          # alias opcional


def _owner_of_product(id_usuario: int, id_producto: int) -> bool:
    p = Producto.query.get(id_producto)
    return p is not None and p.id_usuario == id_usuario


# ------------------------------------------------
# CREAR SOLICITUD (MATCH)
# ------------------------------------------------
@bp_solicitudes.route("", methods=["POST"])
@jwt_required()
def crear_solicitud():
    """
    Body JSON:
    {
      "id_producto_objetivo": number,
      "id_producto_ofrece": number | null,
      "mensaje": string | null,
      "diferencia_propuesta": number | null
    }
    """
    print(">>> USANDO NUEVO routes_solicitudes.py <<<")

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
            diferencia_propuesta = Decimal(str(raw_diff))  # usar Decimal para Numeric
        except Exception as e:
            print("DEBUG error parseando diferencia_propuesta:", e)
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
    db.session.commit()

    # Comprobación directa en DB (debug)
    valor_db = db.session.execute(
        text("SELECT diferencia_propuesta FROM solicitudes WHERE id_solicitud = :id"),
        {"id": nueva.id_solicitud}
    ).scalar()
    print("DEBUG valor en DB despues de commit:", valor_db, type(valor_db))

    # Notificar al dueño del producto (opcional, como en tu archivo viejo)
    try:
        n = Notificacion(
            id_usuario=prod_obj.id_usuario,
            id_intercambio=None,
            mensaje=f"Nuevo interés en tu producto '{prod_obj.titulo}'",
            leido=False,
        )
        db.session.add(n)
        db.session.commit()
    except Exception as e:
        print("WARN al crear notificación:", e)
        db.session.rollback()

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

    # solicitudes donde el producto objetivo es mío Y están pendientes
    solicitudes = (
        Solicitud.query
        .join(Producto, Solicitud.id_producto_objetivo == Producto.id_producto)
        .filter(Producto.id_usuario == id_actual)
        .filter(Solicitud.estado == "pendiente")  # 👈 SOLO pendientes
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

    estado_anterior = s.estado

    s.estado = "aceptado"
    s.confirmo_receptor = True

    # 👇 SOLO si antes no estaba aceptada, creamos el intercambio
    if estado_anterior != "aceptado":
        crear_intercambio_desde_solicitud(s)

    db.session.commit()

    return jsonify(s.to_card(id_actual)), 200

def crear_intercambio_desde_solicitud(solicitud: Solicitud):
    """
    Crea un registro en 'intercambios' cuando la solicitud cambia a estado 'aceptado'.
    Se asegura de no duplicar por id_solicitud.
    """

    # ¿Ya existe intercambio para esta solicitud? (por si llaman dos veces al endpoint)
    existente = Intercambio.query.filter_by(id_solicitud=solicitud.id_solicitud).first()
    if existente:
        return

    # Producto objetivo (el dueño es el receptor)
    prod_obj = Producto.query.get_or_404(solicitud.id_producto_objetivo)

    # Participantes:
    # - solicitante: el que mandó la solicitud (ofrece producto / dinero)
    # - dueño del producto objetivo: el receptor
    id_usuario_ofrece = solicitud.id_solicitante          # 👈 nombre tal cual en tu modelo
    id_usuario_recibe = prod_obj.id_usuario

    # Diferencia monetaria
    diferencia = solicitud.diferencia_propuesta
    if diferencia is None:
        diferencia = Decimal("0.00")

    # Fecha de solicitud para el intercambio
    fecha_solicitud = getattr(solicitud, "fecha_propuesta", None) or solicitud.creado or datetime.utcnow()

    intercambio = Intercambio(
        id_solicitud=solicitud.id_solicitud,
        id_producto_ofrecido=solicitud.id_producto_ofrece,
        id_producto_solicitado=solicitud.id_producto_objetivo,
        id_usuario_ofrece=id_usuario_ofrece,
        id_usuario_recibe=id_usuario_recibe,
        diferencia_monetaria=diferencia,
        estado="pendiente",
        estado_solicitante="pendiente",
        estado_receptor="pendiente",
        fecha_solicitud=fecha_solicitud,
        fecha_actualizacion=datetime.utcnow(),
    )

    db.session.add(intercambio)



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

@bp_solicitudes.route("/<int:id_solicitud>/reofertar", methods=["PUT"])
@jwt_required()
def reofertar_solicitud(id_solicitud: int):
    """
    Permite volver a enviar una solicitud ya existente (por ejemplo rechazada),
    actualizando diferencia_propuesta y/o el producto que se ofrece.

    Body JSON:
    {
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

    s = Solicitud.query.get_or_404(id_solicitud)

    # Solo el solicitante puede reofertar
    if s.id_solicitante != id_actual:
        return jsonify({"error": "Solo el solicitante puede reofertar"}), 403

    data = request.get_json() or {}
    print("DEBUG reofertar payload:", data)

    # --- diferencia_propuesta ---
    raw_diff = data.get("diferencia_propuesta", s.diferencia_propuesta)
    if raw_diff in (None, "", "null"):
        diferencia_propuesta = None
    else:
        try:
            diferencia_propuesta = float(raw_diff)
        except (TypeError, ValueError):
            return jsonify({
                "error": "diferencia_propuesta inválida",
                "valor_recibido": raw_diff
            }), 400

    # --- producto_ofrece (opcional cambiarlo más adelante) ---
    nuevo_id_ofrece = data.get("id_producto_ofrece", s.id_producto_ofrece)
    if nuevo_id_ofrece:
        if not _owner_of_product(id_actual, nuevo_id_ofrece):
            return jsonify({"error": "No eres dueño del producto que ofreces"}), 403

    # --- mensaje ---
    nuevo_mensaje = data.get("mensaje", s.mensaje or "Me interesa tu producto")

    # Actualizamos la misma solicitud
    from datetime import datetime as _dt

    s.id_producto_ofrece = nuevo_id_ofrece
    s.diferencia_propuesta = diferencia_propuesta
    s.mensaje = nuevo_mensaje
    s.estado = "pendiente"          # 👈 vuelve a estar pendiente
    s.confirmo_solicitante = True
    s.confirmo_receptor = False
    s.creado = _dt.utcnow()         # opcional: se re-fecha como nueva

    db.session.commit()
    print("DEBUG solicitud reofertada:", s.id_solicitud, s.diferencia_propuesta)

    return jsonify(s.to_card(id_actual)), 200


