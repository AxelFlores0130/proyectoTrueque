#!/bin/sh
set -e

echo "== Iniciando contenedor Railway =="

# 0) Asegurar que existe Python3 dentro del contenedor
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python3 no encontrado, instalándolo..."
  apt-get update
  apt-get install -y python3 python3-venv python3-pip
fi

# 1) Ir al backend
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




