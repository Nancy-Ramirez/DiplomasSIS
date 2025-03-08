const { app, BrowserWindow } = require('electron');
const { exec, spawn } = require('child_process');
const path = require('path');
const http = require('http');

let mainWindow;
let flaskProcess;
let win;

app.whenReady().then(() => {
    //***********Cambio colocado por Ronald 
    // Uso de servidor flask 
    
    // 📌 Ruta absoluta al backend
    /*const backendPath = path.join(__dirname, 'backend');

    // 🔹 Iniciar el servidor Flask con Waitress desde la carpeta correcta
    flaskProcess = spawn('python', ['wsgi.py'], {
        cwd: backendPath,  // 📌 Cambia al directorio donde está wsgi.py
        shell: true
    });

    flaskProcess.stdout.on('data', (data) => {
        console.log(`Flask: ${data}`);
    });

    flaskProcess.stderr.on('data', (data) => {
        console.error(`Flask Error: ${data}`);
    });

    flaskProcess.on('close', (code) => {
        console.log(`Flask process exited with code ${code}`);
    });

    /*Aca termina mi cambio para levantar servidor */


    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    /*Cambio para levantar servidor --Ronald 
    // Esperar un poco para asegurarse de que el servidor Flask arranque antes de cargar la URL
    setTimeout(() => {
        if (win) { // 📌 Verificar que 'win' está definido antes de usarlo
            win.loadURL('http://127.0.0.1:5000'); // 📌 Ajusta según tu necesidad
        }
    }, 2000);  // 📌 Espera 2 segundos antes de abrir la ventana
    /*Cambio para levantar servidor --Ronald */
    
    mainWindow.loadFile('inicio.html');

});

app.on('window-all-closed', () => {
    if (flaskProcess) {
        flaskProcess.kill();
    }

    if (process.platform !== 'darwin') app.quit();
});
