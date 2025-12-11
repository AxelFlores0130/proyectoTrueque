# models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from decimal import Decimal

db = SQLAlchemy()

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id_usuario = db.Column(db.Integer, primary_key=True)
    nombre_completo = db.Column(db.String(100), nullable=False)
    correo = db.Column(db.String(100), unique=True, nullable=False)
    contrasena = db.Column(db.String(255), nullable=False)
    telefono = db.Column(db.String(20))
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)
    verificado = db.Column(db.Boolean, default=True)
    rol = db.Column(db.Enum('cliente', 'administrador', name='rol_enum'), default='cliente')

class Categoria(db.Model):
    __tablename__ = 'categorias'
    id_categoria = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    descripcion = db.Column(db.String(255))

class Producto(db.Model):
    __tablename__ = 'productos'
    id_producto = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    id_categoria = db.Column(db.Integer, db.ForeignKey('categorias.id_categoria'), nullable=False)
    titulo = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text)
    valor_estimado = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    imagen_url = db.Column(db.String(255))
    ubicacion = db.Column(db.String(120))
    # En la BD es enum('disponible','en_intercambio','intercambiado')
        # Lo manejamos como texto sencillo: 'disponible' o 'baja'
    estado = db.Column(db.String(20), nullable=False, default='disponible')

    fecha_publicacion = db.Column(db.DateTime, default=datetime.utcnow)

    usuario = db.relationship('Usuario', backref='productos')
    categoria = db.relationship('Categoria', backref='productos')

    def estado_api(self):
        # La BD ya guarda directamente 'disponible' o 'baja'
        return self.estado


    def to_dict(self, current_user_id=None):
        return {
            'id_producto': self.id_producto,
            'id_usuario': self.id_usuario,
            'id_categoria': self.id_categoria,
            'categoria_nombre': self.categoria.nombre if self.categoria else None,
            'titulo': self.titulo,
            'descripcion': self.descripcion,
            'valor_estimado': float(self.valor_estimado),
            'imagen_url': self.imagen_url,
            'ubicacion': self.ubicacion,
            'estado': self.estado_api(),  # regresamos 'disponible' o 'baja'
            'es_tuyo': current_user_id is not None and self.id_usuario == current_user_id,
            'fecha_publicacion': self.fecha_publicacion.isoformat() if self.fecha_publicacion else None
        }

class Solicitud(db.Model):
    __tablename__ = 'solicitudes'
    id_solicitud = db.Column(db.Integer, primary_key=True)
    id_solicitante = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    id_producto_objetivo = db.Column(db.Integer, db.ForeignKey('productos.id_producto'), nullable=False)
    id_producto_ofrece = db.Column(db.Integer, db.ForeignKey('productos.id_producto'))
    mensaje = db.Column(db.Text)
    ubicacion = db.Column(db.String(255))
    fecha_propuesta = db.Column(db.DateTime)
    # 👇 CAMPO IMPORTANTE
    diferencia_propuesta = db.Column(db.Numeric(10, 2), nullable=True)
    estado = db.Column(db.String(20), default='pendiente')
    confirmo_solicitante = db.Column(db.Boolean, default=False)
    confirmo_receptor = db.Column(db.Boolean, default=False)
    creado = db.Column(db.DateTime, default=datetime.utcnow)

    solicitante = db.relationship('Usuario', foreign_keys=[id_solicitante])
    producto_objetivo = db.relationship('Producto', foreign_keys=[id_producto_objetivo])
    producto_ofrece = db.relationship('Producto', foreign_keys=[id_producto_ofrece])

    def to_card(self, current_user_id):
        # usuario “del otro lado” (dueño del producto objetivo)
        receptor_user = self.producto_objetivo.usuario if self.producto_objetivo else None

        return {
            'id_solicitud': self.id_solicitud,
            'estado': self.estado,
            'mensaje': self.mensaje,
            'creado': self.creado.isoformat() if self.creado else None,
            'soy_solicitante': self.id_solicitante == current_user_id,
            'diferencia_propuesta': float(self.diferencia_propuesta) if self.diferencia_propuesta is not None else None,
            'producto_objetivo': self.producto_objetivo.to_dict(current_user_id) if self.producto_objetivo else None,
            'producto_ofrece': self.producto_ofrece.to_dict(current_user_id) if self.producto_ofrece else None,
            'solicitante': {
                'id_usuario': self.solicitante.id_usuario,
                'nombre': self.solicitante.nombre_completo
            },
            'receptor': {
                'id_usuario': receptor_user.id_usuario,
                'nombre': receptor_user.nombre_completo
            } if receptor_user else None
        }



class Notificacion(db.Model):
    __tablename__ = 'notificaciones'
    id_notificacion = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    id_intercambio = db.Column(db.Integer, nullable=True)
    mensaje = db.Column(db.String(255))
    leido = db.Column(db.Boolean, default=False)
    fecha_envio = db.Column(db.DateTime, default=datetime.utcnow)

class Intercambio(db.Model):
    __tablename__ = "intercambios"

    id_intercambio = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_solicitud = db.Column(db.Integer, db.ForeignKey("solicitudes.id_solicitud"), nullable=False)

    id_producto_ofrecido = db.Column(db.Integer, db.ForeignKey("productos.id_producto"), nullable=True)
    id_producto_solicitado = db.Column(db.Integer, db.ForeignKey("productos.id_producto"), nullable=False)

    id_usuario_ofrece = db.Column(db.Integer, db.ForeignKey("usuarios.id_usuario"), nullable=False)
    id_usuario_recibe = db.Column(db.Integer, db.ForeignKey("usuarios.id_usuario"), nullable=False)

    diferencia_monetaria = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal("0.00"))

    estado = db.Column(
        db.Enum("pendiente", "aceptado", "cancelado", name="estado_intercambio"),
        nullable=False,
        default="pendiente",
    )
    estado_solicitante = db.Column(
        db.Enum("pendiente", "aceptado", "cancelado", name="estado_intercambio_solicitante"),
        nullable=False,
        default="pendiente",
    )
    estado_receptor = db.Column(
        db.Enum("pendiente", "aceptado", "cancelado", name="estado_intercambio_receptor"),
        nullable=False,
        default="pendiente",
    )

    fecha_solicitud = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    fecha_actualizacion = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    fecha_limite_confirmacion = db.Column(db.DateTime, nullable=True)

class IntercambioMensaje(db.Model):
    __tablename__ = "intercambio_mensajes"

    id_mensaje = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_intercambio = db.Column(db.Integer, db.ForeignKey("intercambios.id_intercambio"), nullable=False)
    id_usuario = db.Column(db.Integer, db.ForeignKey("usuarios.id_usuario"), nullable=False)

    tipo = db.Column(
        db.Enum("texto", "ubicacion", name="tipo_mensaje"),
        nullable=False,
        default="texto",
    )
    contenido = db.Column(db.Text, nullable=True)
    lat = db.Column(db.Numeric(10, 7), nullable=True)
    lng = db.Column(db.Numeric(10, 7), nullable=True)
    creado = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    intercambio = db.relationship("Intercambio", backref="mensajes")

