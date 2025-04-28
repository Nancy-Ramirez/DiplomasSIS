import os
import json
from flask import jsonify
from werkzeug.utils import secure_filename
from zipfile import ZipFile
import pandas as pd

# 📁 Definiciones de rutas
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, 'uploads')
DIPLOMAS_DIR = os.path.join(BASE_DIR, 'diplomas')
JSON_DIR = os.path.join(BASE_DIR, 'json_data')

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(DIPLOMAS_DIR, exist_ok=True)
os.makedirs(JSON_DIR, exist_ok=True)

# ✅ Guardar plantilla de diploma en JSON
def guardar_plantilla_service(data):
    plantilla_path = os.path.join(JSON_DIR, 'plantilla.json')
    with open(plantilla_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    return jsonify({"status": "ok", "message": "Plantilla guardada correctamente"})

# ✅ Guardar imagen de fondo del diploma
def guardar_diploma_imagen_service(request):
    diploma_imagen = request.files.get('diplomaImagen')
    if not diploma_imagen:
        return jsonify({"status": "error", "message": "No se envió la imagen del diploma"}), 400

    save_path = os.path.join(UPLOADS_DIR, 'plantilla_diploma.png')
    diploma_imagen.save(save_path)

    return jsonify({"status": "ok", "message": "Imagen del diploma guardada correctamente"})

# ✅ (Futuro) Generar diplomas masivos
def generar_diplomas_masivos_service(request):
    # (Aquí luego implementamos la generación de diplomas usando plantilla y excel)
    return jsonify({"status": "ok", "message": "Función de generación masiva en construcción..."})
