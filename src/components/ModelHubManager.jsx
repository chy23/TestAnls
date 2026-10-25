import React, { useState, useEffect } from 'react';
import { 
  Server, Cpu, RefreshCw, AlertCircle, CheckCircle2, 
  ExternalLink, Sparkles, Download, Layers, ShieldCheck 
} from 'lucide-react';
import './ModelHubManager.css';

const HUB_BASE_URL = 'http://127.0.0.1:51123';

const AVAILABLE_MODELS = [
  {
    id: 'gemma-4-E2B-it-Q4_K_M.gguf',
    name: 'Gemma 4 E2B (Google DeepMind)',
    size: '1.6 GB',
    tag: '極速首選 · 輕量敏捷',
    isDefault: true,
    desc: 'Google 最新輕量架構，1.6GB 秒級加載，日常任務與試卷分類極度靈敏流暢。'
  },
  {
    id: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    name: 'Llama 3.2 (3B) Instruct (Meta)',
    size: '2.0 GB',
    tag: '格式嚴謹 · 指令遵循度高',
    isDefault: false,
    desc: 'Meta 官方輕量模型，JSON 輸出格式極為穩定，指令遵循度高，適合標準化題型歸納。'
  }
];

export default function ModelHubManager({ selectedModel, onSelectModel, onModelReady }) {
  const [hubOnline, setHubOnline] = useState(null); // null (checking) | true | false
  const [modelState, setModelState] = useState(null); // 'checking' | 'ready' | 'not_downloaded' | 'error'
  const [modelMessage, setModelMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const currentModelId = selectedModel || AVAILABLE_MODELS[0].id;

  // 1. 檢查 Hub 服務狀態
  const checkHubStatus = async () => {
    setIsChecking(true);
    try {
      const res = await fetch(`${HUB_BASE_URL}/api/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        setHubOnline(true);
        await ensureModel(currentModelId);
      } else {
        setHubOnline(false);
        setModelState('error');
        if (onModelReady) onModelReady({ ready: false });
      }
    } catch (e) {
      setHubOnline(false);
      setModelState('error');
      if (onModelReady) onModelReady({ ready: false });
    } finally {
      setIsChecking(false);
    }
  };

  // 2. 向 Hub 確認指定模型
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
        setModelMessage(data.message || `模型 [${modelId}] 尚未下載。Model Hub 已自動彈出下載確認視窗，請於 Model Hub 中確認下載。`);
        if (onModelReady) onModelReady({ ready: false, modelId });
      } else if (data.ready) {
        setModelState('ready');
        setModelMessage(`模型 [${modelId}] 已於本機 GPU 載入就緒！`);
        if (onModelReady) onModelReady({ ready: true, modelId });
      } else {
        setModelState('error');
        setModelMessage(data.error || '模型載入失敗，請至 Model Hub 檢查');
        if (onModelReady) onModelReady({ ready: false, modelId });
      }
    } catch (err) {
      setModelState('error');
      setModelMessage('無法與 Model Hub 溝通：' + err.message);
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
    // 稍候自動重新檢查
    setTimeout(checkHubStatus, 2500);
  };

  useEffect(() => {
    checkHubStatus();
  }, [currentModelId]);

  return (
    <div className="hub-connector-box">
      {/* 伺服器狀態條 */}
      <div className="hub-status-header">
        <div className="flex items-center gap-2">
          <Server size={15} className={hubOnline ? 'text-emerald-500' : 'text-slate-400'} />
          <span className="text-xs font-bold text-slate-700">Antigravity Model Hub</span>
          <span className={`status-pill ${hubOnline ? 'online' : 'offline'}`}>
            {hubOnline ? '🟢 已連線 (127.0.0.1:51123)' : '⚪ 未連線'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            type="button" 
            onClick={checkHubStatus} 
            disabled={isChecking}
            className="hub-icon-btn" 
            title="重新整理連線狀態"
          >
            <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 若未連線提示開啟 Hub */}
      {hubOnline === false && (
        <div className="hub-warn-card">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-amber-900 mb-1">未偵測到本機模型管理系統</p>
            <p className="text-amber-800 leading-relaxed mb-2">
              本專案直接串接本機共享模型庫。請先開啟 <b>Antigravity Model Hub.app</b>，或點擊下方按鈕進行自動喚醒：
            </p>
            <button 
              type="button" 
              onClick={handleLaunchHub} 
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-sm text-xs"
            >
              <ExternalLink size={12} /> 開啟 / 喚醒 Model Hub
            </button>
          </div>
        </div>
      )}

      {/* 模型切換與狀態展示 */}
      {hubOnline && (
        <div className="space-y-2.5 pt-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">
            選擇推論模型（由 Model Hub 提供）
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AVAILABLE_MODELS.map((m) => {
              const isSelected = m.id === currentModelId;
              return (
                <div 
                  key={m.id}
                  onClick={() => onSelectModel && onSelectModel(m.id)}
                  className={`model-option-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-800">{m.name}</span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">{m.size}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{m.desc}</p>
                </div>
              );
            })}
          </div>

          {/* 模型狀態反饋 */}
          {modelState === 'checking' && (
            <div className="hub-note-badge checking">
              <RefreshCw size={12} className="animate-spin text-indigo-600" />
              <span>正在向 Model Hub 確認 {currentModelId} 載入狀態...</span>
            </div>
          )}

          {modelState === 'not_downloaded' && (
            <div className="hub-warn-card">
              <Download size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-blue-900 mb-0.5">模型尚未下載</p>
                <p className="text-blue-800 leading-relaxed mb-2">
                  Model Hub 已在螢幕上彈出下載確認視窗，請前往確認下載完成後點擊「重新整理」。
                </p>
                <button 
                  type="button" 
                  onClick={() => ensureModel(currentModelId)} 
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-[11px] flex items-center gap-1 transition-colors"
                >
                  <RefreshCw size={11} /> 檢查下載進度
                </button>
              </div>
            </div>
          )}

          {modelState === 'ready' && (
            <div className="hub-note-badge ready">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span className="font-medium text-emerald-800">
                模型已載入至本機 GPU 就緒，可直接執行試卷分析！
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
