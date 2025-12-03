"""
Script de restauración automática desde archivos *.backup*
Ejecutar desde la raíz del proyecto:
    python restore_from_backups.py

Crea un respaldo en .restore_backup/{timestamp}/ de los archivos actuales antes de sobrescribir.
"""
import os
import re
import shutil
from datetime import datetime
from pathlib import Path

ROOT = os.path.abspath(os.path.dirname(__file__))
TS = datetime.now().strftime("%Y%m%d_%H%M%S")
BACKUP_DIR = os.path.join(ROOT, ".restore_backup", TS)
os.makedirs(BACKUP_DIR, exist_ok=True)

print(f"[INFO] Restauración comenzada. Respaldo de archivos actuales en: {BACKUP_DIR}")

# Buscar todos los archivos que contengan ".backup" en el nombre
matches = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    # Ignorar carpetas conocidas
    dirnames[:] = [d for d in dirnames if d not in {'node_modules', '.venv', '__pycache__', 'dist', '.restore_backup'}]
    
    for fn in filenames:
        if ".backup" in fn:
            full_path = os.path.join(dirpath, fn)
            matches.append(full_path)

if not matches:
    print("[WARN] No se encontraron archivos *.backup* en el proyecto.")
    print(f"[INFO] Nada que restaurar. Respaldo vacío en: {BACKUP_DIR}")
    exit(0)

print(f"[INFO] Se encontraron {len(matches)} archivos de respaldo para restaurar.")

def guess_original_path(backup_path):
    """
    Adivina la ruta original quitando la porción '.backup...' del nombre.
    Ejemplos:
      - productos.component.ts.backup.fullfix.ts -> productos.component.ts
      - app.component.ts.backup.jwtfix.ts -> app.component.ts
      - models.py.backup.bak -> models.py
    """
    dirpath = os.path.dirname(backup_path)
    filename = os.path.basename(backup_path)
    
    # Encontrar primera ocurrencia de ".backup"
    m = re.search(r'\.backup', filename)
    if not m:
        return None
    
    base = filename[:m.start()]  # parte antes de ".backup"
    ext = os.path.splitext(filename)[1]  # última extensión
    
    candidate = os.path.join(dirpath, base + ext)
    
    # Si el candidato existe, retornarlo
    if os.path.exists(candidate):
        return candidate
    
    # Fallback: buscar cualquier archivo en el mismo directorio que empiece con base y no tenga ".backup"
    try:
        for f in os.listdir(dirpath):
            if f.startswith(base) and ".backup" not in f and not f.startswith("."):
                return os.path.join(dirpath, f)
    except Exception:
        pass
    
    # Retornar candidate de todas formas (lo creará si no existe)
    return candidate

# Restaurar cada archivo
restored_count = 0
skipped_count = 0
error_count = 0

for backup_file in matches:
    original_file = guess_original_path(backup_file)
    
    if not original_file:
        print(f"[SKIP] No pude adivinar original para: {os.path.relpath(backup_file, ROOT)}")
        skipped_count += 1
        continue
    
    # Crear respaldo del archivo original si existe
    if os.path.exists(original_file):
        rel_path = os.path.relpath(original_file, ROOT)
        backup_dest = os.path.join(BACKUP_DIR, rel_path)
        os.makedirs(os.path.dirname(backup_dest), exist_ok=True)
        try:
            shutil.copy2(original_file, backup_dest)
            print(f"[BACKUP] {rel_path}")
        except Exception as e:
            print(f"[ERROR] Al hacer backup de {rel_path}: {e}")
    
    # Crear directorio destino si hace falta
    os.makedirs(os.path.dirname(original_file), exist_ok=True)
    
    # Copiar archivo de respaldo a original
    try:
        shutil.copy2(backup_file, original_file)
        rel_orig = os.path.relpath(original_file, ROOT)
        rel_backup = os.path.relpath(backup_file, ROOT)
        print(f"[OK] {rel_orig} <- {rel_backup}")
        restored_count += 1
    except Exception as e:
        print(f"[ERROR] Al restaurar {os.path.relpath(backup_file, ROOT)}: {e}")
        error_count += 1

# Resumen
print(f"\n{'='*70}")
print(f"[RESUMEN] Restauración completada:")
print(f"  Restaurados: {restored_count}")
print(f"  Omitidos: {skipped_count}")
print(f"  Errores: {error_count}")
print(f"  Respaldos originales guardados en: {BACKUP_DIR}")
print(f"{'='*70}")

if error_count == 0:
    print("[SUCCESS] Restauración completada sin errores.")
    print("\nProximos pasos:")
    print("  1. Reinicia el backend:  cd backend && python app.py")
    print("  2. Reinicia el frontend: cd frontend && npm start")
else:
    print(f"[WARN] Se encontraron {error_count} errores durante la restauración.")
    print("Revisa los mensajes [ERROR] arriba para más detalles.")

exit(0)
