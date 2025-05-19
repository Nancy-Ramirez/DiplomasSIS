document.addEventListener("DOMContentLoaded", () => {
    const btnGuardar = document.getElementById("btnGuardarCambios");
    const inputArchivo = document.getElementById("archivoEstudiantes");
    const chkGenerarQR = document.getElementById("chkGenerarQR");

    if (!btnGuardar) {
        console.error("❌ Botón 'btnGuardarCambios' no encontrado en el DOM.");
        return;
    }

    if (!inputArchivo) {
        console.error("❌ Input de archivo de estudiantes no encontrado.");
        return;
    }

    // Fallback por si solo existe diplomaData
    if (typeof window.plantillaData === "undefined" && typeof window.diplomaData !== "undefined") {
        window.plantillaData = window.diplomaData;
    }

    btnGuardar.addEventListener("click", async () => {
        let nombrePlantilla = ""; // Variable accesible globalmente en el evento

        try {
            if (!window.plantillaData) {
                throw new Error("No se encontró la plantilla cargada (plantillaData está indefinido).");
            }

            const response = await fetch("http://127.0.0.1:5000/diplomas/guardar-plantilla", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(window.plantillaData)
            });

            const contentType = response.headers.get("content-type");
            let result = {};

            if (contentType && contentType.includes("application/json")) {
                result = await response.json();
                nombrePlantilla = result.archivo; // ✅ ASIGNACIÓN CORRECTA
            } else {
                const text = await response.text();
                throw new Error("Respuesta inesperada del servidor: " + text);
            }

            if (!response.ok) {
                throw new Error(result.mensaje || "Error al guardar plantilla.");
            }

            Swal.fire({
                icon: "success",
                title: "¡Plantilla guardada!",
                text: "Ahora seleccioná el archivo de estudiantes (CSV o XLSX)",
                confirmButtonText: "Cargar archivo",
                confirmButtonColor: "#3b82f6"
            }).then(() => {
                inputArchivo.click();

                inputArchivo.onchange = async () => {
                    const archivo = inputArchivo.files[0];

                    if (!archivo) return;

                    const extension = archivo.name.split(".").pop().toLowerCase();
                    if (!["csv", "xlsx"].includes(extension)) {
                        Swal.fire({
                            icon: "warning",
                            title: "Archivo inválido",
                            text: "Solo se permiten archivos .csv o .xlsx",
                            confirmButtonColor: "#f59e0b"
                        });
                        inputArchivo.value = "";
                        return;
                    }

                    const formData = new FormData();
                    formData.append("archivo_estudiantes", archivo);
                    formData.append("nombre_plantilla", nombrePlantilla); // ✅ SE USA CORRECTAMENTE
                    formData.append("generar_qr", chkGenerarQR.checked);

                    try {

                        Swal.fire({
                            title: "Generando diplomas...",
                            html: "Esto puede tardar unos segundos. Por favor, esperá.",
                            allowOutsideClick: false,
                            didOpen: () => {
                                Swal.showLoading();
                            }
                        });

                        const respuesta = await fetch("http://127.0.0.1:5000/diplomas/generar-masivo", {
                            method: "POST",
                            body: formData
                        });

                        Swal.close();

                        if (!respuesta.ok) throw new Error("Error generando diplomas");

                        const blob = await respuesta.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "diplomas_generados.zip";
                        document.body.appendChild(a);
                        a.click();
                        a.remove();

                        Swal.fire({
                            icon: "success",
                            title: "¡Listo!",
                            text: "Los diplomas fueron generados exitosamente.",
                            confirmButtonColor: "#3b82f6"
                        });

                    } catch (err) {
                        Swal.fire({
                            icon: "error",
                            title: "Error",
                            text: "No se pudo generar el archivo.",
                            confirmButtonColor: "#ef4444"
                        });
                        console.error("❌ Error generando diplomas:", err);
                    }
                };
            });

        } catch (error) {
            console.error("❌ ERROR al guardar plantilla:", error);

            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message || "Error inesperado al guardar la plantilla.",
                confirmButtonColor: "#ef4444"
            });
        }
    });
});
