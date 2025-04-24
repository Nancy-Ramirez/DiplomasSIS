// Mostrar el panel correspondiente y cargar integración si es necesario
function showPanel(panelId) {
    const panels = document.querySelectorAll('.panel');
    panels.forEach(panel => panel.classList.add('hidden'));
    document.getElementById('panel-' + panelId).classList.remove('hidden');
  
    if (panelId === "integraciones") {
      cargarIntegracion();
    }
    if (panelId === "general") {
      cargarGeneral();
    }
  }
  
  // Cargar datos de integración desde el backend
  function cargarIntegracion() {
    fetch("http://localhost:5000/cargar-configuracion")
      .then(res => res.json())
      .then(data => {
        const folderInput = document.getElementById("carpetaDrive");
        const estadoCredencial = document.getElementById("estadoCredencial");
  
        if (data.google_drive) {
          folderInput.value = data.google_drive.folder_id || '';
  
          if (data.google_drive.credenciales_guardadas && data.google_drive.nombre_credencial) {
            estadoCredencial.innerText = `✔️ Archivo cargado: ${data.google_drive.nombre_credencial}`;
          } else {
            estadoCredencial.innerText = "❌ No se ha cargado ningún archivo";
          }
        }
      })
      .catch(err => {
        console.error("Error al cargar configuración:", err);
      });
  }
  
  // Guardar integración (credenciales + folder_id)
  function guardarIntegracion() {
    const inputCredenciales = document.getElementById('archivoCredenciales');
    const folderId = document.getElementById('carpetaDrive').value;
    const file = inputCredenciales.files[0];
  
    if (!file || !folderId) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Seleccioná un archivo de credenciales y completá el folder ID.',
        confirmButtonColor: '#E84A5F'
      });
      return;
    }
  
    const formData = new FormData();
    formData.append("credenciales", file);
    formData.append("folder_id", folderId);
  
    fetch("http://localhost:5000/guardar-integracion", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "ok") {
          const fileName = file.name;
          document.getElementById("estadoCredencial").innerText = `✔️ Archivo cargado: ${fileName}`;
  
          Swal.fire({
            icon: 'success',
            title: 'Integración guardada',
            text: 'Los datos se han guardado correctamente.',
            confirmButtonColor: '#3B9C9C'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al guardar',
            text: data.message,
            confirmButtonColor: '#E84A5F'
          });
        }
      })
      .catch(err => {
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo conectar con el servidor.',
          confirmButtonColor: '#E84A5F'
        });
        console.error("Error al guardar integración:", err);
      });
  }
  
  // (Opcional) Cargar la ruta en el panel General
  function cargarGeneral() {
    fetch("http://localhost:5000/cargar-configuracion")
      .then(res => res.json())
      .then(data => {
        if (data.general && data.general.ruta_destino) {
          document.getElementById("rutaDestino").value = data.general.ruta_destino;
        }
      })
      .catch(err => {
        console.error("Error al cargar configuración general:", err);
      });
  }
  
  // Al cargar la página, mostrar la pestaña por defecto
  window.onload = () => showPanel('general');
  