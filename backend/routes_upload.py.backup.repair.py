import os
from flask import Blueprint, request, jsonify, url_for
from werkzeug.utils import secure_filename

bp_upload = Blueprint("upload", __name__, url_prefix="/api/upload")

ALLOWED_EXT = {"png","jpg","jpeg","gif","webp"}

def allowed_filename(name: str):
    ext = (name.rsplit(".",1)[-1] if "." in name else "").lower()
    return ext in ALLOWED_EXT

@bp_upload.post("")
def upload_file():
    if "archivo" not in request.files:
        return jsonify(msg="Falta archivo"), 400
    f = request.files["archivo"]
    if f.filename == "":
        return jsonify(msg="Archivo sin nombre"), 400
    filename = secure_filename(f.filename)
    if not allowed_filename(filename):
        return jsonify(msg="Extensión no permitida"), 400

    # Guardar en backend/static/uploads
    base_dir = os.path.dirname(os.path.abspath(__file__))
    static_dir = os.path.join(base_dir, "..", "static")
    uploads_dir = os.path.join(static_dir, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    import time
    name = f"{int(time.time())}_{filename}"
    path = os.path.join(uploads_dir, name)
    try:
        f.save(path)
    except Exception as e:
        return jsonify(msg="Error guardando archivo", err=str(e)), 500

    public_    url = url_for('static', filename=f'uploads/{filename}', _external=True)
    return jsonify({"url": public_url}), 201

