document.addEventListener("DOMContentLoaded", function () {
    const btnPredeterminadas = document.getElementById("btnPredeterminadas");
    const btnMisPlantillas = document.getElementById("btnMisPlantillas");
    const plantillasPredeterminadas = document.querySelectorAll(".predeterminadas");
    const plantillasMisPlantillas = document.querySelectorAll(".mis-plantillas");
  
    // Función para cambiar entre secciones
    function cambiarSeccion(activo, inactivo, mostrar, ocultar) {
      mostrar.forEach(el => el.classList.remove("hidden"));
      ocultar.forEach(el => el.classList.add("hidden"));
  
      // Resaltar botón activo
      activo.classList.add("bg-primary", "text-white");
      inactivo.classList.remove("bg-primary", "text-white");
    }
  
    btnPredeterminadas.addEventListener("click", function () {
      cambiarSeccion(btnPredeterminadas, btnMisPlantillas, plantillasPredeterminadas, plantillasMisPlantillas);
    });
  
    btnMisPlantillas.addEventListener("click", function () {
      cambiarSeccion(btnMisPlantillas, btnPredeterminadas, plantillasMisPlantillas, plantillasPredeterminadas);
    });
  });
  

  //Modals

  document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modal");
    const closeModal = document.getElementById("closeModal");
    const btnCancelar = document.getElementById("cancelar");
    const btnContinuar = document.getElementById("continuar");
  
    // Abre el modal al hacer clic en una plantilla
    document.querySelectorAll(".plantillas").forEach((plantilla) => {
      plantilla.addEventListener("click", () => {
        modal.classList.remove("hidden"); // Muestra el modal
      });
    });
  
    // Cerrar modal con el botón "X" o "Cancelar"
    closeModal.addEventListener("click", () => modal.classList.add("hidden"));
    btnCancelar.addEventListener("click", () => modal.classList.add("hidden"));
  
    // Puedes agregar funcionalidad al botón "Continuar"
    btnContinuar.addEventListener("click", () => {
    });
  
    // Cerrar modal si se hace clic fuera de él
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  });


