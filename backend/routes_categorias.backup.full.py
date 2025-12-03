from flask import Blueprint, jsonify
from utils.db import db
from models import Categoria

bp_cats = Blueprint("bp_cats", __name__, url_prefix="/api")

@bp_cats.route("/categorias", methods=["GET"])
def categorias():
    cs = Categoria.query.order_by(Categoria.nombre.asc()).all()
    return jsonify([{"id_categoria":c.id_categoria,"nombre":c.nombre} for c in cs])
