  /**Ver Diplomas */
  /******************************************************************************* */
  // Obtener el canvas y el contexto
  const canvas = document.getElementById("diplomaCanvas");
  const ctx = canvas.getContext("2d");
  
  // Cargar el JSON del diploma
  fetch("../../data/diploma.json")
      .then(response => response.json())
      .then(diplomaData => {
          // Configurar tamaño del canvas
          canvas.width = diplomaData.canvas.width;
          canvas.height = diplomaData.canvas.height;
  
          // Dibujar elementos
          drawDiploma(diplomaData);
      })
      .catch(error => console.error("Error cargando el JSON:", error));
  
  // Función para dibujar el diploma
  function drawDiploma(data) {
      data.elements.forEach(element => {
          if (element.type === "text") {
              drawText(element);
          } else if (element.type === "image") {
              drawImage(element);
          } else if (element.type === "border") {
              drawBorder(element);
          }
      });
  }
  
  // Función para dibujar texto
  function drawText(element) {
      ctx.font = `${element.fontWeight || ''} ${element.fontSize}px ${element.fontFamily}`;
      ctx.fillStyle = element.color;
      ctx.textAlign = element.align;
      ctx.fillText(element.content, element.x, element.y);
  }
  
  // Función para dibujar imágenes (firma/sello)
  function drawImage(element) {
      const img = new Image();
      img.src = element.src;
      img.onload = () => {
          ctx.drawImage(img, element.x, element.y, element.width, element.height);
      };
  }
  
  // Función para dibujar bordes
  function drawBorder(element) {
      ctx.lineWidth = element.thickness;
      ctx.strokeStyle = element.color;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  }
  
  