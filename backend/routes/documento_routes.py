from flask import Blueprint, request, jsonify, send_file
import os
import traceback
import pandas as pd
from services.documento_service import generar_documento
from werkzeug.utils import secure_filename
from zipfile import ZipFile

documento_bp = Blueprint('documento', __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@documento_bp.route('/recibir-datos', methods=['POST'])
def recibir_datos():
    try:
        if not request.form:
            return jsonify({"error": "Formato no soportado. Usa multipart/form-data"}), 415

        datos = request.form.to_dict()
        tipo_carta = datos.get("tipoCarta", "individual")
        archivo_membrete = request.files.get("membrete")

        if tipo_carta == "masiva":
            archivo_masivo = request.files.get("archivoMasivo")
            if not archivo_masivo:
                return jsonify({"error": "Falta el archivo para carga masiva"}), 400

            if archivo_masivo.filename.endswith(".xlsx"):
                df = pd.read_excel(archivo_masivo)
            elif archivo_masivo.filename.endswith(".csv"):
                df = pd.read_csv(archivo_masivo)
            else:
                return jsonify({"error": "Formato de archivo no soportado"}), 400

            if "Destinatarios" not in df.columns:
                return jsonify({"error": "La columna 'Destinatarios' no existe en el archivo"}), 400

            zip_path = os.path.join(UPLOAD_FOLDER, "cartas_masivas.zip")
            with ZipFile(zip_path, "w") as zipf:
                for index, row in df.iterrows():
                    datos_individuales = datos.copy()
                    datos_individuales["destinatario"] = row["Destinatarios"]
                    doc_path, error = generar_documento(datos_individuales, archivo_membrete)

                    if error or not doc_path:
                        continue  # 👈 Opcional: ignorar errores individuales

                    nombre_doc = f"carta_{index+1}.docx"
                    zipf.write(doc_path, arcname=nombre_doc)

            return send_file(zip_path, as_attachment=True, download_name="cartas_masivas.zip")

        # Individual
        doc_path, error = generar_documento(datos, archivo_membrete)

        if error or not doc_path:
            return jsonify({"error": error or "No se pudo generar el documento"}), 500

        return send_file(doc_path, as_attachment=True, download_name="carta_generada.docx")

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500