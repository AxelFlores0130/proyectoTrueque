import os
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required
from utils.storage import allowed, save_upload, ensure_folder

bp = Blueprint("uploads", __name__)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")

@bp.post("/upload")
@jwt_required()
def upload():
    if "file" not in request.files:
        return jsonify(msg="No se envió archivo"), 400
    f = request.files["file"]
    if not f or f.filename == "":
        return jsonify(msg="Archivo vacío"), 400
    if not allowed(f.filename):
        return jsonify(msg="Formato no permitido"), 400
    ensure_folder(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads")))
    saved = save_upload(f, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads")))
    url = f"{request.host_url.rstrip('/')}/uploads/{saved}"
    return jsonify(url=url), 200
