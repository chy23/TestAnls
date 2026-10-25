# 本機共享模型庫與推論管理系統（離線 GGUF 模組）

這是一套**完全模組化、解耦（Decoupled）**的「本機共享模型庫與推論管理系統」。
在任何新的 Electron + React 桌面專案中，只要放入以下檔案，就能直接共用同一套 `~/Models` 目錄、動態掃描 Hugging Face GGUF 模型，並具備硬體加速推論與完整的風險指引。

---

### 目錄結構與對應位置

```text
your-new-project/
├── electron/
│   ├── main.cjs               # 主進程（建立視窗並註冊 modelManager）
│   ├── modelManager.cjs       # 模組一：模型管理與推論核心 (node-llama-cpp + ~/Models)
│   └── preload.cjs            # 模組二：IPC 安全通道 (electronAPI)
├── src/
│   └── components/
│       ├── ModelHubManager.jsx # 模組三：即插即用 React 介面 + 下載指引 Modal
│       └── ModelHubManager.css # 模組四：獨立樣式表
└── electron-builder.json      # 模組五：輕量打包配置 (Mac arm64 / dmg / zip)
```

---

### 主流推薦模型
1. **Meta Llama 3.2 (3B) Instruct** (預設推薦，約 2.0GB，秒級響應，8GB 記憶體即可流暢運作)
2. **Google Gemma 4 (E4B) Instruct** (進階推薦，約 5.0GB，128K 超長脈絡，靈動文采)
3. **社群自訂微調**（放入 `~/Models` 下的任何 `.gguf`，軟體啟動即時自動辨識）

---

### 打包與 iCloud 同步指令

```bash
# 1. 執行 Mac 輕量化打包 (dmg & zip)
npm run electron:build:mac

# 2. 自動發布至 iCloud Drive (務必加 -X 避免屬性權限問題)
cp -X release/*.dmg "/Users/chiahua/Library/Mobile Documents/com~apple~CloudDocs/【Home & School】 Cloud/Antigrivity Apps/"
cp -X release/*-mac.zip "/Users/chiahua/Library/Mobile Documents/com~apple~CloudDocs/【Home & School】 Cloud/Antigrivity Apps/"
```
