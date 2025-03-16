const { app, BrowserWindow } = require('electron');
const { exec, spawn } = require('child_process');
const path = require('path');

let mainWindow;
let flaskProcess;

app.whenReady().then(() => {
    
    // 📌 Ruta absoluta al backend
    const backendPath = path.join(__dirname, 'backend');

    // 🔹 Iniciar el servidor Flask como backend
    flaskProcess = spawn('python', ['wsgi.py'], {
        cwd: backendPath,
        shell: true
    });

    flaskProcess.stdout.on('data', (data) => {
        console.log(`Flask: ${data}`);
    });

    flaskProcess.stderr.on('data', (data) => {
        console.error(`Error de Flask: ${data}`);
    });

    flaskProcess.on('close', (code) => {
        console.log(`El proceso Flask termino con codigo ${code}`);
    });
    

    // Crear la ventana de Electron para el frontend
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // Nota: Habilita esto por seguridad en producción
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'inicio.html'))
        .then(() => {
            console.log('✅ Frontend cargado desde inicio.html');
        })
        .catch((err) => {
            console.error('❌ Error al cargar inicio.html:', err);
        });
});

// 🔥 Función para cerrar procesos en el puerto 5000
function killPortProcesses(callback) {
    if (process.platform === 'win32') {
        // 🔹 Cerrar cualquier proceso que use el puerto 5000
        exec('netstat -ano | findstr :5000', (err, stdout) => {
            if (err) {
                console.error(`❌ Error al buscar procesos en puerto 5000: ${err.message}`);
                callback(err);
                return;
            }

            const lines = stdout.split('\n');
            const pids = new Set();

            lines.forEach((line) => {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];

                if (!isNaN(pid)) {
                    pids.add(pid);
                }
            });

            if (pids.size === 0) {
                console.log(`✅ No se encontraron procesos en el puerto 5000`);
                callback(null);
                return;
            }

            console.log(`🔴 Matando procesos en el puerto 5000...`);
            let remaining = pids.size;
            pids.forEach((pid) => {
                exec(`taskkill /PID ${pid} /F`, (killErr) => {
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

        // 🔹 Alternativamente, matar directamente todos los procesos Python (si Flask no se cerró)
        setTimeout(() => {
            exec('taskkill /IM python.exe /F', (killErr) => {
                if (killErr) {
                    console.error(`⚠️ No se pudieron cerrar todos los procesos Python.`);
                } else {
                    console.log(`✅ Todos los procesos Python cerrados correctamente.`);
                }
            });
        }, 2000);

    } else {
        // 🔹 En sistemas Unix (Linux/Mac)
        exec('lsof -ti :5000 | xargs kill -9', (err) => {
            if (err) {
                console.error(`❌ Error al cerrar procesos en puerto 5000: ${err.message}`);
            } else {
                console.log(`✅ Todos los procesos en puerto 5000 fueron cerrados.`);
            }
            callback(null);
        });
    }
}

// 📌 Al cerrar la aplicación, matamos Flask y los procesos en el puerto 5000
app.on('window-all-closed', () => {
    if (flaskProcess && !flaskProcess.killed) {
        console.log("🔴 Intentando cerrar Flask de forma ordenada...");
        flaskProcess.kill('SIGTERM');

        // 🔹 Esperar 1 segundo para ver si Flask cierra correctamente
        setTimeout(() => {
            if (!flaskProcess.killed) {
                console.log("⚠️ Flask no cerro, forzando terminación...");
                flaskProcess.kill('SIGKILL');
            }
        }, 1000);
    }

    // 🔥 Matar procesos en el puerto 5000
    console.log("🔍 Buscando y cerrando procesos en el puerto 5000...");
    killPortProcesses((err) => {
        if (err) {
            console.error('❌ Error al liberar el puerto 5000:', err);
        } else {
            console.log('✅ Puerto 5000 liberado exitosamente');
        }

        if (process.platform !== 'darwin') app.quit();
    });
});

app.on('quit', () => {
    console.log('🛑 Aplicacion cerrada completamente.');
});
