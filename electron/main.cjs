const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { ModelManager } = require('./modelManager.cjs');

let mainWindow = null;
let modelManager = null;

// 註冊本機文件文字提取 IPC (支援 PDF, DOCX, DOC, TXT 等，0 外部相依性秒級提取)
ipcMain.handle('extract-file-text', async (event, { name, base64 }) => {
  if (!base64) return { success: false, text: '' };
  const buffer = Buffer.from(base64, 'base64');
  const ext = path.extname(name || '').toLowerCase();

  // 1. 純文字
  if (ext === '.txt' || ext === '.md' || ext === '.json' || ext === '.csv') {
    return { success: true, text: buffer.toString('utf-8') };
  }

  // 2. Word 檔案 (.docx, .doc, .rtf) - 使用 macOS 原生 textutil
  if (ext === '.docx' || ext === '.doc' || ext === '.rtf') {
    const tempFile = path.join(app.getPath('temp'), `testanls_docx_${Date.now()}${ext}`);
    try {
      fs.writeFileSync(tempFile, buffer);
      const text = execSync(`textutil -convert txt "${tempFile}" -stdout`, {
        maxBuffer: 15 * 1024 * 1024,
        encoding: 'utf8'
      }).trim();
      try { fs.unlinkSync(tempFile); } catch (e) {}
      return { success: true, text };
    } catch (err) {
      try { fs.unlinkSync(tempFile); } catch (e) {}
      return { success: false, error: err.message, text: '' };
    }
  }

  // 3. PDF 檔案 (.pdf) - 使用 macOS 原生 PDFKit
  if (ext === '.pdf') {
    const tempFile = path.join(app.getPath('temp'), `testanls_pdf_${Date.now()}.pdf`);
    try {
      fs.writeFileSync(tempFile, buffer);
      const script = `
        ObjC.import("PDFKit");
        ObjC.import("Foundation");
        var url = $.NSURL.fileURLWithPath("${tempFile}");
        var doc = $.PDFDocument.alloc.initWithURL(url);
        if (doc && doc.string) {
          doc.string.js;
        } else {
          "";
        }
      `;
      const text = execSync(`osascript -l JavaScript -e '${script}'`, {
        maxBuffer: 15 * 1024 * 1024,
        encoding: 'utf8'
      }).trim();
      try { fs.unlinkSync(tempFile); } catch (e) {}
      return { success: true, text };
    } catch (err) {
      try { fs.unlinkSync(tempFile); } catch (e) {}
      return { success: false, error: err.message, text: '' };
    }
  }

  return { success: false, text: '', error: '不支援的檔案格式' };
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'TestAnls - 雙向細目表智能分析系統',
    backgroundColor: '#f3f6fa',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  // 初始化本機模型管理模組
  modelManager = new ModelManager(mainWindow);
  modelManager.registerIpc();

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 點擊關閉按鈕（紅叉叉）時完全退出應用程式
  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 當所有視窗關閉時完全退出應用程式
app.on('window-all-closed', () => {
  app.quit();
});
