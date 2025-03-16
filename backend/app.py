from flask import Flask, request, jsonify, send_file
import os
from documento import generar_documento

app = Flask(__name__)

@app.route('/')
def home():
    return "¡Servidor Flask en ejecución!"

# Carpeta donde se guardarán los archivos
UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/recibir_datos', methods=['POST'])
def recibir_datos():
    try:
        # Verificar si se está recibiendo FormData
        if not request.form:
            return jsonify({"error": "Formato no soportado. Usa multipart/form-data"}), 415

        # Obtener los datos del formulario
        datos = request.form.to_dict()

        # Obtener el archivo (si existe)
        archivo_membrete = request.files.get("membrete")

        # Llamar a la función para generar el documento
        doc_path = generar_documento(datos, archivo_membrete)

        if not doc_path:
            return {"error": "No se pudo generar el documento"}, 500

        # 🔥 Enviar el archivo directamente como respuesta
        return send_file(doc_path, as_attachment=True, download_name="carta_generada.docx")

    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/verificar_sirve')
def verificar_sirve():
    return "si sirve"
