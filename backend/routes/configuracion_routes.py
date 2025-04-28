# 📁 backend/routes/configuracion_routes.py

from flask import Blueprint, request, jsonify
from services.configuracion_service import cargar_config, guardar_config

configuracion_bp = Blueprint('configuracion', __name__)

@configuracion_bp.route('/guardar-ruta', methods=['POST'])
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


@configuracion_bp.route('/guardar-integracion', methods=['POST'])
def guardar_integracion():
    cred_file = request.files.get("credenciales")
    folder_id = request.form.get("folder_id")

    if not cred_file or not folder_id:
        return jsonify({"status": "error", "message": "Faltan datos"}), 400

    from services.configuracion_service import save_credential_file

    save_credential_file(cred_file)

    config_data = cargar_config()
    config_data["google_drive"] = {
        "folder_id": folder_id,
        "credenciales_guardadas": True,
        "nombre_credencial": cred_file.filename
    }
    guardar_config(config_data)

    return jsonify({"status": "ok", "message": "Integración guardada"})


@configuracion_bp.route('/cargar-configuracion', methods=['GET'])
def cargar_configuracion():
    return jsonify(cargar_config())
