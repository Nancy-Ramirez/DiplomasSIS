from flask import Blueprint, request, jsonify, send_file
import os
import traceback
import pandas as pd
from services.memorandum_service import generar_memorandum, crear_memorandum_service

memorandum_bp = Blueprint('memorandum', __name__)

@memorandum_bp.route('/crear_memorandum', methods=['POST'])
def crear_memorandum_endpoint():
    try:
        path, error = crear_memorandum_service(request)

        if error:
            return jsonify({"error": error}), 500

        if path.endswith('.zip'):
            return send_file(path, as_attachment=True, download_name="memorandums.zip")
        else:
            return send_file(path, as_attachment=True, download_name="memorandum.docx")

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
