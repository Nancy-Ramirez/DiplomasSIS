from flask import Blueprint, request, jsonify
import os

config_bp = Blueprint('configuracion', __name__)
CONFIG_DIR = os.path.join(os.path.dirname(__file__), 'configuracion')
os.makedirs(CONFIG_DIR, exist_ok=True)

@config_bp.route('/guardar-diploma-imagen', methods=['POST'])
def guardar_diploma_imagen():
    diploma_imagen = request.files.get('diplomaImagen')

    if not diploma_imagen:
        return jsonify({"status": "error", "message": "No se envió la imagen del diploma"}), 400

    save_path = os.path.join(CONFIG_DIR, 'plantilla_diploma.png')
    diploma_imagen.save(save_path)

    return jsonify({"status": "ok", "message": "Imagen del diploma guardada exitosamente"})
