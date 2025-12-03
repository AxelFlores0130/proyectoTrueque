from flask import Blueprint
from utils.db import db

bp = Blueprint("admin", __name__)

@bp.get("/summary")
def summary():
    rows = db.session.execute(db.text("SELECT * FROM resumen_admin ORDER BY fecha DESC LIMIT 365")).mappings().all()
    return {"items":[dict(r) for r in rows]}
