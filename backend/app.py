from flask import Flask
from routes.configuracion_routes import configuracion_bp
from routes.diploma_routes import diploma_bp
from routes.documento_routes import documento_bp
from routes.memorandum_routes import memorandum_bp

app = Flask(__name__)

# Registrar los Blueprints
app.register_blueprint(configuracion_bp, url_prefix='/configuracion')
app.register_blueprint(diploma_bp, url_prefix='/diplomas')
app.register_blueprint(documento_bp, url_prefix='/documento')
app.register_blueprint(memorandum_bp, url_prefix='/memorandum')

# Ruta de prueba
@app.route('/')
def home():
    return "¡Servidor Flask en ejecución!"

# NO pongas app.run() aquí.
