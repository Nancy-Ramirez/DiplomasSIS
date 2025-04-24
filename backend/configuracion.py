from flask import Blueprint, request, jsonify
import os
import json

config_bp = Blueprint('configuracion', __name__)

BASE_DIR = os.path.dirname(__file__)
CONFIG_DIR = os.path.join(BASE_DIR, 'configuracion')
os.makedirs(CONFIG_DIR, exist_ok=True)

CONFIG_FILE = os.path.join(CONFIG_DIR, 'config.json')
CRED_FILE = os.path.join(CONFIG_DIR, 'credentials.json')



@config_bp.route('/guardar-ruta', methods=['POST'])
def guardar_ruta():
    data = request.get_json()
    ruta = data.get('rutaDestino')

    if not ruta:
        return jsonify({"status": "error", "message": "Ruta vacía"}), 400

    config_data = cargar_config()
    config_data["general"] = config_data.get("general", {})
    config_data["general"]["ruta_destino"] = ruta
    guardar_config(config_data)

    return jsonify({"status": "ok", "message": "Ruta guardada"})


@config_bp.route('/guardar-integracion', methods=['POST'])
def guardar_integracion():
    cred_file = request.files.get("credenciales")
    folder_id = request.form.get("folder_id")

    if not cred_file or not folder_id:
        return jsonify({"status": "error", "message": "Faltan datos"}), 400

    # 📁 Capturar y guardar el archivo de credenciales
    filename = cred_file.filename  # Esto guarda el nombre original
    cred_path = os.path.join(CONFIG_DIR, "credentials.json")
    cred_file.save(cred_path)

    # 🧠 Guardar el folder_id + nombre del archivo en config.json
    config_data = cargar_config()
    config_data["google_drive"] = {
        "folder_id": folder_id,
        "credenciales_guardadas": True,
        "nombre_credencial": filename
    }
    guardar_config(config_data)

    return jsonify({"status": "ok", "message": "Integración guardada"})


@config_bp.route('/cargar-configuracion', methods=['GET'])
def cargar_configuracion():
    return jsonify(cargar_config())


# Funciones auxiliares
def cargar_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    else:
        return {}

def guardar_config(data):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(data, f, indent=4)
