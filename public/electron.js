const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Tells Python where to save your data files
const getPythonEnv = () => ({
  ...process.env,
  FINANCES_DATA_DIR: app.getPath('userData'),
});

// Finds engine.py in both dev and the installed app
const getScriptPath = () =>
  app.isPackaged
    ? path.join(process.resourcesPath, 'backend', 'engine.py')
    : path.join(__dirname, '../backend/engine.py');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      // Points to preload.js in the same folder (public/)
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
// Load React app
    win.loadURL(
  app.isPackaged
    ? `file://${path.join(__dirname, '../build/index.html')}`
    : 'http://localhost:3000'
);  
}


ipcMain.handle('confirm', async (event, message) => {
  const result = await dialog.showMessageBox({
    type: 'none',                 // removes the blue "i" icon
    title: 'Delete snapshot',     // instead of "finance-app"
    buttons: ['Delete', 'Cancel'],
    defaultId: 1,                 // Cancel is the safe default
    cancelId: 1,
    noLink: true,                 // normal buttons instead of the big "→ Delete" link
    message: 'Delete this snapshot?',
    detail: message,
  });
  return result.response === 0;
});

// File selection dialog
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }]
  });
  return result.filePaths[0];
});


// --- THE PYTHON BRIDGE ---
ipcMain.handle('add-snapshot', async (event, data) => {
  return new Promise((resolve, reject) => {
    // We use 'py' to trigger engine.py inside the backend folder
    // Note: path.join helps find the file correctly across different OS
    const scriptPath = getScriptPath();
    const pythonProcess = spawn('py', [scriptPath], { env: getPythonEnv() });

    // Send the React form data to Python
    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();

    let resultData = "";

    pythonProcess.stdout.on('data', (data) => {
      resultData += data.toString();
    });

    pythonProcess.stdout.on('end', () => {
      try {
        resolve(JSON.parse(resultData));
      } catch (e) {
        reject("Failed to parse Python output");
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Error: ${data}`);
    });
  });
});
// -------------------------

// --- NEW: FETCH SNAPSHOTS FROM PYTHON ---
ipcMain.handle('get-snapshots', async (event) => {
  return new Promise((resolve, reject) => {
    const scriptPath = getScriptPath();
    
    // We pass 'read' as an argument so Python runs the get_history function
    const pythonProcess = spawn('py', [scriptPath, 'read'], { env: getPythonEnv() });

    let resultData = "";

    pythonProcess.stdout.on('data', (data) => {
      resultData += data.toString();
    });

    pythonProcess.stdout.on('end', () => {
      try {
        resolve(JSON.parse(resultData));
      } catch (e) {
        console.error("Parse Error:", resultData);
        reject("Failed to parse Python history output");
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Read Error: ${data}`);
    });
  });
});

// --- NEW: DELETE SNAPSHOT VIA PYTHON ---
ipcMain.handle('delete-snapshot', async (event, date) => {
  return new Promise((resolve, reject) => {
    const scriptPath = getScriptPath();
    
    // We pass 'delete' as the command and the specific 'date' as the second argument
    const pythonProcess = spawn('py', [scriptPath, 'delete', date], { env: getPythonEnv() });

    let resultData = "";

    pythonProcess.stdout.on('data', (data) => {
      resultData += data.toString();
    });

    pythonProcess.stdout.on('end', () => {
      try {
        resolve(JSON.parse(resultData));
      } catch (e) {
        reject("Failed to parse Python delete output");
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Delete Error: ${data}`);
    });
  });
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Notes IPC handlers Start
ipcMain.handle('read-notes', async () => {
  return new Promise((resolve, reject) => {
    const scriptPath = getScriptPath();
    const pythonProcess = spawn('py', [scriptPath, 'read_notes'], { env: getPythonEnv() });

    let resultData = "";

    pythonProcess.stdout.on('data', (data) => {
      resultData += data.toString();
    });

    pythonProcess.stdout.on('end', () => {
      try {
        resolve(JSON.parse(resultData));
      } catch (e) {
        reject("Failed to parse notes output");
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Read Notes Error: ${data}`);
    });
  });
});

ipcMain.handle('save-notes', async (event, content) => {
  return new Promise((resolve, reject) => {
    const scriptPath = getScriptPath();
    const pythonProcess = spawn('py', [scriptPath, 'save_notes', content], { env: getPythonEnv() });

    let resultData = "";

    pythonProcess.stdout.on('data', (data) => {
      resultData += data.toString();
    });

    pythonProcess.stdout.on('end', () => {
      try {
        resolve(JSON.parse(resultData));
      } catch (e) {
        reject("Failed to parse save notes output");
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Save Notes Error: ${data}`);
    });
  });
});
// Notes IPC handlers END

