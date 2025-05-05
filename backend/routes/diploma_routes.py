from flask import Blueprint, request, jsonify
import pandas as pd
import base64, io, os, json
from PIL import Image, ImageDraw, ImageFont

diploma_bp = Blueprint("diploma_bp", __name__)

@diploma_bp.route("/generar-masivo", methods=["POST"])
def generar_diplomas_masivo():
    try:
        image_data = request.form.get("imagen")
        config_data = request.form.get("estructura")
        excel_file = request.files.get("excel")

        if not image_data or not config_data or not excel_file:
            return jsonify({"status": "error", "message": "Faltan datos (imagen, configuración o Excel)"}), 400

        base64_data = image_data.split(",")[1] if "," in image_data else image_data
        image_binary = base64.b64decode(base64_data)
        original_image = Image.open(io.BytesIO(image_binary)).convert("RGBA")

        df = pd.read_excel(excel_file)
        if df.empty:
            return jsonify({"status": "error", "message": "El Excel está vacío"}), 400

        config = json.loads(config_data)

        font_path = "C:/Windows/Fonts/arial.ttf"
        if not os.path.exists(font_path):
            font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

        font_cache = {}
        os.makedirs("diplomas_generados", exist_ok=True)

        for i, row in df.iterrows():
            img = original_image.copy()
            draw = ImageDraw.Draw(img)

            for text_item in config.get("text", []):
                raw_content = text_item["content"]
                content = raw_content

                for col in df.columns:
                    tag = f"{{{{{col.strip()}}}}}"
                    if tag in content:
                        content = content.replace(tag, str(row[col]))

                if content != raw_content:
                    font_key = (
                        text_item["font"]["family"],
                        text_item["font"]["size"],
                        text_item["font"].get("weight", "normal")
                    )
                    if font_key not in font_cache:
                        font_cache[font_key] = ImageFont.truetype(font_path, text_item["font"]["size"])
                    font = font_cache[font_key]

                    draw.text(
                        (text_item["position"]["x"], text_item["position"]["y"]),
                        content,
                        font=font,
                        fill=text_item["font"].get("color", "#000000")
                    )

            nombre_base = str(row[df.columns[0]]).strip().replace(" ", "_").replace("/", "-")
            output_path = f"diplomas_generados/diploma_{nombre_base}_{i+1}.png"
            img.save(output_path)

        return jsonify({"status": "ok", "message": "🎓 Diplomas generados exitosamente"})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500
