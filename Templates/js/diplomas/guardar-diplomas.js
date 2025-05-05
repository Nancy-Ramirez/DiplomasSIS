document.addEventListener("DOMContentLoaded", () => {
    const botonGuardar = document.getElementById("descargar");
    const canvas = document.getElementById("diplomaCanvas");

    if (!botonGuardar || !canvas) {
        console.warn("No se encontró el botón de guardar o el canvas.");
        return;
    }

    botonGuardar.addEventListener("click", async () => {
        const { value: file } = await Swal.fire({
            title: "Cargar archivo Excel",
            input: "file",
            inputAttributes: {
                accept: ".xlsx",
                "aria-label": "Carga el archivo Excel con los nombres"
            },
            confirmButtonText: "Enviar y generar diplomas",
            showCancelButton: true,
            cancelButtonText: "Cancelar"
        });

        if (!file) return;

        const imageData = canvas.toDataURL("image/png");
        const configJSON = JSON.stringify(diplomaData); // Asegúrate de tener diplomaData global

        const formData = new FormData();
        formData.append("imagen", imageData);
        formData.append("estructura", configJSON);
        formData.append("excel", file);

        try {
            const response = await fetch("http://127.0.0.1:5000/diploma/generar-masivo", {
                method: "POST",
                body: formData
            });

            const text = await response.text();
            const result = JSON.parse(text);

            if (result.status === "ok") {
                Swal.fire("¡Éxito!", result.message, "success");
            } else {
                Swal.fire("Error", result.message, "error");
            }

        } catch (error) {
            console.error("Error en la solicitud:", error);
            Swal.fire("Error", "No se pudo generar los diplomas.", "error");
        }
    });
});
