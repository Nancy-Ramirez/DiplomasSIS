document.addEventListener("DOMContentLoaded", () => {
    const letra = document.getElementById("letra");
    const tamañoLetra = document.getElementById("tamaño-letra");
    const tamañoPapel = document.getElementById("tamaño-papel");
    const fecha = document.getElementById("fecha");
    const para = document.getElementById("para");
    const de = document.getElementById("de");
    const asunto = document.getElementById("asunto");
    const contenido = document.getElementById("contenido");
    const nombreArchivo = document.getElementById("nombreArchivo");

    const tipoGestionRadios = document.querySelectorAll('input[name="tipoGestion"]');
    const archivoMasivo = document.getElementById("archivoMasivo");
    const cargaMasivaContainer = document.getElementById("cargaMasivaContainer");

    const cargarBtn = document.getElementById("cargarDatos");
    const generarBtn = document.getElementById("generar");
    const cancelarBtn = document.getElementById("cancelar");

    function marcarCampoInvalido(campo) {
        campo.classList.add("border-red-500", "ring-2", "ring-red-300");
    }

    function limpiarCampoInvalido(campo) {
        campo.classList.remove("border-red-500", "ring-2", "ring-red-300");
    }
    
    archivoMasivo.addEventListener("change", () => {
        const file = archivoMasivo.files[0];
        const extension = file?.name.split(".").pop().toLowerCase();
        if (!["xlsx", "csv"].includes(extension)) {
            Swal.fire({
                icon: "warning",
                title: "Archivo inválido",
                text: "Solo se permiten archivos .xlsx o .csv.",
                confirmButtonColor: "#f59e0b"
            });
            archivoMasivo.value = "";
            nombreArchivo.textContent = "Ningún archivo seleccionado";
        } else {
            nombreArchivo.textContent = file.name;
        }
    });

    function limpiarFormulario() {
        letra.value = "";
        tamañoLetra.value = "";
        tamañoPapel.value = "";
        fecha.value = "";
        para.value = "";
        de.value = "";
        asunto.value = "";
        contenido.value = "";
        archivoMasivo.value = "";
        cargaMasivaContainer.classList.add("hidden");
        tipoGestionRadios.forEach(radio => radio.checked = false);
        document.querySelectorAll('input[name="alineacion"]').forEach(r => r.checked = false);
    }

    tipoGestionRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            if (radio.value === "masiva" && radio.checked) {
                cargaMasivaContainer.classList.remove("hidden");
                cargarBtn.disabled = false;
                cargarBtn.classList.remove("bg-gray-300");
                cargarBtn.classList.add("bg-blue-500", "hover:bg-blue-600");
                // Desactivar campo "Para"
                para.disabled = true;
                para.classList.add("bg-gray-100", "text-gray-500");
            } else {
                cargaMasivaContainer.classList.add("hidden");
                cargarBtn.disabled = true;
                cargarBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
                cargarBtn.classList.add("bg-gray-300");
                // Activar campo "Para"
                para.disabled = false;
                para.classList.remove("bg-gray-100", "text-gray-500");
            }
        });
    });

    cargarBtn.addEventListener("click", () => {
        archivoMasivo.click();
    });

    generarBtn.addEventListener("click", async () => {
        let camposInvalidos = [];

        if (!letra.value) { marcarCampoInvalido(letra); camposInvalidos.push("Tipo de letra"); } else limpiarCampoInvalido(letra);
        if (!tamañoLetra.value) { marcarCampoInvalido(tamañoLetra); camposInvalidos.push("Tamaño de letra"); } else limpiarCampoInvalido(tamañoLetra);
        if (!tamañoPapel.value) { marcarCampoInvalido(tamañoPapel); camposInvalidos.push("Tamaño de papel"); } else limpiarCampoInvalido(tamañoPapel);
        if (!fecha.value) { marcarCampoInvalido(fecha); camposInvalidos.push("Fecha"); } else limpiarCampoInvalido(fecha);
        if (!para.value.trim()) { marcarCampoInvalido(para); camposInvalidos.push("Para"); } else limpiarCampoInvalido(para);
        if (!de.value.trim()) { marcarCampoInvalido(de); camposInvalidos.push("De"); } else limpiarCampoInvalido(de);
        if (!asunto.value.trim()) { marcarCampoInvalido(asunto); camposInvalidos.push("Asunto"); } else limpiarCampoInvalido(asunto);
        if (!contenido.value.trim()) { marcarCampoInvalido(contenido); camposInvalidos.push("Contenido"); } else limpiarCampoInvalido(contenido);

        let tipoGestion = "";
        tipoGestionRadios.forEach(radio => {
            if (radio.checked) tipoGestion = radio.value;
        });

        if (!tipoGestion) {
            camposInvalidos.push("Tipo de gestión");
        }

        let alineacion = "";
        document.querySelectorAll('input[name="alineacion"]').forEach(r => {
            if (r.checked) alineacion = r.value;
        });

        if (!alineacion) {
            camposInvalidos.push("Alineación");
        }

        if (tipoGestion === "masiva" && archivoMasivo.files.length === 0) {
            camposInvalidos.push("Archivo de carga masiva");
        }

        if (camposInvalidos.length > 0) {
            return Swal.fire({
                icon: 'warning',
                title: 'Faltan campos',
                html: `Completa: <strong>${camposInvalidos.join(", ")}</strong>`,
                confirmButtonColor: '#f59e0b'
            });
        }

        const formData = new FormData();
        formData.append("letra", letra.value);
        formData.append("tamañoLetra", tamañoLetra.value);
        formData.append("tamañoPapel", tamañoPapel.value);
        formData.append("fecha", fecha.value);
        formData.append("para", para.value.trim());
        formData.append("de", de.value.trim());
        formData.append("asunto", asunto.value.trim());
        formData.append("contenido", contenido.value.trim());
        formData.append("alineacion", alineacion);
        formData.append("tipoGestion", tipoGestion);

        if (tipoGestion === "masiva") {
            formData.append("archivoMasivo", archivoMasivo.files[0]);
        }

        try {
            const response = await fetch("http://127.0.0.1:5000/crear_memorandum", {
                method: "POST",
                body: formData
            });

            if (!response.ok) throw new Error("Error al generar el documento");

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = tipoGestion === "masiva" ? "memorandums.zip" : "memorandum.docx";
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
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo generar el documento.',
                confirmButtonColor: '#ef4444'
            });
        }
    });

    cancelarBtn.addEventListener("click", () => {
        limpiarFormulario();
    });
});
