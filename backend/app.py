from flask import Flask, request, jsonify, send_file
import os
import base64
from io import BytesIO
from PIL import Image
from documento import generar_documento
from memorandum import generar_memorandum
import traceback
import json
import pandas as pd
from zipfile import ZipFile

app = Flask(__name__)

@app.route('/')
def home():
    return "¡Servidor Flask en ejecución!"

# Carpeta donde se guardarán los archivos
UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

DIPLOMA_FOLDER = "diplomas"
if not os.path.exists(DIPLOMA_FOLDER):
    os.makedirs(DIPLOMA_FOLDER)

JSON_FOLDER = "json_data"
os.makedirs(JSON_FOLDER, exist_ok=True)

@app.route('/recibir_datos', methods=['POST'])
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
                return {"error": "Falta el archivo para carga masiva"}, 400

            if archivo_masivo.filename.endswith(".xlsx"):
                df = pd.read_excel(archivo_masivo)
            elif archivo_masivo.filename.endswith(".csv"):
                df = pd.read_csv(archivo_masivo)
            else:
                return {"error": "Formato de archivo no soportado"}, 400

            if "Destinatarios" not in df.columns:
                return {"error": "La columna 'Destinatarios' no existe en el archivo"}, 400

            zip_path = os.path.join(UPLOAD_FOLDER, "cartas_masivas.zip")
            with ZipFile(zip_path, "w") as zipf:
                for index, row in df.iterrows():
                    datos_individuales = datos.copy()
                    datos_individuales["destinatario"] = row["Destinatarios"]
                    doc_path = generar_documento(datos_individuales, archivo_membrete)
                    nombre_doc = f"carta_{index+1}.docx"
                    zipf.write(doc_path, arcname=nombre_doc)

            return send_file(zip_path, as_attachment=True, download_name="cartas_masivas.zip")

        doc_path = generar_documento(datos, archivo_membrete)

        if not doc_path:
            return {"error": "No se pudo generar el documento"}, 500

        return send_file(doc_path, as_attachment=True, download_name="carta_generada.docx")

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}, 500

PLANTILLA_PATH = "plantilla.json"  # Ruta donde se guardará la plantilla

# Guardar plantilla en un archivo JSON
def guardar_plantilla(data):
    with open(PLANTILLA_PATH, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

@app.route('/guardar-plantilla', methods=['POST'])
def guardar_plantilla_api():
    data = request.json
    guardar_plantilla(data)
    return jsonify({"status": "ok", "message": "Plantilla guardada correctamente."})
    

@app.route('/crear_memorandum', methods=['POST'])
def crear_memorandum():
    try:
        if not request.form:
            return jsonify({"error": "Formato no soportado. Usa multipart/form-data"}), 415
        
        datos=request.form.to_dict()
        tipo_gestion = datos.get("tipoGestion")

        if tipo_gestion =="masiva":
            archivo_masivo = request.files.get("archivoMasivo")
            if not archivo_masivo:
                return {"error": "Falta el archivo para carga masiva"}, 400
            if archivo_masivo.filename.endswith(".xlsx"):
                df = pd.read_excel(archivo_masivo)
            elif archivo_masivo.filename.endswith(".csv"):
                df = pd.read_csv(archivo_masivo)
            else:
                return {"error": "Formato de archivo no soportado"}, 400
            
            zip_path = os.path.join(UPLOAD_FOLDER, "memorandums.zip")
            with ZipFile(zip_path, "w") as zipf:
                for index, row in df.iterrows():
                    datos_ind = datos.copy()
                    datos_ind["para"] = row.get("Para", "N/D")
                    datos_ind["de"] = row.get("De", "N/D")
                    datos_ind["asunto"] = row.get("Asunto", "N/D")
                    datos_ind["contenido"] = row.get("Contenido", "N/D")
                    datos_ind["fecha"] = row.get("Fecha", "N/D")
                    path = generar_memorandum(datos_ind)
                    zipf.write(path, arcname=f"memorandum_{index+1}.docx")
            return send_file(zip_path, as_attachment=True, download_name="memorandums.zip")
        else:  # Individual
            doc_path = generar_memorandum(datos)
            return send_file(doc_path, as_attachment=True, download_name="memorandum.docx")
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

