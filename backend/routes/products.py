from flask import Blueprint, request
from utils.db import db
from models import Producto

bp = Blueprint("products", __name__)

@bp.get("")
def list_products():
    categoria = request.args.get("categoria")
    q = db.session.query(Producto)
    if categoria:
        q = q.filter_by(id_categoria=int(categoria))
    data = [{
        "id_producto": p.id_producto,
        "id_usuario": p.id_usuario,
        "id_categoria": p.id_categoria,
        "titulo": p.titulo,
        "descripcion": p.descripcion,
        "valor_estimado": float(p.valor_estimado),
        "imagen_url": p.imagen_url,
        "estado": p.estado
    } for p in q.order_by(Producto.fecha_publicacion.desc()).limit(50)]
    return {"items": data}

@bp.post("")
def create_product():
    data = request.json or {}
    p = Producto(
        id_usuario=data["id_usuario"],
        id_categoria=data["id_categoria"],
        titulo=data["titulo"],
        descripcion=data.get("descripcion"),
        valor_estimado=data.get("valor_estimado",0),
        imagen_url=data.get("imagen_url"),
        estado="disponible"
    )
    db.session.add(p); db.session.commit()
    return {"id_producto": p.id_producto}, 201
