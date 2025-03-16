const { app, BrowserWindow, screen, globalShortcut } = require('electron');
const { exec, spawn } = require('child_process');
const path = require('path');

let mainWindow;
let flaskProcess;

// Función para ajustar la ventana al área de trabajo (pantalla completa con barra de tareas visible)
function adjustWindowToWorkArea() {
    const display = screen.getPrimaryDisplay();
    const { workArea, bounds } = display;

    // Ajustar la ventana al área de trabajo (excluye la barra de tareas)
    mainWindow.setBounds({
        x: workArea.x,
        y: workArea.y,
        width: workArea.width,
        height: workArea.height
    });

    // Asegurarse de que no esté en modo pantalla completa real
    mainWindow.setFullScreen(false);

    console.log(`Ventana ajustada al área de trabajo: ${workArea.width}x${workArea.height} en (${workArea.x}, ${workArea.y})`);
}

// Función para alternar entre modo "pantalla completa con barra de tareas" y pantalla completa real
function toggleFullScreenMode() {
    if (mainWindow.isFullScreen()) {
        // Salir de pantalla completa y ajustar al área de trabajo
        adjustWindowToWorkArea();
    } else {
        // Entrar en pantalla completa real (oculta la barra de tareas)
        mainWindow.setFullScreen(true);
    }
}

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
        console.log(`El proceso Flask terminó con código ${code}`);
    });

    // Crear la ventana de Electron para el frontend
    mainWindow = new BrowserWindow({
        width: 800,  // Tamaño inicial (se ajustará después)
        height: 600,
        webPreferences: {
            nodeIntegration: false, // Deshabilitado por seguridad
            contextIsolation: true, // Habilitado para aislar el renderer
            preload: path.join(__dirname, 'preload.js') // Script de precarga
        },
        frame: true, // Mantener el marco de la ventana
        autoHideMenuBar: true // Ocultar la barra de menú por defecto
    });

    // Ajustar la ventana al área de trabajo al iniciar
    adjustWindowToWorkArea();

    // Permitir redimensionamiento (opcional, puedes cambiar a false si no lo deseas)
    mainWindow.setResizable(true);

    // Evitar que maximizar cubra la barra de tareas
    mainWindow.on('maximize', () => {
        adjustWindowToWorkArea();
    });

    // Ajustar la ventana si el área de trabajo cambia (por ejemplo, si la barra de tareas se oculta/muestra)
    screen.on('display-metrics-changed', () => {
        if (!mainWindow.isFullScreen()) {
            adjustWindowToWorkArea();
        }
    });

    // Registrar atajo para alternar modos (F11)
    globalShortcut.register('F11', toggleFullScreenMode);

    // Cargar el archivo HTML
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

        setTimeout(() => {
            if (!flaskProcess.killed) {
                console.log("⚠️ Flask no cerró, forzando terminación...");
                flaskProcess.kill('SIGKILL');
            }
        }, 1000);
    }

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
    // Limpiar atajos de teclado al cerrar
    globalShortcut.unregisterAll();
    console.log('🛑 Aplicación cerrada completamente.');
});