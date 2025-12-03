from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Producto, Categoria

bp_productos = Blueprint("productos", __name__, url_prefix="/api/productos")
bp_prod = bp_productos   # alias usado por app.py
bp = bp_productos


def _producto_to_dict(p: Producto, current_user_id: int | None = None):
    # Obtener nombre de categoría (sin depender de relaciones)
    cat = Categoria.query.get(p.id_categoria)
    categoria_nombre = cat.nombre if cat else None

    return {
        "id_producto": p.id_producto,
        "id_usuario": p.id_usuario,
        "id_categoria": p.id_categoria,
        "categoria_nombre": categoria_nombre,
        "titulo": p.titulo,
        "descripcion": p.descripcion,
        "valor_estimado": float(p.valor_estimado or 0),
        "imagen_url": p.imagen_url,
        "ubicacion": p.ubicacion,
        "estado": p.estado,
        "es_tuyo": bool(current_user_id and p.id_usuario == current_user_id),
    }


@bp_productos.route("", methods=["GET"])
@jwt_required(optional=True)
def listar_productos():
    """
    Listado de productos.
    Query params:
      - q: texto a buscar en título/descripcion
      - id_categoria: filtrar por categoría
      - solo_mios=1: solo productos del usuario logueado
      - solo_otros=1: solo productos de otros usuarios
      - incluir_bajas=1: incluir productos con estado != 'disponible'
    Si no hay token, solo se ignoran solo_mios/solo_otros y se ve público.
    """
    current_user_id = get_jwt_identity()

    q = request.args.get("q", type=str)
    id_categoria = request.args.get("id_categoria", type=int)
    solo_mios = request.args.get("solo_mios")
    solo_otros = request.args.get("solo_otros")
    incluir_bajas = request.args.get("incluir_bajas")

    query = Producto.query

    # Filtro de búsqueda
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Producto.titulo.ilike(like)) |
            (Producto.descripcion.ilike(like))
        )

    # Filtro por categoría
    if id_categoria:
        query = query.filter(Producto.id_categoria == id_categoria)

    # Filtro de estado (por defecto solo disponibles)
    if not incluir_bajas:
        query = query.filter(Producto.estado == "disponible")

    # Filtros solo_mios / solo_otros (solo si hay usuario logueado)
    if current_user_id:
        if solo_mios:
            query = query.filter(Producto.id_usuario == current_user_id)
        elif solo_otros:
            query = query.filter(Producto.id_usuario != current_user_id)

    productos = query.order_by(Producto.fecha_publicacion.desc()).all()

    data = [_producto_to_dict(p, current_user_id) for p in productos]
    return jsonify(data), 200


@bp_productos.route("", methods=["POST"])
@jwt_required()
def crear_producto():
    """
    Crea un producto nuevo del usuario logueado.
    Body JSON:
      - id_categoria (int)
      - titulo (str)
      - descripcion (str)
      - valor_estimado (number)
      - ubicacion (str)
      - imagen_url (str, opcional)
    estado se fija automáticamente en 'disponible'.
    """
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}

    id_categoria = data.get("id_categoria")
    titulo = data.get("titulo")
    descripcion = data.get("descripcion")
    valor_estimado = data.get("valor_estimado")
    ubicacion = data.get("ubicacion")
    imagen_url = data.get("imagen_url")

    if not id_categoria or not titulo or valor_estimado is None or not ubicacion:
        return jsonify({"error": "Faltan datos obligatorios del producto"}), 400

    # Validar categoría existe
    if not Categoria.query.get(id_categoria):
        return jsonify({"error": "Categoría inválida"}), 400

    nuevo = Producto(
        id_usuario=current_user_id,
        id_categoria=id_categoria,
        titulo=titulo,
        descripcion=descripcion,
        valor_estimado=valor_estimado,
        imagen_url=imagen_url,
        ubicacion=ubicacion,
        estado="disponible",
    )

    db.session.add(nuevo)
    db.session.commit()

    return jsonify(_producto_to_dict(nuevo, current_user_id)), 201


@bp_productos.route("/<int:id_producto>", methods=["PUT"])
@jwt_required()
def actualizar_producto(id_producto: int):
    """
    Edita un producto (solo dueño).
    Permite cambiar:
      - id_categoria
      - titulo
      - descripcion
      - valor_estimado
      - ubicacion
      - imagen_url
    """
    current_user_id = get_jwt_identity()
    p = Producto.query.get_or_404(id_producto)

    if p.id_usuario != current_user_id:
        return jsonify({"error": "No autorizado"}), 403

    data = request.get_json() or {}

    if "id_categoria" in data and data["id_categoria"]:
        if not Categoria.query.get(data["id_categoria"]):
            return jsonify({"error": "Categoría inválida"}), 400
        p.id_categoria = data["id_categoria"]

    if "titulo" in data and data["titulo"] is not None:
        p.titulo = data["titulo"]

    if "descripcion" in data:
        p.descripcion = data["descripcion"]

    if "valor_estimado" in data and data["valor_estimado"] is not None:
        p.valor_estimado = data["valor_estimado"]

    if "ubicacion" in data and data["ubicacion"] is not None:
        p.ubicacion = data["ubicacion"]

    if "imagen_url" in data:
        p.imagen_url = data["imagen_url"]

    db.session.commit()

    return jsonify(_producto_to_dict(p, current_user_id)), 200


@bp_productos.route("/<int:id_producto>/estado", methods=["PUT"])
@jwt_required()
def cambiar_estado_producto(id_producto: int):
    """
    Cambia el estado del producto (baja/alta).
    Body JSON:
      { "estado": "baja" }  -> dar de baja
      { "estado": "disponible" } -> dar de alta
    Solo el dueño puede hacerlo.
    """
    current_user_id = get_jwt_identity()
    p = Producto.query.get_or_404(id_producto)

    if p.id_usuario != current_user_id:
        return jsonify({"error": "No autorizado"}), 403

    data = request.get_json() or {}
    estado = data.get("estado")

    if estado not in ("disponible", "baja"):
        return jsonify({"error": "Estado inválido"}), 400

    p.estado = estado
    db.session.commit()

    return jsonify(_producto_to_dict(p, current_user_id)), 200


# Wrapper para exponer bp_prod desde el paquete 'routes'
try:
    # si la versión del código tiene un paquete 'routes' con módulo productos
    from routes.productos import bp_prod as bp_prod
except Exception:
    # fallback: intentar importar desde archivo local 'routes/productos.py'
    from routes.productos import bp_prod as bp_prod
# exportado como variable global para que app.py pueda importarlo como 'routes_productos'
