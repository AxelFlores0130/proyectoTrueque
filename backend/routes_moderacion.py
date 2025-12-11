# routes_moderacion.py

import base64
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from openai import OpenAI

bp_moderacion = Blueprint("moderacion", __name__, url_prefix="/api/moderacion")

# Usa la OPENAI_API_KEY del entorno
client = OpenAI()


@bp_moderacion.route("/imagen-producto", methods=["POST"])
@jwt_required()
def moderar_imagen_producto():
    """
    Recibe una imagen (campo 'imagen') y devuelve:
    {
      "allowed": bool,
      "category": "ok|drogas|alcohol|vape|cigarros|arma|documento|otro_prohibido",
      "reason": "texto breve en español"
    }
    """
    file = request.files.get("imagen")
    if not file:
        return jsonify({"error": "No se envió ninguna imagen"}), 400

    # Leer bytes y convertir a data URL para el modelo
    image_bytes = file.read()
    base64_image = base64.b64encode(image_bytes).decode("utf-8")
    mime = file.mimetype or "image/jpeg"
    data_url = f"data:{mime};base64,{base64_image}"

    instrucciones = """
Eres un filtro de imágenes para una plataforma de trueque de productos.

Recibes la foto de UN producto. Debes decidir si se puede publicar según estas reglas:

PROHIBIDOS (no se pueden publicar):
- Drogas ilegales, marihuana, cocaína, pastillas de venta controlada, jeringas con drogas.
- Medicamentos controlados (recetados) o sustancias peligrosas.
- Cigarros, cigarrillos, tabaco.
- Vapes, cigarros electrónicos, pods.
- Alcohol en cualquier presentación (botellas, latas, shots, cajas de vino, etc.).
- Armas de fuego (pistolas, rifles, escopetas), armas blancas peligrosas (cuchillos de combate, navajas tácticas), municiones, explosivos.
- Documentos oficiales o personales: INE/IFE, pasaporte, licencia, tarjetas bancarias, cheques, actas de nacimiento, títulos, etc.
- Cualquier cosa obviamente ilegal o muy peligrosa de vender.

PERMITIDOS (sí se pueden publicar):
- Ropa, zapatos, accesorios.
- Electrónicos, celulares, laptops, consolas.
- Juguetes, libros, muebles, decoración, etc.

Responde ÚNICAMENTE un JSON válido con este formato EXACTO (sin texto adicional):

{
  "allowed": true o false,
  "category": "ok" o "drogas" o "alcohol" o "vape" o "cigarros" o "arma" o "documento" o "otro_prohibido",
  "reason": "explicación muy corta en español"
}
"""

    try:
        resp = client.responses.create(
            model="gpt-4.1-mini",
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": instrucciones},
                        {"type": "input_image", "image_url": data_url},
                    ],
                }
            ],
        )

        raw_text = resp.output_text  # la IA devuelve el JSON como texto
        data = json.loads(raw_text)

        allowed = bool(data.get("allowed", False))
        category = data.get("category", "otro_prohibido")
        reason = data.get("reason", "")

        return jsonify(
            {
                "allowed": allowed,
                "category": category,
                "reason": reason,
            }
        ), 200

    except json.JSONDecodeError:
        # Por si la IA no responde un JSON perfecto
        return jsonify({
            "allowed": False,
            "category": "otro_prohibido",
            "reason": "No se pudo interpretar la respuesta de la IA. Intenta con otra foto."
        }), 200

    except Exception as e:
        print("Error en moderación de imagen:", e)
        return jsonify({
            "error": "No se pudo analizar la imagen en este momento. Inténtalo de nuevo."
        }), 500
