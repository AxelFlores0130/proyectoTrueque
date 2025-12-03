import os, uuid
from werkzeug.utils import secure_filename

ALLOWED = {"png","jpg","jpeg","gif","webp"}

def ensure_folder(path: str):
    os.makedirs(path, exist_ok=True)

def allowed(filename: str) -> bool:
    ext = filename.rsplit(".",1)[-1].lower() if "." in filename else ""
    return ext in ALLOWED

def save_upload(fileobj, folder: str) -> str:
    ensure_folder(folder)
    filename = secure_filename(fileobj.filename or "upload")
    ext = filename.rsplit(".",1)[-1].lower() if "." in filename else "bin"
    uid = uuid.uuid4().hex[:12]
    final = f"{uid}.{ext}"
    fileobj.save(os.path.join(folder, final))
    return final
