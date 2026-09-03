// 網站建立自楊家驊老師 The website was created by Teacher ChiahuaYang
import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Plus, Trash2, Settings, Table as TableIcon, Sparkles, Key, AlertCircle, Loader2, LayoutGrid, CheckCircle2, FileUp, ExternalLink, Info, X, History, Tag, Eye, EyeOff } from 'lucide-react';
import { saveAs } from 'file-saver';
import syllabusData from './data/syllabus.json';

// ─── 版本更新紀錄 ───────────────────────────────────────────
const CHANGELOG = [
  {
    version: 'v2.6.2',
    date: '2026-09-03',
    title: '模型使用順序更新',
    details: '根據需求，將 AI 模型的備援使用順序調整為：1. gemini-3.8-flash 2. gemini-3.7-flash 3. gemini-3.6-flash 4. gemini-3.1-pro-preview',
    bugFixes: [],
  },
  {
    version: 'v2.6.1',
    date: '2026-08-15',
    title: '模型使用順序調整',
    details: '根據需求，將 AI 模型的備援使用順序調整為：1. gemini-3.7-flash 2. gemini-3.6-flash 3. gemini-3.5-flash 4. gemini-3.1-pro-preview',
    bugFixes: [],
  },
  {
    version: 'v2.6.0',
    date: '2026-08-15',
    title: 'UI/UX 全面升級（10 項優化）',
    details: '① 自訂精美確認對話框取代瀏覽器原生彈窗；② 錯誤/成功訊息 4 秒後自動消失並可手動關閉；③ API Key 新增眼睛圖示可切換明文/密文顯示；④ 刪除列按鈕改為常駐淡色顯示；⑤ 表格欄位加寬改善資訊顯示；⑥ 上傳區塊新增移除已選檔案功能；⑦ 手機版 Header 響應式優化；⑧ 表格加入空狀態引導說明；⑨ 分析按鈕 disabled 時顯示 tooltip 提示；⑩ 底部統計列在各裝置下版面修正。修復了因舊版 localStorage 缺漏造成的致命白屏錯誤，並調整 Hooks 順序。',
    bugFixes: ['修復畫面空白致命錯誤 (localStorage 格式相容性)', '修復開發環境 HMR 重新載入時 React Hooks 順序崩潰問題'],
  },
  {
    version: 'v2.5.0',
    date: '2026-08-14',
    title: '模型備援鏈升級',
    details: '實作 AI 模型自動備援順序機制。分析完成後顯示實際使用模型名稱。',
    bugFixes: [],
  },
  {
    version: 'v2.4.0',
    date: '2026-08-06',
    title: '自動部署與拖曳上傳全面修復',
    details: '建立 GitHub Actions 自動化部署流程（每次 push 自動發布至 GitHub Pages）。將拖曳上傳的實作方式改為全尺寸透明原生 file input 覆蓋，解決所有瀏覽器相容問題。',
    bugFixes: ['修正拖曳至子元件時 dragLeave 誤觸發導致視覺閃爍的問題', '修正 GitHub Action 第一次跑失敗（npm ci 改為 npm install）'],
  },
  {
    version: 'v2.3.0',
    date: '2026-08-05',
    title: 'UX 全面優化與程式碼分割',
    details: '加入拖曳上傳 (Drag & Drop) 視覺效果；實作 LocalStorage 自動暫存，防止重整資料流失；AI 分析中加入動態輪播文字；使用動態 import() 分割大型套件，網頁初始載入速度大幅提升。',
    bugFixes: ['強制 AI 以 application/json 格式輸出，杜絕 JSON 解析失敗問題'],
  },
  {
    version: 'v2.2.0',
    date: '2026-08-05',
    title: '浮水印與隱藏版權',
    details: '在網頁右上及右下角加入 18pt、25% 透明度的灰色浮水印「網站建立自楊家驊老師」，定位避免與主要內容重疊。同時於程式碼中加入隱藏版權備註。',
    bugFixes: [],
  },
  {
    version: 'v2.1.0',
    date: '2026-07-25',
    title: 'API Key 申請說明彈出視窗',
    details: '點擊分析但未填 API Key 時，自動彈出精美對話框，說明申請流程、費用資訊及申請連結，不再以常駐面板形式顯示。',
    bugFixes: [],
  },
  {
    version: 'v2.0.0',
    date: '2026-07-25',
    title: '全介面 UI 重新設計',
    details: '整體介面大改版：採用玻璃擬態 (Glassmorphism) 視覺風格、漸層背景光暈、卡片陰影效果。版面改為兩欄式佈局，左側為表格區、右側為 AI 設定區，並調整為響應式排版。',
    bugFixes: ['修正表格欄位被擠壓的版面問題', '修正 Word 匯出時欄寬比例不正確的問題'],
  },
  {
    version: 'v1.9.0',
    date: '2026-07-25',
    title: '清除資料按鈕',
    details: '新增「清除所有資料並重新開始」按鈕，點擊後跳出確認視窗，確認後清空所有上傳檔案、表格資料及 LocalStorage 暫存記錄。',
    bugFixes: [],
  },
  {
    version: 'v1.8.0',
    date: '2026-07-25',
    title: 'AI Prompt 精準化',
    details: '優化 AI 分析 Prompt：要求題型欄位必須直接提取考卷上的大題標題（如「一、選擇題」），不再自行命名。同時要求同一單元的 unitName 必須完全一致以便合併顯示。',
    bugFixes: [],
  },
  {
    version: 'v1.7.0',
    date: '2026-07-25',
    title: '自訂應用程式圖示',
    details: '加入自訂的 TestAnls 應用程式 icon，顯示於瀏覽器分頁標籤上。',
    bugFixes: [],
  },
  {
    version: 'v1.6.0',
    date: '2026-07-25',
    title: '單元列合併顯示 (rowSpan)',
    details: '相同單元名稱的列在 UI 表格中合併顯示（rowSpan），單元名稱、學習表現、學習內容欄位視覺上合而為一，整體更清晰易讀。',
    bugFixes: [],
  },
  {
    version: 'v1.5.0',
    date: '2026-07-25',
    title: '內建 108 課綱資料庫',
    details: '整合內建課綱 JSON 資料（國語、數學、社會、自然），AI 分析時自動比對課綱編碼，無需上傳外部課綱資料也能精準對應學習表現與學習內容。',
    bugFixes: [],
  },
  {
    version: 'v1.4.0',
    date: '2026-07-25',
    title: 'Word 匯出與 AI 自動填表',
    details: '新增匯出精美 Word 功能（.docx 格式），包含雙向細目表完整格式與備註說明。AI 分析後自動填入試卷學年、學期、年級、科目等基本資訊。支援同時上傳多份課本參考檔案。',
    bugFixes: [],
  },
  {
    version: 'v1.3.0',
    date: '2026-07-25',
    title: '課本檔案上傳支援',
    details: '新增課本/參考資料上傳區，支援 PDF、DOCX、圖片格式。AI 可根據課本內容自動推導各單元名稱及對應的 108 課綱學習表現與學習內容編碼。',
    bugFixes: [],
  },
  {
    version: 'v1.2.0',
    date: '2026-07-25',
    title: 'GitHub Pages 初次部署',
    details: '設定 Vite base path，成功將網站部署至 GitHub Pages (https://chy23.github.io/TestAnls)，支援公開網路存取。',
    bugFixes: ['修正 base path 設定錯誤導致資源 404 的問題'],
  },
  {
    version: 'v1.1.0',
    date: '2026-07-24',
    title: 'Google Gemini AI 整合',
    details: '整合 Google Gemini AI 分析功能，使用者可輸入 API Key 後上傳考卷，AI 自動分析並填入雙向細目表。支援 PDF 與圖片格式的考卷辨識。',
    bugFixes: [],
  },
  {
    version: 'v1.0.0',
    date: '2026-07-24',
    title: '初始建立',
    details: '建立 TestAnls 雙向細目表分析系統的基礎架構。包含試卷基本資料填寫區（學年、學期、年級、科目、範圍、時間、命題者、審題者）及可手動編輯的雙向細目表（單元、學習表現、學習內容、題型、知識/應用/評鑑題數與分數）。',
    bugFixes: [],
  },
];

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [basicInfo, setBasicInfo] = useState(() => {
    const saved = localStorage.getItem('testAnls_basicInfo');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      academicYear: '',
      semester: '',
      grade: '',
      subject: '',
      scope: '',
      time: '40 分鐘',
      setter: '',
      reviewer: ''
    };
  });

  const [tableData, setTableData] = useState(() => {
    const defaultRow = { 
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
    };
    const saved = localStorage.getItem('testAnls_tableData');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved); 
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(row => ({
            ...defaultRow,
            ...row,
            cognitiveScores: {
              knowledge: { ...defaultRow.cognitiveScores.knowledge, ...(row.cognitiveScores?.knowledge || {}) },
              application: { ...defaultRow.cognitiveScores.application, ...(row.cognitiveScores?.application || {}) },
              evaluation: { ...defaultRow.cognitiveScores.evaluation, ...(row.cognitiveScores?.evaluation || {}) }
            }
          }));
        }
      } catch (e) { console.error(e); }
    }
    return [ { ...defaultRow } ];
  });

  useEffect(() => {
    localStorage.setItem('testAnls_basicInfo', JSON.stringify(basicInfo));
  }, [basicInfo]);

  useEffect(() => {
    localStorage.setItem('testAnls_tableData', JSON.stringify(tableData));
  }, [tableData]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingText, setLoadingText] = useState('準備分析中...');
  const [syllabusFiles, setSyllabusFiles] = useState([]);
  const [testPaperFile, setTestPaperFile] = useState(null);
  const [showApiHelp, setShowApiHelp] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isDraggingSyllabus, setIsDraggingSyllabus] = useState(false);
  const [isDraggingTestPaper, setIsDraggingTestPaper] = useState(false);

  const doReset = () => {
    localStorage.removeItem('testAnls_basicInfo');
    localStorage.removeItem('testAnls_tableData');
    setSyllabusFiles([]);
    setTestPaperFile(null);
    setTableData([{ id: Date.now(), unitName: '', learningPerformance: '', learningContent: '', questionType: '選擇題', cognitiveScores: { knowledge: { count: 0, score: 0 }, application: { count: 0, score: 0 }, evaluation: { count: 0, score: 0 } } }]);
    setBasicInfo({ academicYear: '', semester: '', grade: '', subject: '', scope: '', time: '40 分鐘', setter: '', reviewer: '' });
    setError(null);
    setSuccessMsg('資料已全數清除，可以重新開始分析了！');
    setShowConfirmReset(false);
  };


  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      const texts = ['正在閱讀課綱與試卷...', '正在分析試卷內容...', '正在統整認知層次...', '正在產生雙向細目表...'];
      let i = 0;
      setLoadingText(texts[0]);
      interval = setInterval(() => {
        i = (i + 1) % texts.length;
        setLoadingText(texts[i]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  useEffect(() => {
    const preventDefault = (e) => {
      if (e.target.type !== 'file') {
        e.preventDefault();
      }
    };
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
    setShowApiHelp(false);
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
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, VerticalAlign } = await import('docx');
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
    if (!apiKey) { 
      setError("請先填寫 API Key 才能進行自動分析！"); 
      setShowApiHelp(true);
      setSuccessMsg(null); 
      return; 
    }
    if (!testPaperFile) { setError("請上傳一份試卷檔案供 AI 進行分析！"); setSuccessMsg(null); return; }

    setIsAnalyzing(true); setError(null); setSuccessMsg(null);

    try {
      const { GoogleGenAI } = await import('@google/genai');
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

      const MODEL_FALLBACK_CHAIN = [
        'gemini-3.8-flash',
        'gemini-3.7-flash',
        'gemini-3.6-flash',
        'gemini-3.1-pro-preview',
      ];

      // 嘗試備援鏈中的每一個模型
      let response = null;
      let usedModel = null;
      let lastError = null;

      for (const modelName of MODEL_FALLBACK_CHAIN) {
        try {
          response = await ai.models.generateContent({ 
            model: modelName, 
            contents,
            config: { responseMimeType: "application/json" }
          });
          usedModel = modelName;
          break;
        } catch (modelErr) {
          lastError = modelErr;
          console.warn(`模型 ${modelName} 失敗，嘗試下一個...`, modelErr.message);
        }
      }

      if (!response) {
        throw lastError || new Error("所有備援模型均無法完成分析，請稍後再試。");
      }

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
          setSuccessMsg(`AI 分析成功！（使用模型：${usedModel}）試卷基本設定與雙向細目表已自動更新。`);
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
          <div className="flex items-center gap-3">
            <button onClick={() => setShowChangelog(true)} className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 border border-slate-200 px-4 py-2.5 rounded-xl transition-all font-semibold text-sm shadow-sm hover:-translate-y-0.5 active:translate-y-0">
              <History size={16} />
              更新紀錄
              <span className="ml-0.5 text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold">{CHANGELOG[0].version}</span>
            </button>
            <button onClick={exportToWord} className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-all font-semibold text-sm shadow-xl shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0">
              <FileText size={18} />
              匯出精美 Word
            </button>
          </div>
        </div>
      </header>

      {/* Changelog Modal */}
      {showChangelog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowChangelog(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <History size={18} className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">版本更新紀錄</h2>
                  <p className="text-xs text-slate-500">TestAnls · Intelligent Exam Analysis</p>
                </div>
              </div>
              <button onClick={() => setShowChangelog(false)} className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {CHANGELOG.map((entry, idx) => (
                <div key={entry.version} className={`relative pl-5 border-l-2 ${idx === 0 ? 'border-indigo-400' : 'border-slate-200'}`}>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${idx === 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                      <Tag size={10} />
                      {entry.version}
                    </span>
                    <span className="text-sm font-bold text-slate-800">{entry.title}</span>
                    {idx === 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">最新版本</span>}
                    <span className="text-xs text-slate-400 ml-auto">{entry.date}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{entry.details}</p>
                  {entry.bugFixes.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {entry.bugFixes.map((fix, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-red-600">
                          <span className="mt-0.5 shrink-0">🐛</span>
                          <span>{fix}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <p className="text-xs text-slate-400">共 {CHANGELOG.length} 個版本紀錄</p>
              <button onClick={() => setShowChangelog(false)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                關閉
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Top Right Watermark */}
      <div className="fixed top-32 right-6 text-[18pt] text-slate-500/25 font-bold pointer-events-none select-none z-40">
        網站建立自楊家驊老師
      </div>

      {/* Bottom Right Watermark */}
      <div className="fixed bottom-6 right-6 text-[18pt] text-slate-500/25 font-bold pointer-events-none select-none z-40">
        網站建立自楊家驊老師
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8 relative z-10">
        
        {error && (
          <div className="bg-red-50/80 backdrop-blur-md border border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3 shadow-lg shadow-red-500/5 animate-in slide-in-from-top-4">
            <AlertCircle className="shrink-0 mt-0.5 text-red-500" size={20} />
            <p className="text-sm font-medium flex-1">{error}</p>
            <button onClick={() => setError(null)} className="shrink-0 text-red-400 hover:text-red-600 transition-colors"><X size={16} /></button>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50/80 backdrop-blur-md border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-start gap-3 shadow-lg shadow-emerald-500/5 animate-in slide-in-from-top-4">
            <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-500" size={20} />
            <p className="text-sm font-medium flex-1">{successMsg}</p>
            <button onClick={() => setSuccessMsg(null)} className="shrink-0 text-emerald-500 hover:text-emerald-700 transition-colors"><X size={16} /></button>
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
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">API Key (不記錄於本地端)</label>
                    <div className="relative">
                      <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type={showApiKey ? 'text' : 'password'} 
                        value={apiKey} 
                        onChange={handleApiKeyChange} 
                        className="w-full pl-10 pr-10 py-3 bg-white/80 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-mono placeholder:font-sans shadow-sm" 
                        placeholder="請貼上您的 Google Gemini API Key..." 
                      />
                      <button type="button" onClick={() => setShowApiKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label 
                        className={`flex items-center gap-3 p-4 bg-white/80 border ${isDraggingSyllabus ? 'border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-200' : 'border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/50'} rounded-xl cursor-pointer transition-all shadow-sm group relative overflow-hidden`}
                        onDragEnter={() => setIsDraggingSyllabus(true)}
                        onDragLeave={() => setIsDraggingSyllabus(false)}
                        onDrop={() => setIsDraggingSyllabus(false)}
                      >
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" multiple accept=".pdf,.docx,.jpg,.png" onChange={e => { setSyllabusFiles(Array.from(e.target.files)); setIsDraggingSyllabus(false); }} />
                        {isDraggingSyllabus && <div className="absolute inset-0 bg-indigo-500/5 backdrop-blur-[1px] pointer-events-none z-10"></div>}
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors pointer-events-none relative z-20">
                          <FileUp size={18} className="text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0 pointer-events-none relative z-20">
                          <p className="text-sm font-semibold text-slate-700 truncate">上傳課本內容 (可點擊或拖曳)</p>
                          <p className="text-xs text-slate-400 truncate">{syllabusFiles.length > 0 ? `已選取 ${syllabusFiles.length} 個檔案` : '選填：供 AI 分類單元與課綱'}</p>
                        </div>
                      </label>
                      {syllabusFiles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 pl-1">
                          {syllabusFiles.map((f, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full max-w-[160px]">
                              <span className="truncate">{f.name}</span>
                              <button type="button" onClick={() => setSyllabusFiles(prev => prev.filter((_, idx) => idx !== i))} className="shrink-0 hover:text-red-500 transition-colors ml-0.5"><X size={10} /></button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label 
                        className={`flex items-center gap-3 p-4 bg-white/80 border ${isDraggingTestPaper ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200' : 'border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/50'} rounded-xl cursor-pointer transition-all shadow-sm group relative overflow-hidden`}
                        onDragEnter={() => setIsDraggingTestPaper(true)}
                        onDragLeave={() => setIsDraggingTestPaper(false)}
                        onDrop={() => setIsDraggingTestPaper(false)}
                      >
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" accept=".pdf,.docx,.jpg,.png" onChange={e => { setTestPaperFile(e.target.files[0]); setIsDraggingTestPaper(false); }} />
                        {isDraggingTestPaper && <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[1px] pointer-events-none z-10"></div>}
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors pointer-events-none relative z-20">
                          <Upload size={18} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0 pointer-events-none relative z-20">
                          <p className="text-sm font-semibold text-slate-700 truncate">上傳測驗考卷 (可點擊或拖曳)</p>
                          <p className="text-xs text-slate-400 truncate">{testPaperFile ? testPaperFile.name : '準備交給 AI 分析'}</p>
                        </div>
                      </label>
                      {testPaperFile && (
                        <div className="mt-2 pl-1">
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full max-w-full">
                            <span className="truncate">{testPaperFile.name}</span>
                            <button type="button" onClick={() => setTestPaperFile(null)} className="shrink-0 hover:text-red-500 transition-colors ml-0.5"><X size={10} /></button>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <div className="relative group/analyze">
                    <button 
                      onClick={handleAIAnalysis}
                      disabled={isAnalyzing || !testPaperFile}
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? <><Loader2 size={18} className="animate-spin" /> {loadingText}</> : '開始 AI 自動分析'}
                    </button>
                    {!testPaperFile && !isAnalyzing && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/analyze:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
                        請先上傳測驗考卷才能分析
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => setShowConfirmReset(true)}
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
                             <button onClick={() => removeRow(row.id)} className="text-slate-300 hover:text-red-500 bg-transparent hover:bg-red-50 p-2 rounded-lg transition-all mx-auto block">
                                <Trash2 size={16} />
                             </button>
                          </td>
                        </tr>
                        );
                      })}{tableData.length === 1 && !tableData[0].unitName && !tableData[0].learningPerformance && !tableData[0].learningContent && (
                        <tr><td colSpan={11} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-slate-400">
                            <TableIcon size={36} className="opacity-30" />
                            <p className="text-sm font-semibold">表格目前是空的</p>
                            <p className="text-xs">請上傳考卷後點擊「開始 AI 自動分析」，或點擊右上角「新增列」手動填寫</p>
                          </div>
                        </td></tr>
                      )}
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

      {showApiHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-5">
              <AlertCircle size={32} strokeWidth={2.5} />
            </div>
            
            <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">需要 API Key</h3>
            
            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium">
              系統需要 Google Gemini API Key 才能閱讀與分析考卷。
            </p>
            
            <div className="w-full text-left mb-8">
              <p className="font-bold text-red-500 mb-1.5 flex items-center gap-1.5 text-sm">
                <span className="text-base">⚠️</span> 費用提醒：
              </p>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Gemini API 目前提供一定的免費額度，但若用量大或綁定信用卡，可能會產生費用，請務必留意官方計費標準。
              </p>
            </div>
            
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="w-full py-3.5 bg-[#5b45ff] hover:bg-[#4b35e0] text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 mb-3 flex items-center justify-center tracking-wide">
              前往申請 API Key
            </a>
            
            <button onClick={() => setShowApiHelp(false)} className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-all tracking-wide">
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* Confirm Reset Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowConfirmReset(false)}>
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-5">
              <Trash2 size={30} strokeWidth={2} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">確定要清除所有資料？</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-8">所有上傳的檔案、表格內容與基本設定都將被清除，此操作無法復原。</p>
            <div className="w-full flex flex-col gap-3">
              <button onClick={doReset} className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-md shadow-rose-500/20 tracking-wide">
                確定清除
              </button>
              <button onClick={() => setShowConfirmReset(false)} className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-all tracking-wide">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
