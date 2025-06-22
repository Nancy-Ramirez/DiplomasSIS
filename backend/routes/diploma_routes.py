import os
import json
import zipfile
from flask import Blueprint, request, send_file, jsonify
from services.diploma_service import generar_diplomas_masivos, guardar_plantilla_json, generar_imagen_diploma
import pandas as pd
import base64
from io import BytesIO
from PIL import Image


diploma_bp = Blueprint("diplomas", __name__)

@diploma_bp.route("/guardar-plantilla", methods=["POST"])
def guardar_plantilla_diploma():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"status": "error", "mensaje": "No se recibió JSON"}), 400

        # Usar función con nombre único
        ruta = guardar_plantilla_json(data)
        nombre_archivo = os.path.basename(ruta)

        return jsonify({
            "status": "ok",
            "mensaje": "Plantilla guardada exitosamente",
            "archivo": nombre_archivo
        })

    except Exception as e:
        return jsonify({"status": "error", "mensaje": str(e)}), 500

@diploma_bp.route("/generar-masivo", methods=["POST"])
def generar_diplomas():
    try:
        archivo = request.files.get("archivo_estudiantes")  
        nombre_plantilla = request.form.get("nombre_plantilla", "plantilla.json")
        generar_qr_flag = request.form.get("generar_qr", "false").lower() == "true"
        
        if not archivo:
            return jsonify({"status": "error", "mensaje": "No se recibió archivo de estudiantes"}), 400

        ruta_plantilla = os.path.join("plantillas_guardadas", nombre_plantilla)
        if not os.path.exists(ruta_plantilla):
            return jsonify({"status": "error", "mensaje": "La plantilla no existe"}), 404

        output_zip = generar_diplomas_masivos(archivo, ruta_plantilla, generar_qr_flag)
        return send_file(output_zip, as_attachment=True)

    except Exception as e:
        return jsonify({"status": "error", "mensaje": str(e)}), 500
    
@diploma_bp.route("/plantillas_guardadas", methods=["GET"])
def obtener_plantillas_guardadas():
    ruta_json = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "plantillas_guardadas"))
    plantillas = []

    for archivo in os.listdir(ruta_json):
        if archivo.endswith(".json"):
            ruta = os.path.join(ruta_json, archivo)
            with open(ruta, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Simula un estudiante ficticio
            fila_ejemplo = pd.Series({
                "NOMBRES": "Ejemplo Estudiante",
                "CURSO": "Curso de Demostración"
            })

            try:
                img = generar_imagen_diploma(data, fila_ejemplo)
                buffer = BytesIO()
                img.save(buffer, format="PNG")
                img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

                plantillas.append({
                    "id": archivo.replace(".json", ""),
                    "nombre": archivo.replace(".json", ""),
                    "imagen": f"data:image/png;base64,{img_base64}"
                })
            except Exception as e:
                print(f"[ERROR] No se pudo generar imagen para {archivo}: {e}")

    return jsonify(plantillas)

@diploma_bp.route("/generar_desde_nombre", methods=["POST"])
def generar_desde_nombre():
    nombre_json = request.form.get("nombre_json")
    excel_file = request.files.get("excel")
    generar_qr_flag = request.form.get("generar_qr", "false").lower() == "true"

    if not nombre_json or not excel_file:
        return jsonify({"error": "Faltan datos"}), 400

    # Ruta corregida al archivo JSON
    json_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "plantillas_guardadas", nombre_json)
    )
    if not os.path.exists(json_path):
        return jsonify({"error": "Plantilla no encontrada"}), 404

    try:
        # 🧠 Reutilizar función completa igual que generar-masivo
        output_zip = generar_diplomas_masivos(excel_file, json_path, generar_qr_flag)

        # 📦 Retornar ZIP como descarga
        return send_file(output_zip, as_attachment=True)

    except Exception as e:
        print("[ERROR GENERAR DESDE NOMBRE]:", str(e))
        return jsonify({"error": str(e)}), 500

@diploma_bp.route("/eliminar_plantilla", methods=["DELETE"])
def eliminar_plantilla():
    data = request.get_json()
    nombre = data.get("nombre")

    if not nombre:
        return jsonify({"error": "Falta el nombre de la plantilla"}), 400

    ruta = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "plantillas_guardadas", nombre + ".json")
    )

    if not os.path.exists(ruta):
        return jsonify({"error": "La plantilla no existe"}), 404

    try:
        os.remove(ruta)
        return jsonify({"status": "ok", "mensaje": "Plantilla eliminada"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
