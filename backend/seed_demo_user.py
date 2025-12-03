from models import db, Usuario
from app import app

with app.app_context():
    correo = "demo@demo.com"
    u = Usuario.query.filter(Usuario.correo==correo).first()
    if not u:
        u = Usuario(
            nombre_completo="Usuario Demo",
            correo=correo,
            contrasena="123456",   # en PROD: usa generate_password_hash
            telefono="",
            rol="cliente",
            verificado=True
        )
        db.session.add(u)
        db.session.commit()
        print("Usuario DEMO creado:", correo, "/ 123456")
    else:
        print("Usuario DEMO ya existía:", correo)
