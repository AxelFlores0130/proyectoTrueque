#!/bin/sh
set -e

cd backend
pip install -r requirements.txt
python app.py
