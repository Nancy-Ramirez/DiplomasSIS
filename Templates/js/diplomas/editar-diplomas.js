const canvas = document.getElementById("diplomaCanvas");
const ctx = canvas.getContext("2d");
const editor = document.getElementById("editor");

let diplomaData = {};
let seleccionado = null;
let offsetX, offsetY, arrastrando = false;

async function cargarDiploma() {
    try {
        const response = await fetch("../../data/diploma.json");
        diplomaData = await response.json();
        canvas.width = diplomaData.canvas.width;
        canvas.height = diplomaData.canvas.height;
        renderizarDiploma();
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

    // Construir las líneas
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > adjustedMaxWidth && i > 0) {
            lines.push({ text: line.trim(), width: ctx.measureText(line.trim()).width });
            line = words[i] + " ";
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    lines.push({ text: line.trim(), width: ctx.measureText(line.trim()).width });

    // Calcular el ancho máximo del párrafo
    const textWidth = Math.max(...lines.map((line) => line.width));

    // Dibujar las líneas con alineación dentro del párrafo
    lines.forEach((lineObj) => {
        let adjustedX = x; // Punto de inicio fijo (borde izquierdo del párrafo)
        if (align === "center") {
            adjustedX = x + (textWidth - lineObj.width) / 2;
        } else if (align === "right") {
            adjustedX = x + (textWidth - lineObj.width);
        } else if (align === "justify" && lineObj.text.split(" ").length > 1) {
            const wordsInLine = lineObj.text.split(" ");
            const totalSpaces = wordsInLine.length - 1;
            const spaceWidth = (adjustedMaxWidth - ctx.measureText(wordsInLine.join("")).width) / totalSpaces;
            let currentX = x;
            wordsInLine.forEach((word, idx) => {
                ctx.fillText(word, currentX, currentY);
                currentX += ctx.measureText(word).width + (idx < totalSpaces ? spaceWidth : 0);
            });
            return;
        }
        ctx.fillText(lineObj.text, adjustedX, currentY);
        currentY += lineHeight;
    });

    // Devolver líneas para el rectángulo de selección
    return lines.map((lineObj) => ({
        text: lineObj.text,
        x: x, // Siempre el borde izquierdo del párrafo
        y: currentY - lineHeight,
        width: lineObj.width
    }));
}

function renderizarDiploma() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    diplomaData.elements.forEach((item, index) => {
        if (item.type === "text") {
            ctx.font = `${item.fontWeight || ""} ${item.fontSize}px ${item.fontFamily}`;
            ctx.fillStyle = item.color || "#000000";
            const maxWidth = canvas.width - 60;
            const lineHeight = item.fontSize * 1.2;

            // Usar las posiciones originales del JSON sin modificarlas
            const boundedX = item.x;
            const boundedY = item.y;
            const lines = wrapText(ctx, item.content, boundedX, boundedY, maxWidth, lineHeight, item.align || "left");

            if (seleccionado === index) {
                ctx.strokeStyle = "red";
                ctx.lineWidth = 2;
                const textWidth = Math.max(...lines.map((line) => ctx.measureText(line.text).width));
                const textHeight = lines.length * lineHeight;

                // Rectángulo fijo desde el borde izquierdo (boundedX)
                ctx.strokeRect(boundedX - 5, boundedY - item.fontSize - 5, textWidth + 10, textHeight + 5);
            }
        } else if (item.type === "image") {
            const img = new Image();
            img.src = item.src;
            img.onload = () => {
                ctx.drawImage(img, item.x, item.y, item.width, item.height);
            };
            // Dibujar inmediatamente si la imagen ya está cargada
            if (img.complete) {
                ctx.drawImage(img, item.x, item.y, item.width, item.height);
            }
        } else if (item.type === "border") {
            ctx.strokeStyle = item.color;
            ctx.lineWidth = item.thickness;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
        }
    });
}

function generarEditor() {
    editor.innerHTML = "";
    console.log("Generando editor para seleccionado:", seleccionado);

    if (seleccionado !== null) {
        const item = diplomaData.elements[seleccionado];

        const titulo = document.createElement("h3");
        titulo.innerText = `Editar: ${item.type === "text" ? "Texto" : item.type === "image" ? "Imagen" : "Borde"}`;
        titulo.classList.add("font-bold", "mb-2");
        editor.appendChild(titulo);

        if (item.type === "text") {
            // Contenido del texto
            const inputTexto = document.createElement("input");
            inputTexto.type = "text";
            inputTexto.value = item.content;
            inputTexto.classList.add("w-full", "p-2", "border", "rounded", "mb-2");
            inputTexto.addEventListener("input", (e) => {
                diplomaData.elements[seleccionado].content = e.target.value;
                requestAnimationFrame(renderizarDiploma);
            });
            editor.appendChild(document.createElement("label")).innerText = "Contenido:";
            editor.appendChild(inputTexto);
            inputTexto.focus();

            // 1. Tipo de fuente
            const selectFont = document.createElement("select");
            selectFont.classList.add("w-full", "p-2", "border", "rounded", "mb-2");
            const fonts = ["Arial", "Times New Roman", "Courier New", "Verdana", "Georgia"];
            fonts.forEach((font) => {
                const option = document.createElement("option");
                option.value = font;
                option.text = font;
                if (font === item.fontFamily) option.selected = true;
                selectFont.appendChild(option);
            });
            selectFont.addEventListener("change", (e) => {
                diplomaData.elements[seleccionado].fontFamily = e.target.value;
                requestAnimationFrame(renderizarDiploma);
            });
            editor.appendChild(document.createElement("label")).innerText = "Fuente:";
            editor.appendChild(selectFont);

            // 2. Color de letra
            const inputColor = document.createElement("input");
            inputColor.type = "color";
            inputColor.value = item.color || "#000000";
            inputColor.classList.add("w-full", "h-12", "p-2", "border", "rounded", "mb-2");
            inputColor.addEventListener("input", (e) => {
                diplomaData.elements[seleccionado].color = e.target.value;
                requestAnimationFrame(renderizarDiploma);
            });
            editor.appendChild(document.createElement("label")).innerText = "Color:";
            editor.appendChild(inputColor);

            // 3. Tamaño de letra
            const inputSize = document.createElement("input");
            inputSize.type = "number";
            inputSize.min = 8;
            inputSize.max = 72;
            inputSize.value = item.fontSize || 20;
            inputSize.classList.add("w-full", "p-2", "border", "rounded", "mb-2");
            inputSize.addEventListener("input", (e) => {
                diplomaData.elements[seleccionado].fontSize = parseInt(e.target.value);
                requestAnimationFrame(renderizarDiploma);
            });
            editor.appendChild(document.createElement("label")).innerText = "Tamaño (px):";
            editor.appendChild(inputSize);

            // 4. Grosor de texto
            const selectWeight = document.createElement("select");
            selectWeight.classList.add("w-full", "p-2", "border", "rounded", "mb-2");
            const weights = ["normal", "bold", "lighter", "bolder"];
            weights.forEach((weight) => {
                const option = document.createElement("option");
                option.value = weight;
                option.text = weight;
                if (weight === (item.fontWeight || "normal")) option.selected = true;
                selectWeight.appendChild(option);
            });
            selectWeight.addEventListener("change", (e) => {
                diplomaData.elements[seleccionado].fontWeight = e.target.value;
                requestAnimationFrame(renderizarDiploma);
            });
            editor.appendChild(document.createElement("label")).innerText = "Grosor:";
            editor.appendChild(selectWeight);

            // 5. Alineación
            const selectAlign = document.createElement("select");
            selectAlign.classList.add("w-full", "p-2", "border", "rounded", "mb-2");
            const aligns = ["left", "center", "right", "justify"];
            aligns.forEach((align) => {
                const option = document.createElement("option");
                option.value = align;
                option.text = align;
                if (align === (item.align || "left")) option.selected = true;
                selectAlign.appendChild(option);
            });
            selectAlign.addEventListener("change", (e) => {
                diplomaData.elements[seleccionado].align = e.target.value;
                requestAnimationFrame(renderizarDiploma);
            });
            editor.appendChild(document.createElement("label")).innerText = "Alineación:";
            editor.appendChild(selectAlign);
        }

        if (item.type === "image") {
            const inputSrc = document.createElement("input");
            inputSrc.type = "text";
            inputSrc.value = item.src;
            inputSrc.classList.add("w-full", "p-2", "border", "rounded", "mb-2");
            inputSrc.addEventListener("input", (e) => {
                diplomaData.elements[seleccionado].src = e.target.value;
                renderizarDiploma();
            });
            editor.appendChild(document.createElement("label")).innerText = "URL de imagen:";
            editor.appendChild(inputSrc);
        }

        if (item.type === "border") {
            const inputColor = document.createElement("input");
            inputColor.type = "color";
            inputColor.value = item.color;
            inputColor.classList.add("w-full", "p-2", "border", "rounded", "mb-2");
            inputColor.addEventListener("input", (e) => {
                diplomaData.elements[seleccionado].color = e.target.value;
                renderizarDiploma();
            });
            editor.appendChild(document.createElement("label")).innerText = "Color del borde:";
            editor.appendChild(inputColor);
        }
    }
}

canvas.addEventListener("mousedown", (e) => {
    const { offsetX: x, offsetY: y } = e;
    let seleccionadoTemp = null;

    diplomaData.elements.forEach((item, index) => {
        if (item.type === "text") {
            const maxWidth = canvas.width - 60;
            const lineHeight = item.fontSize * 1.2;
            const boundedX = item.x; // Usar posición original del JSON
            const boundedY = item.y;
            const lines = wrapText(ctx, item.content, boundedX, boundedY, maxWidth, lineHeight, item.align || "left");
            const textWidth = Math.max(...lines.map((line) => ctx.measureText(line.text).width));
            const textHeight = lines.length * lineHeight;

            let rectX = boundedX - 5; // Borde izquierdo fijo
            if (
                x >= rectX &&
                x <= rectX + textWidth + 10 &&
                y >= boundedY - item.fontSize - 5 &&
                y <= boundedY - item.fontSize + textHeight + 5
            ) {
                seleccionadoTemp = index;
                offsetX = x - boundedX;
                offsetY = y - boundedY;
                arrastrando = true;
            }
        } else if (item.type === "image") {
            if (x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height) {
                seleccionadoTemp = index;
                offsetX = x - item.x;
                offsetY = y - item.y;
                arrastrando = true;
            }
        }

        if (seleccionadoTemp !== null) {
            seleccionado = seleccionadoTemp;
            console.log("Elemento seleccionado:", seleccionado);
            renderizarDiploma();
            generarEditor();
        }
    });
});

canvas.addEventListener("mousemove", (e) => {
    if (arrastrando && seleccionado !== null) {
        const { offsetX: x, offsetY: y } = e;
        const item = diplomaData.elements[seleccionado];

        if (item.type === "text" || item.type === "image") {
            item.x = x - offsetX;
            item.y = y - offsetY;
        }
        renderizarDiploma();
    }
});

canvas.addEventListener("mouseup", () => {
    arrastrando = false;
});

document.getElementById("descargar").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "Diploma.png";
    link.href = canvas.toDataURL();
    link.click();
});

cargarDiploma();