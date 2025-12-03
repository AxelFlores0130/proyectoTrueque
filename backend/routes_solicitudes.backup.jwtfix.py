from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import db
from models import Solicitud, Producto, Notificacion

bp_sol = Blueprint("solicitudes", __name__, url_prefix="/api/solicitudes")


@bp_sol.post("")
@jwt_required()
def crear_solicitud():
    data = request.get_json() or {}
    uid = get_jwt_identity()
    if not uid:
        return jsonify(msg="No autorizado"), 401

    if not data.get("id_producto_objetivo"):
        return jsonify(msg="Falta id_producto_objetivo"), 400

    prod = Producto.query.get(data["id_producto_objetivo"])
    if not prod:
        return jsonify(msg="Producto objetivo no encontrado"), 404
    if prod.id_usuario == uid:
        return jsonify(msg="No puedes solicitar tu propio producto"), 400

    s = Solicitud(
        id_solicitante=uid,
        id_producto_objetivo=int(data["id_producto_objetivo"]),
        id_producto_ofrece=int(data["id_producto_ofrece"]) if data.get("id_producto_ofrece") else None,
        mensaje=data.get("mensaje"),
        ubicacion=data.get("ubicacion"),
        fecha_propuesta=data.get("fecha_propuesta"),
        estado="pendiente",
    )
    db.session.add(s)
    db.session.commit()

    # Notificar al dueño del producto
    try:
        n = Notificacion(
            id_usuario=prod.id_usuario,
            id_intercambio=None,
            mensaje=f"Nuevo interés en tu producto '{prod.titulo}'",
            leido=False,
        )
        db.session.add(n)
        db.session.commit()
    except Exception:
        db.session.rollback()

    return jsonify(id_solicitud=s.id_solicitud), 201


@bp_sol.get("/enviadas")
@jwt_required()
def listar_enviadas():
    uid = get_jwt_identity()
    items = Solicitud.query.filter_by(id_solicitante=uid).order_by(Solicitud.creado.desc()).all()
    return jsonify(
        [
            {
                "id_solicitud": s.id_solicitud,
                "id_solicitante": s.id_solicitante,
                "id_producto_objetivo": s.id_producto_objetivo,
                "id_producto_ofrece": s.id_producto_ofrece,
                "mensaje": s.mensaje,
                "ubicacion": s.ubicacion,
                "fecha_propuesta": s.fecha_propuesta.isoformat() if s.fecha_propuesta else None,
                "estado": s.estado,
                "creado": s.creado.isoformat() if s.creado else None,
            }
            for s in items
        ]
    ), 200


@bp_sol.get("/recibidas")
@jwt_required()
def listar_recibidas():
    uid = get_jwt_identity()
    items = (
        Solicitud.query.join(Producto, Solicitud.id_producto_objetivo == Producto.id_producto)
        .filter(Producto.id_usuario == uid)
        .order_by(Solicitud.creado.desc())
        .all()
    )
    return jsonify(
        [
            {
                "id_solicitud": s.id_solicitud,
                "id_solicitante": s.id_solicitante,
                "id_producto_objetivo": s.id_producto_objetivo,
                "id_producto_ofrece": s.id_producto_ofrece,
                "mensaje": s.mensaje,
                "ubicacion": s.ubicacion,
                "fecha_propuesta": s.fecha_propuesta.isoformat() if s.fecha_propuesta else None,
                "estado": s.estado,
                "creado": s.creado.isoformat() if s.creado else None,
            }
            for s in items
        ]
    ), 200


@bp_sol.route("/<int:id_solicitud>/aceptar", methods=["PUT"])
@jwt_required()
def aceptar_solicitud(id_solicitud: int):
    current_user_id = get_jwt_identity()
    solicitud = Solicitud.query.get_or_404(id_solicitud)

    # Solo dueño del producto objetivo puede aceptar
    try:
        producto_objetivo = solicitud.producto_objetivo
    except AttributeError:
        producto_objetivo = Producto.query.get(solicitud.id_producto_objetivo)

    if not producto_objetivo or producto_objetivo.id_usuario != current_user_id:
        return jsonify({"error": "No autorizado"}), 403

    solicitud.estado = "aceptado"
    db.session.commit()

    return jsonify(_solicitud_to_dict(solicitud, current_user_id)), 200


@bp_sol.route("/<int:id_solicitud>/rechazar", methods=["PUT"])
@jwt_required()
def rechazar_solicitud(id_solicitud: int):
    current_user_id = get_jwt_identity()
    solicitud = Solicitud.query.get_or_404(id_solicitud)

    try:
        producto_objetivo = solicitud.producto_objetivo
    except AttributeError:
        producto_objetivo = Producto.query.get(solicitud.id_producto_objetivo)

    if not producto_objetivo or producto_objetivo.id_usuario != current_user_id:
        return jsonify({"error": "No autorizado"}), 403

    solicitud.estado = "rechazado"
    db.session.commit()

    return jsonify(_solicitud_to_dict(solicitud, current_user_id)), 200


@bp_sol.route("/<int:id_solicitud>/cancelar", methods=["PUT"])
@jwt_required()
def cancelar_solicitud(id_solicitud: int):
    current_user_id = get_jwt_identity()
    solicitud = Solicitud.query.get_or_404(id_solicitud)

    if solicitud.id_solicitante != current_user_id:
        return jsonify({"error": "No autorizado"}), 403

    solicitud.estado = "cancelado"
    db.session.commit()

    return jsonify(_solicitud_to_dict(solicitud, current_user_id)), 200
