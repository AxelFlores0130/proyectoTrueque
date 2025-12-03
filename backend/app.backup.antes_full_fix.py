from routes_auth import bp_auth
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from config import Config
from utils.db import db

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS","*")}})
    JWTManager(app)
    db.init_app(app)

    print("DB URI usada por app.py ->", app.config.get("SQLALCHEMY_DATABASE_URI"))

    # Crear tablas y sembrar categorías base si hace falta
    from models import Categoria
    with app.app_context():
        db.create_all()
        # BLOQUE DE SEED CATEGORIAS DESACTIVADO

    # Blueprints
    from routes_auth import bp_auth
    from routes_categorias import bp_cats
    from routes_productos import bp_prod
    from routes_solicitudes import bp_sol
    from routes_upload import bp_upload

    app.register_blueprint(bp_auth)
    app.register_blueprint(bp_cats)
    app.register_blueprint(bp_prod)
    app.register_blueprint(bp_sol)
    app.register_blueprint(bp_upload)

    @app.get("/api/health")
    def health():
        return jsonify(ok=True), 200

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)


