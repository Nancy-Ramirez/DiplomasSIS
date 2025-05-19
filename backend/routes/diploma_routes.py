import os
import json
import zipfile
from flask import Blueprint, request, send_file, jsonify
from services.diploma_service import generar_diplomas_masivos, guardar_plantilla_json

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