# Trueque Final (Angular 20 + Flask)
Alineado con **Node 20/22** y **Angular CLI 20**.

## Requisitos
- Node 20.x o 22.x
- Python 3.11+
- MySQL/MariaDB (ejecuta `database/bd_truquefinal.sql`)

## Primer uso
1) Base de datos: ejecuta `database/bd_truquefinal.sql`.
2) Backend:
   ```bash
   cd backend
   python -m venv .venv
   # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env  # ajusta DATABASE_URL
   ```
3) Frontend:
   ```bash
   cd frontend
   npm install
   npx @angular/cli@20 ng serve --open
   ```
4) VS Code: abre `trueque-final-ng20.code-workspace` y usa la tarea **Start: Frontend + Backend** o el compound **Start Trueque (Angular + Flask)**.
