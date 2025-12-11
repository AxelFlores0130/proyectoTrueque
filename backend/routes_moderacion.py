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
@jwt_required(optional=True)
def moderar_imagen():
    try:
        # 1) Intentar obtener el archivo con varios nombres posibles
        file = (
            request.files.get("imagen")
            or request.files.get("file")
            or (next(iter(request.files.values())) if request.files else None)
        )

        if not file:
            # 👉 No se ve archivo, pero lo tratamos como PERMITIDO
            return jsonify({
                "allowed": True,
                "category": "permitido",
                "reason": "No se envió ninguna imagen, se permite por defecto."
            }), 200

        image_bytes = file.read()

        if not image_bytes:
            # 👉 Imagen vacía, también PERMITIDO
            return jsonify({
                "allowed": True,
                "category": "permitido",
                "reason": "La imagen está vacía, se permite por defecto."
            }), 200

        # 2) Codificar la imagen en base64
        b64_image = base64.b64encode(image_bytes).decode("utf-8")

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

        message = response.choices[0].message

        if isinstance(message.content, list):
            text_result = ""
            for part in message.content:
                if hasattr(part, "text"):
                    text_result += part.text
        else:
            text_result = message.content or ""

        text_result = (text_result or "").strip().lower()

        allowed = True
        category = "permitido"

        if "bloqueado" in text_result:
            allowed = False
            if "-" in text_result:
                category = text_result.split("-", 1)[1].strip()
            else:
                category = "contenido_no_permitido"

        return jsonify({
            "allowed": allowed,
            "category": category,
            "reason": text_result
        }), 200

    except Exception as e:
        print("Error en /api/moderacion/imagen:", repr(e), flush=True)
        # 👉 En caso de error de IA, también PERMITIDO para no tronar el flujo
        return jsonify({
            "allowed": True,
            "category": "permitido",
            "reason": "No se pudo analizar la imagen con IA, se permite por defecto."
        }), 200
    



