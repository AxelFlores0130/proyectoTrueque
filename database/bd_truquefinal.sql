-- BD Trueque Final (igual a tu script)
CREATE DATABASE IF NOT EXISTS bd_truquefinal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bd_truquefinal;

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    verificado BOOLEAN DEFAULT FALSE,
    rol ENUM('cliente','administrador') DEFAULT 'cliente'
);

CREATE TABLE IF NOT EXISTS categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255)
);

INSERT INTO categorias (nombre, descripcion)
SELECT 'Electrónicos','Computadoras, consolas, televisores, etc.' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre='Electrónicos');
INSERT INTO categorias (nombre, descripcion)
SELECT 'Celulares','Teléfonos y accesorios.' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre='Celulares');
INSERT INTO categorias (nombre, descripcion)
SELECT 'Hogar','Muebles, decoración, electrodomésticos.' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre='Hogar');
INSERT INTO categorias (nombre, descripcion)
SELECT 'Deportes','Artículos deportivos y de ejercicio.' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre='Deportes');
INSERT INTO categorias (nombre, descripcion)
SELECT 'Ropa','Ropa, calzado y accesorios.' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre='Ropa');
INSERT INTO categorias (nombre, descripcion)
SELECT 'Otros','Artículos varios no clasificados.' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre='Otros');

CREATE TABLE IF NOT EXISTS productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_categoria INT NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    valor_estimado DECIMAL(10,2) NOT NULL DEFAULT 0,
    imagen_url VARCHAR(255),
    estado ENUM('disponible','en_intercambio','intercambiado') DEFAULT 'disponible',
    fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS intercambios (
    id_intercambio INT AUTO_INCREMENT PRIMARY KEY,
    id_producto_ofrecido INT NOT NULL,
    id_producto_solicitado INT NOT NULL,
    id_usuario_ofrece INT NOT NULL,
    id_usuario_recibe INT NOT NULL,
    diferencia_monetaria DECIMAL(10,2) DEFAULT 0,
    estado ENUM('pendiente','aceptado','rechazado','completado','cancelado') DEFAULT 'pendiente',
    fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto_ofrecido) REFERENCES productos(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_producto_solicitado) REFERENCES productos(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_ofrece) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_recibe) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pagos (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_intercambio INT NOT NULL,
    id_usuario_pagador INT NOT NULL,
    id_usuario_receptor INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    comision DECIMAL(10,2) GENERATED ALWAYS AS (monto * 0.10) STORED,
    monto_neto DECIMAL(10,2) GENERATED ALWAYS AS (monto - (monto * 0.10)) STORED,
    metodo_pago ENUM('tarjeta','simulado') DEFAULT 'simulado',
    estado ENUM('pendiente','exitoso','fallido') DEFAULT 'pendiente',
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_intercambio) REFERENCES intercambios(id_intercambio) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_pagador) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_receptor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ubicaciones (
    id_ubicacion INT AUTO_INCREMENT PRIMARY KEY,
    id_intercambio INT NOT NULL,
    direccion VARCHAR(255),
    latitud DECIMAL(10,7),
    longitud DECIMAL(10,7),
    fecha_encuentro DATE,
    hora_encuentro TIME,
    FOREIGN KEY (id_intercambio) REFERENCES intercambios(id_intercambio) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historial_intercambios (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_intercambio INT NOT NULL,
    fecha_confirmacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_intercambio) REFERENCES intercambios(id_intercambio) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_intercambio INT NOT NULL,
    mensaje VARCHAR(255),
    leido BOOLEAN DEFAULT FALSE,
    fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_intercambio) REFERENCES intercambios(id_intercambio) ON DELETE CASCADE
);

CREATE OR REPLACE VIEW resumen_admin AS
SELECT 
    DATE(p.fecha_pago) AS fecha,
    COUNT(DISTINCT p.id_intercambio) AS intercambios_realizados,
    SUM(p.monto) AS total_pagado,
    SUM(p.comision) AS comision_ganada,
    SUM(p.monto_neto) AS total_recibido_usuarios
FROM pagos p
WHERE p.estado = 'exitoso'
GROUP BY DATE(p.fecha_pago)
ORDER BY fecha DESC;
