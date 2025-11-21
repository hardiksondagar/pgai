const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const net = require('net');

let mainWindow;
let flaskProcess;
let flaskPort = 5000;

// Find available port using net module
function isPortOpen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      resolve(false); // Port is in use
    });
    server.once('listening', () => {
      server.close();
      resolve(true); // Port is free
    });
    server.listen(port);
  });
}

async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortOpen(port)) {
      return port;
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

  // Use bundled venv in production, system Python in dev
  let pythonPath;
  if (isDev) {
    // Development: use system Python or venv if it exists
    const devVenvPath = isWindows
      ? path.join(backendDir, 'venv', 'Scripts', 'python.exe')
      : path.join(backendDir, 'venv', 'bin', 'python');

    pythonPath = require('fs').existsSync(devVenvPath)
      ? devVenvPath
      : (isWindows ? 'python' : 'python3');
  } else {
    // Production: use bundled venv
    pythonPath = isWindows
      ? path.join(backendDir, 'venv', 'Scripts', 'python.exe')
      : path.join(backendDir, 'venv', 'bin', 'python');

    // Check if bundled venv exists
    const fs = require('fs');
    if (!fs.existsSync(pythonPath)) {
      throw new Error(`Bundled Python virtual environment not found at: ${pythonPath}\n\nPlease rebuild the app with: npm run build:mac`);
    }
    console.log('✅ Using bundled Python environment');
  }

  const appPath = path.join(backendDir, 'app.py');

  flaskProcess = spawn(pythonPath, [appPath], {
    env: { ...process.env, FLASK_PORT: flaskPort.toString() },
    cwd: backendDir,
  });

  flaskProcess.stdout.on('data', (data) => {
    if (isDev) console.log(`Flask: ${data}`);
  });

  flaskProcess.stderr.on('data', (data) => {
    console.error(`Flask Error: ${data}`);
  });

  flaskProcess.on('error', (error) => {
    console.error('Failed to start Flask:', error);
  });

  // Wait for Flask to be ready
  const maxAttempts = 60;
  let flaskExited = false;

  flaskProcess.on('exit', (code) => {
    console.error(`Flask process exited with code ${code}`);
    flaskExited = true;
  });

  for (let i = 0; i < maxAttempts; i++) {
    if (flaskExited) {
      throw new Error('Flask process exited unexpectedly. Check debug log for details.');
    }
    try {
      // Use 127.0.0.1 instead of localhost to avoid IPv6 issues
      await axios.get(`http://127.0.0.1:${flaskPort}/api/health`, { timeout: 1000 });
      console.log('Flask server is ready on port', flaskPort);
      return true;
    } catch (error) {
      if (isDev && i % 5 === 0) {
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
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    trafficLightPosition: { x: 15, y: 20 },
    show: false,
  });

  // Load the app
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    console.log('Loading development URL: http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, dist is packaged inside app.asar
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load file:', err);
    });
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Log any load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // Pass Flask port to renderer
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
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
    await startFlaskServer();
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    const { dialog } = require('electron');

    let errorMessage = `Failed to start Flask backend:\n\n${error.message}\n\n`;
    errorMessage += 'This usually means:\n';
    errorMessage += '1. Python 3 is not installed\n';
    errorMessage += '2. Python dependencies are missing\n\n';
    errorMessage += 'To fix:\n';
    errorMessage += '• Install Python 3: https://www.python.org/\n';
    errorMessage += '• Install dependencies manually:\n';
    errorMessage += '  pip3 install flask flask-cors psycopg2-binary openai cryptography python-dotenv sqlparse openpyxl';

    dialog.showErrorBox('PGAI Startup Error', errorMessage);
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

