import React, { useState } from 'react';
import { Upload, FileText, Download, Plus, Trash2, Settings, Table as TableIcon, Sparkles, Key, AlertCircle, Loader2, LayoutGrid, CheckCircle2, FileUp, ExternalLink } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, VerticalAlign } from 'docx';
import { saveAs } from 'file-saver';
import { GoogleGenAI } from '@google/genai';
import syllabusData from './data/syllabus.json';

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
  const [syllabusFiles, setSyllabusFiles] = useState([]);
  const [testPaperFile, setTestPaperFile] = useState(null);
  const [useCustomApi, setUseCustomApi] = useState(true);

  const handleToggleCustomApi = (value) => {
    if (!value) {
      if (window.confirm("⚠️ 注意：如果不填寫自己的 API Key，系統將使用預設的共用額度。\n\n共用額度可能會因為多人同時使用而導致【分析速度緩慢】甚至【額度用盡而失敗】。\n\n強烈建議您花 1 分鐘免費申請自己的 API Key 以確保順暢！\n\n您確定要繼續使用系統預設額度嗎？")) {
        setUseCustomApi(false);
        setApiKey('');
      }
    } else {
      setUseCustomApi(true);
    }
  };

  const handleReset = () => {
    if (window.confirm("確定要清除所有上傳檔案與表格資料嗎？")) {
      setSyllabusFiles([]);
      setTestPaperFile(null);
      setTableData([
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
      setBasicInfo({
        academicYear: '112',
        semester: '上',
        grade: '三',
        subject: '數學',
        scope: '第一單元至第五單元',
        time: '40分鐘',
        setter: '王大明老師',
        reviewer: '李小華老師'
      });
      setError(null);
      setSuccessMsg("資料已全數清除，可以重新開始分析了！");
    }
  };

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
  };

  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setBasicInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleTableDataChange = (id, field, value) => {
    setTableData(prev => {
      const targetRow = prev.find(r => r.id === id);
      if (!targetRow) return prev;
      const oldUnitName = targetRow.unitName;
      return prev.map(row => {
        if (field === 'unitName' || field === 'learningPerformance' || field === 'learningContent') {
          if (row.unitName === oldUnitName) return { ...row, [field]: value };
        } else if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      });
    });
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

  // Word Export matching PDF perfectly
  const exportToWord = async () => {
    const cellMargin = { top: 100, bottom: 100, left: 100, right: 100 };
    const createCell = (text, options = {}) => {
      const lines = (text || '').split('\n');
      const paragraphs = lines.map(line => new Paragraph({ 
        children: [new TextRun({ text: line, font: 'DFKai-SB', size: 24 })], 
        alignment: AlignmentType.CENTER 
      }));
      return new TableCell({
        children: paragraphs,
        verticalAlign: VerticalAlign.CENTER,
        margins: cellMargin,
        ...options
      });
    };

    const title1 = new Paragraph({
      children: [new TextRun({ text: `新北市林口區麗園國小 ( ${basicInfo.academicYear} ) 學年度第 ( ${basicInfo.semester} ) 學期定期評量`, size: 32, font: 'DFKai-SB' })],
      alignment: AlignmentType.CENTER
    });
    const title2 = new Paragraph({
      children: [new TextRun({ text: `____${basicInfo.grade}____年級____${basicInfo.subject}____科試題雙向細目表`, size: 32, font: 'DFKai-SB' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    });

    const info1 = new Paragraph({ children: [new TextRun({ text: '一、 試卷基本資料', size: 24, font: 'DFKai-SB' })] });
    const info2 = new Paragraph({ children: [new TextRun({ text: `(一) 評量範圍： ${basicInfo.scope}`, size: 24, font: 'DFKai-SB' })] });
    const info3 = new Paragraph({ children: [new TextRun({ text: `(二) 評量時間： ${basicInfo.time}`, size: 24, font: 'DFKai-SB' })] });
    const info4 = new Paragraph({ children: [new TextRun({ text: `(三) 命題教師： ${basicInfo.setter}`, size: 24, font: 'DFKai-SB' })] });
    const info5 = new Paragraph({ children: [new TextRun({ text: `(四) 審題教師： ${basicInfo.reviewer}`, size: 24, font: 'DFKai-SB' })], spacing: { after: 200 } });
    const info6 = new Paragraph({ children: [new TextRun({ text: '二、 試卷雙向細目表', size: 24, font: 'DFKai-SB' })] });

    const headerRow1 = new TableRow({
      children: [
        createCell('單元名稱', { rowSpan: 3 }),
        createCell('學習重點\n(以編碼呈現)', { columnSpan: 2 }),
        createCell('題型', { rowSpan: 3 }),
        createCell('認知領域的目標層次', { columnSpan: 6 }),
        createCell('題數\n分配', { rowSpan: 2 }),
        createCell('分數\n分配', { rowSpan: 2 }),
      ]
    });

    const headerRow2 = new TableRow({
      children: [
        createCell('學習表現', { rowSpan: 2 }),
        createCell('學習內容', { rowSpan: 2 }),
        createCell('知識、理解', { columnSpan: 2 }),
        createCell('應用、分析', { columnSpan: 2 }),
        createCell('評鑑、創造', { columnSpan: 2 }),
      ]
    });

    const headerRow3 = new TableRow({
      children: [
        createCell('題數'), createCell('佔分'),
        createCell('題數'), createCell('佔分'),
        createCell('題數'), createCell('佔分'),
        createCell('題數'), createCell('佔分'),
      ]
    });

    const tableRows = [headerRow1, headerRow2, headerRow3];

    tableData.forEach((row, index) => {
      const isFirstOfUnit = index === 0 || tableData[index - 1].unitName !== row.unitName;
      const rowSpanCount = isFirstOfUnit ? tableData.filter(r => r.unitName === row.unitName).length : 0;
      const rowCount = row.cognitiveScores.knowledge.count + row.cognitiveScores.application.count + row.cognitiveScores.evaluation.count;
      const rowScore = row.cognitiveScores.knowledge.score + row.cognitiveScores.application.score + row.cognitiveScores.evaluation.score;
      
      const children = [];
      if (isFirstOfUnit) {
        children.push(createCell(row.unitName, { rowSpan: rowSpanCount }));
        children.push(createCell(row.learningPerformance, { rowSpan: rowSpanCount }));
        children.push(createCell(row.learningContent, { rowSpan: rowSpanCount }));
      }
      children.push(
        createCell(row.questionType),
        createCell(row.cognitiveScores.knowledge.count.toString()),
        createCell(row.cognitiveScores.knowledge.score.toString()),
        createCell(row.cognitiveScores.application.count.toString()),
        createCell(row.cognitiveScores.application.score.toString()),
        createCell(row.cognitiveScores.evaluation.count.toString()),
        createCell(row.cognitiveScores.evaluation.score.toString()),
        createCell(rowCount.toString()),
        createCell(rowScore.toString())
      );

      tableRows.push(new TableRow({ children }));
    });

    tableRows.push(new TableRow({
      children: [
        createCell('分 數 小 計', { columnSpan: 4 }),
        createCell(totals.knowledge.count.toString()),
        createCell(totals.knowledge.score.toString()),
        createCell(totals.application.count.toString()),
        createCell(totals.application.score.toString()),
        createCell(totals.evaluation.count.toString()),
        createCell(totals.evaluation.score.toString()),
        createCell(totals.totalCount.toString()),
        createCell(totals.totalScore.toString()),
      ]
    }));

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [1800, 1500, 1500, 1000, 800, 800, 800, 800, 800, 800, 800, 800],
      rows: tableRows,
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          title1, title2, info1, info2, info3, info4, info5, info6, table,
          new Paragraph({ children: [new TextRun({ text: '※ 命題教師請將所命試卷中，每一道試題依照其單元及所屬認知領域的目標層次，填入上表中。', size: 20, font: 'DFKai-SB' })], spacing: { before: 200 } }),
          new Paragraph({ children: [new TextRun({ text: '※ 表格列數請依需求自行增減。', size: 20, font: 'DFKai-SB' })] })
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "TestAnalysis.docx");
  };

  const fileToGenerativePart = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ inlineData: { data: reader.result.split(',')[1], mimeType: file.type } });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAIAnalysis = async () => {
    const finalApiKey = useCustomApi ? apiKey : (import.meta.env.VITE_DEFAULT_API_KEY || "");
    if (!finalApiKey) { 
      setError(useCustomApi ? "請先輸入您的 Gemini API Key！" : "系統尚未設定預設 API Key，請切換為「使用專屬 API Key」並自行申請！"); 
      setSuccessMsg(null); 
      return; 
    }
    if (!testPaperFile) { setError("請上傳一份試卷檔案供 AI 進行分析！"); setSuccessMsg(null); return; }

    setIsAnalyzing(true); setError(null); setSuccessMsg(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const contents = [];

      for (const file of syllabusFiles) {
        contents.push(await fileToGenerativePart(file));
      }
      if (syllabusFiles.length > 0) {
         contents.push("以上是課本或相關參考資料，請根據課本內容自動判斷各單元名稱，並為每個單元推導出符合 108 課綱的「學習表現」與「學習內容」對應編碼。");
      }

      contents.push(await fileToGenerativePart(testPaperFile));
      contents.push(`這是一份測驗卷。請幫我分析這份試卷的每一題，並根據上方的課本內容（若有）將試題分類到對應的單元中，最後總結歸納出一個雙向細目表，同時從試卷標題提取基本資訊。
      我們內建了 108 課綱資料庫（包含國語、數學、社會、自然四個領域）：
      ${JSON.stringify(syllabusData)}
      請判斷這份試卷的科目，並自動從上述課綱資料中找出最適合的「學習表現」與「學習內容」編碼。
      【重要格式要求】：
      1. 單元名稱 (unitName) 請一律使用大單元呈現，不要出現小節！格式請盡量統一為「第X單元 OOO」或「X. OOO」（例如：「第一單元 體積」或「1. 體積」）。
      2. 同一個單元如果有不同的題型，請產生多個 row，但它們的 unitName 必須「完全一模一樣」，讓相同的單元能夠集中合併在一起，千萬不要分散填寫。
      3. 題型 (questionType) 必須嚴格根據考卷上的「大題標題」來分類與命名（例如：「一、選擇題」、「二、填填看」、「三、做做看」等），請直接提取試卷上的大題標題作為題型分類的依據。
      請將分析結果以嚴格的 JSON 格式回傳，包含以下屬性：
      {
        "academicYear": "112",
        "semester": "上",
        "grade": "三",
        "subject": "國語",
        "rows": [
          {
            "unitName": "單元名稱",
            "learningPerformance": "學習表現(限填代碼，例如 1-I-1)",
            "learningContent": "學習內容(限填代碼，例如 Ab-I-1)",
            "questionType": "題型(例如: 選擇題)",
            "cognitiveScores": {
              "knowledge": { "count": 2, "score": 4 },
              "application": { "count": 1, "score": 2 },
              "evaluation": { "count": 0, "score": 0 }
            }
          }
        ]
      }
      注意：
      1. 認知領域目標層次分為「知識、理解(knowledge)」、「應用、分析(application)」、「評鑑、創造(evaluation)」。count 是該題型對應目標層次的總題數，score 是這些題目的總佔分。
      2. 務必讓「學習表現」與「學習內容」只填寫課綱編碼，絕對不要包含任何中文說明文字。
      請只回傳 JSON，不要包含任何 markdown 語法 (不要有 \`\`\`json 等) 或額外的說明文字。`);

      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents });
      const responseText = response.text;
      
      try {
        const parsedData = JSON.parse(responseText.trim().replace(/^```json/, '').replace(/```$/, ''));
        
        // Auto-fill basic info
        setBasicInfo(prev => ({
          ...prev,
          academicYear: parsedData.academicYear || prev.academicYear,
          semester: parsedData.semester || prev.semester,
          grade: parsedData.grade || prev.grade,
          subject: parsedData.subject || prev.subject,
        }));

        if (Array.isArray(parsedData.rows) && parsedData.rows.length > 0) {
          // Normalize rows so that same unitName has identical learningPerformance and learningContent
          const unitsMap = {};
          parsedData.rows.forEach(row => {
            const uName = row.unitName || '未命名單元';
            if (!unitsMap[uName]) unitsMap[uName] = { perf: new Set(), cont: new Set() };
            if (row.learningPerformance) row.learningPerformance.split(/[,\n、]/).map(s => s.trim()).filter(Boolean).forEach(s => unitsMap[uName].perf.add(s));
            if (row.learningContent) row.learningContent.split(/[,\n、]/).map(s => s.trim()).filter(Boolean).forEach(s => unitsMap[uName].cont.add(s));
          });

          const newData = parsedData.rows.map((row, index) => {
            const uName = row.unitName || '未命名單元';
            return {
              id: Date.now() + index,
              unitName: uName,
              learningPerformance: Array.from(unitsMap[uName].perf).join('\n'),
              learningContent: Array.from(unitsMap[uName].cont).join('\n'),
              questionType: row.questionType || '選擇題',
              cognitiveScores: row.cognitiveScores || {
                knowledge: { count: 0, score: 0 }, application: { count: 0, score: 0 }, evaluation: { count: 0, score: 0 }
              }
            };
          });
          setTableData(newData);
          setSuccessMsg("AI 分析成功！試卷基本設定與雙向細目表已自動更新。");
        } else {
          setError("AI 分析成功，但無法解析為有效的表格格式，請重試。");
        }
      } catch (e) {
         setError("AI 回傳的資料格式有誤，無法解析為 JSON。");
      }
    } catch (err) {
      setError(err.message || "分析過程中發生錯誤，請確認 API Key 是否正確。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6fa] text-slate-800 pb-20 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-400/20 blur-[100px] rounded-full pointer-events-none"></div>

      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <LayoutGrid className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
                TestAnls
              </h1>
              <p className="text-xs font-medium text-slate-500 tracking-wider uppercase">Intelligent Exam Analysis</p>
            </div>
          </div>
          <button onClick={exportToWord} className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-all font-semibold text-sm shadow-xl shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0">
            <FileText size={18} />
            匯出精美 Word
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8 relative z-10">
        
        {error && (
          <div className="bg-red-50/80 backdrop-blur-md border border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3 shadow-lg shadow-red-500/5 animate-in slide-in-from-top-4">
            <AlertCircle className="shrink-0 mt-0.5 text-red-500" size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50/80 backdrop-blur-md border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-start gap-3 shadow-lg shadow-emerald-500/5 animate-in slide-in-from-top-4">
            <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-500" size={20} />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-8 flex flex-col">
            
            <div className="bg-white rounded-3xl p-1 shadow-xl shadow-indigo-500/10 border border-white/60 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-purple-500/10 pointer-events-none"></div>
              <div className="bg-white/60 backdrop-blur-2xl p-6 rounded-[1.4rem] h-full flex flex-col relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Sparkles size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">AI 智能分析</h2>
                    <p className="text-xs font-medium text-slate-500">Powered by Google Gemini</p>
                  </div>
                </div>
                
                <div className="space-y-5 flex-1">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">API Key 設定</label>
                    
                    <div className="flex flex-col gap-2 p-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="radio" checked={useCustomApi} onChange={() => handleToggleCustomApi(true)} className="peer w-4 h-4 opacity-0 absolute" />
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300 peer-checked:border-indigo-600 flex items-center justify-center transition-all">
                            <div className="w-2 h-2 rounded-full bg-indigo-600 scale-0 peer-checked:scale-100 transition-transform"></div>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold transition-colors ${useCustomApi ? 'text-indigo-700' : 'text-slate-600 group-hover:text-slate-800'}`}>使用專屬 API Key (強烈推薦)</span>
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="radio" checked={!useCustomApi} onChange={() => handleToggleCustomApi(false)} className="peer w-4 h-4 opacity-0 absolute" />
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300 peer-checked:border-indigo-600 flex items-center justify-center transition-all">
                            <div className="w-2 h-2 rounded-full bg-indigo-600 scale-0 peer-checked:scale-100 transition-transform"></div>
                          </div>
                        </div>
                        <span className={`text-sm font-medium transition-colors ${!useCustomApi ? 'text-indigo-700' : 'text-slate-600 group-hover:text-slate-800'}`}>不使用 API Key (共用系統預設額度)</span>
                      </label>
                    </div>

                    {useCustomApi ? (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
                        <div className="relative">
                          <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="password" 
                            value={apiKey} 
                            onChange={handleApiKeyChange} 
                            className="w-full pl-10 pr-4 py-3 bg-white/80 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-mono placeholder:font-sans shadow-sm" 
                            placeholder="輸入當次使用的 API Key..." 
                          />
                        </div>
                        <div className="pl-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                          <span>不知道怎麼申請？</span>
                          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:text-indigo-700 hover:underline">
                            點此免費申請 Google Gemini API Key <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-amber-800 text-xs flex items-start gap-2.5 shadow-sm">
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-500" />
                        <p className="leading-relaxed font-medium">您目前選擇不填寫 API Key。若系統共用額度耗盡，AI 分析可能會失敗或沒有反應。若遇到此情況，建議您切換回上方「使用專屬 API Key」並自行申請。</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-3 p-4 bg-white/80 border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-xl cursor-pointer transition-all shadow-sm group">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                        <FileUp size={18} className="text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">上傳課本內容 (可複選)</p>
                        <p className="text-xs text-slate-400 truncate">{syllabusFiles.length > 0 ? `已選取 ${syllabusFiles.length} 個檔案` : '選填：供 AI 分類單元與課綱'}</p>
                      </div>
                      <input type="file" className="hidden" multiple accept=".pdf,.docx,.jpg,.png" onChange={e => setSyllabusFiles(Array.from(e.target.files))} />
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-white/80 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/50 rounded-xl cursor-pointer transition-all shadow-sm group">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Upload size={18} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">上傳測驗考卷</p>
                        <p className="text-xs text-slate-400 truncate">{testPaperFile ? testPaperFile.name : '準備交給 AI 分析'}</p>
                      </div>
                      <input type="file" className="hidden" accept=".pdf,.docx,.jpg,.png" onChange={e => setTestPaperFile(e.target.files[0])} />
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <button 
                    onClick={handleAIAnalysis}
                    disabled={isAnalyzing || !testPaperFile}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? <><Loader2 size={18} className="animate-spin" /> 正在深度分析中...</> : '開始 AI 自動分析'}
                  </button>
                  
                  <button 
                    onClick={handleReset}
                    className="w-full py-3 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl shadow-sm hover:bg-rose-50 hover:border-rose-300 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    清除資料並重新開始
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-white/60">
              <h2 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <Settings size={18} className="text-slate-400" />
                試卷基本設定 (自動帶入)
              </h2>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide pl-1">學年度</label>
                    <input type="text" name="academicYear" value={basicInfo.academicYear} onChange={handleBasicInfoChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all font-medium" placeholder="112" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide pl-1">學期</label>
                    <input type="text" name="semester" value={basicInfo.semester} onChange={handleBasicInfoChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all font-medium" placeholder="上" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide pl-1">年級</label>
                    <input type="text" name="grade" value={basicInfo.grade} onChange={handleBasicInfoChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all font-medium" placeholder="三" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide pl-1">科目</label>
                    <input type="text" name="subject" value={basicInfo.subject} onChange={handleBasicInfoChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all font-medium" placeholder="國語" />
                  </div>
                </div>
                
                <div className="pt-5 border-t border-slate-100/80 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide pl-1">評量範圍</label>
                    <input type="text" name="scope" value={basicInfo.scope} onChange={handleBasicInfoChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all font-medium" placeholder="版第 1 冊第 1 章" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide pl-1">評量時間</label>
                    <input type="text" name="time" value={basicInfo.time} onChange={handleBasicInfoChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide pl-1">命題教師</label>
                      <input type="text" name="setter" value={basicInfo.setter} onChange={handleBasicInfoChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide pl-1">審題教師</label>
                      <input type="text" name="reviewer" value={basicInfo.reviewer} onChange={handleBasicInfoChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all font-medium" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col h-full">
            <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white/80 overflow-hidden flex flex-col flex-1">
              
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-3">
                  <TableIcon className="text-blue-500" size={24} />
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">雙向細目表編輯器</h2>
                </div>
                <button onClick={addRow} className="flex items-center gap-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl transition-all font-bold shadow-sm active:scale-95">
                  <Plus size={16} strokeWidth={3} /> 新增列
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                <div className="border border-slate-200/60 rounded-2xl overflow-x-auto shadow-sm bg-white">
                  <table className="w-[1200px] text-sm text-left border-collapse table-fixed">
                    <thead className="bg-slate-50/80">
                      <tr>
                        <th className="px-4 py-4 font-bold text-slate-700 border-b border-slate-200" rowSpan="2">單元名稱</th>
                        <th className="px-4 py-4 font-bold text-slate-700 border-b border-slate-200 text-center" colSpan="2">學習重點 (編碼)</th>
                        <th className="px-4 py-4 font-bold text-slate-700 border-b border-slate-200" rowSpan="2">題型</th>
                        <th className="px-4 py-4 font-bold text-slate-700 border-b border-slate-200 text-center" colSpan="6">認知領域目標層次</th>
                        <th className="px-3 py-4 font-bold text-slate-700 border-b border-slate-200 w-12 text-center" rowSpan="2"></th>
                      </tr>
                      <tr className="bg-slate-50/50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                        <th className="px-3 py-3 font-semibold border-r border-slate-100">學習表現</th>
                        <th className="px-3 py-3 font-semibold border-r border-slate-200">學習內容</th>
                        
                        <th className="px-2 py-3 font-bold text-center border-r border-slate-100 bg-blue-500/5 text-blue-700" colSpan="2">知識、理解</th>
                        <th className="px-2 py-3 font-bold text-center border-r border-slate-100 bg-indigo-500/5 text-indigo-700" colSpan="2">應用、分析</th>
                        <th className="px-2 py-3 font-bold text-center bg-violet-500/5 text-violet-700" colSpan="2">評鑑、創造</th>
                      </tr>
                      <tr className="border-b border-slate-200 bg-white text-xs font-semibold text-slate-400">
                        <th className="p-0" colSpan="4"></th>
                        <th className="px-2 py-2 text-center border-r border-slate-100 bg-blue-50/30">題數</th>
                        <th className="px-2 py-2 text-center border-r border-slate-200 bg-blue-50/30">佔分</th>
                        <th className="px-2 py-2 text-center border-r border-slate-100 bg-indigo-50/30">題數</th>
                        <th className="px-2 py-2 text-center border-r border-slate-200 bg-indigo-50/30">佔分</th>
                        <th className="px-2 py-2 text-center border-r border-slate-100 bg-violet-50/30">題數</th>
                        <th className="px-2 py-2 text-center bg-violet-50/30">佔分</th>
                        <th className="p-0"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tableData.map((row, index) => {
                        const isFirstOfUnit = index === 0 || tableData[index - 1].unitName !== row.unitName;
                        const rowSpanCount = isFirstOfUnit ? tableData.filter(r => r.unitName === row.unitName).length : 0;
                        return (
                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                          {isFirstOfUnit && (
                            <>
                              <td className="p-2 border-r border-slate-100 w-36" rowSpan={rowSpanCount}>
                                <textarea value={row.unitName} onChange={(e) => handleTableDataChange(row.id, 'unitName', e.target.value)} className="w-full bg-slate-50/50 border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg px-3 py-2 outline-none transition-all font-medium resize-none" rows={rowSpanCount > 1 ? 2 : 1} placeholder="單元名稱" />
                              </td>
                              <td className="p-2 border-r border-slate-100 w-28" rowSpan={rowSpanCount}>
                                <textarea value={row.learningPerformance} onChange={(e) => handleTableDataChange(row.id, 'learningPerformance', e.target.value)} className="w-full bg-slate-50/50 border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg px-3 py-2 outline-none transition-all font-medium resize-none text-xs" rows={rowSpanCount > 1 ? 2 : 1} placeholder="1-I-1" />
                              </td>
                              <td className="p-2 border-r border-slate-200 w-28" rowSpan={rowSpanCount}>
                                <textarea value={row.learningContent} onChange={(e) => handleTableDataChange(row.id, 'learningContent', e.target.value)} className="w-full bg-slate-50/50 border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg px-3 py-2 outline-none transition-all font-medium resize-none text-xs" rows={rowSpanCount > 1 ? 2 : 1} placeholder="Ab-I-1" />
                              </td>
                            </>
                          )}
                          <td className="p-2 border-r border-slate-200 w-28">
                            <input type="text" value={row.questionType} onChange={(e) => handleTableDataChange(row.id, 'questionType', e.target.value)} className="w-full bg-slate-50/50 border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg px-3 py-2 outline-none transition-all font-medium" placeholder="選擇題" />
                          </td>
                          
                          <td className="p-2 border-r border-slate-100 w-16 bg-blue-50/10">
                            <input type="number" min="0" value={row.cognitiveScores.knowledge.count || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'knowledge', 'count', e.target.value)} className="w-full text-center bg-transparent border border-transparent hover:border-blue-200 focus:border-blue-500 focus:bg-white rounded-md py-1.5 outline-none transition-all font-medium" placeholder="0" />
                          </td>
                          <td className="p-2 border-r border-slate-200 w-16 bg-blue-50/10">
                            <input type="number" min="0" value={row.cognitiveScores.knowledge.score || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'knowledge', 'score', e.target.value)} className="w-full text-center bg-transparent border border-transparent hover:border-blue-200 focus:border-blue-500 focus:bg-white rounded-md py-1.5 outline-none transition-all font-bold text-blue-600" placeholder="0" />
                          </td>

                          <td className="p-2 border-r border-slate-100 w-16 bg-indigo-50/10">
                            <input type="number" min="0" value={row.cognitiveScores.application.count || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'application', 'count', e.target.value)} className="w-full text-center bg-transparent border border-transparent hover:border-indigo-200 focus:border-indigo-500 focus:bg-white rounded-md py-1.5 outline-none transition-all font-medium" placeholder="0" />
                          </td>
                          <td className="p-2 border-r border-slate-200 w-16 bg-indigo-50/10">
                            <input type="number" min="0" value={row.cognitiveScores.application.score || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'application', 'score', e.target.value)} className="w-full text-center bg-transparent border border-transparent hover:border-indigo-200 focus:border-indigo-500 focus:bg-white rounded-md py-1.5 outline-none transition-all font-bold text-indigo-600" placeholder="0" />
                          </td>

                          <td className="p-2 border-r border-slate-100 w-16 bg-violet-50/10">
                            <input type="number" min="0" value={row.cognitiveScores.evaluation.count || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'evaluation', 'count', e.target.value)} className="w-full text-center bg-transparent border border-transparent hover:border-violet-200 focus:border-violet-500 focus:bg-white rounded-md py-1.5 outline-none transition-all font-medium" placeholder="0" />
                          </td>
                          <td className="p-2 w-16 bg-violet-50/10">
                            <input type="number" min="0" value={row.cognitiveScores.evaluation.score || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'evaluation', 'score', e.target.value)} className="w-full text-center bg-transparent border border-transparent hover:border-violet-200 focus:border-violet-500 focus:bg-white rounded-md py-1.5 outline-none transition-all font-bold text-violet-600" placeholder="0" />
                          </td>

                          <td className="p-2 text-center">
                             <button onClick={() => removeRow(row.id)} className="text-slate-300 hover:text-red-500 bg-transparent hover:bg-red-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 mx-auto block">
                                <Trash2 size={16} />
                             </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900 border-t border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6 text-white shrink-0 relative z-20">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">知識、理解</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-blue-400">{totals.knowledge.score}</span>
                      <span className="text-sm font-medium text-slate-500">/ {totals.knowledge.count} 題</span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-slate-800"></div>
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">應用、分析</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-indigo-400">{totals.application.score}</span>
                      <span className="text-sm font-medium text-slate-500">/ {totals.application.count} 題</span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-slate-800"></div>
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">評鑑、創造</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-violet-400">{totals.evaluation.score}</span>
                      <span className="text-sm font-medium text-slate-500">/ {totals.evaluation.count} 題</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 bg-white/5 py-3 px-6 rounded-2xl border border-white/10">
                  <div className="text-right">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">總題數</p>
                    <p className="text-2xl font-bold text-white">{totals.totalCount}</p>
                  </div>
                  <div className="w-px h-10 bg-slate-700"></div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">總分數</p>
                    <p className="text-4xl font-black text-emerald-400 drop-shadow-sm">{totals.totalScore}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
