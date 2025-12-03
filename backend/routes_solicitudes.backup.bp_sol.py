# routes_solicitudes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Solicitud, Producto

bp_solicitudes = Blueprint('solicitudes', __name__, url_prefix='/api/solicitudes')

@bp_solicitudes.route('', methods=['POST'])
@jwt_required()
def crear_solicitud():
    """
    Crea un match hacia un producto de otro usuario.
    Payload:
      - id_producto_objetivo (obligatorio)
      - id_producto_ofrece (opcional)
      - mensaje (opcional)
    """
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}

    id_producto_objetivo = data.get('id_producto_objetivo')
    if not id_producto_objetivo:
        return jsonify({'error': 'Falta id_producto_objetivo'}), 400

    producto_objetivo = Producto.query.get_or_404(id_producto_objetivo)

    # No permitir hacer match con tu propio producto
    if producto_objetivo.id_usuario == current_user_id:
        return jsonify({'error': 'No puedes solicitar tu propio producto'}), 400

    solicitud = Solicitud(
        id_solicitante=current_user_id,
        id_producto_objetivo=id_producto_objetivo,
        id_producto_ofrece=data.get('id_producto_ofrece'),
        mensaje=data.get('mensaje'),
        ubicacion=data.get('ubicacion'),
        fecha_propuesta=None,
        estado='pendiente'
    )

    db.session.add(solicitud)
    db.session.commit()

    return jsonify(solicitud.to_card(current_user_id)), 201

@bp_solicitudes.route('/recibidas', methods=['GET'])
@jwt_required()
def solicitudes_recibidas():
    """
    Solicitudes donde yo soy dueño del producto objetivo.
    """
    current_user_id = get_jwt_identity()
    solicitudes = (Solicitud.query
                   .join(Producto, Solicitud.id_producto_objetivo == Producto.id_producto)
                   .filter(Producto.id_usuario == current_user_id)
                   .order_by(Solicitud.creado.desc())
                   .all())
    data = [s.to_card(current_user_id) for s in solicitudes]
    return jsonify(data), 200

@bp_solicitudes.route('/enviadas', methods=['GET'])
@jwt_required()
def solicitudes_enviadas():
    current_user_id = get_jwt_identity()
    solicitudes = (Solicitud.query
                   .filter(Solicitud.id_solicitante == current_user_id)
                   .order_by(Solicitud.creado.desc())
                   .all())
    data = [s.to_card(current_user_id) for s in solicitudes]
    return jsonify(data), 200

@bp_solicitudes.route('/<int:id_solicitud>/aceptar', methods=['PUT'])
@jwt_required()
def aceptar_solicitud(id_solicitud):
    current_user_id = get_jwt_identity()
    solicitud = Solicitud.query.get_or_404(id_solicitud)

    # Solo dueño del producto objetivo puede aceptar
    if solicitud.producto_objetivo.id_usuario != current_user_id:
        return jsonify({'error': 'No autorizado'}), 403

    solicitud.estado = 'aceptado'
    db.session.commit()
    return jsonify(solicitud.to_card(current_user_id)), 200

@bp_solicitudes.route('/<int:id_solicitud>/rechazar', methods=['PUT'])
@jwt_required()
def rechazar_solicitud(id_solicitud):
    current_user_id = get_jwt_identity()
    solicitud = Solicitud.query.get_or_404(id_solicitud)

    if solicitud.producto_objetivo.id_usuario != current_user_id:
        return jsonify({'error': 'No autorizado'}), 403

    solicitud.estado = 'rechazado'
    db.session.commit()
    return jsonify(solicitud.to_card(current_user_id)), 200

@bp_solicitudes.route('/<int:id_solicitud>/cancelar', methods=['PUT'])
@jwt_required()
def cancelar_solicitud(id_solicitud):
    current_user_id = get_jwt_identity()
    solicitud = Solicitud.query.get_or_404(id_solicitud)

    if solicitud.id_solicitante != current_user_id:
        return jsonify({'error': 'No autorizado'}), 403

    solicitud.estado = 'cancelado'
    db.session.commit()
    return jsonify(solicitud.to_card(current_user_id)), 200

