"""
Restaura archivos originales desde copias que contengan '.backup' en su nombre.
Ejecutar en la raíz del repo:
    python restore_specific_backups.py
Crea un respaldo de los archivos actuales en .restore_backup/{timestamp}/ antes de sobrescribir.
"""
import os, re, shutil
from datetime import datetime

ROOT = os.path.abspath(os.path.dirname(__file__))
TS = datetime.now().strftime("%Y%m%d_%H%M%S")
OUT = os.path.join(ROOT, ".restore_backup", TS)
os.makedirs(OUT, exist_ok=True)

# Buscar archivos con ".backup" en el nombre
matches = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    for fn in filenames:
        if ".backup" in fn:
            matches.append(os.path.join(dirpath, fn))

if not matches:
    print("No se encontraron archivos *.backup* en el repo.")
    exit(0)

def guess_original(src_path):
    # heurística: eliminar la primera aparición de ".backup" y todo lo que sigue hasta la última extensión
    dirn, fname = os.path.split(src_path)
    m = re.search(r'\.backup', fname)
    if not m:
        return None
    base = fname[:m.start()]
    # intentar conservar la extensión final (tomar desde la última dot)
    ext = os.path.splitext(fname)[1]
    candidate = os.path.join(dirn, base + ext)
    if os.path.exists(candidate):
        return candidate
    # fallback: buscar en el mismo directorio cualquier archivo que empiece por base y no contenga ".backup"
    for f in os.listdir(dirn):
        if f.startswith(base) and ".backup" not in f:
            return os.path.join(dirn, f)
    # si no se encuentra, retornar candidate (puede crearlo)
    return candidate

restored = 0
for src in matches:
    orig = guess_original(src)
    if not orig:
        print(f"[SKIP] No pude adivinar original para: {src}")
        continue

    # crear backup del original actual (si existe)
    if os.path.exists(orig):
        rel = os.path.relpath(orig, ROOT)
        dest = os.path.join(OUT, rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(orig, dest)
        print(f"[BACKUP] {orig} -> {dest}")

    # crear directorio destino si hace falta
    os.makedirs(os.path.dirname(orig), exist_ok=True)
    try:
        shutil.copy2(src, orig)
        print(f"[RESTORED] {orig} <= {src}")
        restored += 1
    except Exception as e:
        print(f"[ERROR] al restaurar {src} -> {orig}: {e}")

print(f"\nRestauración completa: {restored} archivos restaurados.")
print(f"Backups originales guardados en: {OUT}")
