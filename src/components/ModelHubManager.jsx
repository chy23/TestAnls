import React, { useState, useEffect } from 'react';
import { 
  Server, Cpu, RefreshCw, AlertCircle, CheckCircle2, 
  ExternalLink, Sparkles, Download, Layers, ShieldCheck,
  Folder, ArrowUpRight, HardDrive, Info
} from 'lucide-react';
import './ModelHubManager.css';

const HUB_BASE_URL = 'http://127.0.0.1:51123';

// 6 大核心指定模型定義（同步 Antigravity Model Hub 官方標準）
const DEFAULT_CORE_MODELS = [
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
    pros: '體積僅 1.6GB 下載秒就緒、推論速度極快、8GB 記憶體 Mac 即可飛速流暢運行。',
    cons: '參數量精簡（2B），面對深奧多步邏輯推理、超長哲理創作之論述深度相對有限。',
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
    pros: '指令遵循度極高、輸出格式規範嚴謹、2.0GB 輕盈體積，Apple Silicon GPU 加速可達 50+ tokens/s。',
    cons: '3B 規模在超長篇學術知識深度與複雜生僻領域的論述豐富度略低於大型模型。',
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
    pros: '兼具 26B 廣博知識庫與 4B 等級的高速生成效率、支援 128K 超長上下文，極高性價比。',
    cons: '完整模型仍需常駐記憶體，檔案約 15.5GB，建議 16GB~24GB 以上 RAM 的 Mac 運行。',
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
    pros: '支援視覺與文本雙模態、圖表與截圖分析力強，11B 規模在推論邏輯與辨識度取得優秀平衡。',
    cons: '純文字生成速度略慢於純文本 3B/8B，若需要視覺投影功能需額外掛載 mmproj。',
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
    pros: '思維鏈條深厚、邏輯推理強悍、長文寫作與繁中語感極佳，適合高品質內容產出。',
    cons: '檔案近 19GB，需要較高記憶體頻寬，建議配備 24GB 或 32GB 以上記憶體。',
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
    pros: '世界一流的推理能力、多輪超長上下文對話極致精準、專家層級解題深度。',
    cons: '體積超過 60GB，僅限 64GB 以上之 Mac Studio 或 MacBook Pro Max 高配機型！',
    downloadUrl: 'https://huggingface.co/bartowski/Llama-4-Scout-109B-GGUF/resolve/main/Llama-4-Scout-109B-Q4_K_M.gguf?download=true',
    hfPageUrl: 'https://huggingface.co/models?search=llama-4-scout+gguf'
  }
];

export default function ModelHubManager({ selectedModel, onSelectModel, onModelReady }) {
  const [hubOnline, setHubOnline] = useState(null); // null (checking) | true | false
  const [coreModels, setCoreModels] = useState(DEFAULT_CORE_MODELS);
  const [customModels, setCustomModels] = useState([]);
  const [currentLoadedModel, setCurrentLoadedModel] = useState(null);
  const [effectiveModelDir, setEffectiveModelDir] = useState('~/Models');
  const [isChecking, setIsChecking] = useState(false);
  const [modelState, setModelState] = useState(null); // 'checking' | 'ready' | 'not_downloaded' | 'error'
  const [modelMessage, setModelMessage] = useState('');

  const currentModelId = selectedModel || DEFAULT_CORE_MODELS[0].id;

  // 取得當前選取之模型資訊（核心或社群自訂）
  const allModels = [...coreModels, ...customModels];
  const activeModelInfo = allModels.find(m => m.id === currentModelId) || 
    DEFAULT_CORE_MODELS.find(m => m.id === currentModelId) || 
    DEFAULT_CORE_MODELS[0];

  // 1. 檢查 Hub 服務狀態與動態模型清單
  const refreshStatus = async () => {
    setIsChecking(true);
    try {
      if (window.electronAPI?.getModelsStatus) {
        const res = await window.electronAPI.getModelsStatus();
        setHubOnline(!!res.hubOnline);
        if (res.coreModels && res.coreModels.length > 0) {
          setCoreModels(res.coreModels);
        }
        setCustomModels(res.customModels || []);
        setCurrentLoadedModel(res.currentLoadedModel || null);
        if (res.effectiveModelDir) setEffectiveModelDir(res.effectiveModelDir);

        if (res.hubOnline) {
          await ensureModel(currentModelId);
        } else {
          // Hub 離線，根據本地檔案判定
          const target = (res.coreModels || DEFAULT_CORE_MODELS).find(m => m.id === currentModelId);
          if (target && target.isAvailable) {
            setModelState('ready_offline');
            setModelMessage(`模型 [${currentModelId}] 本地檔案就緒，待 Model Hub 啟動即可推論。`);
          } else {
            setModelState('not_downloaded');
            setModelMessage(`模型 [${currentModelId}] 尚未下載至 ~/Models。`);
          }
        }
      } else {
        // 瀏覽器純 HTTP 模式
        const res = await fetch(`${HUB_BASE_URL}/api/status`, {
          method: 'GET',
          signal: AbortSignal.timeout(2500)
        });
        if (res.ok) {
          const data = await res.json();
          setHubOnline(true);
          if (data.coreModels) setCoreModels(data.coreModels);
          if (data.customModels) setCustomModels(data.customModels);
          if (data.currentLoadedModel) setCurrentLoadedModel(data.currentLoadedModel);
          if (data.effectiveModelDir) setEffectiveModelDir(data.effectiveModelDir);
          await ensureModel(currentModelId);
        } else {
          setHubOnline(false);
          setModelState('error');
          if (onModelReady) onModelReady({ ready: false });
        }
      }
    } catch (e) {
      setHubOnline(false);
      setModelState('offline');
      if (onModelReady) onModelReady({ ready: false });
    } finally {
      setIsChecking(false);
    }
  };

  // 2. 向 Hub 確認指定模型載入狀態
  const ensureModel = async (modelId) => {
    setModelState('checking');
    try {
      const res = await fetch(`${HUB_BASE_URL}/api/ensure-model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, autoLoad: true })
      });
      const data = await res.json();

      if (data.exists === false) {
        setModelState('not_downloaded');
        setModelMessage(data.message || `模型 [${modelId}] 尚未下載。可直接開啟 Model Hub 自動下載或前往 Hugging Face 下載。`);
        if (onModelReady) onModelReady({ ready: false, modelId });
      } else if (data.ready) {
        setModelState('ready');
        setCurrentLoadedModel(modelId);
        setModelMessage(`模型 [${modelId}] 已於本機 GPU 載入就緒！`);
        if (onModelReady) onModelReady({ ready: true, modelId });
      } else {
        setModelState('error');
        setModelMessage(data.error || '模型載入失敗，請至 Model Hub 檢查記憶體');
        if (onModelReady) onModelReady({ ready: false, modelId });
      }
    } catch (err) {
      // 若連線失敗但檔案已存在本地
      const isLocalAvail = activeModelInfo?.isAvailable;
      if (isLocalAvail) {
        setModelState('ready_offline');
        setModelMessage(`模型檔案已存在本機，但 Model Hub 尚未連線。`);
      } else {
        setModelState('not_downloaded');
        setModelMessage(`模型 [${modelId}] 尚未下載。`);
      }
      if (onModelReady) onModelReady({ ready: false, modelId });
    }
  };

  // 3. 喚醒或開啟 Model Hub
  const handleLaunchHub = async () => {
    if (window.electronAPI?.launchHub) {
      await window.electronAPI.launchHub();
    } else {
      window.open('antigravity-hub://launch', '_self');
    }
    setTimeout(refreshStatus, 3000);
  };

  // 4. 開啟 ~/Models 資料夾
  const handleOpenDir = async () => {
    if (window.electronAPI?.openModelDir) {
      await window.electronAPI.openModelDir();
    }
  };

  // 5. 開啟外部網址
  const handleOpenExternal = async (url) => {
    if (!url) return;
    if (window.electronAPI?.openExternal) {
      await window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    refreshStatus();
  }, [currentModelId]);

  return (
    <div className="hub-connector-box app-no-drag">
      {/* 伺服器狀態條 */}
      <div className="hub-status-header">
        <div className="flex items-center gap-2">
          <Server size={15} className={hubOnline ? 'text-emerald-500' : 'text-slate-400'} />
          <span className="text-xs font-bold text-slate-700">Antigravity Model Hub</span>
          <span className={`status-pill ${hubOnline ? 'online' : 'offline'}`}>
            {hubOnline ? '🟢 已連線 (127.0.0.1:51123)' : '⚪ 未連線 (離線檢視本機目錄)'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            type="button" 
            onClick={handleOpenDir}
            className="hub-icon-btn" 
            title={`開啟共享模型目錄 (${effectiveModelDir})`}
          >
            <Folder size={13} />
          </button>
          <button 
            type="button" 
            onClick={refreshStatus} 
            disabled={isChecking}
            className="hub-icon-btn" 
            title="重新整理連線與模型狀態"
          >
            <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 若未連線提示開啟 Hub */}
      {hubOnline === false && (
        <div className="hub-warn-card mb-3">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-amber-900 mb-1">本機模型中樞尚未啟動</p>
            <p className="text-amber-800 leading-relaxed mb-2">
              本軟體連線至本機「Antigravity Model Hub」進行零延遲 GPU 離線推論。您仍可在此檢視或選擇本機共享模型庫，請點擊下方按鈕啟動中樞：
            </p>
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={handleLaunchHub} 
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-sm text-xs"
              >
                <ExternalLink size={12} /> 開啟 / 喚醒 Model Hub
              </button>
              <button 
                type="button" 
                onClick={handleOpenDir} 
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-amber-300 text-amber-900 rounded-lg font-medium flex items-center gap-1 text-xs transition-colors"
              >
                <Folder size={12} /> 打開 ~/Models 目錄
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 模型下拉選單（包含 6 大核心模型與動態掃描的社群微調模型） */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-0.5 flex items-center gap-1.5">
            <HardDrive size={12} className="text-indigo-500" />
            選擇本機推論模型
          </label>
          <span className="text-[10px] text-slate-400 font-mono">
            {allModels.length} 款模型支援
          </span>
        </div>

        <div className="relative">
          <select
            value={currentModelId}
            onChange={(e) => onSelectModel && onSelectModel(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none shadow-sm"
          >
            <optgroup label="── 官方推薦 6 大核心模型 ──">
              {coreModels.map(m => (
                <option key={m.id} value={m.id}>
                  {m.isAvailable ? '✅ [已安裝] ' : '📥 [未下載] '}
                  {m.name} ({m.size} · {m.recRamGB})
                </option>
              ))}
            </optgroup>

            {customModels.length > 0 && (
              <optgroup label="── 本機 ~/Models 社群微調模型 (動態偵測) ──">
                {customModels.map(m => (
                  <option key={m.id} value={m.id}>
                    ✨ [社群] {m.name} ({m.size})
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs font-bold">
            ▼
          </div>
        </div>

        {/* 選中模型的詳細資訊卡 */}
        {activeModelInfo && (
          <div className="model-detail-card">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-800">{activeModelInfo.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {activeModelInfo.tag || activeModelInfo.category}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>開發者: {activeModelInfo.provider}</span>
                  <span>•</span>
                  <span>大小: {activeModelInfo.size}</span>
                  <span>•</span>
                  <span className="font-medium text-slate-600">
                    門檻: {activeModelInfo.recRamGB || (activeModelInfo.minRamGB ? `${activeModelInfo.minRamGB}GB RAM` : (activeModelInfo.size ? `建議約 ${Math.ceil(parseFloat(activeModelInfo.size) * 1.5) || 8}GB+ RAM` : '8GB+ RAM'))}
                  </span>
                </div>
              </div>

              {activeModelInfo.isAvailable ? (
                <span className="shrink-0 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-600" /> 已就緒
                </span>
              ) : (
                <span className="shrink-0 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Download size={12} className="text-amber-600" /> 未下載
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed mb-2 bg-white/70 p-2 rounded-lg border border-slate-100">
              {activeModelInfo.summary || activeModelInfo.desc}
            </p>

            {/* 模型已下載：載入狀態或準備分析 */}
            {activeModelInfo.isAvailable ? (
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs">
                  {currentLoadedModel === activeModelInfo.id ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                      <Sparkles size={13} className="text-emerald-500 animate-pulse" />
                      已載入 GPU，可秒級分析試卷
                    </span>
                  ) : hubOnline ? (
                    <span className="text-slate-600 text-[11px]">
                      檔案位於 {activeModelInfo.path ? `.../${activeModelInfo.id}` : '~/Models'}，開始分析時將自動加載
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[11px]">
                      本地檔案就緒，啟動 Model Hub 即可啟用
                    </span>
                  )}
                </div>

                {hubOnline && currentLoadedModel !== activeModelInfo.id && (
                  <button
                    type="button"
                    onClick={() => ensureModel(activeModelInfo.id)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                  >
                    <Cpu size={12} /> 預先載入
                  </button>
                )}
              </div>
            ) : (
              /* 模型未下載：引導按鈕群 */
              <div className="pt-2 border-t border-amber-100/80">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
                    <AlertCircle size={12} className="text-amber-600" />
                    需下載本模型至本機 <b>~/Models</b> 才能離線推論
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLaunchHub}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <ExternalLink size={12} /> 開啟 Antigravity Model Hub 管理
                    </button>

                    {activeModelInfo.downloadUrl && (
                      <button
                        type="button"
                        onClick={() => handleOpenExternal(activeModelInfo.downloadUrl)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                      >
                        <Download size={12} className="text-slate-500" /> 直接下載
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 載入狀態指示條 */}
        {modelState === 'checking' && (
          <div className="hub-note-badge checking">
            <RefreshCw size={12} className="animate-spin text-indigo-600" />
            <span>正在向 Model Hub 確認 {currentModelId} 狀態...</span>
          </div>
        )}
      </div>
    </div>
  );
}
