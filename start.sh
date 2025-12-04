#!/bin/sh
set -e

echo "== Iniciando contenedor Railway =="

# 1) Ir al backend (ajusta la ruta si tu carpeta se llama distinto)
cd backend

# 2) Crear entorno virtual si no existe
if [ ! -d ".venv" ]; then
  echo "Creando entorno virtual de Python..."
  python3 -m venv .venv
fi

# 3) Activar entorno virtual
. .venv/bin/activate

# 4) Instalar dependencias dentro del venv
echo "Instalando dependencias de Python en el venv..."
pip install --no-cache-dir -r requirements.txt

# 5) Lanzar Flask en el puerto que ponga Railway
export PORT="${PORT:-5000}"
export FLASK_ENV=production

echo "Levantando Flask en el puerto $PORT..."
python app.py


