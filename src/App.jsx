import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Download, Plus, Trash2, Settings, Table as TableIcon, Sparkles, Key, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from '@google/genai';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [basicInfo, setBasicInfo] = useState({
    academicYear: '',
    semester: '',
    grade: '',
    subject: '',
    scope: '',
    time: '40 分鐘',
    setter: '',
    reviewer: ''
  });

  const [tableData, setTableData] = useState([
    {
      id: 1,
      unitName: '',
      learningPerformance: '',
      learningContent: '',
      questionType: '選擇題',
      cognitiveScores: {
        knowledge: { count: 0, score: 0 },
        application: { count: 0, score: 0 },
        evaluation: { count: 0, score: 0 }
      }
    }
  ]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [testPaperFile, setTestPaperFile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
    localStorage.setItem('gemini_api_key', e.target.value);
  };

  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setBasicInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleTableDataChange = (id, field, value) => {
    setTableData(prev => prev.map(row => {
      if (row.id === id) return { ...row, [field]: value };
      return row;
    }));
  };

  const handleCognitiveScoreChange = (id, domain, type, value) => {
    setTableData(prev => prev.map(row => {
      if (row.id === id) {
        return {
          ...row,
          cognitiveScores: {
            ...row.cognitiveScores,
            [domain]: {
              ...row.cognitiveScores[domain],
              [type]: parseInt(value) || 0
            }
          }
        };
      }
      return row;
    }));
  };

  const addRow = () => {
    setTableData(prev => [
      ...prev,
      {
        id: Date.now(),
        unitName: '',
        learningPerformance: '',
        learningContent: '',
        questionType: '選擇題',
        cognitiveScores: {
          knowledge: { count: 0, score: 0 },
          application: { count: 0, score: 0 },
          evaluation: { count: 0, score: 0 }
        }
      }
    ]);
  };

  const removeRow = (id) => {
    if (tableData.length > 1) {
      setTableData(prev => prev.filter(row => row.id !== id));
    }
  };

  const calculateTotals = () => {
    let totals = {
      knowledge: { count: 0, score: 0 },
      application: { count: 0, score: 0 },
      evaluation: { count: 0, score: 0 },
      totalCount: 0,
      totalScore: 0
    };

    tableData.forEach(row => {
      totals.knowledge.count += row.cognitiveScores.knowledge.count;
      totals.knowledge.score += row.cognitiveScores.knowledge.score;
      totals.application.count += row.cognitiveScores.application.count;
      totals.application.score += row.cognitiveScores.application.score;
      totals.evaluation.count += row.cognitiveScores.evaluation.count;
      totals.evaluation.score += row.cognitiveScores.evaluation.score;
    });

    totals.totalCount = totals.knowledge.count + totals.application.count + totals.evaluation.count;
    totals.totalScore = totals.knowledge.score + totals.application.score + totals.evaluation.score;

    return totals;
  };

  const totals = calculateTotals();

  // Excel Export Logic exactly matching the PDF layout
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    const wsData = [];
    
    // Title
    wsData.push([`新北市林口區麗園國小 ( ${basicInfo.academicYear} ) 學年度第 ( ${basicInfo.semester} ) 學期定期評量`]);
    wsData.push([`____${basicInfo.grade}____年級____${basicInfo.subject}____科試題雙向細目表`]);
    wsData.push([]);
    
    // Basic Info
    wsData.push(['一、 試卷基本資料']);
    wsData.push([`(一) 評量範圍： ${basicInfo.scope}`]);
    wsData.push([`(二) 評量時間： ${basicInfo.time}`]);
    wsData.push([`(三) 命題教師： ${basicInfo.setter}`]);
    wsData.push([`(四) 審題教師： ${basicInfo.reviewer}`]);
    wsData.push([]);
    wsData.push(['二、 試卷雙向細目表']);

    // Table Headers (3 rows to match PDF)
    wsData.push(['單元名稱', '學習重點', null, '題型', '認知領域的目標層次', null, null, null, null, null, '題數分配', '分數分配']);
    wsData.push([null, '(以編碼呈現)', null, null, '知識、理解', null, '應用、分析', null, '評鑑、創造', null, null, null]);
    wsData.push([null, '學習表現', '學習內容', null, '題數', '佔分', '題數', '佔分', '題數', '佔分', null, null]);

    // Data Rows
    tableData.forEach(row => {
      const rowCount = row.cognitiveScores.knowledge.count + row.cognitiveScores.application.count + row.cognitiveScores.evaluation.count;
      const rowScore = row.cognitiveScores.knowledge.score + row.cognitiveScores.application.score + row.cognitiveScores.evaluation.score;
      
      wsData.push([
        row.unitName,
        row.learningPerformance,
        row.learningContent,
        row.questionType,
        row.cognitiveScores.knowledge.count,
        row.cognitiveScores.knowledge.score,
        row.cognitiveScores.application.count,
        row.cognitiveScores.application.score,
        row.cognitiveScores.evaluation.count,
        row.cognitiveScores.evaluation.score,
        rowCount,
        rowScore
      ]);
    });

    // Totals Row
    wsData.push([
      '分 數 小 計', null, null, null,
      totals.knowledge.count,
      totals.knowledge.score,
      totals.application.count,
      totals.application.score,
      totals.evaluation.count,
      totals.evaluation.score,
      totals.totalCount,
      totals.totalScore
    ]);

    // Footer Notes
    wsData.push([]);
    wsData.push(['※ 命題教師請將所命試卷中，每一道試題依照其單元及所屬認知領域的目標層次，填入上表中。']);
    wsData.push(['※ 表格列數請依需求自行增減。']);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge Cells
    ws['!merges'] = [
      // Title merges
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
      
      // Header merges
      { s: { r: 7, c: 0 }, e: { r: 9, c: 0 } }, // 單元名稱
      { s: { r: 7, c: 1 }, e: { r: 7, c: 2 } }, // 學習重點
      { s: { r: 8, c: 1 }, e: { r: 8, c: 2 } }, // (以編碼呈現)
      { s: { r: 7, c: 3 }, e: { r: 9, c: 3 } }, // 題型
      { s: { r: 7, c: 4 }, e: { r: 7, c: 9 } }, // 認知領域的目標層次
      { s: { r: 8, c: 4 }, e: { r: 8, c: 5 } }, // 知識、理解
      { s: { r: 8, c: 6 }, e: { r: 8, c: 7 } }, // 應用、分析
      { s: { r: 8, c: 8 }, e: { r: 8, c: 9 } }, // 評鑑、創造
      { s: { r: 7, c: 10 }, e: { r: 9, c: 10 } }, // 題數分配
      { s: { r: 7, c: 11 }, e: { r: 9, c: 11 } }, // 分數分配
      
      // Totals merge
      { s: { r: 10 + tableData.length, c: 0 }, e: { r: 10 + tableData.length, c: 3 } } // 分數小計
    ];

    XLSX.utils.book_append_sheet(wb, ws, "雙向細目表");
    XLSX.writeFile(wb, "TestAnalysis.xlsx");
  };

  // Convert File to Base64 for Gemini
  const fileToGenerativePart = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAIAnalysis = async () => {
    if (!apiKey) {
      setError("請先填寫您的 Gemini API Key！");
      return;
    }
    if (!testPaperFile) {
      setError("請至少上傳一份試卷檔案供 AI 分析！");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const contents = [];

      if (syllabusFile) {
        contents.push(await fileToGenerativePart(syllabusFile));
        contents.push("這是一份課綱參考資料，請根據裡面的學習表現、學習內容編碼與內容來分析後續的考卷。");
      }

      contents.push(await fileToGenerativePart(testPaperFile));
      contents.push(`這是一份學校的測驗卷。請幫我分析這份試卷的每一題，並總結歸納出一個雙向細目表。
      請將分析結果以嚴格的 JSON 陣列格式回傳，每個物件代表一列資料，包含以下屬性：
      [
        {
          "unitName": "單元名稱",
          "learningPerformance": "學習表現(編碼)",
          "learningContent": "學習內容(編碼)",
          "questionType": "題型(例如: 選擇題)",
          "cognitiveScores": {
            "knowledge": { "count": 2, "score": 4 },
            "application": { "count": 1, "score": 2 },
            "evaluation": { "count": 0, "score": 0 }
          }
        }
      ]
      注意：認知領域目標層次分為「知識、理解(knowledge)」、「應用、分析(application)」、「評鑑、創造(evaluation)」。count是題數，score是總分。
      請只回傳 JSON，不要包含任何 markdown 語法 (不要有 \`\`\`json 等) 或額外的說明文字。`);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
      });

      const responseText = response.text;
      
      try {
        const parsedData = JSON.parse(responseText.trim().replace(/^```json/, '').replace(/```$/, ''));
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          const newData = parsedData.map((row, index) => ({
            id: Date.now() + index,
            unitName: row.unitName || '',
            learningPerformance: row.learningPerformance || '',
            learningContent: row.learningContent || '',
            questionType: row.questionType || '選擇題',
            cognitiveScores: row.cognitiveScores || {
              knowledge: { count: 0, score: 0 },
              application: { count: 0, score: 0 },
              evaluation: { count: 0, score: 0 }
            }
          }));
          setTableData(newData);
        } else {
          setError("AI 分析成功，但無法解析為有效的表格格式，請重試。");
        }
      } catch (e) {
         console.error(e, responseText);
         setError("AI 回傳的資料格式有誤，無法解析為 JSON。");
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "分析過程中發生錯誤，請確認 API Key 是否正確。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100 pb-20">
      {/* Premium Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-inner">
              <TableIcon className="text-white" size={22} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tight">
              TestAnls 試題分析系統
            </h1>
          </div>
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg transition-all font-medium text-sm shadow-md hover:shadow-lg active:scale-95">
            <Download size={16} />
            匯出精美 Excel
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Settings & AI */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* API Key Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Key size={16} />
                AI 金鑰設定
              </h2>
              <div>
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={handleApiKeyChange} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-mono placeholder:font-sans" 
                  placeholder="輸入 Gemini API Key..." 
                />
                <p className="text-xs text-slate-500 mt-2">金鑰僅儲存於您的瀏覽器本地端，安全無虞。</p>
              </div>
            </div>

            {/* AI Assistant Card */}
            <div className="bg-gradient-to-br from-indigo-500 via-blue-600 to-blue-700 p-1 rounded-2xl shadow-lg">
              <div className="bg-white/10 backdrop-blur-xl p-5 rounded-xl h-full flex flex-col">
                <h2 className="text-white font-semibold mb-2 flex items-center gap-2 text-lg">
                  <Sparkles size={20} className="text-blue-200" />
                  AI 智能分析
                </h2>
                <p className="text-blue-100 text-sm mb-6 opacity-90">上傳課綱與考卷，AI 將自動為您解析出雙向細目表。</p>
                
                <div className="space-y-4 flex-1">
                  <div className="bg-white/10 p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-colors group relative overflow-hidden">
                    <label className="flex flex-col items-center justify-center gap-2 cursor-pointer relative z-10">
                      <Upload size={22} className="text-blue-200 group-hover:text-white transition-colors" />
                      <span className="font-medium text-white text-sm">
                        {syllabusFile ? syllabusFile.name : '上傳課綱 (選填)'}
                      </span>
                      <input type="file" className="hidden" accept=".pdf,.docx,.jpg,.png" onChange={e => setSyllabusFile(e.target.files[0])} />
                    </label>
                  </div>

                  <div className="bg-white/10 p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-colors group relative overflow-hidden">
                    <label className="flex flex-col items-center justify-center gap-2 cursor-pointer relative z-10">
                      <FileText size={22} className="text-blue-200 group-hover:text-white transition-colors" />
                      <span className="font-medium text-white text-sm">
                        {testPaperFile ? testPaperFile.name : '上傳考卷 (必填)'}
                      </span>
                      <input type="file" className="hidden" accept=".pdf,.docx,.jpg,.png" onChange={e => setTestPaperFile(e.target.files[0])} />
                    </label>
                  </div>
                </div>

                <button 
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing || !testPaperFile}
                  className="mt-6 w-full py-3 bg-white text-blue-700 font-bold rounded-xl shadow-sm hover:shadow hover:bg-blue-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? <><Loader2 size={18} className="animate-spin" /> 分析中...</> : '開始 AI 分析'}
                </button>
              </div>
            </div>

            {/* Basic Info Settings */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Settings size={16} />
                試卷基本設定
              </h2>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">學年度</label>
                    <input type="text" name="academicYear" value={basicInfo.academicYear} onChange={handleBasicInfoChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" placeholder="112" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">學期</label>
                    <input type="text" name="semester" value={basicInfo.semester} onChange={handleBasicInfoChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" placeholder="上" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">年級</label>
                    <input type="text" name="grade" value={basicInfo.grade} onChange={handleBasicInfoChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" placeholder="三" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">科目</label>
                    <input type="text" name="subject" value={basicInfo.subject} onChange={handleBasicInfoChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" placeholder="國語" />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">評量範圍</label>
                    <input type="text" name="scope" value={basicInfo.scope} onChange={handleBasicInfoChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" placeholder="版第 1 冊第 1 章" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">評量時間</label>
                    <input type="text" name="time" value={basicInfo.time} onChange={handleBasicInfoChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">命題教師</label>
                      <input type="text" name="setter" value={basicInfo.setter} onChange={handleBasicInfoChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">審題教師</label>
                      <input type="text" name="reviewer" value={basicInfo.reviewer} onChange={handleBasicInfoChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          {/* Right Column: Table Editor */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col h-full">
              
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800">雙向細目表編輯器</h2>
                <button onClick={addRow} className="flex items-center gap-1.5 text-sm bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 px-4 py-2 rounded-lg transition-all font-medium shadow-sm active:scale-95">
                  <Plus size={16} /> 新增列
                </button>
              </div>

              <div className="p-0 overflow-x-auto flex-1">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-100/80 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 font-semibold border-b border-slate-200" rowSpan="2">單元名稱</th>
                      <th className="px-4 py-3 font-semibold border-b border-slate-200 text-center" colSpan="2">學習重點 (編碼)</th>
                      <th className="px-4 py-3 font-semibold border-b border-slate-200" rowSpan="2">題型</th>
                      <th className="px-4 py-3 font-semibold border-b border-slate-200 text-center" colSpan="6">認知領域目標層次</th>
                      <th className="px-2 py-3 font-semibold border-b border-slate-200 w-10 text-center" rowSpan="2">操作</th>
                    </tr>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <th className="px-3 py-2 font-medium border-r border-slate-100">學習表現</th>
                      <th className="px-3 py-2 font-medium border-r border-slate-200">學習內容</th>
                      
                      <th className="px-2 py-2 font-medium text-center border-r border-slate-100 bg-blue-50/50" colSpan="2">知識、理解</th>
                      <th className="px-2 py-2 font-medium text-center border-r border-slate-100 bg-indigo-50/50" colSpan="2">應用、分析</th>
                      <th className="px-2 py-2 font-medium text-center bg-violet-50/50" colSpan="2">評鑑、創造</th>
                    </tr>
                    <tr className="border-b border-slate-200 bg-white shadow-sm">
                      <th className="p-0" colSpan="4"></th>
                      <th className="px-2 py-1.5 text-xs text-center text-slate-400 font-normal border-r border-slate-100 bg-blue-50/20">題數</th>
                      <th className="px-2 py-1.5 text-xs text-center text-slate-400 font-normal border-r border-slate-200 bg-blue-50/20">佔分</th>
                      <th className="px-2 py-1.5 text-xs text-center text-slate-400 font-normal border-r border-slate-100 bg-indigo-50/20">題數</th>
                      <th className="px-2 py-1.5 text-xs text-center text-slate-400 font-normal border-r border-slate-200 bg-indigo-50/20">佔分</th>
                      <th className="px-2 py-1.5 text-xs text-center text-slate-400 font-normal border-r border-slate-100 bg-violet-50/20">題數</th>
                      <th className="px-2 py-1.5 text-xs text-center text-slate-400 font-normal bg-violet-50/20">佔分</th>
                      <th className="p-0"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-2 border-r border-slate-100 w-32">
                          <input type="text" value={row.unitName} onChange={(e) => handleTableDataChange(row.id, 'unitName', e.target.value)} className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 rounded px-2 py-1.5 outline-none transition-all" placeholder="單元..." />
                        </td>
                        <td className="p-2 border-r border-slate-100 w-32">
                          <input type="text" value={row.learningPerformance} onChange={(e) => handleTableDataChange(row.id, 'learningPerformance', e.target.value)} className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 rounded px-2 py-1.5 outline-none transition-all" placeholder="編碼..." />
                        </td>
                        <td className="p-2 border-r border-slate-200 w-32">
                          <input type="text" value={row.learningContent} onChange={(e) => handleTableDataChange(row.id, 'learningContent', e.target.value)} className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 rounded px-2 py-1.5 outline-none transition-all" placeholder="編碼..." />
                        </td>
                        <td className="p-2 border-r border-slate-200 w-24">
                          <input type="text" value={row.questionType} onChange={(e) => handleTableDataChange(row.id, 'questionType', e.target.value)} className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 rounded px-2 py-1.5 outline-none transition-all" placeholder="題型..." />
                        </td>
                        
                        {/* Knowledge */}
                        <td className="p-2 border-r border-slate-100 w-16 bg-blue-50/10">
                          <input type="number" min="0" value={row.cognitiveScores.knowledge.count || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'knowledge', 'count', e.target.value)} className="w-full text-center bg-transparent border border-transparent hover:border-blue-200 focus:border-blue-500 rounded py-1.5 outline-none transition-all" />
                        </td>
                        <td className="p-2 border-r border-slate-200 w-16 bg-blue-50/10">
                          <input type="number" min="0" value={row.cognitiveScores.knowledge.score || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'knowledge', 'score', e.target.value)} className="w-full text-center bg-transparent border border-transparent hover:border-blue-200 focus:border-blue-500 rounded py-1.5 outline-none transition-all font-semibold text-blue-700" />
                        </td>

                        {/* Application */}
                        <td className="p-2 border-r border-slate-100 w-16 bg-indigo-50/10">
                          <input type="number" min="0" value={row.cognitiveScores.application.count || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'application', 'count', e.target.value)} className="w-full text-center bg-transparent border border-transparent hover:border-indigo-200 focus:border-indigo-500 rounded py-1.5 outline-none transition-all" />
                        </td>
                        <td className="p-2 border-r border-slate-200 w-16 bg-indigo-50/10">
                          <input type="number" min="0" value={row.cognitiveScores.application.score || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'application', 'score', e.target.value)} className="w-full text-center bg-transparent border border-transparent hover:border-indigo-200 focus:border-indigo-500 rounded py-1.5 outline-none transition-all font-semibold text-indigo-700" />
                        </td>

                        {/* Evaluation */}
                        <td className="p-2 border-r border-slate-100 w-16 bg-violet-50/10">
                          <input type="number" min="0" value={row.cognitiveScores.evaluation.count || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'evaluation', 'count', e.target.value)} className="w-full text-center bg-transparent border border-transparent hover:border-violet-200 focus:border-violet-500 rounded py-1.5 outline-none transition-all" />
                        </td>
                        <td className="p-2 w-16 bg-violet-50/10">
                          <input type="number" min="0" value={row.cognitiveScores.evaluation.score || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'evaluation', 'score', e.target.value)} className="w-full text-center bg-transparent border border-transparent hover:border-violet-200 focus:border-violet-500 rounded py-1.5 outline-none transition-all font-semibold text-violet-700" />
                        </td>

                        <td className="p-2 text-center">
                           <button onClick={() => removeRow(row.id)} className="text-slate-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                              <Trash2 size={16} />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right font-bold text-slate-600 border-r border-slate-200">總計</td>
                      <td className="px-2 py-3 text-center font-semibold text-slate-600">{totals.knowledge.count}</td>
                      <td className="px-2 py-3 text-center font-bold text-blue-600 border-r border-slate-200 bg-blue-50/30">{totals.knowledge.score}</td>
                      <td className="px-2 py-3 text-center font-semibold text-slate-600">{totals.application.count}</td>
                      <td className="px-2 py-3 text-center font-bold text-indigo-600 border-r border-slate-200 bg-indigo-50/30">{totals.application.score}</td>
                      <td className="px-2 py-3 text-center font-semibold text-slate-600">{totals.evaluation.count}</td>
                      <td className="px-2 py-3 text-center font-bold text-violet-600 bg-violet-50/30">{totals.evaluation.score}</td>
                      <td></td>
                    </tr>
                    <tr className="bg-slate-800 text-white">
                      <td colSpan="4" className="px-4 py-3 text-right font-bold border-r border-slate-700">全卷總分/題數</td>
                      <td colSpan="3" className="px-4 py-3 text-center text-slate-300 text-xs">總題數</td>
                      <td colSpan="3" className="px-4 py-3 text-center text-slate-300 text-xs">總分數</td>
                      <td></td>
                    </tr>
                    <tr className="bg-slate-900 text-white">
                      <td colSpan="4" className="border-r border-slate-800"></td>
                      <td colSpan="3" className="px-4 py-3 text-center font-bold text-xl">{totals.totalCount}</td>
                      <td colSpan="3" className="px-4 py-3 text-center font-bold text-xl text-emerald-400">{totals.totalScore}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
