/** Ver Diplomas */
/*******************************************************************************/

// Obtener el canvas y el contexto
const canvas = document.getElementById("diplomaCanvas");
const ctx = canvas.getContext("2d");

// Cargar el JSON del diploma
fetch("../../data/diploma.json")
    .then(response => response.json())
    .then(diplomaData => {
        // Configurar tamaño del canvas
        canvas.width = diplomaData.canvas.width;
        canvas.height = diplomaData.canvas.height;

        // Dibujar el diploma
        drawDiploma(diplomaData);
    })
    .catch(error => console.error("Error cargando el JSON:", error));

// Función para dibujar el diploma
function drawDiploma(data) {
    // Dibujar fondo y bordes
    drawBackground(data.canvas);
    drawBorder(data.canvas.border);

    // Dibujar texto
    data.text.forEach(drawText);

    // Dibujar líneas
    data.lines.forEach(drawLine);

    // Dibujar imágenes
    data.images.forEach(drawImage);
}

// Función para dibujar el fondo
function drawBackground(canvasData) {
    // Dibujar color de fondo
    ctx.fillStyle = canvasData.background.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Si hay una imagen de fondo definida, cargarla
    if (canvasData.background.image.src) {
        const bgImg = new Image();
        bgImg.src = canvasData.background.image.src;
        bgImg.onload = () => {
            ctx.globalAlpha = canvasData.background.image.opacity; // Aplicar opacidad
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0; // Restaurar opacidad
        };
    }
}

// Función para dibujar bordes
function drawBorder(borderData) {
    ctx.lineWidth = borderData.width;
    ctx.strokeStyle = borderData.color;
    ctx.strokeRect(
        borderData.width / 2,
        borderData.width / 2,
        canvas.width - borderData.width,
        canvas.height - borderData.width
    );
}

// Función para dibujar texto
function drawText(element) {
    ctx.font = `${element.font.weight} ${element.font.size}px ${element.font.family}`;
    ctx.fillStyle = element.font.color;
    
    // Alinear texto correctamente en el canvas
    switch (element.alignment) {
        case "center":
            ctx.textAlign = "center";
            break;
        case "right":
            ctx.textAlign = "right";
            break;
        default:
            ctx.textAlign = "left";
    }

    let textContent = element.content;

    // Si el texto es un placeholder, reemplazarlo con datos ficticios
    if (element.placeholder) {
        textContent = textContent.replace("{{NOMBRES}}", "Nombre").replace("{{APELLIDOS}}", "Apellido");
    }

    ctx.fillText(textContent, element.position.x, element.position.y);
}

// Función para dibujar líneas
function drawLine(line) {
    ctx.beginPath();
    ctx.moveTo(line.start.x, line.start.y);
    ctx.lineTo(line.end.x, line.end.y);
    ctx.strokeStyle = line.color;
    ctx.lineWidth = line.width;
    ctx.stroke();
}

// Función para dibujar imágenes
function drawImage(element) {
    if (!element.src) return; // No intentar cargar imágenes sin src

    const img = new Image();
    img.src = element.src;
    img.onload = () => {
        ctx.drawImage(img, element.position.x, element.position.y, element.size.width, element.size.height);
    };
}
