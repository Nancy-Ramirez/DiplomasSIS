function solicitarExcel() {
    Swal.fire({
      title: 'Selecciona el archivo Excel',
      text: 'Este archivo debe contener los estudiantes para generar los diplomas',
      input: 'file',
      inputAttributes: {
        accept: '.xlsx', // Solo archivos Excel
        'aria-label': 'Subí tu archivo Excel'
      },
      showCancelButton: true,
      confirmButtonText: 'Cargar Excel',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3B9C9C',
      cancelButtonColor: '#E84A5F',
      preConfirm: (file) => {
        if (!file) {
          Swal.showValidationMessage('Debes seleccionar un archivo Excel');
        }
        return file;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const file = result.value;
        subirExcel(file); // función que enviará el archivo al backend
      }
    });
  }
  