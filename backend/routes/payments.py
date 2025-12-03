from flask import Blueprint, request
from utils.db import db
from models import Pago, Intercambio

bp = Blueprint("payments", __name__)

@bp.post("/simulate")
def simulate_payment():
    data = request.json or {}
    ex = db.session.get(Intercambio, data["id_intercambio"])
    if not ex: return {"error":"Intercambio no encontrado"},404
    monto = float(data.get("monto", 0))
    p = Pago(
        id_intercambio=ex.id_intercambio,
        id_usuario_pagador=data["id_usuario_pagador"],
        id_usuario_receptor=data["id_usuario_receptor"],
        monto=monto,
        metodo_pago="simulado",
        estado="exitoso"
    )
    db.session.add(p); db.session.commit()
    return {"id_pago": p.id_pago, "estado": p.estado}
