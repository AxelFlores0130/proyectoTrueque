from flask import Blueprint, request
from utils.db import db
from models import Notificacion

bp = Blueprint("notifications", __name__)

@bp.get("")
def list_notifications():
    uid = request.args.get("uid")
    qs = db.session.query(Notificacion).filter_by(id_usuario=uid).order_by(Notificacion.fecha_envio.desc()).limit(50).all()
    return {"items":[{"id":n.id_notificacion,"msg":n.mensaje,"leido":n.leido,"id_intercambio":n.id_intercambio} for n in qs]}

@bp.post("/read")
def mark_read():
    data = request.json or {}
    n = db.session.get(Notificacion, data["id_notificacion"])
    if not n: return {"error":"No encontrada"},404
    n.leido = True; db.session.commit()
    return {"ok": True}
