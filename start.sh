#!/bin/sh
set -e

echo "== Iniciando contenedor Railway =="

# 1) Asegurar Python y pip dentro del contenedor
if ! command -v python3 >/dev/null 2>&1; then
  echo "Instalando Python3 y pip3..."
  apt-get update
  apt-get install -y python3 python3-pip
fi

# 2) Ir al backend e instalar dependencias
cd backend

echo "Instalando dependencias de Python..."
pip3 install --no-cache-dir -r requirements.txt

# 3) Lanzar Flask en el puerto que ponga Railway
export PORT="${PORT:-5000}"
export FLASK_ENV=production

echo "Levantando Flask en el puerto $PORT..."
python3 app.py

