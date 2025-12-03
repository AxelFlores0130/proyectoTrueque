from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, Producto, Categoria

bp_productos = Blueprint("productos", __name__, url_prefix="/api/productos")
bp_prod = bp_productos   # alias usado en app.py
bp = bp_productos


def _producto_to_dict(p: Producto, current_user_id: int | None = None):
    # Obtener nombre de categoría por id_categoria
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
    Lista productos con filtros.
    Query params:
      - q (texto)
      - id_categoria (int)
      - solo_mios=1
      - solo_otros=1
      - incluir_bajas=1
    """
    current_user_id_raw = get_jwt_identity()
    try:
        current_user_id = int(current_user_id_raw) if current_user_id_raw is not None else None
    except (TypeError, ValueError):
        current_user_id = None

    q = request.args.get("q", type=str)
    id_categoria = request.args.get("id_categoria", type=int)
    solo_mios = request.args.get("solo_mios")
    solo_otros = request.args.get("solo_otros")
    incluir_bajas = request.args.get("incluir_bajas")

    query = Producto.query

    # búsqueda texto
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Producto.titulo.ilike(like)) |
            (Producto.descripcion.ilike(like))
        )

    # categoría
    if id_categoria:
        query = query.filter(Producto.id_categoria == id_categoria)

    # por defecto solo disponibles
    if not incluir_bajas:
        query = query.filter(Producto.estado == "disponible")

    # filtros por usuario
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
    Crea un producto del usuario logueado.
    """
    current_user_id_raw = get_jwt_identity()
    try:
        current_user_id = int(current_user_id_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Token inválido"}), 401

    data = request.get_json() or {}
    print("DEBUG crear_producto data:", data)

    id_categoria = data.get("id_categoria")
    titulo = data.get("titulo")
    descripcion = data.get("descripcion")
    valor_estimado = data.get("valor_estimado")
    ubicacion = data.get("ubicacion")
    imagen_url = data.get("imagen_url")

    faltan = []
    if not id_categoria:
        faltan.append("id_categoria")
    if not titulo:
        faltan.append("titulo")
    if descripcion is None:
        faltan.append("descripcion")
    if valor_estimado is None:
        faltan.append("valor_estimado")
    if not ubicacion:
        faltan.append("ubicacion")

    if faltan:
        return jsonify({
            "error": "Faltan datos obligatorios",
            "campos": faltan,
        }), 422

    # validar categoría
    cat = Categoria.query.get(id_categoria)
    if not cat:
        return jsonify({"error": "Categoría inválida"}), 422

    nuevo = Producto(
        id_usuario=current_user_id,
        id_categoria=id_categoria,
        titulo=titulo,
        descripcion=descripcion,
        valor_estimado=valor_estimado,
        imagen_url=imagen_url,
        ubicacion=ubicacion,
        estado="disponible",
        fecha_publicacion=datetime.utcnow(),
    )

    db.session.add(nuevo)
    db.session.commit()

    return jsonify(_producto_to_dict(nuevo, current_user_id)), 201


@bp_productos.route("/<int:id_producto>", methods=["PUT"])
@jwt_required()
def actualizar_producto(id_producto: int):
    """
    Edita un producto (solo dueño).
    """
    current_user_id_raw = get_jwt_identity()
    try:
        current_user_id = int(current_user_id_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Token inválido"}), 401

    p = Producto.query.get_or_404(id_producto)

    if p.id_usuario != current_user_id:
        return jsonify({"error": "No autorizado"}), 403

    data = request.get_json() or {}
    print("DEBUG actualizar_producto data:", data)

    if "id_categoria" in data and data["id_categoria"]:
        cat = Categoria.query.get(data["id_categoria"])
        if not cat:
            return jsonify({"error": "Categoría inválida"}), 422
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
    Alterna el campo estado de un producto:
      disponible -> baja
      baja -> disponible

    Solo el dueño del producto puede hacerlo.
    """
    current_user_id_raw = get_jwt_identity()
    try:
        current_user_id = int(current_user_id_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Token inválido"}), 401

    p = Producto.query.get_or_404(id_producto)

    # Verificamos dueño
    if int(p.id_usuario) != current_user_id:
        return jsonify({"error": "No autorizado"}), 403

    # No usamos el body. Sólo alternamos.
    estado_actual = (p.estado or "").strip().lower()
    print("DEBUG estado actual:", estado_actual)

    if estado_actual == "disponible":
        nuevo_estado = "baja"
    else:
        nuevo_estado = "disponible"

    p.estado = nuevo_estado
    db.session.commit()

    print("DEBUG nuevo estado:", nuevo_estado)

    return jsonify(_producto_to_dict(p, current_user_id)), 200




