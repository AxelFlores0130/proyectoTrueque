# backend/routes_moderacion.py

import base64
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from openai import OpenAI

bp_moderacion = Blueprint("moderacion", __name__, url_prefix="/api/moderacion")

# Usa la API key desde la variable de entorno OPENAI_API_KEY
client = OpenAI()


@bp_moderacion.route("/imagen", methods=["POST"])
@jwt_required(optional=True)
def moderar_imagen():
    """
    Analiza una imagen (y opcionalmente título/descripcion) para decidir
    si el producto es legal o ilegal para publicar en la app.

    Espera un FormData con:
      - archivo: File (imagen)
      - titulo: string (opcional)
      - descripcion: string (opcional)
    """

    if "archivo" not in request.files:
        return jsonify({"ok": False, "error": "No se envió archivo"}), 400

    file = request.files["archivo"]
    raw = file.read()
    if not raw:
        return jsonify({"ok": False, "error": "Archivo vacío"}), 400

    # Texto adicional
    titulo = request.form.get("titulo") or ""
    descripcion = request.form.get("descripcion") or ""

    # Pasamos la imagen como base64 data URL
    b64 = base64.b64encode(raw).decode("utf-8")
    data_url = f"data:{file.mimetype};base64,{b64}"

    system_prompt = """
Eres un moderador de contenido para una aplicación de trueque de productos.

Tu tarea es decidir si un producto es LEGAL o ILEGAL para publicar,
basándote en la IMAGEN y en el TEXTO que te damos (título y descripción).

CONSIDERA ILEGAL (DEBES BLOQUEAR) cualquier producto que parezca ser:
- Drogas o sustancias ilegales (marihuana, cocaína, cristal, etc.).
- Vapes, cigarros electrónicos, pods, cartuchos, juul, etc.
- Cigarros de tabaco tradicionales, puros, tabaco para fumar, etc.
- Bebidas alcohólicas (cerveza, vino, tequila, vodka, whisky, ron, mezcal, etc.).
- Armas de fuego (pistolas, rifles, escopetas), municiones.
- Armas blancas peligrosas (cuchillos tácticos, navajas automáticas, machetes de combate).
- Explosivos, fuegos artificiales peligrosos o pirotecnia fuerte.
- Medicamentos controlados o con receta, frascos de pastillas sospechosas.
- Documentos personales: INE, pasaporte, licencia, tarjeta bancaria, etc.
- Productos sexuales explícitos o para adultos.

SI HAY CUALQUIER DUDA razonable de que pueda ser de estas categorías,
clasifica como ILEGAL.

Responde SIEMPRE y SOLO en JSON con este formato EXACTO:
{
  "is_illegal": true o false,
  "reason": "explicación corta en español"
}
"""

    user_content = f"Título: {titulo}\nDescripción: {descripcion}\nAnaliza si el producto parece ilegal según las reglas."

    try:
        resp = client.chat.completions.create(
            model="gpt-4.1-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_content},
                        {
                            "type": "input_image",
                            "image_url": {"url": data_url}
                        },
                    ],
                },
            ],
            max_tokens=128,
        )

        content = resp.choices[0].message.content
        data = json.loads(content)

        is_illegal = bool(data.get("is_illegal"))
        reason = data.get("reason") or ""

        return jsonify(
            {
                "ok": True,
                "is_illegal": is_illegal,
                "reason": reason,
            }
        ), 200

    except Exception as e:
        print("ERROR moderando imagen:", e)
        return jsonify(
            {
                "ok": False,
                "error": "Error al analizar la imagen con IA",
            }
        ), 500

