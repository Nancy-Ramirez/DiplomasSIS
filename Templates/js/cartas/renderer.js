document.addEventListener("DOMContentLoaded", function () {
    const fileButton = document.getElementById("fileButton");
    const fileInput = document.getElementById("membrete");
    const fileName = document.getElementById("fileName");
    const cantidadFirmantes = document.getElementById("cantidadFirmantes");
    const firmantesContainer = document.getElementById("firmantesContainer");
    const sendButton = document.getElementById("enviar");
    const responseMessage = document.getElementById("responseMessage");

    // Obtener otros inputs de la carta
    const letra = document.getElementById("letra");
    const tamañoLetra = document.getElementById("tamaño-letra");
    const tamañoPapel = document.getElementById("tamaño-papel");
    const fecha = document.getElementById("fecha");
    const destinatario = document.getElementById("destinatario");
    const cuerpo = document.getElementById("cuerpo");

    // Evento para abrir el explorador de archivos
    fileButton.addEventListener("click", () => {
        fileInput.click();
    });

    // Evento para mostrar el nombre del archivo seleccionado
    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            fileName.textContent = fileInput.files[0].name;
        } else {
            fileName.textContent = "Ningún archivo seleccionado";
        }
    });

    // Evento para actualizar los inputs de firmantes
    cantidadFirmantes.addEventListener("input", () => {
        const numFirmantes = parseInt(cantidadFirmantes.value);

        if (numFirmantes < 1 || numFirmantes > 4 || isNaN(numFirmantes)) {
            cantidadFirmantes.value = "";
            firmantesContainer.innerHTML = "";
            return;
        }

        // Limpiar el contenedor antes de agregar nuevos campos
        firmantesContainer.innerHTML = "";

        // Crear los inputs dinámicamente
        for (let i = 1; i <= numFirmantes; i++) {
            const inputDiv = document.createElement("div");
            inputDiv.classList.add("flex", "items-center", "space-x-2");

            const label = document.createElement("label");
            label.textContent = `Firmante ${i}:`;
            label.classList.add("text-gray-700", "w-1/3");

            const input = document.createElement("input");
            input.type = "text";
            input.id = `firmante${i}`;
            input.classList.add("w-2/3", "p-2", "rounded-md", "shadow");

            inputDiv.appendChild(label);
            inputDiv.appendChild(input);
            firmantesContainer.appendChild(inputDiv);
        }
    });

    // Evento para enviar los datos de la carta al backend Flask y descargar el archivo
    sendButton.addEventListener("click", async () => {
        const numFirmantes = parseInt(cantidadFirmantes.value);
        if (isNaN(numFirmantes) || numFirmantes < 1 || numFirmantes > 4) {
            alert("⚠️ Por favor, ingresa una cantidad de firmantes entre 1 y 4.");
            return;
        }

        // Capturar los nombres de los firmantes
        let firmantes = [];
        for (let i = 1; i <= numFirmantes; i++) {
            const firmanteInput = document.getElementById(`firmante${i}`);
            firmantes.push(firmanteInput.value);
        }

        // Capturar la alineación seleccionada
        let alineacionSeleccionada = "";
        document.querySelectorAll('input[name="alineacion"]').forEach(radio => {
            if (radio.checked) {
                alineacionSeleccionada = radio.value;
            }
        });

        // Crear un objeto FormData para enviar el membrete (imagen) y los detalles de la carta
        const formData = new FormData();
        formData.append("letra", letra.value);
        formData.append("tamañoLetra", tamañoLetra.value);
        formData.append("tamañoPapel", tamañoPapel.value);
        formData.append("alineacion", alineacionSeleccionada);
        formData.append("fecha", fecha.value);
        formData.append("destinatario", destinatario.value);
        formData.append("cuerpo", cuerpo.value);
        formData.append("cantidadFirmantes", numFirmantes);
        firmantes.forEach((firmante, index) => {
            formData.append(`firmante${index + 1}`, firmante);
        });

        // Agregar el archivo si se seleccionó uno
        if (fileInput.files.length > 0) {
            formData.append("membrete", fileInput.files[0]);
        }

        console.log("📤 Enviando datos:", formData);

        try {
            const response = await fetch("http://127.0.0.1:5000/recibir_datos", {
                method: "POST",
                body: formData, // Usamos FormData para enviar archivos
            });

            if (!response.ok) {
                throw new Error(`❌ Error en la solicitud: ${response.statusText}`);
            }

            // 🔥 Descargar el archivo automáticamente
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "carta_generada.docx"; // Nombre del archivo
            document.body.appendChild(a);
            a.click();
            a.remove();

            responseMessage.innerText = "✅ Documento generado y descargado exitosamente.";
        } catch (error) {
            console.error("❌ Error al enviar datos:", error);
            responseMessage.innerText = "⚠️ Error al generar el documento.";
        }
    });
});
