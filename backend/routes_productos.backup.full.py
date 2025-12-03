# routes_productos.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Producto, Categoria

bp_productos = Blueprint('productos', __name__, url_prefix='/api/productos')

def map_estado_api_to_db(estado_api: str) -> str:
    """
    API usa: 'disponible' | 'baja'
    BD usa: 'disponible' | 'en_intercambio' | 'intercambiado'
    """
    if estado_api == 'baja':
        return 'en_intercambio'
    if estado_api == 'disponible':
        return 'disponible'
    # fallback
    return estado_api

@bp_productos.route('', methods=['GET'])
@jwt_required(optional=True)
def listar_productos():
    """
    Filtros:
      - q: búsqueda texto en título/descripcion
      - id_categoria: id de categoría
      - solo_mios: '1' para sólo productos del usuario logueado
      - solo_otros: '1' para excluir productos del usuario logueado
      - incluir_bajas: '1' para incluir los 'baja' (en_intercambio)
    """
    current_user_id = get_jwt_identity()
    q_text = request.args.get('q', '', type=str)
    id_categoria = request.args.get('id_categoria', type=int)
    solo_mios = request.args.get('solo_mios') == '1'
    solo_otros = request.args.get('solo_otros') == '1'
    incluir_bajas = request.args.get('incluir_bajas') == '1'

    query = Producto.query.join(Categoria)

    # Estado
    if not incluir_bajas:
        query = query.filter(Producto.estado == 'disponible')

    # Búsqueda texto
    if q_text:
        like = f"%{q_text}%"
        query = query.filter(
            (Producto.titulo.ilike(like)) |
            (Producto.descripcion.ilike(like))
        )

    # Categoría
    if id_categoria:
        query = query.filter(Producto.id_categoria == id_categoria)

    # Filtros por dueño
    if current_user_id:
        if solo_mios:
            query = query.filter(Producto.id_usuario == current_user_id)
        elif solo_otros:
            query = query.filter(Producto.id_usuario != current_user_id)

    productos = query.order_by(Producto.fecha_publicacion.desc()).all()
    data = [p.to_dict(current_user_id=current_user_id) for p in productos]
    return jsonify(data), 200

@bp_productos.route('', methods=['POST'])
@jwt_required()
def crear_producto():
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}

    requerido = ['id_categoria', 'titulo', 'descripcion', 'valor_estimado', 'ubicacion']
    for campo in requerido:
        if campo not in data:
            return jsonify({'error': f'Falta campo {campo}'}), 400

    producto = Producto(
        id_usuario=current_user_id,
        id_categoria=data['id_categoria'],
        titulo=data['titulo'],
        descripcion=data['descripcion'],
        valor_estimado=data.get('valor_estimado', 0),
        imagen_url=data.get('imagen_url'),
        ubicacion=data.get('ubicacion'),
        estado='disponible'
    )
    db.session.add(producto)
    db.session.commit()

    return jsonify(producto.to_dict(current_user_id)), 201

@bp_productos.route('/<int:id_producto>', methods=['PUT'])
@jwt_required()
def editar_producto(id_producto):
    current_user_id = get_jwt_identity()
    producto = Producto.query.get_or_404(id_producto)

    if producto.id_usuario != current_user_id:
        return jsonify({'error': 'No autorizado'}), 403

    data = request.get_json() or {}

    # Editamos campos básicos
    for campo in ['titulo', 'descripcion', 'valor_estimado', 'ubicacion', 'id_categoria', 'imagen_url']:
        if campo in data:
            setattr(producto, campo, data[campo])

    db.session.commit()
    return jsonify(producto.to_dict(current_user_id)), 200

@bp_productos.route('/<int:id_producto>/estado', methods=['PUT'])
@jwt_required()
def cambiar_estado_producto(id_producto):
    """
    Payload esperado: { "estado": "baja" } o { "estado": "disponible" }
    """
    current_user_id = get_jwt_identity()
    producto = Producto.query.get_or_404(id_producto)

    if producto.id_usuario != current_user_id:
        return jsonify({'error': 'No autorizado'}), 403

    data = request.get_json() or {}
    nuevo_estado_api = data.get('estado')

    if nuevo_estado_api not in ('disponible', 'baja'):
        return jsonify({'error': 'Estado inválido'}), 400

    producto.estado = map_estado_api_to_db(nuevo_estado_api)
    db.session.commit()
    return jsonify(producto.to_dict(current_user_id)), 200


# Alias para compatibilidad con app.py
bp_prod = bp_productos
