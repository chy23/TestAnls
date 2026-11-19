const { app, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { exec } = require('child_process');

// 6 大核心指定模型定義（同步 Antigravity Model Hub 官方標準）
const CORE_MODELS = [
  {
    id: 'gemma-4-E2B-it-Q4_K_M.gguf',
    canonicalId: 'gemma-4-e2b',
    name: 'Gemma 4 (E2B) Instruct',
    provider: 'Google DeepMind',
    size: '1.6 GB',
    minRamGB: 8,
    recRamGB: '8GB+ RAM',
    tag: '⚡ 輕量極速',
    category: '極致輕量 · 邊緣首選',
    isDefault: true,
    summary: 'Google 旗艦第 4 代超輕量架構，體積極小秒級加載，日常任務與試卷分類極敏捷。',
    pros: '【優點】體積僅 1.6GB 下載秒就緒、推論速度極快、耗電低發熱極少，8GB 記憶體 Mac 即可飛速流暢運行。',
    cons: '【限制】參數量精簡（2B），面對深奧多步邏輯推理、超長哲理創作之論述深度相對有限。',
    downloadUrl: 'https://huggingface.co/bartowski/google_gemma-4-2B-it-GGUF/resolve/main/google_gemma-4-2B-it-Q4_K_M.gguf?download=true',
    hfPageUrl: 'https://huggingface.co/models?search=gemma-4-2b+gguf'
  },
  {
    id: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    canonicalId: 'llama-3.2-3b',
    name: 'Llama 3.2 (3B) Instruct',
    provider: 'Meta AI',
    size: '2.0 GB',
    minRamGB: 8,
    recRamGB: '8GB+ RAM',
    tag: '⭐️ 格式穩定',
    category: '全能輕量 · 指令首選',
    isDefault: false,
    summary: 'Meta 官方輕量模型，JSON 輸出格式極為穩定，指令遵循度高，適合標準化題型歸納。',
    pros: '【優點】指令遵循度極高、輸出格式規範嚴謹、2.0GB 輕盈體積，Apple Silicon GPU 加速可達 50+ tokens/s。',
    cons: '【限制】3B 規模在超長篇學術知識深度與複雜生僻領域的論述豐富度略低於大型模型。',
    downloadUrl: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf?download=true',
    hfPageUrl: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF'
  },
  {
    id: 'gemma-4-26B-A4B-it-Q4_K_M.gguf',
    canonicalId: 'gemma-4-26b-a4b',
    name: 'Gemma 4 (26B A4B) MoE',
    provider: 'Google DeepMind',
    size: '15.5 GB',
    minRamGB: 16,
    recRamGB: '16GB~24GB+ RAM',
    tag: '🚀 MoE 旗艦',
    category: '混合專家 · 高性價比',
    isDefault: false,
    summary: '總參數量 26B 但推論僅激活 4B，兼具 26B 廣博知識庫與 4B 的飛快速度，128K 超長脈絡。',
    pros: '【優點】兼具 26B 廣博知識庫與 4B 等級的高速生成效率、支援 128K 超長上下文，極高性價比。',
    cons: '【限制】完整模型仍需常駐記憶體，檔案約 15.5GB，建議 16GB~24GB 以上 RAM 的 Mac 運行。',
    downloadUrl: 'https://huggingface.co/bartowski/google_gemma-4-26B-A4B-it-GGUF/resolve/main/google_gemma-4-26B-A4B-it-Q4_K_M.gguf?download=true',
    hfPageUrl: 'https://huggingface.co/models?search=gemma-4-26b+gguf'
  },
  {
    id: 'Llama-3.2-11B-Vision-Instruct-Q4_K_M.gguf',
    canonicalId: 'llama-3.2-vision-11b',
    name: 'Llama 3.2 Vision (11B)',
    provider: 'Meta AI',
    size: '6.8 GB',
    minRamGB: 16,
    recRamGB: '16GB+ RAM',
    tag: '👁️ 多模態視覺',
    category: '多模態視覺 · 圖文理解',
    isDefault: false,
    summary: '具備視覺感知能力，可處理圖片辨識、圖表分析、OCR 文字提取與教材圖像問答。',
    pros: '【優點】支援視覺與文本雙模態、圖表與截圖分析力強，11B 規模在推論邏輯與辨識度取得優秀平衡。',
    cons: '【限制】純文字生成速度略慢於純文本 3B/8B，若需要視覺投影功能需額外掛載 mmproj。',
    downloadUrl: 'https://huggingface.co/bartowski/Llama-3.2-11B-Vision-Instruct-GGUF/resolve/main/Llama-3.2-11B-Vision-Instruct-Q4_K_M.gguf?download=true',
    hfPageUrl: 'https://huggingface.co/bartowski/Llama-3.2-11B-Vision-Instruct-GGUF'
  },
  {
    id: 'gemma-4-31B-Dense-it-Q4_K_M.gguf',
    canonicalId: 'gemma-4-31b-dense',
    name: 'Gemma 4 (31B Dense) Instruct',
    provider: 'Google DeepMind',
    size: '18.5 GB',
    minRamGB: 24,
    recRamGB: '24GB~32GB+ RAM',
    tag: '🧠 深度旗艦',
    category: '稠密旗艦 · 深度推理',
    isDefault: false,
    summary: '全參數激活稠密模型，邏輯推演極為嚴密，繁體中文文采細膩，複雜程式與教材編寫力強。',
    pros: '【優點】思維鏈條深厚、邏輯推理強悍、長文寫作與繁中語感極佳，適合高品質內容產出。',
    cons: '【限制】檔案近 19GB，需要較高記憶體頻寬，建議配備 24GB 或 32GB 以上記憶體。',
    downloadUrl: 'https://huggingface.co/bartowski/google_gemma-4-31B-it-GGUF/resolve/main/google_gemma-4-31B-it-Q4_K_M.gguf?download=true',
    hfPageUrl: 'https://huggingface.co/models?search=gemma-4-31b+gguf'
  },
  {
    id: 'Llama-4-Scout-109B-MoE-Q4_K_M.gguf',
    canonicalId: 'llama-4-scout-109b',
    name: 'Llama 4 Scout (109B) MoE',
    provider: 'Meta AI',
    size: '62.0 GB',
    minRamGB: 64,
    recRamGB: '64GB+ RAM',
    tag: '👑 頂級巨獸',
    category: '超巨型怪獸 · 極限專家',
    isDefault: false,
    summary: 'Meta 次世代 109B 頂尖架構（17B Active），極限跨領域專家理解與深度上下文感知。',
    pros: '【優點】世界一流的推理能力、多輪超長上下文對話極致精準、專家層級解題深度。',
    cons: '【限制】體積超過 60GB，僅限 64GB 以上之 Mac Studio 或 MacBook Pro Max 高配機型！',
    downloadUrl: 'https://huggingface.co/bartowski/Llama-4-Scout-109B-GGUF/resolve/main/Llama-4-Scout-109B-Q4_K_M.gguf?download=true',
    hfPageUrl: 'https://huggingface.co/models?search=llama-4-scout+gguf'
  }
];

class ModelManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.hubPort = 51123;
  }

  // 讀取全域設定檔（儲存於 ~/.antigravity-model-hub.json）
  getGlobalConfigPath() {
    return path.join(app.getPath('home'), '.antigravity-model-hub.json');
  }

  loadSettings() {
    try {
      const p = this.getGlobalConfigPath();
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    } catch (e) {}
    return {
      customModelDir: path.join(app.getPath('home'), 'Models'),
      lastModel: 'gemma-4-E2B-it-Q4_K_M.gguf'
    };
  }

  // 取得有效模型儲存目錄（優先使用 ~/.antigravity-model-hub.json，預設 ~/Models）
  getEffectiveModelDir() {
    const settings = this.loadSettings();
    const target = settings.customModelDir || path.join(app.getPath('home'), 'Models');
    if (!fs.existsSync(target)) {
      try { fs.mkdirSync(target, { recursive: true }); } catch (e) {}
    }
    return target;
  }

  // 取得所有候選搜尋目錄
  getModelDirs() {
    const dirs = [];
    const eff = this.getEffectiveModelDir();
    dirs.push(eff);
    dirs.push(path.join(app.getPath('home'), 'Models'));
    dirs.push(path.join(app.getPath('userData'), 'models'));
    dirs.push(path.join(__dirname, '../models'));
    if (process.resourcesPath) dirs.push(path.join(process.resourcesPath, 'models'));
    return Array.from(new Set(dirs.filter(Boolean)));
  }

  // 依檔名或別名搜尋本機實體檔案路徑
  resolveModelPath(fileNameOrId) {
    if (!fileNameOrId) return null;
    const cleanName = fileNameOrId.trim();
    const coreDef = CORE_MODELS.find(m => 
      m.id.toLowerCase() === cleanName.toLowerCase() || 
      m.canonicalId?.toLowerCase() === cleanName.toLowerCase()
    );
    const targetFile = coreDef ? coreDef.id : cleanName;

    for (const dir of this.getModelDirs()) {
      if (fs.existsSync(dir)) {
        const full = path.join(dir, targetFile);
        if (fs.existsSync(full)) {
          try {
            const stat = fs.statSync(full);
            if (stat.size > 20 * 1024 * 1024) return full;
          } catch (e) {}
        }
      }
    }
    return null;
  }

  // 本地掃描模型目錄狀態（在 Hub 離線時亦可提供完整模型清單與自訂微調模型）
  getLocalModelsStatus() {
    const effectiveDir = this.getEffectiveModelDir();

    // 1. 檢查 6 大核心模型
    const coreList = CORE_MODELS.map(m => {
      const resolved = this.resolveModelPath(m.id);
      let realSize = 0;
      if (resolved) {
        try { realSize = fs.statSync(resolved).size; } catch (e) {}
      }
      const isAvailable = !!resolved && realSize > 50 * 1024 * 1024;
      return {
        ...m,
        isAvailable,
        path: resolved || path.join(effectiveDir, m.id),
        fileSizeMB: realSize > 0 ? (realSize / 1024 / 1024).toFixed(1) : 0
      };
    });

    // 2. 掃描目錄中的自訂 / Hugging Face 社群 GGUF 模型
    const coreIds = new Set(CORE_MODELS.map(m => m.id.toLowerCase()));
    const customModels = [];
    for (const dir of this.getModelDirs()) {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            if (file.endsWith('.gguf') && !coreIds.has(file.toLowerCase()) && !file.endsWith('.part')) {
              const fullPath = path.join(dir, file);
              try {
                const stat = fs.statSync(fullPath);
                if (stat.size > 20 * 1024 * 1024) {
                  customModels.push({
                    id: file,
                    canonicalId: file,
                    name: file.replace('.gguf', ''),
                    provider: 'Hugging Face / 社群微調',
                    size: (stat.size / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                    tag: '社群模型',
                    category: '社群自訂微調',
                    isCustom: true,
                    isAvailable: true,
                    path: fullPath,
                    fileSizeMB: (stat.size / 1024 / 1024).toFixed(1),
                    summary: '本機動態偵測到的自訂 GGUF 模型，隨放即用。'
                  });
                }
              } catch (e) {}
            }
          }
        } catch (e) {}
      }
    }

    return {
      hubOnline: false,
      effectiveModelDir: effectiveDir,
      coreModels: coreList,
      customModels
    };
  }

  // 嘗試向本機 Hub (http://127.0.0.1:51123/api/status) 發送請求
  checkHubStatus() {
    return new Promise((resolve) => {
      const req = http.get({
        hostname: '127.0.0.1',
        port: this.hubPort,
        path: '/api/status',
        timeout: 1500
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ online: true, data: parsed });
          } catch (e) {
            resolve({ online: false });
          }
        });
      });

      req.on('error', () => resolve({ online: false }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ online: false });
      });
    });
  }

  // 喚醒 Antigravity Model Hub 應用程式
  async launchHub() {
    try {
      await shell.openExternal('antigravity-hub://launch');
      return { success: true };
    } catch (e) {
      // Fallback: 透過 macOS open 指令
      return new Promise((resolve) => {
        exec('open -a "Antigravity Model Hub"', (err) => {
          if (!err) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: err.message });
          }
        });
      });
    }
  }

  // 註冊所有 IPC 通訊
  registerIpc() {
    // 取得模型狀態（優先詢問 Hub，若無則本地掃描）
    ipcMain.handle('get-models-status', async () => {
      const hubCheck = await this.checkHubStatus();
      if (hubCheck.online && hubCheck.data) {
        return {
          hubOnline: true,
          ...hubCheck.data,
          effectiveModelDir: hubCheck.data.effectiveModelDir || this.getEffectiveModelDir()
        };
      }
      return this.getLocalModelsStatus();
    });

    // 喚醒 Model Hub
    ipcMain.handle('launch-hub', async () => {
      return this.launchHub();
    });

    // 開啟 ~/Models 目錄於 Finder
    ipcMain.handle('open-model-dir', async () => {
      const dir = this.getEffectiveModelDir();
      try {
        await shell.openPath(dir);
        return { success: true, dir };
      } catch (err) {
        return { success: false, error: err.message };
      }
    });

    // 安全開啟外部網址
    ipcMain.handle('open-external', async (event, url) => {
      if (url && (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('antigravity-hub://'))) {
        await shell.openExternal(url);
        return { success: true };
      }
      return { success: false, error: '非法的外部連結' };
    });
  }
}

module.exports = { ModelManager, CORE_MODELS };
