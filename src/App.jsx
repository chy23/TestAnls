import React, { useState } from 'react';
import { Upload, FileText, Download, Plus, Trash2, Settings, Table as TableIcon } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function App() {
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
      cognitiveScores: {
        knowledge: { count: 0, score: 0 },
        application: { count: 0, score: 0 },
        evaluation: { count: 0, score: 0 }
      }
    }
  ]);

  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setBasicInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleTableDataChange = (id, field, value) => {
    setTableData(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
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

  const exportToExcel = () => {
    // Basic implementation for exporting the table
    const ws = XLSX.utils.json_to_sheet(tableData.map(row => ({
      '單元名稱': row.unitName,
      '學習表現': row.learningPerformance,
      '學習內容': row.learningContent,
      '知識/理解 (題數)': row.cognitiveScores.knowledge.count,
      '知識/理解 (佔分)': row.cognitiveScores.knowledge.score,
      '應用/分析 (題數)': row.cognitiveScores.application.count,
      '應用/分析 (佔分)': row.cognitiveScores.application.score,
      '評鑑/創造 (題數)': row.cognitiveScores.evaluation.count,
      '評鑑/創造 (佔分)': row.cognitiveScores.evaluation.score,
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "雙向細目表");
    XLSX.writeFile(wb, "TestAnalysis.xlsx");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <TableIcon className="text-blue-600" size={32} />
              試題雙向細目表系統
            </h1>
            <p className="text-slate-500 mt-2">自動化生成與分析試卷雙向細目表</p>
          </div>
          <div className="flex gap-3">
             <button onClick={exportToExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium">
              <Download size={18} />
              匯出 Excel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Basic Info & File Uploads */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Title Settings */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-semibold mb-5 flex items-center gap-2 text-slate-800">
                <Settings size={20} className="text-blue-500" />
                標題設定
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">學年度</label>
                    <input type="text" name="academicYear" value={basicInfo.academicYear} onChange={handleBasicInfoChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例如: 112" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">學期</label>
                    <input type="text" name="semester" value={basicInfo.semester} onChange={handleBasicInfoChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例如: 上" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">年級</label>
                    <input type="text" name="grade" value={basicInfo.grade} onChange={handleBasicInfoChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例如: 三" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">科目</label>
                    <input type="text" name="subject" value={basicInfo.subject} onChange={handleBasicInfoChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例如: 國語" />
                  </div>
                </div>
              </div>
            </div>

            {/* Test Basic Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-semibold mb-5 flex items-center gap-2 text-slate-800">
                <FileText size={20} className="text-blue-500" />
                試卷基本資料
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">評量範圍</label>
                  <input type="text" name="scope" value={basicInfo.scope} onChange={handleBasicInfoChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="版第 X 冊第 Y 章" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">評量時間</label>
                  <input type="text" name="time" value={basicInfo.time} onChange={handleBasicInfoChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">命題教師</label>
                    <input type="text" name="setter" value={basicInfo.setter} onChange={handleBasicInfoChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">審題教師</label>
                    <input type="text" name="reviewer" value={basicInfo.reviewer} onChange={handleBasicInfoChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Upload Area */}
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-6 rounded-2xl shadow-md text-white">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload size={20} />
                智慧分析 (AI)
              </h2>
              <p className="text-sm text-blue-100 mb-5">上傳參考資料或試卷，系統將自動擷取資訊並分類填入表格。</p>
              
              <div className="space-y-4">
                <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm hover:bg-white/20 transition cursor-pointer">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload size={24} className="text-white" />
                    <span className="font-medium">上傳參考資料 (擷取單元/學習重點)</span>
                    <span className="text-xs text-blue-200">支援 PDF, Word</span>
                  </div>
                </div>

                <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm hover:bg-white/20 transition cursor-pointer">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload size={24} className="text-white" />
                    <span className="font-medium">上傳試卷 (自動分類題型/佔分)</span>
                    <span className="text-xs text-blue-200">支援 PDF, Word</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          {/* Right Column: Two-Way Table */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Table Preview Document Header */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                  新北市林口區麗園國小 ( {basicInfo.academicYear} ) 學年度第 ( {basicInfo.semester} ) 學期定期評量
                </h2>
                <h3 className="text-xl font-semibold text-slate-700 mt-2">
                  {basicInfo.grade} 年級 {basicInfo.subject} 科試題雙向細目表
                </h3>
              </div>

              <div className="mb-6 space-y-1 text-slate-700">
                <p className="font-bold">一、 試卷基本資料</p>
                <p className="pl-6">(一) 評量範圍： {basicInfo.scope}</p>
                <p className="pl-6">(二) 評量時間： {basicInfo.time}</p>
                <p className="pl-6">(三) 命題教師： {basicInfo.setter}</p>
                <p className="pl-6">(四) 審題教師： {basicInfo.reviewer}</p>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <p className="font-bold text-slate-700">二、 試卷雙向細目表</p>
                <button onClick={addRow} className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium border border-blue-200">
                  <Plus size={16} /> 新增列
                </button>
              </div>

              <table className="w-full border-collapse border border-slate-800 text-sm">
                <thead>
                  <tr>
                    <th className="border border-slate-800 p-2 w-32" rowSpan="2">單元名稱</th>
                    <th className="border border-slate-800 p-2" colSpan="2">學習重點<br/><span className="font-normal text-xs">(以編碼呈現)</span></th>
                    <th className="border border-slate-800 p-2" rowSpan="2">題型</th>
                    <th className="border border-slate-800 p-2" colSpan="6">認知領域的目標層次</th>
                    <th className="border border-slate-800 p-2 w-16" rowSpan="2">題數<br/>分配</th>
                    <th className="border border-slate-800 p-2 w-16" rowSpan="2">分數<br/>分配</th>
                    <th className="border border-slate-800 p-2 w-10" rowSpan="2"></th>
                  </tr>
                  <tr>
                    <th className="border border-slate-800 p-2 w-24">學習表現</th>
                    <th className="border border-slate-800 p-2 w-24">學習內容</th>
                    <th className="border border-slate-800 p-2 w-12">題數</th>
                    <th className="border border-slate-800 p-2 w-12">佔分</th>
                    <th className="border border-slate-800 p-2 w-12">題數</th>
                    <th className="border border-slate-800 p-2 w-12">佔分</th>
                    <th className="border border-slate-800 p-2 w-12">題數</th>
                    <th className="border border-slate-800 p-2 w-12">佔分</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Knowledge/理解, 應用/分析, 評鑑/創造 headers inner row */}
                  <tr>
                    <td className="border border-slate-800 p-1 bg-slate-100" colSpan="4"></td>
                    <td className="border border-slate-800 p-1 text-center font-medium bg-slate-50" colSpan="2">知識、理解</td>
                    <td className="border border-slate-800 p-1 text-center font-medium bg-slate-50" colSpan="2">應用、分析</td>
                    <td className="border border-slate-800 p-1 text-center font-medium bg-slate-50" colSpan="2">評鑑、創造</td>
                    <td className="border border-slate-800 p-1 bg-slate-100" colSpan="3"></td>
                  </tr>

                  {tableData.map((row, index) => {
                    const rowCount = row.cognitiveScores.knowledge.count + row.cognitiveScores.application.count + row.cognitiveScores.evaluation.count;
                    const rowScore = row.cognitiveScores.knowledge.score + row.cognitiveScores.application.score + row.cognitiveScores.evaluation.score;
                    
                    return (
                    <tr key={row.id}>
                      <td className="border border-slate-800 p-0">
                        <input type="text" value={row.unitName} onChange={(e) => handleTableDataChange(row.id, 'unitName', e.target.value)} className="w-full h-full p-2 outline-none text-center focus:bg-blue-50" placeholder="單元" />
                      </td>
                      <td className="border border-slate-800 p-0">
                        <input type="text" value={row.learningPerformance} onChange={(e) => handleTableDataChange(row.id, 'learningPerformance', e.target.value)} className="w-full h-full p-2 outline-none text-center focus:bg-blue-50" />
                      </td>
                      <td className="border border-slate-800 p-0">
                        <input type="text" value={row.learningContent} onChange={(e) => handleTableDataChange(row.id, 'learningContent', e.target.value)} className="w-full h-full p-2 outline-none text-center focus:bg-blue-50" />
                      </td>
                      <td className="border border-slate-800 p-0">
                        <input type="text" className="w-full h-full p-2 outline-none text-center focus:bg-blue-50" placeholder="選擇" />
                      </td>
                      
                      {/* Knowledge */}
                      <td className="border border-slate-800 p-0">
                        <input type="number" min="0" value={row.cognitiveScores.knowledge.count || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'knowledge', 'count', e.target.value)} className="w-full h-full p-2 outline-none text-center focus:bg-blue-50" />
                      </td>
                      <td className="border border-slate-800 p-0">
                        <input type="number" min="0" value={row.cognitiveScores.knowledge.score || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'knowledge', 'score', e.target.value)} className="w-full h-full p-2 outline-none text-center focus:bg-blue-50" />
                      </td>

                      {/* Application */}
                      <td className="border border-slate-800 p-0">
                        <input type="number" min="0" value={row.cognitiveScores.application.count || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'application', 'count', e.target.value)} className="w-full h-full p-2 outline-none text-center focus:bg-blue-50" />
                      </td>
                      <td className="border border-slate-800 p-0">
                        <input type="number" min="0" value={row.cognitiveScores.application.score || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'application', 'score', e.target.value)} className="w-full h-full p-2 outline-none text-center focus:bg-blue-50" />
                      </td>

                      {/* Evaluation */}
                      <td className="border border-slate-800 p-0">
                        <input type="number" min="0" value={row.cognitiveScores.evaluation.count || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'evaluation', 'count', e.target.value)} className="w-full h-full p-2 outline-none text-center focus:bg-blue-50" />
                      </td>
                      <td className="border border-slate-800 p-0">
                        <input type="number" min="0" value={row.cognitiveScores.evaluation.score || ''} onChange={(e) => handleCognitiveScoreChange(row.id, 'evaluation', 'score', e.target.value)} className="w-full h-full p-2 outline-none text-center focus:bg-blue-50" />
                      </td>

                      <td className="border border-slate-800 p-2 text-center font-semibold bg-slate-50">{rowCount > 0 ? rowCount : ''}</td>
                      <td className="border border-slate-800 p-2 text-center font-semibold bg-slate-50">{rowScore > 0 ? rowScore : ''}</td>
                      <td className="border border-slate-800 p-1 text-center bg-white">
                         <button onClick={() => removeRow(row.id)} className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition">
                            <Trash2 size={16} />
                         </button>
                      </td>
                    </tr>
                  )})}

                  {/* Totals Row */}
                  <tr className="font-bold bg-slate-100">
                    <td className="border border-slate-800 p-3 text-center" colSpan="4">分 數 小 計</td>
                    <td className="border border-slate-800 p-2 text-center">{totals.knowledge.count}</td>
                    <td className="border border-slate-800 p-2 text-center text-blue-600">{totals.knowledge.score}</td>
                    <td className="border border-slate-800 p-2 text-center">{totals.application.count}</td>
                    <td className="border border-slate-800 p-2 text-center text-blue-600">{totals.application.score}</td>
                    <td className="border border-slate-800 p-2 text-center">{totals.evaluation.count}</td>
                    <td className="border border-slate-800 p-2 text-center text-blue-600">{totals.evaluation.score}</td>
                    <td className="border border-slate-800 p-2 text-center text-emerald-600">{totals.totalCount}</td>
                    <td className="border border-slate-800 p-2 text-center text-emerald-600">{totals.totalScore}</td>
                    <td className="border border-slate-800 p-2"></td>
                  </tr>

                </tbody>
              </table>

              <div className="mt-4 text-sm text-slate-500 space-y-1">
                <p>※ 命題教師請將所命試卷中，每一道試題依照其單元及所屬認知領域的目標層次，填入上表中。</p>
                <p>※ 表格列數請依需求自行增減。</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
