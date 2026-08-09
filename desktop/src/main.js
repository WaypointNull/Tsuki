const path = require('path');
const { app, BrowserWindow, Tray, Menu, dialog, nativeImage } = require('electron');
const { setupAutoUpdate } = require('@waypointnull/auto-update');

const isPackaged = app.isPackaged;

const APP_ROOT = isPackaged ? path.join(process.resourcesPath, 'app.asar') : path.join(__dirname, '..', '..');

const USER_DATA_DIR = path.join(app.getPath('appData'), 'Tsuki');
app.setPath('userData', USER_DATA_DIR);

let mainWindow = null;
let tray = null;
let server = null;
let port = null;

function log(...args) {
  console.log('[tsuki]', ...args);
}

function pickFreePort() {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const probe = net.createServer();
    probe.on('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const p = probe.address().port;
      probe.close(() => resolve(p));
    });
  });
}

async function startBackend() {
  process.env.TSUKI_PORT = String(port);
  const { start } = require(path.join(APP_ROOT, 'server', 'server.js'));
  server = await start({ host: '127.0.0.1' });
  log(`backend listening on ${port}`);
}

async function waitForServer(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (res.ok) {
        return true;
      }
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

function showMainWindow() {
  if (!mainWindow) {
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.focus();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0b0a07',
    title: 'Tsuki · Tag Strength',
    icon: path.join(APP_ROOT, 'desktop', 'assets', 'tray.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log('window shown');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'tray.ico');
  tray = new Tray(nativeImage.createFromPath(iconPath));
  tray.setToolTip('Tsuki · Tag Strength');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Tsuki', click: showMainWindow },
      { type: 'separator' },
      { label: 'Quit Tsuki', click: () => app.quit() }
    ])
  );
  tray.on('click', showMainWindow);
  tray.on('double-click', showMainWindow);
}

async function bootstrap() {
  port = await pickFreePort();
  try {
    await startBackend();
  } catch (error) {
    log('backend failed to start:', error);
    dialog.showErrorBox('Tsuki could not start', String((error && error.message) || error));
    app.exit(1);
    return;
  }
  const ok = await waitForServer(30000);
  if (!ok) {
    log('backend never became ready');
    dialog.showErrorBox('Tsuki could not start', 'The local server did not become ready in time.');
    app.exit(1);
    return;
  }
  createWindow();
  createTray();
  setupAutoUpdate({ onError: (error) => log('auto-update:', (error && error.message) || error) });
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => showMainWindow());
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', () => {
    if (server) {
      try {
        server.close();
      } catch {}
    }
    if (tray) {
      tray.destroy();
    }
  });
  app.setAppUserModelId('com.tsuki.desktop');
  app
    .whenReady()
    .then(bootstrap)
    .catch((error) => {
      log('fatal:', error);
      dialog.showErrorBox('Tsuki failed to launch', String((error && error.message) || error));
      app.exit(1);
    });
}
