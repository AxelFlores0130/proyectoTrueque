# routes_moderacion.py

import os
import base64
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from openai import OpenAI

bp_moderacion = Blueprint("moderacion", __name__, url_prefix="/api/moderacion")

# Cliente de OpenAI usando la variable de entorno
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


@bp_moderacion.route("/imagen", methods=["POST"])
@jwt_required(optional=True)  # opcional: permite que funcione aunque no mandes token
def moderar_imagen():
    try:
        # 1) Verificar que venga el archivo
        if "imagen" not in request.files:
            return jsonify({
                "allowed": True,
                "category": "sin_imagen",
                "reason": "No se envió ninguna imagen, se permite por defecto."
            }), 200

        file = request.files["imagen"]
        image_bytes = file.read()

        if not image_bytes:
            return jsonify({
                "allowed": True,
                "category": "imagen_vacia",
                "reason": "La imagen está vacía, se permite por defecto."
            }), 200

        # 2) Codificar la imagen en base64 para enviarla al modelo
        b64_image = base64.b64encode(image_bytes).decode("utf-8")

        # 3) Llamar a OpenAI con visión
        prompt_text = """
Eres un sistema de moderación para una app de trueques entre personas.

Debes decidir si la imagen muestra contenido NO permitido según esta lista:
- Alcohol (botellas, latas, copas de bebidas alcohólicas, vinos, licores, cerveza, etc.)
- Tabaco, cigarros, vapeadores, cigarrillos electrónicos.
- Drogas o sustancias ilegales.
- Armas (pistolas, rifles, cuchillos de combate, etc.).
- Contenido sexual explícito o desnudos.
- Violencia gráfica (sangre, heridas graves).
- Cualquier producto claramente ilegal de vender o intercambiar.

Responde SOLO con una de estas dos formas (sin explicaciones extra):

1) "permitido"
   -> si la imagen NO muestra nada de la lista anterior.

2) "bloqueado - CATEGORÍA"
   -> si ves algo de la lista; por ejemplo:
   - "bloqueado - alcohol"
   - "bloqueado - tabaco"
   - "bloqueado - armas"
   - "bloqueado - drogas"
   - "bloqueado - contenido_sexual"
   - "bloqueado - violencia"
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt_text},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{b64_image}"
                            },
                        },
                    ],
                }
            ],
            temperature=0,
        )

        # 4) Recuperar el texto de respuesta
        message = response.choices[0].message

        # En la API nueva, content suele ser una lista de bloques
        if isinstance(message.content, list):
            # Tomamos el primer bloque de texto
            text_result = ""
            for part in message.content:
                if hasattr(part, "text"):
                    text_result += part.text
        else:
            text_result = message.content or ""

        text_result = (text_result or "").strip().lower()

        allowed = True
        category = "ninguna"

        if "bloqueado" in text_result:
            allowed = False
            # Intentar extraer categoría después del guion
            if "-" in text_result:
                category = text_result.split("-", 1)[1].strip()
            else:
                category = "contenido_no_permitido"
        else:
            allowed = True
            category = "permitido"

        return jsonify({
            "allowed": allowed,
            "category": category,
            "reason": text_result
        }), 200

    except Exception as e:
        # 5) Si algo truena, ya NO devolvemos 500
        print("Error en /api/moderacion/imagen:", repr(e), flush=True)
        return jsonify({
            "allowed": True,   # si quieres ser estricto, cámbialo a False
            "category": "error",
            "reason": "No se pudo analizar la imagen con IA, se permite por defecto."
        }), 200


