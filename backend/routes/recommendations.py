from flask import Blueprint, request
from utils.db import db

bp = Blueprint("recommendations", __name__)

@bp.get("")
def recommend():
    categoria = int(request.args.get("categoria"))
    valor = float(request.args.get("valor", 0))
    margen = float(request.args.get("margen", 0.2))
    min_v = max(0, valor*(1-margen))
    max_v = valor*(1+margen) if valor>0 else 9999999
    sql = """
        SELECT id_producto, id_usuario, id_categoria, titulo, descripcion, valor_estimado, imagen_url, estado
        FROM productos
        WHERE id_categoria=:cat AND valor_estimado BETWEEN :minv AND :maxv AND estado='disponible'
        ORDER BY ABS(valor_estimado - :val) ASC
        LIMIT 20
    """
    rows = db.session.execute(db.text(sql), {"cat":categoria,"minv":min_v,"maxv":max_v,"val":valor}).mappings().all()
    return {"items":[dict(r) for r in rows]}
