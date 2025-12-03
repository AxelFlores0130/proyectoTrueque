from flask import Blueprint, request
from utils.db import db
from models import Intercambio, Notificacion

bp = Blueprint("exchanges", __name__)

@bp.post("")
def propose_exchange():
    data = request.json or {}
    ex = Intercambio(
        id_producto_ofrecido=data["id_producto_ofrecido"],
        id_producto_solicitado=data["id_producto_solicitado"],
        id_usuario_ofrece=data["id_usuario_ofrece"],
        id_usuario_recibe=data["id_usuario_recibe"],
        diferencia_monetaria=data.get("diferencia_monetaria", 0),
        estado="pendiente"
    )
    db.session.add(ex); db.session.flush()
    notif = Notificacion(
        id_usuario=data["id_usuario_recibe"],
        id_intercambio=ex.id_intercambio,
        mensaje=data.get("mensaje","Nueva solicitud de intercambio"),
        leido=False
    )
    db.session.add(notif); db.session.commit()
    return {"id_intercambio": ex.id_intercambio}, 201

@bp.post("/update")
def update_exchange():
    data = request.json or {}
    ex = db.session.get(Intercambio, data["id_intercambio"])
    if not ex: return {"error":"No existe"},404
    ex.estado = data.get("estado", ex.estado)
    db.session.commit()
    return {"ok": True}

@bp.get("")
def list_my():
    uid = request.args.get("uid")
    rec = db.session.query(Intercambio).filter_by(id_usuario_recibe=uid).all()
    env = db.session.query(Intercambio).filter_by(id_usuario_ofrece=uid).all()
    def pack(x):
        return {
            "id_intercambio": x.id_intercambio,
            "estado": x.estado,
            "diferencia_monetaria": float(x.diferencia_monetaria)
        }
    return {"recibidas":[pack(x) for x in rec], "enviadas":[pack(x) for x in env]}
