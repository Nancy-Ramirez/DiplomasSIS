# ✅ backend/routes/diploma_routes.py

from flask import Blueprint, request, jsonify, send_file
import os
import traceback
import pandas as pd
from services.diploma_service import generar_diploma
from werkzeug.utils import secure_filename
from zipfile import ZipFile

diploma_bp = Blueprint('diploma', __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'diplomas')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@diploma_bp.route('/generar-diploma', methods=['POST'])
def generar_diploma_endpoint():
    try:
        if not request.form:
            return jsonify({"error": "Formato no soportado. Usa multipart/form-data"}), 415

        datos = request.form.to_dict()
        tipo_generacion = datos.get("tipoGeneracion", "individual")

        if tipo_generacion == "masiva":
            archivo_masivo = request.files.get("archivoMasivo")
            if not archivo_masivo:
                return jsonify({"error": "Falta el archivo para carga masiva"}), 400

            if archivo_masivo.filename.endswith(".xlsx"):
                df = pd.read_excel(archivo_masivo)
            elif archivo_masivo.filename.endswith(".csv"):
                df = pd.read_csv(archivo_masivo)
            else:
                return jsonify({"error": "Formato de archivo no soportado"}), 400

            zip_path = os.path.join(UPLOAD_FOLDER, "diplomas_masivos.zip")
            with ZipFile(zip_path, "w") as zipf:
                for index, row in df.iterrows():
                    datos_individuales = datos.copy()
                    datos_individuales["nombre"] = row.get("Nombre", "Participante")
                    doc_path, error = generar_diploma(datos_individuales)

                    if error or not doc_path:
                        continue

                    nombre_doc = f"diploma_{index+1}.docx"
                    zipf.write(doc_path, arcname=nombre_doc)

            return send_file(zip_path, as_attachment=True, download_name="diplomas_masivos.zip")

        # Individual
        doc_path, error = generar_diploma(datos)

        if error or not doc_path:
            return jsonify({"error": error or "No se pudo generar el diploma"}), 500

        return send_file(doc_path, as_attachment=True, download_name="diploma_generado.docx")

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Luego seguiría el services/diploma_service.py similar al anterior, ¡avisame si continuamos!
