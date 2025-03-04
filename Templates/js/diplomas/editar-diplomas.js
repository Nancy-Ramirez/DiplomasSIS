const canvas = document.getElementById("diplomaCanvas");
const ctx = canvas.getContext("2d");
const editor = document.getElementById("editor");

let diplomaData = {};
let seleccionado = null;
let offsetX, offsetY, arrastrando = false;

// Cargar el JSON y renderizar el Diploma
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

// Limpiar el Canvas y renderizar solo los elementos existentes
function renderizarDiploma() {
    // Limpiar canvas antes de redibujar
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    diplomaData.elements.forEach((item, index) => {
        if (item.type === "text") {
            ctx.font = `${item.fontWeight || ""} ${item.fontSize}px ${item.fontFamily}`;
            ctx.fillStyle = item.color;
            ctx.textAlign = item.align || "left";
            ctx.fillText(item.content, item.x, item.y);
        } else if (item.type === "image") {
            const img = new Image();
            img.src = item.src;
            img.onload = () => {
                ctx.drawImage(img, item.x, item.y, item.width, item.height);
            };
        } else if (item.type === "border") {
            ctx.strokeStyle = item.color;
            ctx.lineWidth = item.thickness;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
        }

        // Si el elemento está seleccionado, dibujar un borde
        if (seleccionado !== null && seleccionado === index) {
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            if (item.type === "text") {
                const textWidth = ctx.measureText(item.content).width;
                const textHeight = item.fontSize;
                ctx.strokeRect(item.x - 5, item.y - item.fontSize, textWidth + 10, textHeight + 5);
            } else if (item.type === "image") {
                ctx.strokeRect(item.x - 5, item.y - 5, item.width + 10, item.height + 10);
            }
        }
    });
    generarEditor(); // Actualizar editor del sidebar
}

// Generar el editor en el sidebar
function generarEditor() {
    editor.innerHTML = ""; // Limpiar el editor antes de agregar elementos

    if (seleccionado !== null) {
        const item = diplomaData.elements[seleccionado];

        // Título de edición
        const titulo = document.createElement("h3");
        titulo.innerText = `Editar: ${item.type === "text" ? "Texto" : item.type === "image" ? "Imagen" : "Borde"}`;
        titulo.classList.add("font-bold", "mb-2");

        // Editar texto
        if (item.type === "text") {
            const inputTexto = document.createElement("input");
            inputTexto.type = "text";
            inputTexto.value = item.content;
            inputTexto.classList.add("w-full", "p-2", "border", "rounded", "mb-2");
            inputTexto.addEventListener("focus", (e) => {
                inputTexto.select(); // Selecciona todo el texto al enfocarse
            });

            inputTexto.addEventListener("input", (e) => {
                diplomaData.elements[seleccionado].content = e.target.value;
                renderizarDiploma();
            });

            inputTexto.addEventListener("blur", (e) => {
                // Cuando el campo pierde el foco, se guardan los cambios
                diplomaData.elements[seleccionado].content = e.target.value;
                renderizarDiploma();
            });

            editor.appendChild(titulo);
            editor.appendChild(inputTexto);
        }

        // Editar imagen
        if (item.type === "image") {
            const inputSrc = document.createElement("input");
            inputSrc.type = "text";
            inputSrc.value = item.src;
            inputSrc.classList.add("w-full", "p-2", "border", "rounded", "mb-2");
            inputSrc.addEventListener("input", (e) => {
                diplomaData.elements[seleccionado].src = e.target.value;
                renderizarDiploma();
            });

            editor.appendChild(titulo);
            editor.appendChild(inputSrc);
        }

        // Editar borde
        if (item.type === "border") {
            const inputColor = document.createElement("input");
            inputColor.type = "color";
            inputColor.value = item.color;
            inputColor.classList.add("w-full", "p-2", "border", "rounded", "mb-2");
            inputColor.addEventListener("input", (e) => {
                diplomaData.elements[seleccionado].color = e.target.value;
                renderizarDiploma();
            });

            editor.appendChild(titulo);
            editor.appendChild(inputColor);
        }
    }
}

// Detectar clic en el Canvas para seleccionar un elemento
canvas.addEventListener("mousedown", (e) => {
    const { offsetX: x, offsetY: y } = e;
    let seleccionadoTemp = null;

    diplomaData.elements.forEach((item, index) => {
        if (item.type === "text") {
            const textWidth = ctx.measureText(item.content).width;
            const textHeight = item.fontSize;

            if (x >= item.x - 5 && x <= item.x + textWidth + 5 && y >= item.y - textHeight - 5 && y <= item.y + 5) {
                seleccionadoTemp = index;
                offsetX = x - item.x;
                offsetY = y - item.y;
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
            renderizarDiploma();
        }
    });
});

// Mover el texto en el Canvas con el mouse
canvas.addEventListener("mousemove", (e) => {
    if (arrastrando && seleccionado !== null) {
        const { offsetX: x, offsetY: y } = e;
        const item = diplomaData.elements[seleccionado];

        if (item.type === "text") {
            item.x = x - offsetX;
            item.y = y - offsetY;
        } else if (item.type === "image") {
            item.x = x - offsetX;
            item.y = y - offsetY;
        }
        renderizarDiploma();
    }
});

// Soltar el texto (deja de arrastrar)
canvas.addEventListener("mouseup", () => {
    arrastrando = false;
});

// Descargar el diploma como imagen
document.getElementById("descargar").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "Diploma.png";
    link.href = canvas.toDataURL();
    link.click();
});

// Cargar diploma al iniciar
cargarDiploma();
