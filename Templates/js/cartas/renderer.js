document.addEventListener("DOMContentLoaded", function () {
    const fileButton = document.getElementById("fileButton");
    const fileInput = document.getElementById("membrete");
    const fileName = document.getElementById("fileName");
    const cantidadFirmantes = document.getElementById("cantidadFirmantes");
    const firmantesContainer = document.getElementById("firmantesContainer");
    const sendButton = document.getElementById("enviar");

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

    function marcarCampoInvalido(campo) {
        campo.classList.add("border-red-500", "ring-2", "ring-red-300");
    }

    function limpiarCampoInvalido(campo) {
        campo.classList.remove("border-red-500", "ring-2", "ring-red-300");
    }

    function agregarEventoLimpieza(campo) {
        campo.addEventListener("input", () => limpiarCampoInvalido(campo));
    }

    function agregarEventoCambio(campo) {
        campo.addEventListener("change", () => limpiarCampoInvalido(campo));
    }

    [letra, tamañoLetra, tamañoPapel, fecha, asunto, cuerpo, destinatarioInput, cantidadFirmantes].forEach(campo => {
        agregarEventoCambio(campo);
        agregarEventoLimpieza(campo);
    });

    fileButton.addEventListener("click", () => fileInput.click());

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

    botonArchivoMasivo.addEventListener("click", () => archivoMasivo.click());

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
        firmantesContainer.innerHTML = "";
        if (isNaN(numFirmantes) || numFirmantes < 1 || numFirmantes > 4) return;

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

            input.addEventListener("input", () => limpiarCampoInvalido(input));

            inputDiv.appendChild(label);
            inputDiv.appendChild(input);
            firmantesContainer.appendChild(inputDiv);
        }
    });

    sendButton.addEventListener("click", async () => {
        const numFirmantes = parseInt(cantidadFirmantes.value);
        let camposInvalidos = [];

        if (isNaN(numFirmantes) || numFirmantes < 1 || numFirmantes > 4) {
            marcarCampoInvalido(cantidadFirmantes);
            camposInvalidos.push("Cantidad de firmantes (1-4)");
        } else {
            limpiarCampoInvalido(cantidadFirmantes);
        }

        let firmantes = [];
        for (let i = 1; i <= numFirmantes; i++) {
            const input = document.getElementById(`firmante${i}`);
            if (!input.value.trim()) {
                marcarCampoInvalido(input);
                camposInvalidos.push(`Firmante ${i}`);
            } else {
                limpiarCampoInvalido(input);
                firmantes.push(input.value.trim());
            }
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

        if (!letra.value) { marcarCampoInvalido(letra); camposInvalidos.push("Tipo de letra"); } else limpiarCampoInvalido(letra);
        if (!tamañoLetra.value) { marcarCampoInvalido(tamañoLetra); camposInvalidos.push("Tamaño de letra"); } else limpiarCampoInvalido(tamañoLetra);
        if (!tamañoPapel.value) { marcarCampoInvalido(tamañoPapel); camposInvalidos.push("Tamaño de papel"); } else limpiarCampoInvalido(tamañoPapel);
        if (!alineacionSeleccionada) camposInvalidos.push("Alineación");
        if (!fecha.value) { marcarCampoInvalido(fecha); camposInvalidos.push("Fecha"); } else limpiarCampoInvalido(fecha);
        if (!asunto.value.trim()) { marcarCampoInvalido(asunto); camposInvalidos.push("Asunto"); } else limpiarCampoInvalido(asunto);
        if (!cuerpo.value.trim()) { marcarCampoInvalido(cuerpo); camposInvalidos.push("Cuerpo"); } else limpiarCampoInvalido(cuerpo);
        if (!tipoCartaSeleccionada) camposInvalidos.push("Tipo de carta");

        if (tipoCartaSeleccionada === "individual") {
            if (!destinatarioInput.value.trim()) {
                marcarCampoInvalido(destinatarioInput);
                camposInvalidos.push("Destinatario");
            } else {
                limpiarCampoInvalido(destinatarioInput);
            }
        }

        if (tipoCartaSeleccionada === "masiva" && archivoMasivo.files.length === 0) {
            camposInvalidos.push("Archivo de carga masiva");
        }

        if (camposInvalidos.length > 0) {
            return Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                html: `Por favor completa: <strong>${camposInvalidos.join(", ")}</strong>`,
                confirmButtonColor: '#f59e0b'
            });
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
        } else {
            formData.append("archivoMasivo", archivoMasivo.files[0]);
        }

        firmantes.forEach((firmante, index) => {
            formData.append(`firmante${index + 1}`, firmante);
        });

        if (fileInput.files.length > 0) {
            formData.append("membrete", fileInput.files[0]);
        }

        try {
            const response = await fetch("http://127.0.0.1:5000/documento/recibir-datos", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error(`Error en la solicitud: ${response.statusText}`);

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = tipoCartaSeleccionada === "masiva" ? "cartas_masivas.zip" : "carta_generada.docx";
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                a.remove();
                Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!',
                    text: 'Documento generado y listo para guardar.',
                    confirmButtonColor: '#3b82f6'
                }).then(() => {
                    limpiarFormulario();
                });
            }, 500);
        } catch (error) {
            console.error("Error al enviar datos:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al generar el documento.',
                confirmButtonColor: '#ef4444'
            });
        }
    });

    function limpiarFormulario() {
        letra.value = "";
        tamañoLetra.value = "";
        tamañoPapel.value = "";
        fecha.value = "";
        asunto.value = "";
        cuerpo.value = "";
        destinatarioInput.value = "";
        cantidadFirmantes.value = "";
        firmantesContainer.innerHTML = "";
        tipoCartaRadios.forEach(r => r.checked = false);
        document.querySelectorAll('input[name="alineacion"]').forEach(r => r.checked = false);
        archivoMasivo.value = "";
        nombreArchivoMasivo.textContent = "Ningún archivo seleccionado";
        cargaMasivaContainer.classList.add("hidden");
    
        fileInput.value = "";
        fileName.textContent = "Ningún archivo seleccionado";
        document.getElementById("previewImage").classList.add("hidden");
    }
    
});
