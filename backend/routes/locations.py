from flask import Blueprint, request
from utils.db import db
from models import Ubicacion

bp = Blueprint("locations", __name__)

@bp.post("")
def set_location():
    data = request.json or {}
    u = Ubicacion(
        id_intercambio=data["id_intercambio"],
        direccion=data.get("direccion"),
        latitud=data.get("latitud"),
        longitud=data.get("longitud"),
        fecha_encuentro=data.get("fecha_encuentro"),
        hora_encuentro=data.get("hora_encuentro"),
    )
    db.session.add(u); db.session.commit()
    return {"id_ubicacion": u.id_ubicacion}
