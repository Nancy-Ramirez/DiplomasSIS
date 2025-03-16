from docx import Document
from docx.shared import Pt, Inches
import os
from werkzeug.utils import secure_filename
from datetime import datetime

UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Función para convertir la fecha a texto (Ejemplo: "15 de marzo de 2025")
def formatear_fecha(fecha_iso):
    try:
        fecha_dt = datetime.strptime(fecha_iso, "%Y-%m-%d")
        meses = [
            "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
        ]
        return f"{fecha_dt.day} de {meses[fecha_dt.month - 1]} de {fecha_dt.year}"
    except:
        return fecha_iso  # Si hay error, mantener el formato original

def generar_documento(datos, archivo_membrete):
    try:
        letra = datos.get("letra", "Arial")
        tamañoLetra = int(datos.get("tamañoLetra", 12))
        tamañoPapel = datos.get("tamañoPapel", "Carta")
        alineacion = datos.get("alineacion", "left")
        fecha = formatear_fecha(datos.get("fecha", "No especificado"))
        destinatario = datos.get("destinatario", "No especificado")
        cuerpo = datos.get("cuerpo", "No especificado")
        cantidadFirmantes = datos.get("cantidadFirmantes", "0")

        firmantes = [datos.get(f"firmante{i}", "No especificado") for i in range(1, int(cantidadFirmantes) + 1)]

        membrete_path = None
        if archivo_membrete:
            filename = secure_filename(archivo_membrete.filename)
            membrete_path = os.path.join(UPLOAD_FOLDER, filename)
            archivo_membrete.save(membrete_path)

        doc = Document()

        # Aplicar fuente global
        style = doc.styles['Normal']
        style.font.name = letra
        style.font.size = Pt(tamañoLetra)

        # 📌 Insertar el membrete alineado completamente a la derecha
        if membrete_path:
            p_membrete = doc.add_paragraph()
            run = p_membrete.add_run()
            run.add_picture(membrete_path, width=Inches(1.5))  
            p_membrete.alignment = 2  # Alineado a la derecha

        # 📌 Agregar la fecha alineada a la derecha, debajo del membrete
        p_fecha = doc.add_paragraph(fecha)
        p_fecha.alignment = 2  # Alineado a la derecha

        # 📌 Espacio y destinatario
        doc.add_paragraph("\n")
        doc.add_paragraph(destinatario)

        # 📌 Espacio y cuerpo de la carta
        doc.add_paragraph("\n")
        p_cuerpo = doc.add_paragraph(cuerpo)
        alineaciones = {"left": 0, "center": 1, "right": 2, "justify": 3}
        p_cuerpo.alignment = alineaciones.get(alineacion, 0)

        doc.add_paragraph("\n\nSaludos.\n")

        # 📌 Firmantes con línea para firma
        doc.add_paragraph("\nFirmantes:\n")
        for firmante in firmantes:
            doc.add_paragraph("_" * 30)  # Línea de firma
            doc.add_paragraph(f"{firmante}\n")

        # Guardar el documento
        doc_path = os.path.join(UPLOAD_FOLDER, "carta_generada.docx")
        doc.save(doc_path)

        return doc_path  # Retorna la ruta del documento generado

    except Exception as e:
        return None, str(e)
