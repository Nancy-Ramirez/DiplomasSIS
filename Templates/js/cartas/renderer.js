document.addEventListener("DOMContentLoaded", function () {
    const fileButton = document.getElementById("fileButton");
    const fileInput = document.getElementById("membrete");
    const fileName = document.getElementById("fileName");
    const cantidadFirmantes = document.getElementById("cantidadFirmantes");
    const firmantesContainer = document.getElementById("firmantesContainer");
    const sendButton = document.getElementById("enviar");
    const responseMessage = document.getElementById("responseMessage");

    const letra = document.getElementById("letra");
    const tamañoLetra = document.getElementById("tamaño-letra");
    const tamañoPapel = document.getElementById("tamaño-papel");
    const fecha = document.getElementById("fecha");
    const destinatarioInput = document.getElementById("destinatario");
    const cuerpo = document.getElementById("cuerpo");
    const asunto = document.getElementById("asunto");

    const tipoCartaRadios = document.querySelectorAll('input[name="tipoCarta"]');
    const cargaMasivaContainer = document.getElementById("cargaMasivaContainer");
    const archivoMasivo = document.getElementById("archivoMasivo");
    const botonArchivoMasivo = document.getElementById("botonArchivoMasivo");
    const nombreArchivoMasivo = document.getElementById("nombreArchivoMasivo");

    fileButton.addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", () => {
        fileName.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : "Ningún archivo seleccionado";
    });

    tipoCartaRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            if (radio.value === "masiva" && radio.checked) {
                destinatarioInput.disabled = true;
                destinatarioInput.classList.remove("bg-white");
                destinatarioInput.classList.add("bg-gray-100");
                cargaMasivaContainer.classList.remove("hidden");
            } else if (radio.value === "individual" && radio.checked) {
                destinatarioInput.disabled = false;
                destinatarioInput.classList.remove("bg-gray-100");
                destinatarioInput.classList.add("bg-white");
                cargaMasivaContainer.classList.add("hidden");
            }
        });
    });

    botonArchivoMasivo.addEventListener("click", () => {
        archivoMasivo.click();
    });

    archivoMasivo.addEventListener("change", () => {
        if (archivoMasivo.files.length > 0) {
            const file = archivoMasivo.files[0];
            const extension = file.name.split(".").pop().toLowerCase();
            if (["xlsx", "csv"].includes(extension)) {
                nombreArchivoMasivo.textContent = file.name;
            } else {
                alert("Solo se permiten archivos .xlsx o .csv");
                archivoMasivo.value = "";
                nombreArchivoMasivo.textContent = "Ningún archivo seleccionado";
            }
        }
    });

    cantidadFirmantes.addEventListener("input", () => {
        const numFirmantes = parseInt(cantidadFirmantes.value);
        if (isNaN(numFirmantes) || numFirmantes < 1 || numFirmantes > 4) {
            cantidadFirmantes.value = "";
            firmantesContainer.innerHTML = "";
            return;
        }

        firmantesContainer.innerHTML = "";
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

    sendButton.addEventListener("click", async () => {
        const numFirmantes = parseInt(cantidadFirmantes.value);
        if (isNaN(numFirmantes) || numFirmantes < 1 || numFirmantes > 4) {
            alert("⚠️ Por favor, ingresa una cantidad de firmantes entre 1 y 4.");
            return;
        }

        let firmantes = [];
        for (let i = 1; i <= numFirmantes; i++) {
            const firmanteInput = document.getElementById(`firmante${i}`);
            firmantes.push(firmanteInput.value);
        }

        let alineacionSeleccionada = "";
        document.querySelectorAll('input[name="alineacion"]').forEach(radio => {
            if (radio.checked) {
                alineacionSeleccionada = radio.value;
            }
        });

        let tipoCartaSeleccionada = "";
        document.querySelectorAll('input[name="tipoCarta"]').forEach(radio => {
            if (radio.checked) {
                tipoCartaSeleccionada = radio.value;
            }
        });

        if (!tipoCartaSeleccionada) {
            alert("Por favor, selecciona si la carta es individual o masiva.");
            return;
        }

        const formData = new FormData();
        formData.append("letra", letra.value);
        formData.append("tamañoLetra", tamañoLetra.value);
        formData.append("tamañoPapel", tamañoPapel.value);
        formData.append("alineacion", alineacionSeleccionada);
        formData.append("fecha", fecha.value);
        formData.append("cuerpo", cuerpo.value);
        formData.append("asunto", asunto.value);
        formData.append("cantidadFirmantes", numFirmantes);
        formData.append("tipoCarta", tipoCartaSeleccionada);

        if (tipoCartaSeleccionada === "individual") {
            formData.append("destinatario", destinatarioInput.value);
        } else if (tipoCartaSeleccionada === "masiva") {
            if (archivoMasivo.files.length === 0) {
                alert("Por favor, selecciona un archivo para carga masiva.");
                return;
            }
            formData.append("archivoMasivo", archivoMasivo.files[0]);
        }

        firmantes.forEach((firmante, index) => {
            formData.append(`firmante${index + 1}`, firmante);
        });

        if (fileInput.files.length > 0) {
            formData.append("membrete", fileInput.files[0]);
        }

        try {
            const response = await fetch("http://127.0.0.1:5000/recibir_datos", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = tipoCartaSeleccionada === "masiva" ? "cartas_masivas.zip" : "carta_generada.docx";
            document.body.appendChild(a);
            a.click();
            a.remove();

            responseMessage.innerText = "Documento generado y descargado exitosamente.";
        } catch (error) {
            console.error("Error al enviar datos:", error);
            responseMessage.innerText = "Error al generar el documento.";
        }
    });
});
