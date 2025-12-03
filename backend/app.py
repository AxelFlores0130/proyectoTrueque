import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, decode_token
from flask_socketio import SocketIO, join_room, leave_room
from datetime import datetime

from models import db, Intercambio, IntercambioMensaje

# Crear instancia global de SocketIO (patrón factory)
socketio = SocketIO(cors_allowed_origins="*")


def create_app():
    app = Flask(__name__, static_folder="static")

    # Configuración de BD
    app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:root@127.0.0.1:3306/bd_truquefinal?charset=utf8mb4"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = "trueque-dev-secret-change-me"
    app.config["MAX_CONTENT_LENGTH"] = 12 * 1024 * 1024

    print("DB URI usada por app.py ->", app.config["SQLALCHEMY_DATABASE_URI"])

    # Inicializar extensiones
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)
    db.init_app(app)

    # Inicializar SocketIO con la app
    socketio.init_app(app, cors_allowed_origins="*")

    # Crear tablas y sembrar categorías
    with app.app_context():
        from models import Categoria
        db.create_all()

        try:
            if Categoria.query.count() == 0:
                categorias_base = [
                    ("Electrónicos", "Computadoras, consolas, TV"),
                    ("Celulares", "Teléfonos y accesorios"),
                    ("Hogar", "Muebles y electrodomésticos"),
                    ("Deportes", "Artículos deportivos"),
                    ("Ropa", "Ropa y calzado"),
                    ("Otros", "Varios"),
                ]
                for nombre, descripcion in categorias_base:
                    db.session.add(Categoria(nombre=nombre, descripcion=descripcion))
                db.session.commit()
                print("[INFO] Categorías base sembradas.")
        except Exception as e:
            print(f"[WARN] Error al sembrar categorías: {e}")
            db.session.rollback()

    # Registrar blueprints
    from routes_auth import bp_auth
    from routes_upload import bp_upload
    from routes_categorias import bp_cats
    from routes_productos import bp_prod
    from routes_solicitudes import bp_sol
    from routes_intercambios import bp_intercambios  # 👈 NUEVO

    app.register_blueprint(bp_auth)
    app.register_blueprint(bp_upload)
    app.register_blueprint(bp_cats)
    app.register_blueprint(bp_prod)
    app.register_blueprint(bp_sol)
    app.register_blueprint(bp_intercambios)  # 👈 NUEVO

    @app.get("/api/health")
    def health():
        return jsonify(ok=True), 200

    return app


# ===============================
#   HELPERS SOCKET / JWT
# ===============================

def get_user_id_from_token(token: str):
    try:
        decoded = decode_token(token)
        # por defecto flask_jwt_extended pone el id en "sub"
        return int(decoded["sub"])
    except Exception as e:
        print("WARN decode_token:", e)
        return None


# ===============================
#   EVENTOS SOCKET.IO
# ===============================

@socketio.on("join_intercambio")
def on_join_intercambio(data):
    """
    data: { token: string, id_intercambio: number }
    """
    token = data.get("token")
    id_intercambio = data.get("id_intercambio")
    id_usuario = get_user_id_from_token(token)

    if not id_usuario or not id_intercambio:
        return

    intercambio = Intercambio.query.get(id_intercambio)
    if not intercambio:
        return

    # Solo los participantes del intercambio pueden unirse al room
    if id_usuario not in (intercambio.id_usuario_ofrece, intercambio.id_usuario_recibe):
        return

    room = f"intercambio_{id_intercambio}"
    join_room(room)
    # opcional: print
    print(f"[SOCKET] Usuario {id_usuario} se unió a {room}")


@socketio.on("leave_intercambio")
def on_leave_intercambio(data):
    """
    data: { id_intercambio: number }
    """
    id_intercambio = data.get("id_intercambio")
    room = f"intercambio_{id_intercambio}"
    leave_room(room)
    print(f"[SOCKET] leave room {room}")


@socketio.on("nuevo_mensaje")
def on_nuevo_mensaje(data):
    """
    data:
    {
      token: string,
      id_intercambio: number,
      tipo: "texto" | "ubicacion",
      contenido?: string,
      lat?: number,
      lng?: number
    }
    """
    token = data.get("token")
    id_usuario = get_user_id_from_token(token)
    id_intercambio = data.get("id_intercambio")
    tipo = data.get("tipo", "texto")
    contenido = data.get("contenido")
    lat = data.get("lat")
    lng = data.get("lng")

    if not id_usuario or not id_intercambio:
        return

    intercambio = Intercambio.query.get(id_intercambio)
    if not intercambio:
        return

    # Validar que el usuario participa en ese intercambio
    if id_usuario not in (intercambio.id_usuario_ofrece, intercambio.id_usuario_recibe):
        return

    msg = IntercambioMensaje(
        id_intercambio=id_intercambio,
        id_usuario=id_usuario,
        tipo=tipo,
        contenido=contenido if tipo == "texto" else None,
        lat=lat if tipo == "ubicacion" else None,
        lng=lng if tipo == "ubicacion" else None,
        creado=datetime.utcnow(),
    )
    db.session.add(msg)
    db.session.commit()

    room = f"intercambio_{id_intercambio}"
    payload = {
        "id_mensaje": msg.id_mensaje,
        "id_intercambio": msg.id_intercambio,
        "id_usuario": msg.id_usuario,
        "tipo": msg.tipo,
        "contenido": msg.contenido,
        "lat": float(msg.lat) if msg.lat is not None else None,
        "lng": float(msg.lng) if msg.lng is not None else None,
        "creado": msg.creado.isoformat(),
    }

    # Enviar el mensaje a todos los conectados a ese intercambio
    socketio.emit("mensaje_recibido", payload, room=room)
    print(f"[SOCKET] mensaje en {room} ->", payload)


# ===============================
#   MAIN
# ===============================

if __name__ == "__main__":
    app = create_app()
    # IMPORTANTE: usar socketio.run en lugar de app.run
    socketio.run(app, debug=True, host="127.0.0.1", port=5000)

