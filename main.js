const { app, BrowserWindow } = require('electron');
const { exec, spawn } = require('child_process');
const path = require('path');

let mainWindow;
let flaskProcess;

app.whenReady().then(() => {
    /*
    // 📌 Ruta absoluta al backend
    const backendPath = path.join(__dirname, 'backend');

    // 🔹 Iniciar el servidor Flask como backend
    flaskProcess = spawn('python', ['wsgi.py'], {
        cwd: backendPath,  // 📌 Directorio donde está wsgi.py
        shell: true
    });

    flaskProcess.stdout.on('data', (data) => {
        console.log(`Flask: ${data}`);
    });

    flaskProcess.stderr.on('data', (data) => {
        console.error(`Error de Flask: ${data}`);
    });

    flaskProcess.on('close', (code) => {
        console.log(`El proceso Flask terminó con código ${code}`);
    });
    */

    // Crear la ventana de Electron para el frontend
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // Nota: Habilita esto por seguridad en producción
        }
    });

    // Cargar el archivo HTML local como frontend
    mainWindow.loadFile(path.join(__dirname, 'inicio.html'))
        .then(() => {
            console.log('✅ Frontend cargado desde inicio.html');
        })
        .catch((err) => {
            console.error('❌ Error al cargar inicio.html:', err);
        });
});

/*
// Función para cerrar todos los procesos en el puerto 5000
function killPortProcesses(port, callback) {
    if (process.platform === 'win32') {
        // En Windows, usar netstat para encontrar PIDs en el puerto
        exec(`netstat -aon | findstr :${port}`, (err, stdout) => {
            if (err) {
                console.error(`❌ Error al buscar procesos en puerto ${port}: ${err.message}`);
                callback(err);
                return;
            }

            const lines = stdout.split('\n');
            const pids = new Set(); // Usar Set para evitar duplicados

            lines.forEach((line) => {
                const match = line.match(/LISTENING\s+(\d+)/);
                if (match) {
                    pids.add(match[1]); // Agregar PID al conjunto
                }
            });

            if (pids.size === 0) {
                console.log(`✅ No se encontraron procesos en el puerto ${port}`);
                callback(null);
                return;
            }

            // Matar cada PID encontrado
            let remaining = pids.size;
            pids.forEach((pid) => {
                exec(`taskkill /PID ${pid} /F`, (killErr, killStdout) => {
                    if (killErr) {
                        console.error(`❌ Error al matar PID ${pid}: ${killErr.message}`);
                    } else {
                        console.log(`✅ Proceso PID ${pid} terminado: ${killStdout}`);
                    }
                    remaining--;
                    if (remaining === 0) callback(null); // Terminar cuando todos estén cerrados
                });
            });
        });
    } else {
        // En sistemas Unix (Linux/Mac), usar lsof
        exec(`lsof -i :${port} -t`, (err, stdout) => {
            if (err) {
                console.error(`❌ Error al buscar procesos en puerto ${port}: ${err.message}`);
                callback(err);
                return;
            }

            const pids = stdout.trim().split('\n').filter(Boolean);
            if (pids.length === 0) {
                console.log(`✅ No se encontraron procesos en el puerto ${port}`);
                callback(null);
                return;
            }

            // Matar cada PID encontrado
            let remaining = pids.length;
            pids.forEach((pid) => {
                exec(`kill -9 ${pid}`, (killErr) => {
                    if (killErr) {
                        console.error(`❌ Error al matar PID ${pid}: ${killErr.message}`);
                    } else {
                        console.log(`✅ Proceso PID ${pid} terminado`);
                    }
                    remaining--;
                    if (remaining === 0) callback(null);
                });
            });
        });
    }
}
*/

app.on('window-all-closed', () => {
    /*
    // Intentar cerrar Flask de forma ordenada primero
    if (flaskProcess && !flaskProcess.killed) {
        console.log("🔴 Intentando cerrar Flask de forma ordenada...");
        flaskProcess.kill('SIGTERM');

        // Dar un segundo para que Flask cierre
        setTimeout(() => {
            if (!flaskProcess.killed) {
                console.log("⚠️ Flask no cerró, forzando terminación...");
                flaskProcess.kill('SIGKILL');
            }
        }, 1000);
    }*/

    /*
        // Liberar el puerto 5000 matando todos los procesos asociados
    console.log("🔍 Buscando y cerrando procesos en el puerto 5000...");
    killPortProcesses(5000, (err) => {
        if (err) {
            console.error('❌ Error al liberar el puerto 5000:', err);
        } else {
            console.log('✅ Puerto 5000 liberado exitosamente');
        }
    
        // Cerrar la aplicación si no es macOS
        
    });*/
    if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
    console.log('Aplicación cerrada completamente.');
});