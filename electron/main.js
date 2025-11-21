const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

let mainWindow;
let flaskProcess;
let flaskPort = 5000;

// Find available port
async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + 10; port++) {
    try {
      await axios.get(`http://localhost:${port}/api/health`, { timeout: 100 });
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return port;
      }
    }
  }
  return startPort;
}

// Start Flask backend
async function startFlaskServer() {
  flaskPort = await findAvailablePort(5001);

  const isWindows = process.platform === 'win32';
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  // In production, backend is in app.asar.unpacked
  const backendDir = isDev
    ? path.join(__dirname, '..', 'backend')
    : path.join(process.resourcesPath, 'app.asar.unpacked', 'backend');

  console.log('Backend directory:', backendDir);
  console.log('Is packaged:', app.isPackaged);
  console.log('Resources path:', process.resourcesPath);

  // Try system Python (packaged apps should use system Python)
  const pythonPath = isWindows ? 'python' : 'python3';

  const appPath = path.join(backendDir, 'app.py');
  console.log('App path:', appPath);
  console.log('Python path:', pythonPath);

  // Check if dependencies are installed
  if (!isDev) {
    console.log('Production mode: Installing dependencies...');
    const installProcess = spawn(pythonPath, ['-m', 'pip', 'install', '-r', 'requirements.txt', '--user'], {
      cwd: backendDir,
    });

    await new Promise((resolve, reject) => {
      installProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Dependencies installed successfully');
          resolve();
        } else {
          console.log('Dependency installation finished with code:', code);
          resolve(); // Continue even if install fails (deps might already be installed)
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => resolve(), 30000);
    });
  }

  flaskProcess = spawn(pythonPath, [appPath], {
    env: { ...process.env, FLASK_PORT: flaskPort.toString() },
    cwd: backendDir,
  });

  flaskProcess.stdout.on('data', (data) => {
    console.log(`Flask: ${data}`);
  });

  flaskProcess.stderr.on('data', (data) => {
    console.error(`Flask Error: ${data}`);
  });

  flaskProcess.on('error', (error) => {
    console.error('Failed to start Flask:', error);
  });

  // Wait for Flask to be ready
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`http://localhost:${flaskPort}/api/health`, { timeout: 1000 });
      console.log('Flask server is ready on port', flaskPort);
      return true;
    } catch (error) {
      if (i % 5 === 0) {
        console.log(`Waiting for Flask... attempt ${i + 1}/${maxAttempts}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Flask server failed to start');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Pass Flask port to renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('flask-port', flaskPort);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New Connection', accelerator: 'CmdOrCtrl+N' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('ready', async () => {
  try {
    console.log('App starting...');
    await startFlaskServer();
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    const { dialog } = require('electron');
    dialog.showErrorBox('Startup Error',
      `Failed to start Flask backend:\n\n${error.message}\n\nPlease ensure Python 3 is installed and available in your PATH.`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (flaskProcess) {
    flaskProcess.kill();
  }
});

