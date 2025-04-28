# 📁 backend/services/configuracion_service.py

import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
CONFIG_DIR = os.path.join(BASE_DIR, 'configuracion')
CONFIG_FILE = os.path.join(CONFIG_DIR, 'config.json')
CRED_FILE = os.path.join(CONFIG_DIR, 'credentials.json')

os.makedirs(CONFIG_DIR, exist_ok=True)

def cargar_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        return {}

def guardar_config(data):
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

def save_credential_file(file):
    file.save(CRED_FILE)
