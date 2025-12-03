from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from utils.db import db
from models import Usuario
from utils.security import hash_password, verify_password

bp = Blueprint("auth", __name__)

@bp.post("/register")
def register():
    data = request.get_json() or {}
    nombre = data.get("nombre_completo")
    correo = data.get("correo")
    password = data.get("password")
    telefono = data.get("telefono")
    rol = (data.get("rol") or "cliente").lower()
    if rol not in ("cliente","administrador"):
        return jsonify(msg="Rol inválido"), 400

    if not all([nombre, correo, password]):
        return jsonify(msg="Faltan campos"), 400
    if Usuario.query.filter_by(correo=correo).first():
        return jsonify(msg="El correo ya está registrado"), 409

    user = Usuario(
        nombre_completo=nombre,
        correo=correo,
        contrasena=hash_password(password),
        telefono=telefono,
        verificado=True,     # por ahora verificamos directo
        rol=rol
    )
    db.session.add(user)
    db.session.commit()

    # identity = id numérico; rol va como claim adicional
    token = create_access_token(identity=user.id_usuario, additional_claims={"rol": user.rol})
    return jsonify(token=token, usuario={"id": user.id_usuario, "nombre": user.nombre_completo, "rol": user.rol}), 201

@bp.post("/login")
def login():
    data = request.get_json() or {}
    correo = data.get("correo")
    password = data.get("password")
    user = Usuario.query.filter_by(correo=correo).first()
    if not user or not verify_password(password, user.contrasena):
        return jsonify(msg="Credenciales inválidas"), 401
    if not user.verificado:
        return jsonify(msg="Cuenta no verificada"), 401

    token = create_access_token(identity=user.id_usuario, additional_claims={"rol": user.rol})
    return jsonify(token=token, usuario={"id": user.id_usuario, "nombre": user.nombre_completo, "rol": user.rol}), 200
