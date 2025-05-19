import os
import json
import pandas as pd
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import zipfile
import base64
import uuid
import qrcode
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# Ruta absoluta segura basada en la ubicación de este archivo
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, "..", "configuracion", "config.json")

def cargar_configuracion():
    if not os.path.exists(CONFIG_PATH):
        raise FileNotFoundError("No se encontró el archivo de configuración.")
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

config = cargar_configuracion()
FOLDER_ID = config["google_drive"]["folder_id"]
CRED_FILE = os.path.join(BASE_DIR, "..", "configuracion", config["google_drive"]["nombre_credencial"])

def guardar_plantilla_json(data):
    carpeta = "plantillas_guardadas"
    os.makedirs(carpeta, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    uid = str(uuid.uuid4())[:8]
    nombre = f"plantilla_{timestamp}_{uid}.json"
    ruta = os.path.join(carpeta, nombre)
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return ruta

def reemplazar_campos(texto, fila):
    for col in fila.keys():
        texto = texto.replace(f"{{{{{col}}}}}", str(fila[col]))
    return texto

def get_font(font_family, font_size, weight="normal"):
    try:
        font_path = f"{font_family.lower()}bd.ttf" if weight == "bold" else f"{font_family.lower()}.ttf"
        return ImageFont.truetype(font_path, font_size)
    except:
        return ImageFont.load_default()

def wrap_text(draw, text, font, max_width):
    words = text.split()
    lines = []
    line = ""
    for word in words:
        test_line = line + word + " "
        width = draw.textlength(test_line, font=font)
        if width > max_width and line:
            lines.append(line.strip())
            line = word + " "
        else:
            line = test_line
    lines.append(line.strip())
    return lines

def generar_qr(url, file_name, carpeta="diplomas_qr"):
    os.makedirs(carpeta, exist_ok=True)
    qr = qrcode.make(url)
    path = os.path.join(carpeta, f"{file_name}.png")
    qr.save(path)
    return path

def subir_a_drive(file_path, file_name):
    SCOPES = ['https://www.googleapis.com/auth/drive.file']
    creds = service_account.Credentials.from_service_account_file(CRED_FILE, scopes=SCOPES)
    drive_service = build('drive', 'v3', credentials=creds)

    file_metadata = {"name": file_name, "parents": [FOLDER_ID]}
    media = MediaFileUpload(file_path, mimetype="image/png")

    file = drive_service.files().create(body=file_metadata, media_body=media, fields="id").execute()
    file_id = file.get("id")

    drive_service.permissions().create(
        fileId=file_id,
        body={"role": "reader", "type": "anyone"},
    ).execute()

    return f"https://drive.google.com/uc?id={file_id}"

def generar_diplomas_masivos(file_storage, ruta_plantilla, generar_qr_flag=False):
    plantilla = json.load(open(ruta_plantilla, encoding="utf-8"))
    ext = file_storage.filename.split(".")[-1].lower()

    if ext == "csv":
        df = pd.read_csv(file_storage)
    else:
        df = pd.read_excel(file_storage)

    carpeta_temp = "diplomas_generados"
    os.makedirs(carpeta_temp, exist_ok=True)

    rutas_diplomas = []

    for i, fila in df.iterrows():
        imagen = generar_imagen_diploma(plantilla, fila)
        nombre = str(fila.get("NOMBRES") or fila.get("NOMBRE_COMPLETO") or f"diploma_{i+1}")
        uid = str(uuid.uuid4())[:3]
        nombre = f"{nombre}_{uid}"
        nombre = nombre.replace("/", "-").replace("\\", "-") + ".png"
        ruta = os.path.join(carpeta_temp, nombre)
        imagen.save(ruta)
        rutas_diplomas.append(ruta)

        if generar_qr_flag:
            try:
                url_publica = subir_a_drive(ruta, nombre)
                generar_qr(url_publica, nombre.replace(".png", ""))
            except Exception as e:
                print(f"Error subiendo o generando QR para {nombre}: {e}")

    zip_path = os.path.join("diplomas_generados", "diplomas.zip")
    with zipfile.ZipFile(zip_path, "w") as z:
        for ruta in rutas_diplomas:
            z.write(ruta, os.path.basename(ruta))

    return zip_path

def generar_imagen_diploma(data, fila):
    canvas = data["canvas"]
    width, height = int(canvas["width"]), int(canvas["height"])
    img = Image.new("RGB", (width, height), canvas["background"]["color"])
    draw = ImageDraw.Draw(img)

    # Fondo imagen
    if canvas["background"]["type"] == "image" and "src" in canvas["background"]["image"]:
        bg_src = canvas["background"]["image"]["src"]
        if bg_src.startswith("data:image"):
            _, encoded = bg_src.split(",", 1)
            bg_img = Image.open(BytesIO(base64.b64decode(encoded))).resize((width, height)).convert("RGBA")
            opacity = canvas["background"]["image"].get("opacity", 1)
            bg_img.putalpha(int(opacity * 255))
            img.paste(bg_img, (0, 0), bg_img)

    # Borde
    if "border" in canvas and canvas["border"]["width"] > 0:
        border = canvas["border"]
        border_width = int(border["width"])
        for i in range(border_width):
            draw.rectangle(
                [i, i, width - i - 1, height - i - 1],
                outline=border["color"]
            )

    # Textos
    for item in data.get("text", []):
        texto = reemplazar_campos(item["content"], fila.to_dict())
        font = get_font(item["font"]["family"], int(item["font"]["size"]), item["font"].get("weight", "normal"))
        color = item["font"]["color"]
        x = int(item["position"]["x"])
        y = int(item["position"]["y"])
        align = item.get("alignment", "left")
        #draw.text((x, y), texto, fill=color, font=font)

        # Ajuste de texto
        max_width = width - 60
        line_height = item["font"]["size"] * 1.4
        lines = wrap_text(draw, texto, font, max_width)
        

        for i, line_text in enumerate(lines):
            line_width = draw.textlength(line_text, font=font)
            draw_x = x
            if align == "center":
                draw_x = x - int(line_width // 2)
            elif align == "right":
                draw_x = x - int(line_width)
            draw.text((draw_x, y + int(i * line_height)), line_text, font=font, fill=color)

    # Líneas
    for line in data.get("lines", []):
        draw.line([
            (int(line["start"]["x"]), int(line["start"]["y"])),
            (int(line["end"]["x"]), int(line["end"]["y"]))
        ], fill=line["color"], width=int(line["width"]))

    # Imágenes
    for img_item in data.get("images", []):
        try:
            if img_item["src"].startswith("data:image"):
                _, encoded = img_item["src"].split(",", 1)
                img_overlay = Image.open(BytesIO(base64.b64decode(encoded))).convert("RGBA")
            elif os.path.exists(img_item["src"]):
                img_overlay = Image.open(img_item["src"]).convert("RGBA")
            else:
                continue

            width_img = int(round(img_item["size"]["width"]))
            height_img = int(round(img_item["size"]["height"]))
            img_overlay = img_overlay.resize((width_img, height_img))

            pos_x = int(round(img_item["position"]["x"]))
            pos_y = int(round(img_item["position"]["y"]))

            img.paste(img_overlay, (pos_x, pos_y), img_overlay)
        except:
            continue

    return img
