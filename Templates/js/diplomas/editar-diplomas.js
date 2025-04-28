const canvas = document.getElementById("diplomaCanvas");
const ctx = canvas.getContext("2d");
let diplomaData = {};
let seleccionado = null;
let offsetX, offsetY, arrastrando = false;

// Cache para imágenes cargadas
const imageCache = {};

// Elemento para mostrar las dimensiones
const sizeDisplay = document.createElement("p");
sizeDisplay.classList.add("text-center", "mt-2");

// Referencias a los elementos del editor
const inputTexto = document.getElementById("inputTexto");
const selectFont = document.getElementById("selectFont");
const inputColor = document.getElementById("inputColor");
const inputSize = document.getElementById("inputSize");
const selectWeight = document.getElementById("selectWeight");
const selectAlign = document.getElementById("selectAlign");
const imageUpload = document.getElementById("imageUpload");
const rotateImage = document.getElementById("rotateImage");
const scaleImage = document.getElementById("scaleImage");
const inputLineColor = document.getElementById("inputLineColor");
const lineWidth = document.getElementById("lineWidth");
const lineAngle = document.getElementById("lineAngle");
const lineLength = document.getElementById("lineLength");
const bgColor = document.getElementById("bgColor");
const bgImageUpload = document.getElementById("bgImageUpload");
const bgOpacity = document.getElementById("bgOpacity");
const borderColor = document.getElementById("borderColor");
const borderWidth = document.getElementById("borderWidth");
const borderType = document.getElementById("borderType");
const borderRadius = document.getElementById("borderRadius");
const orientation = document.getElementById("orientation");
const sizePreset = document.getElementById("sizePreset");
const customSize = document.getElementById("customSize");
const customWidth = document.getElementById("customWidth");
const customHeight = document.getElementById("customHeight");
const borderOptions = document.getElementById("borderOptions");

async function cargarDiploma() {
    try {
        const response = await fetch("../../data/diploma.json");
        diplomaData = await response.json();
        canvas.width = diplomaData.canvas.width;
        canvas.height = diplomaData.canvas.height;

        // Ajustar el estilo del canvas al cargar
        updateCanvasStyle();

        sizeDisplay.innerText = `Tamaño del diploma: ${canvas.width}px x ${canvas.height}px`;
        const container = canvas.parentNode;
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.alignItems = "center";
        container.insertBefore(sizeDisplay, canvas.nextSibling);

        console.log("JSON cargado:", diplomaData);
        renderizarDiploma();
        actualizarEditorDiploma();
        toggleBorderOptions();
    } catch (error) {
        console.error("Error cargando el JSON:", error);
    }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, align) {
    const words = text.split(" ");
    let line = "";
    let lines = [];
    let currentY = y;

    const leftMargin = 30;
    const rightMargin = 30;
    const adjustedMaxWidth = maxWidth - leftMargin - rightMargin;

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > adjustedMaxWidth && i > 0) {
            lines.push({ text: line.trim(), width: ctx.measureText(line.trim()).width, x: x, y: currentY });
            line = words[i] + " ";
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    lines.push({ text: line.trim(), width: ctx.measureText(line.trim()).width, x: x, y: currentY });

    let paragraphX = x;
    const textWidth = Math.max(...lines.map((line) => line.width));
    if (align === "center") {
        paragraphX = x - textWidth / 2;
    } else if (align === "right") {
        paragraphX = x - textWidth;
    }
    paragraphX = Math.max(leftMargin, Math.min(paragraphX, canvas.width - textWidth - rightMargin));

    lines.forEach(lineObj => {
        let adjustedX = paragraphX;
        if (align === "center") {
            adjustedX = paragraphX + (textWidth - lineObj.width) / 2;
        } else if (align === "right") {
            adjustedX = paragraphX + (textWidth - lineObj.width);
        }
        ctx.fillText(lineObj.text, adjustedX, lineObj.y);
    });

    return lines.map(lineObj => ({
        text: lineObj.text,
        x: paragraphX,
        y: lineObj.y,
        width: lineObj.width
    }));
}

function renderizarDiploma() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (diplomaData.canvas.background.type === "solid") {
        ctx.fillStyle = diplomaData.canvas.background.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (diplomaData.canvas.background.type === "image" && diplomaData.canvas.background.image.src) {
        const bgImage = imageCache[diplomaData.canvas.background.image.src];
        if (bgImage) {
            ctx.globalAlpha = diplomaData.canvas.background.image.opacity || 1;
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;
        } else {
            const img = new Image();
            img.src = diplomaData.canvas.background.image.src;
            img.onload = () => {
                imageCache[img.src] = img;
                console.log("Fondo cargado:", diplomaData.canvas.background.image.src);
                renderizarDiploma();
            };
            img.onerror = () => console.error("Error al cargar el fondo:", diplomaData.canvas.background.image.src);
        }
    }

    if (diplomaData.canvas.border && diplomaData.canvas.border.width > 0) {
        ctx.strokeStyle = diplomaData.canvas.border.color;
        ctx.lineWidth = diplomaData.canvas.border.width;
        if (diplomaData.canvas.border.type === "dotted") ctx.setLineDash([2, 2]);
        else if (diplomaData.canvas.border.type === "dashed") ctx.setLineDash([5, 5]);
        else if (diplomaData.canvas.border.type === "double") {
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
        } else ctx.setLineDash([]);
        const radius = diplomaData.canvas.border.radius || 0;
        if (radius > 0) {
            ctx.beginPath();
            ctx.moveTo(10 + radius, 10);
            ctx.lineTo(canvas.width - 10 - radius, 10);
            ctx.arcTo(canvas.width - 10, 10, canvas.width - 10, 10 + radius, radius);
            ctx.lineTo(canvas.width - 10, canvas.height - 10 - radius);
            ctx.arcTo(canvas.width - 10, canvas.height - 10, canvas.width - 10 - radius, canvas.height - 10, radius);
            ctx.lineTo(10 + radius, canvas.height - 10);
            ctx.arcTo(10, canvas.height - 10, 10, canvas.height - 10 - radius, radius);
            ctx.lineTo(10, 10 + radius);
            ctx.arcTo(10, 10, 10 + radius, 10, radius);
            ctx.closePath();
            ctx.stroke();
        } else if (diplomaData.canvas.border.type !== "double") {
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        }
        ctx.setLineDash([]);
    }

    if (seleccionado === "border") {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    }

    if (diplomaData.images && diplomaData.images.length > 0) {
        diplomaData.images.forEach((item, index) => {
            if (!item.src) {
                console.error(`Imagen ${index} no tiene src definido`);
                return;
            }
            const img = imageCache[item.src];
            if (img) {
                ctx.save();
                ctx.translate(item.position.x + item.size.width / 2, item.position.y + item.size.height / 2);
                ctx.rotate((item.rotation || 0) * Math.PI / 180);
                ctx.drawImage(img, -item.size.width / 2, -item.size.height / 2, item.size.width, item.size.height);
                ctx.restore();
                if (seleccionado === `image-${index}`) {
                    ctx.strokeStyle = "red";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(item.position.x, item.position.y, item.size.width, item.size.height);
                }
            } else {
                const newImg = new Image();
                newImg.src = item.src;
                newImg.onload = () => {
                    imageCache[item.src] = newImg;
                    console.log(`Imagen ${index} cargada:`, item.src);
                    renderizarDiploma();
                };
                newImg.onerror = () => console.error(`Error al cargar la imagen ${index}:`, item.src);
            }
        });
    }

    diplomaData.text.forEach((item, index) => {
        ctx.font = `${item.font.weight || "normal"} ${item.font.size}px ${item.font.family}`;
        ctx.fillStyle = item.font.color || "#000000";
        const maxWidth = canvas.width - 60;
        const lineHeight = item.font.size * 1.2;
        const lines = wrapText(ctx, item.content, item.position.x, item.position.y, maxWidth, lineHeight, item.alignment || "left");

        if (seleccionado === `text-${index}`) {
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            const textWidth = Math.max(...lines.map((line) => ctx.measureText(line.text).width));
            const textHeight = lines.length * lineHeight;
            const paragraphX = lines[0].x;
            const rectX = paragraphX - 5;
            const rectY = item.position.y - item.font.size - 5;
            const rectWidth = textWidth + 10;
            const rectHeight = textHeight + 10;
            ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
        }
    });

    if (diplomaData.lines && diplomaData.lines.length > 0) {
        diplomaData.lines.forEach((item, index) => {
            ctx.beginPath();
            ctx.moveTo(item.start.x, item.start.y);
            ctx.lineTo(item.end.x, item.end.y);
            ctx.strokeStyle = item.color;
            ctx.lineWidth = item.width;
            ctx.stroke();
            if (seleccionado === `line-${index}`) {
                ctx.strokeStyle = "red";
                ctx.lineWidth = 2;
                ctx.strokeRect(item.start.x, item.start.y - 5, item.end.x - item.start.x, 10);
            }
        });
    }
}

function actualizarEditor() {
    if (seleccionado === null) {
        inputTexto.value = "";
        selectFont.value = "Arial";
        inputColor.value = "#000000";
        inputSize.value = 16;
        selectWeight.value = "normal";
        selectAlign.value = "left";
        rotateImage.value = 0;
        scaleImage.value = 100;
        inputLineColor.value = "#000000";
        lineWidth.value = 5;
        lineAngle.value = 0;
        lineLength.value = 100;
        return;
    }

    const [type, index] = seleccionado.split("-");
    if (seleccionado === "border") {
        const item = diplomaData.canvas.border;
        borderColor.value = item.color;
        borderWidth.value = item.width;
        borderType.value = item.type;
        borderRadius.value = item.radius || 0;
    } else {
        let item = type === "text" ? diplomaData.text[index] : type === "image" ? diplomaData.images[index] : diplomaData.lines[index];
        if (type === "text") {
            inputTexto.value = item.content;
            selectFont.value = item.font.family;
            inputColor.value = item.font.color || "#000000";
            inputSize.value = item.font.size;
            selectWeight.value = item.font.weight || "normal";
            selectAlign.value = item.alignment || "left";
            rotateImage.value = 0;
            scaleImage.value = 100;
            inputLineColor.value = "#000000";
            lineWidth.value = 5;
            lineAngle.value = 0;
            lineLength.value = 100;
        } else if (type === "image") {
            inputTexto.value = "";
            selectFont.value = "Arial";
            inputColor.value = "#000000";
            inputSize.value = 16;
            selectWeight.value = "normal";
            selectAlign.value = "left";
            rotateImage.value = item.rotation || 0;
            scaleImage.value = (item.scale || 1) * 100;
            inputLineColor.value = "#000000";
            lineWidth.value = 5;
            lineAngle.value = 0;
            lineLength.value = 100;
        } else if (type === "line") {
            inputTexto.value = "";
            selectFont.value = "Arial";
            inputColor.value = "#000000";
            inputSize.value = 16;
            selectWeight.value = "normal";
            selectAlign.value = "left";
            rotateImage.value = 0;
            scaleImage.value = 100;
            inputLineColor.value = item.color;
            lineWidth.value = item.width;
            lineAngle.value = item.angle || 0;
            lineLength.value = Math.sqrt(Math.pow(item.end.x - item.start.x, 2) + Math.pow(item.end.y - item.start.y, 2));
        }
    }
}

function actualizarEditorDiploma() {
    bgColor.value = diplomaData.canvas.background.type === "solid" ? diplomaData.canvas.background.color : "#ffffff";
    bgOpacity.value = diplomaData.canvas.background.type === "image" && diplomaData.canvas.background.image.opacity !== undefined ? diplomaData.canvas.background.image.opacity : 1;
    borderColor.value = diplomaData.canvas.border ? diplomaData.canvas.border.color : "#000000";
    borderWidth.value = diplomaData.canvas.border ? diplomaData.canvas.border.width : 1;
    borderType.value = diplomaData.canvas.border ? diplomaData.canvas.border.type : "solid";
    borderRadius.value = diplomaData.canvas.border && diplomaData.canvas.border.radius ? diplomaData.canvas.border.radius : 0;
    orientation.value = diplomaData.canvas.orientation || "horizontal";
    sizePreset.value = diplomaData.canvas.sizePreset || "carta";
    customWidth.value = diplomaData.canvas.width || 600;
    customHeight.value = diplomaData.canvas.height || 400;
    customSize.classList.toggle("hidden", sizePreset.value !== "custom");
}

// Vincular eventos a los elementos del editor
function vincularEventosEditor() {
    inputTexto.addEventListener("input", (e) => {
        if (seleccionado && seleccionado.startsWith("text-")) {
            const index = seleccionado.split("-")[1];
            diplomaData.text[index].content = e.target.value;
            renderizarDiploma();
        }
    });

    selectFont.addEventListener("change", (e) => {
        if (seleccionado && seleccionado.startsWith("text-")) {
            const index = seleccionado.split("-")[1];
            diplomaData.text[index].font.family = e.target.value;
            renderizarDiploma();
        }
    });

    inputColor.addEventListener("input", (e) => {
        if (seleccionado && seleccionado.startsWith("text-")) {
            const index = seleccionado.split("-")[1];
            diplomaData.text[index].font.color = e.target.value;
            renderizarDiploma();
        }
    });

    inputSize.addEventListener("input", (e) => {
        if (seleccionado && seleccionado.startsWith("text-")) {
            const index = seleccionado.split("-")[1];
            diplomaData.text[index].font.size = parseInt(e.target.value);
            renderizarDiploma();
        }
    });

    selectWeight.addEventListener("change", (e) => {
        if (seleccionado && seleccionado.startsWith("text-")) {
            const index = seleccionado.split("-")[1];
            diplomaData.text[index].font.weight = e.target.value;
            renderizarDiploma();
        }
    });

    selectAlign.addEventListener("change", (e) => {
        if (seleccionado && seleccionado.startsWith("text-")) {
            const index = seleccionado.split("-")[1];
            diplomaData.text[index].alignment = e.target.value;
            renderizarDiploma();
        }
    });

    imageUpload.addEventListener("change", addImageFromFile);
    rotateImage.addEventListener("change", rotateSelectedImage);
    scaleImage.addEventListener("change", scaleSelectedImage);
    inputLineColor.addEventListener("input", changeLineColor);
    lineWidth.addEventListener("change", changeLineWidth);
    lineAngle.addEventListener("change", changeLineAngle);
    lineLength.addEventListener("change", changeLineLength);

    // Nuevos eventos para el diploma
    bgColor.addEventListener("input", updateBackgroundColor);
    bgImageUpload.addEventListener("change", updateBackgroundImage);
    bgOpacity.addEventListener("input", updateBackgroundOpacity);
    borderColor.addEventListener("input", updateBorderColor);
    borderWidth.addEventListener("input", updateBorderWidth);
    borderType.addEventListener("change", updateBorderType);
    borderRadius.addEventListener("input", updateBorderRadius);
    orientation.addEventListener("change", updateOrientation);
    sizePreset.addEventListener("change", updateSizePreset);
    customWidth.addEventListener("input", updateCustomSize);
    customHeight.addEventListener("input", updateCustomSize);

    document.getElementById("descargar").addEventListener("click", guardarDiploma);
}

// Funciones para texto
function addText() {
    const newText = {
        content: "Nuevo texto",
        position: { x: 100, y: 100 },
        font: {
            family: "Arial",
            size: 16,
            weight: "normal",
            color: "#000000"
        },
        alignment: "left"
    };
    if (!diplomaData.text) diplomaData.text = [];
    diplomaData.text.push(newText);
    seleccionado = `text-${diplomaData.text.length - 1}`;
    toggleSection("textSection");
    renderizarDiploma();
    actualizarEditor();
}

// Funciones para imágenes (corregido para evitar duplicación)
function addImageFromFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const newImage = {
                    src: img.src,
                    position: { x: 50, y: 50 },
                    size: { width: img.width * 0.5, height: img.height * 0.5 },
                    rotation: 0,
                    scale: 0.5
                };
                if (!diplomaData.images) diplomaData.images = [];
                // Verificar si ya existe una imagen con la misma src para evitar duplicados
                const existingImage = diplomaData.images.find(image => image.src === newImage.src);
                if (!existingImage) {
                    diplomaData.images.push(newImage);
                    imageCache[img.src] = img;
                    seleccionado = `image-${diplomaData.images.length - 1}`;
                    toggleSection("imageSection");
                    renderizarDiploma();
                    actualizarEditor();
                } else {
                    console.log("La imagen ya está cargada, no se duplicará.");
                    seleccionado = `image-${diplomaData.images.indexOf(existingImage)}`;
                    toggleSection("imageSection");
                    actualizarEditor();
                }
                // Limpiar el input para evitar múltiples eventos
                imageUpload.value = "";
            };
        };
        reader.readAsDataURL(file);
    }
}

function rotateSelectedImage() {
    if (seleccionado && seleccionado.startsWith("image-")) {
        const index = seleccionado.split("-")[1];
        diplomaData.images[index].rotation = parseInt(rotateImage.value);
        renderizarDiploma();
    }
}

function scaleSelectedImage() {
    if (seleccionado && seleccionado.startsWith("image-")) {
        const index = seleccionado.split("-")[1];
        const scale = parseInt(scaleImage.value) / 100;
        const img = imageCache[diplomaData.images[index].src];
        diplomaData.images[index].scale = scale;
        diplomaData.images[index].size.width = img.width * scale;
        diplomaData.images[index].size.height = img.height * scale;
        renderizarDiploma();
    }
}

function deleteSelectedImage() {
    if (seleccionado && seleccionado.startsWith("image-")) {
        const index = seleccionado.split("-")[1];
        diplomaData.images.splice(index, 1);
        seleccionado = null;
        renderizarDiploma();
        actualizarEditor();
    }
}

// Funciones para líneas
function addLine() {
    const newLine = {
        start: { x: 100, y: 100 },
        end: { x: 200, y: 100 },
        color: "#000000",
        width: 5,
        angle: 0
    };
    if (!diplomaData.lines) diplomaData.lines = [];
    diplomaData.lines.push(newLine);
    seleccionado = `line-${diplomaData.lines.length - 1}`;
    toggleSection("lineSection");
    renderizarDiploma();
    actualizarEditor();
}

function changeLineColor() {
    if (seleccionado && seleccionado.startsWith("line-")) {
        const index = seleccionado.split("-")[1];
        diplomaData.lines[index].color = inputLineColor.value;
        renderizarDiploma();
    }
}

function changeLineWidth() {
    if (seleccionado && seleccionado.startsWith("line-")) {
        const index = seleccionado.split("-")[1];
        diplomaData.lines[index].width = parseInt(lineWidth.value);
        renderizarDiploma();
    }
}

function changeLineAngle() {
    if (seleccionado && seleccionado.startsWith("line-")) {
        const index = seleccionado.split("-")[1];
        const angle = parseInt(lineAngle.value);
        const line = diplomaData.lines[index];
        const length = Math.sqrt(Math.pow(line.end.x - line.start.x, 2) + Math.pow(line.end.y - line.start.y, 2));
        const angleRad = angle * Math.PI / 180;
        line.end.x = line.start.x + length * Math.cos(angleRad);
        line.end.y = line.start.y + length * Math.sin(angleRad);
        line.angle = angle;
        renderizarDiploma();
    }
}

function changeLineLength() {
    if (seleccionado && seleccionado.startsWith("line-")) {
        const index = seleccionado.split("-")[1];
        const length = parseInt(lineLength.value);
        const line = diplomaData.lines[index];
        const angleRad = (line.angle || 0) * Math.PI / 180;
        line.end.x = line.start.x + length * Math.cos(angleRad);
        line.end.y = line.start.y + length * Math.sin(angleRad);
        renderizarDiploma();
    }
}

function deleteSelectedLine() {
    if (seleccionado && seleccionado.startsWith("line-")) {
        const index = seleccionado.split("-")[1];
        diplomaData.lines.splice(index, 1);
        seleccionado = null;
        renderizarDiploma();
        actualizarEditor();
    }
}

// Funciones para el diploma
function updateBackgroundColor() {
    diplomaData.canvas.background.type = "solid";
    diplomaData.canvas.background.color = bgColor.value;
    delete diplomaData.canvas.background.image;
    renderizarDiploma();
}

function updateBackgroundImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                diplomaData.canvas.background.type = "image";
                diplomaData.canvas.background.image = {
                    src: img.src,
                    opacity: parseFloat(bgOpacity.value)
                };
                imageCache[img.src] = img;
                renderizarDiploma();
            };
        };
        reader.readAsDataURL(file);
    }
}

function updateBackgroundOpacity() {
    if (diplomaData.canvas.background.type === "image") {
        diplomaData.canvas.background.image.opacity = parseFloat(bgOpacity.value);
        renderizarDiploma();
    }
}

// Nueva función para quitar la imagen de fondo
function removeBackgroundImage() {
    if (diplomaData.canvas.background.type === "image") {
        delete diplomaData.canvas.background.image;
        diplomaData.canvas.background.type = "solid";
        diplomaData.canvas.background.color = "#ffffff"; // Valor por defecto
        bgOpacity.value = 1; // Resetear opacidad
        renderizarDiploma();
        actualizarEditorDiploma();
    }
}

function updateBorderColor() {
    if (!diplomaData.canvas.border) diplomaData.canvas.border = {};
    diplomaData.canvas.border.color = borderColor.value;
    renderizarDiploma();
}

function updateBorderWidth() {
    if (!diplomaData.canvas.border) diplomaData.canvas.border = {};
    diplomaData.canvas.border.width = parseInt(borderWidth.value);
    renderizarDiploma();
}

function updateBorderType() {
    if (!diplomaData.canvas.border) diplomaData.canvas.border = {};
    diplomaData.canvas.border.type = borderType.value;
    renderizarDiploma();
}

function updateBorderRadius() {
    if (!diplomaData.canvas.border) diplomaData.canvas.border = {};
    diplomaData.canvas.border.radius = parseInt(borderRadius.value);
    renderizarDiploma();
}

function addBorder() {
    if (!diplomaData.canvas.border) {
        diplomaData.canvas.border = {
            color: "#000000",
            width: 1,
            type: "solid",
            radius: 0
        };
    }
    toggleBorderOptions();
    renderizarDiploma();
    actualizarEditorDiploma();
}

function deleteBorder() {
    delete diplomaData.canvas.border;
    toggleBorderOptions();
    renderizarDiploma();
    actualizarEditorDiploma();
}

function toggleBorderOptions() {
    if (diplomaData.canvas.border) {
        borderOptions.classList.remove("hidden");
    } else {
        borderOptions.classList.add("hidden");
    }
}

function scaleElements(oldWidth, oldHeight, newWidth, newHeight) {
    const scaleX = newWidth / oldWidth;
    const scaleY = newHeight / oldHeight;

    diplomaData.text.forEach(item => {
        item.position.x = Math.max(10, Math.min(item.position.x * scaleX, newWidth - 10));
        item.position.y = Math.max(10, Math.min(item.position.y * scaleY, newHeight - 10));
    });

    if (diplomaData.images) {
        diplomaData.images.forEach(item => {
            item.position.x = Math.max(10, Math.min(item.position.x * scaleX, newWidth - item.size.width));
            item.position.y = Math.max(10, Math.min(item.position.y * scaleY, newHeight - item.size.height));
        });
    }

    if (diplomaData.lines) {
        diplomaData.lines.forEach(item => {
            item.start.x = Math.max(10, Math.min(item.start.x * scaleX, newWidth - 10));
            item.start.y = Math.max(10, Math.min(item.start.y * scaleY, newHeight - 10));
            item.end.x = Math.max(10, Math.min(item.end.x * scaleX, newWidth - 10));
            item.end.y = Math.max(10, Math.min(item.end.y * scaleY, newHeight - 10));
        });
    }
}

function updateOrientation() {
    const newOrientation = orientation.value;
    if (newOrientation !== diplomaData.canvas.orientation) {
        const oldWidth = diplomaData.canvas.width;
        const oldHeight = diplomaData.canvas.height;
        diplomaData.canvas.orientation = newOrientation;

        diplomaData.canvas.width = oldHeight;
        diplomaData.canvas.height = oldWidth;
        canvas.width = oldHeight;
        canvas.height = oldWidth;

        scaleElements(oldWidth, oldHeight, oldHeight, oldWidth);

        updateCanvasStyle();
        sizeDisplay.innerText = `Tamaño del diploma: ${canvas.width}px x ${canvas.height}px`;
        renderizarDiploma();
    }
}

function updateSizePreset() {
    const preset = sizePreset.value;
    diplomaData.canvas.sizePreset = preset;
    customSize.classList.toggle("hidden", preset !== "custom");

    const mmToPx = 3.78;
    let width, height;

    switch (preset) {
        case "carta":
            width = 216 * mmToPx;
            height = 279 * mmToPx;
            break;
        case "oficio":
            width = 216 * mmToPx;
            height = 356 * mmToPx;
            break;
        case "a4":
            width = 210 * mmToPx;
            height = 297 * mmToPx;
            break;
        case "custom":
            width = parseInt(customWidth.value);
            height = parseInt(customHeight.value);
            break;
    }

    updateCanvasSize(width, height);
}

function updateCustomSize() {
    if (sizePreset.value === "custom") {
        const width = parseInt(customWidth.value);
        const height = parseInt(customHeight.value);
        updateCanvasSize(width, height);
    }
}

function updateCanvasSize(newWidth, newHeight) {
    const oldWidth = diplomaData.canvas.width;
    const oldHeight = diplomaData.canvas.height;
    const isVertical = diplomaData.canvas.orientation === "vertical";

    if (isVertical) {
        if (newWidth > newHeight) [newWidth, newHeight] = [newHeight, newWidth];
    } else {
        if (newWidth < newHeight) [newWidth, newHeight] = [newHeight, newWidth];
    }

    scaleElements(oldWidth, oldHeight, newWidth, newHeight);

    diplomaData.canvas.width = newWidth;
    diplomaData.canvas.height = newHeight;
    canvas.width = newWidth;
    canvas.height = newHeight;

    updateCanvasStyle();
    sizeDisplay.innerText = `Tamaño del diploma: ${newWidth}px x ${newHeight}px`;
    renderizarDiploma();
}

function updateCanvasStyle() {
    const scale = Math.min(window.innerWidth / canvas.width, window.innerHeight / canvas.height) * 0.8;
    canvas.style.width = `${canvas.width * scale}px`;
    canvas.style.height = `${canvas.height * scale}px`;
}

canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = e.offsetX * scaleX;
    const y = e.offsetY * scaleY;
    let seleccionadoTemp = null;

    // Verificar si se hace clic en un texto
    diplomaData.text.forEach((item, index) => {
        ctx.font = `${item.font.weight || "normal"} ${item.font.size}px ${item.font.family}`;
        const maxWidth = canvas.width - 60;
        const lineHeight = item.font.size * 1.2;
        const lines = wrapText(ctx, item.content, item.position.x, item.position.y, maxWidth, lineHeight, item.alignment || "left");

        const textWidth = Math.max(...lines.map((line) => ctx.measureText(line.text).width));
        const textHeight = lines.length * lineHeight;
        const paragraphX = lines[0].x;
        const rectX = paragraphX - 5;
        const rectY = item.position.y - item.font.size - 5;
        const rectWidth = textWidth + 10;
        const rectHeight = textHeight + 10;

        if (x >= rectX && x <= rectX + rectWidth && y >= rectY && y <= rectY + rectHeight) {
            seleccionadoTemp = `text-${index}`;
            offsetX = x - item.position.x;
            offsetY = y - item.position.y;
            arrastrando = true;
            toggleSection("textSection");
        }
    });

    // Verificar si se hace clic en una imagen
    if (!seleccionadoTemp && diplomaData.images) {
        diplomaData.images.forEach((item, index) => {
            if (x >= item.position.x && x <= item.position.x + item.size.width && 
                y >= item.position.y && y <= item.position.y + item.size.height) {
                seleccionadoTemp = `image-${index}`;
                offsetX = x - item.position.x;
                offsetY = y - item.position.y;
                arrastrando = true;
                toggleSection("imageSection");
            }
        });
    }

    // Verificar si se hace clic en una línea
    if (!seleccionadoTemp && diplomaData.lines) {
        diplomaData.lines.forEach((item, index) => {
            const rectX = item.start.x;
            const rectY = item.start.y - 5;
            const rectWidth = item.end.x - item.start.x;
            const rectHeight = 10;
            if (x >= rectX && x <= rectX + rectWidth && y >= rectY && y <= rectY + rectHeight) {
                seleccionadoTemp = `line-${index}`;
                offsetX = x - item.start.x;
                offsetY = y - item.start.y;
                arrastrando = true;
                toggleSection("lineSection");
            }
        });
    }

    // Verificar si se hace clic en el borde
    if (!seleccionadoTemp && diplomaData.canvas.border && diplomaData.canvas.border.width > 0) {
        const borderWidth = diplomaData.canvas.border.width;
        const outerRect = { x: 5, y: 5, width: canvas.width - 10, height: canvas.height - 10 };
        const innerRect = { x: 5 + borderWidth, y: 5 + borderWidth, width: canvas.width - 10 - 2 * borderWidth, height: canvas.height - 10 - 2 * borderWidth };
        
        if ((x >= outerRect.x && x <= outerRect.x + outerRect.width && y >= outerRect.y && y <= outerRect.y + outerRect.height) &&
            !(x >= innerRect.x && x <= innerRect.x + innerRect.width && y >= innerRect.y && y <= innerRect.y + innerRect.height)) {
            seleccionadoTemp = "border";
            offsetX = 0;
            offsetY = 0;
            arrastrando = false;
            toggleSection("diplomaSection");
        }
    }

    seleccionado = seleccionadoTemp;
    renderizarDiploma();
    actualizarEditor();
});

canvas.addEventListener("mousemove", (e) => {
    if (arrastrando && seleccionado !== null && seleccionado !== "border") {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = e.offsetX * scaleX;
        const y = e.offsetY * scaleY;
        const [type, index] = seleccionado.split("-");
        
        if (type === "text") {
            diplomaData.text[index].position.x = Math.max(10, Math.min(x - offsetX, canvas.width - 10));
            diplomaData.text[index].position.y = Math.max(10, Math.min(y - offsetY, canvas.height - 10));
        } else if (type === "image") {
            diplomaData.images[index].position.x = Math.max(10, Math.min(x - offsetX, canvas.width - diplomaData.images[index].size.width));
            diplomaData.images[index].position.y = Math.max(10, Math.min(y - offsetY, canvas.height - diplomaData.images[index].size.height));
        } else if (type === "line") {
            const item = diplomaData.lines[index];
            const dx = item.end.x - item.start.x;
            const dy = item.end.y - item.start.y;
            item.start.x = Math.max(10, Math.min(x - offsetX, canvas.width - 10));
            item.start.y = Math.max(10, Math.min(y - offsetY, canvas.height - 10));
            item.end.x = item.start.x + dx;
            item.end.y = item.start.y + dy;
        }
        renderizarDiploma();
    }
});

canvas.addEventListener("mouseup", () => {
    arrastrando = false;
});

// Guardar los cambios en el JSON
/*
async function guardarDiploma() {
    try {
        const response = await fetch("/save-diploma", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(diplomaData)
        });

        if (response.ok) {
            alert("¡Diploma guardado exitosamente!");
        } else {
            alert("Error al guardar el diploma: " + response.statusText);
        }
    } catch (error) {
        console.error("Error al guardar el diploma:", error);
        alert("Error al guardar el diploma: " + error.message);
    }
}
*/
async function guardarDiploma() {
    try {
      // 1️⃣ Exportar el canvas como imagen (formato PNG)
      const imageBlob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
      });
  
      if (!imageBlob) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo exportar el diploma.',
          confirmButtonColor: '#E84A5F'
        });
        return;
      }
  
      // 2️⃣ Subir la imagen temporalmente al backend
      const formData = new FormData();
      formData.append('diplomaImagen', imageBlob, 'diploma.png');
  
      const response = await fetch('http://127.0.0.1:5000/guardar-diploma-imagen', {
        method: 'POST',
        body: formData
      });
  
      const data = await response.json();
  
      if (data.status === "ok") {
        // 3️⃣ Mostrar SweetAlert para seleccionar el Excel
        Swal.fire({
          title: 'Seleccionar archivo Excel',
          text: 'Ahora seleccioná el archivo Excel con los datos de los estudiantes',
          input: 'file',
          inputAttributes: {
            accept: '.xlsx',
            'aria-label': 'Subí tu archivo Excel'
          },
          showCancelButton: true,
          confirmButtonText: 'Cargar Excel',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#3B9C9C',
          cancelButtonColor: '#E84A5F',
          preConfirm: (file) => {
            if (!file) {
              Swal.showValidationMessage('Debes seleccionar un archivo Excel');
            }
            return file;
          }
        }).then((result) => {
          if (result.isConfirmed) {
            const excelFile = result.value;
            subirExcelParaDiplomas(excelFile);
          }
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: data.message,
          confirmButtonColor: '#E84A5F'
        });
      }
  
    } catch (error) {
      console.error('Error al guardar el diploma:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el diploma.',
        confirmButtonColor: '#E84A5F'
      });
    }
  }
  

// Inicializar
cargarDiploma();
vincularEventosEditor();