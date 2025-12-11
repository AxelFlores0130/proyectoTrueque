# routes_intercambios.py
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
from datetime import datetime, timedelta

from models import db, Intercambio, IntercambioMensaje, Producto, Usuario

# 👇 importa tu instancia de socketio (ajusta si tu app se llama distinto)
from app import socketio

bp_intercambios = Blueprint("intercambios", __name__, url_prefix="/api/intercambios")


def usuario_to_dict(u: Usuario):
    if not u:
        return None

    nombre = (
        getattr(u, "nombre", None)
        or getattr(u, "nombre_completo", None)
        or getattr(u, "nombre_usuario", None)
        or ""
    )

    return {
        "id_usuario": u.id_usuario,
        "nombre": nombre,
        "avatar_url": getattr(u, "avatar_url", None),
    }


def producto_to_card(p: Producto):
    if not p:
        return None
    return {
        "id_producto": p.id_producto,
        "titulo": p.titulo,
        "imagen": getattr(p, "imagen_url", None),
        "precio": float(p.valor_estimado) if getattr(p, "valor_estimado", None) is not None else None,
    }


def _serializar_intercambio(i: Intercambio, id_usuario_actual: int):
    usuario_ofrece = Usuario.query.get(i.id_usuario_ofrece)
    usuario_recibe = Usuario.query.get(i.id_usuario_recibe)
    prod_ofrece = Producto.query.get(i.id_producto_ofrecido) if i.id_producto_ofrecido else None
    prod_solicita = Producto.query.get(i.id_producto_solicitado)

    soy_ofertante = (i.id_usuario_ofrece == id_usuario_actual)

    return {
        "id_intercambio": i.id_intercambio,
        "estado": i.estado,
        "estado_solicitante": i.estado_solicitante,
        "estado_receptor": i.estado_receptor,
        "diferencia_monetaria": str(i.diferencia_monetaria),
        "yo_soy_ofertante": soy_ofertante,
        "usuario_ofrece": usuario_to_dict(usuario_ofrece),
        "usuario_recibe": usuario_to_dict(usuario_recibe),
        "producto_ofrece": producto_to_card(prod_ofrece),
        "producto_objetivo": producto_to_card(prod_solicita),
        "fecha_limite_confirmacion": (
            i.fecha_limite_confirmacion.isoformat() if i.fecha_limite_confirmacion else None
        ),
    }


# --------------------------------------------------------
# LISTAR INTERCAMBIOS EN PROCESO
# --------------------------------------------------------
@bp_intercambios.route("/en_proceso", methods=["GET"])
@jwt_required()
def listar_en_proceso():
    raw = get_jwt_identity()
    try:
        id_usuario_actual = int(raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Token inválido"}), 401

    intercambios = (
        Intercambio.query
        .filter(
            Intercambio.estado == "pendiente",
            or_(
                Intercambio.id_usuario_ofrece == id_usuario_actual,
                Intercambio.id_usuario_recibe == id_usuario_actual,
            )
        )
        .order_by(Intercambio.fecha_actualizacion.desc())
        .all()
    )

    usuario_actual = Usuario.query.get(id_usuario_actual)

    resultado = []
    for i in intercambios:
        soy_ofertante = (i.id_usuario_ofrece == id_usuario_actual)

        usuario_ofrece = Usuario.query.get(i.id_usuario_ofrece)
        usuario_recibe = Usuario.query.get(i.id_usuario_recibe)
        otro = usuario_recibe if soy_ofertante else usuario_ofrece

        prod_ofrece = Producto.query.get(i.id_producto_ofrecido) if i.id_producto_ofrecido else None
        prod_solicita = Producto.query.get(i.id_producto_solicitado)

        resultado.append({
            "id_intercambio": i.id_intercambio,
            "estado": i.estado,
            "estado_solicitante": i.estado_solicitante,
            "estado_receptor": i.estado_receptor,
            "diferencia_monetaria": str(i.diferencia_monetaria),
            "soy_ofertante": soy_ofertante,
            "yo": usuario_to_dict(usuario_actual),
            "otro": usuario_to_dict(otro),
            "producto_ofrece": producto_to_card(prod_ofrece),
            "producto_objetivo": producto_to_card(prod_solicita),
            "fecha_solicitud": i.fecha_solicitud.isoformat() if i.fecha_solicitud else None,
            "fecha_limite_confirmacion": (
                i.fecha_limite_confirmacion.isoformat() if i.fecha_limite_confirmacion else None
            ),
        })

    return jsonify(resultado), 200


# --------------------------------------------------------
# DETALLE DE UN INTERCAMBIO
# --------------------------------------------------------
@bp_intercambios.route("/<int:id_intercambio>", methods=["GET"])
@jwt_required()
def obtener_intercambio(id_intercambio):
    raw = get_jwt_identity()
    try:
        id_usuario_actual = int(raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Token inválido"}), 401

    i = Intercambio.query.get_or_404(id_intercambio)

    if id_usuario_actual not in (i.id_usuario_ofrece, i.id_usuario_recibe):
        return jsonify({"msg": "No participas en este intercambio"}), 403

    # 👇 penalización si ya se pasó el tiempo y solo uno confirmó
    ahora = datetime.utcnow()
    if (
        i.fecha_limite_confirmacion
        and i.fecha_limite_confirmacion < ahora
        and i.estado == "pendiente"
    ):
        sol_acepto = (i.estado_solicitante == "aceptado")
        rec_acepto = (i.estado_receptor == "aceptado")

        # XOR: exactamente uno aceptó
        if sol_acepto ^ rec_acepto:
            if sol_acepto:
                id_no_confirmo = i.id_usuario_recibe
            else:
                id_no_confirmo = i.id_usuario_ofrece

            usuario = Usuario.query.get(id_no_confirmo)
            if usuario and usuario.verificado:
                usuario.verificado = False  # verificado = 0
                i.estado = "cancelado"
                i.fecha_limite_confirmacion = None
                db.session.commit()

                room = f"intercambio_{i.id_intercambio}"
                socketio.emit("intercambio_penalizado", {
                    "id_intercambio": i.id_intercambio,
                    "id_usuario_penalizado": id_no_confirmo
                }, room=room)

    data = _serializar_intercambio(i, id_usuario_actual)
    return jsonify(data), 200


# --------------------------------------------------------
# LISTAR MENSAJES DE UN INTERCAMBIO
# --------------------------------------------------------
@bp_intercambios.route("/<int:id_intercambio>/mensajes", methods=["GET"])
@jwt_required()
def listar_mensajes(id_intercambio):
    raw = get_jwt_identity()
    try:
        id_usuario_actual = int(raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Token inválido"}), 401

    intercambio = Intercambio.query.get_or_404(id_intercambio)

    if id_usuario_actual not in (intercambio.id_usuario_ofrece, intercambio.id_usuario_recibe):
        return jsonify({"msg": "No participas en este intercambio"}), 403

    mensajes = (
        IntercambioMensaje.query
        .filter_by(id_intercambio=id_intercambio)
        .order_by(IntercambioMensaje.creado.asc())
        .all()
    )

    data = []
    for m in mensajes:
        data.append({
            "id_mensaje": m.id_mensaje,
            "id_intercambio": m.id_intercambio,
            "id_usuario": m.id_usuario,
            "tipo": m.tipo,
            "contenido": m.contenido,
            "lat": float(m.lat) if m.lat is not None else None,
            "lng": float(m.lng) if m.lng is not None else None,
            "creado": m.creado.isoformat(),
        })

    return jsonify(data), 200


# --------------------------------------------------------
# CANCELAR INTERCAMBIO
# --------------------------------------------------------
@bp_intercambios.route("/<int:id_intercambio>/cancelar", methods=["PUT"])
@jwt_required()
def cancelar_intercambio(id_intercambio):
    raw = get_jwt_identity()
    try:
        id_usuario_actual = int(raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Token inválido"}), 401

    intercambio = Intercambio.query.get_or_404(id_intercambio)

    if id_usuario_actual not in (intercambio.id_usuario_ofrece, intercambio.id_usuario_recibe):
        return jsonify({"msg": "No participas en este intercambio"}), 403

    if intercambio.estado == "cancelado":
        return jsonify({"msg": "El intercambio ya estaba cancelado"}), 400

    if id_usuario_actual == intercambio.id_usuario_ofrece:
        intercambio.estado_solicitante = "cancelado"
    else:
        intercambio.estado_receptor = "cancelado"

    intercambio.estado = "cancelado"
    intercambio.fecha_actualizacion = datetime.utcnow()
    intercambio.fecha_limite_confirmacion = None

    db.session.commit()

    room = f"intercambio_{intercambio.id_intercambio}"
    socketio.emit("intercambio_cancelado", {
        "id_intercambio": intercambio.id_intercambio,
        "estado": intercambio.estado
    }, room=room)

    return jsonify({"msg": "Intercambio cancelado", "estado": intercambio.estado}), 200


# --------------------------------------------------------
# FINALIZAR / CONFIRMAR INTERCAMBIO
# --------------------------------------------------------
@bp_intercambios.route("/<int:id_intercambio>/finalizar", methods=["PUT"])
@jwt_required()
def finalizar_intercambio(id_intercambio):
    """
    - Primer usuario que confirma:
        * su estado_* pasa a "aceptado"
        * estado general sigue "pendiente"
        * fecha_limite_confirmacion = ahora + 15 min (si no existe)
        * emite evento 'intercambio_confirmado_parcial'
    - Segundo usuario que confirma:
        * su estado_* pasa a "aceptado"
        * si ambos "aceptado" → estado = "aceptado"
        * fecha_limite_confirmacion = NULL
        * emite evento 'intercambio_confirmado_total'
    """
    raw = get_jwt_identity()
    try:
        id_usuario_actual = int(raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Token inválido"}), 401

    intercambio = Intercambio.query.get_or_404(id_intercambio)

    if id_usuario_actual not in (intercambio.id_usuario_ofrece, intercambio.id_usuario_recibe):
        return jsonify({"msg": "No participas en este intercambio"}), 403

    if intercambio.estado == "cancelado":
        return jsonify({"msg": "El intercambio está cancelado"}), 400

    ahora = datetime.utcnow()

    # marcar confirmación según quién es
    if id_usuario_actual == intercambio.id_usuario_ofrece:
        intercambio.estado_solicitante = "aceptado"
    else:
        intercambio.estado_receptor = "aceptado"

    # comprobar si ambos aceptaron
    if (
        intercambio.estado_solicitante == "aceptado"
        and intercambio.estado_receptor == "aceptado"
    ):
        intercambio.estado = "aceptado"
        intercambio.fecha_limite_confirmacion = None
        evento = "intercambio_confirmado_total"
    else:
        # solo uno ha confirmado
        if not intercambio.fecha_limite_confirmacion:
            intercambio.fecha_limite_confirmacion = ahora + timedelta(minutes=15)
        # mantenemos estado "pendiente"
        evento = "intercambio_confirmado_parcial"

    intercambio.fecha_actualizacion = ahora
    db.session.commit()

    data = _serializar_intercambio(intercambio, id_usuario_actual)

    room = f"intercambio_{intercambio.id_intercambio}"
    socketio.emit(evento, data, room=room)

    return jsonify({"msg": "Estado actualizado", **data}), 200





