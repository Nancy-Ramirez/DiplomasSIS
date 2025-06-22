document.addEventListener("DOMContentLoaded", () => {
  const btnPredeterminadas = document.getElementById("btnPredeterminadas");
  const btnMisPlantillas = document.getElementById("btnMisPlantillas");
  const contenedorGrid = document.getElementById("contenedor-plantillas");
  const loadingIndicator = document.getElementById("loading-indicator");

  // Mostrar solo las plantillas de una sección
  const mostrarSeccion = (tipo) => {
    document.querySelectorAll(".plantillas").forEach(el => el.classList.add("hidden"));
    document.querySelectorAll(`.plantillas.${tipo}`).forEach(el => el.classList.remove("hidden"));
  };

  // Mostrar predeterminadas
  btnPredeterminadas?.addEventListener("click", () => {
    mostrarSeccion("predeterminadas");
  });

  // Mostrar personalizadas
  btnMisPlantillas?.addEventListener("click", async () => {
    mostrarSeccion("mis-plantillas");

    const yaCargadas = document.querySelector(".plantillas.mis-plantillas.generada");
    if (yaCargadas) return;

    loadingIndicator.classList.remove("hidden");

    try {
      const res = await fetch("http://127.0.0.1:5000/diplomas/plantillas_guardadas");
      const plantillas = await res.json();

      // Si no hay plantillas, mostrar mensaje
      if (plantillas.length === 0) {
        const aviso = document.createElement("div");
        aviso.className = "plantillas mis-plantillas generada col-span-full text-center text-gray-500 font-medium";
        aviso.textContent = "Aún no hay plantillas personalizadas guardadas.";
        contenedorGrid.appendChild(aviso);
        return;
      }

      // Agregar tarjetas
      plantillas.forEach((p) => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "plantillas mis-plantillas generada hidden";

       tarjeta.innerHTML = `
  <div class="relative h-full border-2 border-gray-200 border-opacity-60 rounded-lg overflow-hidden hover:shadow-lg hover:scale-105 transition transform duration-300 group">

    <!-- Imagen con opacidad suave al pasar el cursor -->
    <img class="w-full object-cover object-center transition-opacity duration-300 group-hover:opacity-60" src="${p.imagen}" alt="${p.nombre}" />

    <!-- Íconos superpuestos -->
    <div class="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
      <button title="Editar" class="bg-white rounded-full p-2 hover:bg-gray-200 shadow-md cursor-pointer" onclick="editarPlantilla('${p.id}')">
        ✏️
      </button>
      <button title="Eliminar" class="bg-white rounded-full p-2 hover:bg-gray-200 shadow-md cursor-pointer" onclick="confirmarEliminacion('${p.id}')"">
        🗑️
      </button>
    </div>

    <!-- Título -->
    <div class="p-6 text-center bg-white relative z-20">
      <h1 class="title-font text-lg font-medium text-gray-900 mb-3">${p.nombre}</h1>
    </div>
  </div>
`;



      contenedorGrid.appendChild(tarjeta);
      });

      mostrarSeccion("mis-plantillas");
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
      const errorMsg = document.createElement("div");
      errorMsg.className = "plantillas mis-plantillas generada col-span-full text-center text-red-500 font-medium";
      errorMsg.textContent = "Ocurrió un error al cargar las plantillas.";
      contenedorGrid.appendChild(errorMsg);
    } finally {
      loadingIndicator.classList.add("hidden");
    }
  });
});

// Al hacer clic en el ícono ✏️
function editarPlantilla(nombreJson) {
  // Guardamos el nombre para usarlo al enviar
  window.nombreJsonSeleccionado = nombreJson;
  document.getElementById("modal-generar").classList.remove("hidden");
}

// Enviar el nombre del JSON y el Excel
async function enviarPlantillaConExcel() {
  const fileInput = document.getElementById("excelFile");
  const nombre = window.nombreJsonSeleccionado;

  if (!fileInput.files.length || !nombre) {
    Swal.fire({
      icon: "warning",
      title: "Faltan datos",
      text: "Por favor seleccione una plantilla y un archivo Excel.",
      confirmButtonColor: "#3085d6"
    });
    return;
  }

  const formData = new FormData();
  formData.append("nombre_json", nombre.endsWith(".json") ? nombre : nombre + ".json");
  formData.append("excel", fileInput.files[0]);
  formData.append("generar_qr", "true");

  Swal.fire({
    title: 'Generando diplomas...',
    text: 'Por favor espere mientras se crean los archivos',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const res = await fetch("http://127.0.0.1:5000/diplomas/generar_desde_nombre", {
      method: "POST",
      body: formData,
    });

    const blob = await res.blob();
    if (res.ok) {
      Swal.close();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "diplomas_generados.zip";
      a.click();

      cerrarModal();
    } else {
      const text = await blob.text();
      console.error("Error:", text);
      Swal.fire({
        icon: "error",
        title: "Error al generar diplomas",
        text: "El servidor respondió con un error.",
        confirmButtonColor: "#d33"
      });
    }
  } catch (error) {
    console.error("Error:", error);
    Swal.fire({
      icon: "error",
      title: "Error inesperado",
      text: "No se pudo generar el archivo. Intente nuevamente.",
      confirmButtonColor: "#d33"
    });
  }
}


// Cerrar el modal
function cerrarModal() {
  document.getElementById("modal-generar").classList.add("hidden");
  window.nombreJsonSeleccionado = null;
}

function confirmarEliminacion(nombrePlantilla) {
  Swal.fire({
    title: "¿Eliminar plantilla?",
    text: "¿Está segura que desea eliminar de manera permanente esta plantilla?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      eliminarPlantilla(nombrePlantilla);
    }
  });
}

async function eliminarPlantilla(nombre) {
  try {
    const res = await fetch("http://127.0.0.1:5000/diplomas/eliminar_plantilla", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nombre }),
    });

    const data = await res.json();

    if (res.ok) {
      Swal.fire("¡Eliminada!", "La plantilla ha sido eliminada correctamente.", "success")
        .then(() => {
          location.reload(); // recargar para reflejar el cambio
        });
    } else {
      throw new Error(data.error || "Error al eliminar");
    }
  } catch (error) {
    console.error("Error al eliminar:", error);
    Swal.fire("Error", "No se pudo eliminar la plantilla.", "error");
  }
}
