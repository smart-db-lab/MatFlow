import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Send } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { setReRender, setActiveFile } from '../../../Slices/UploadedFileSlice';
import { updateDataInIndexedDB } from '../../../util/indexDB';
import { apiService } from '../../../services/api/apiService';
import { CreateFile } from '../../../util/utils';

// Import existing MatFlow components
import DatasetDisplay from '../Dataset/DatasetDisplay';
import DatasetStatistics from '../Dataset/DatasetStatistics';
import UnifiedEDA from '../EDA/UnifiedEDA';
import UnifiedFeatureEngineering from '../Feature Engineering/UnifiedFeatureEngineering';

export default function DatasetExplorerUI({ csvData, setCsvData, activeFunction = 'Data Table' }) {
  const dispatch = useDispatch();
  const { projectId } = useParams();
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const activeFolder = useSelector((state) => state.uploadedFile.activeFolder);
  const render = useSelector((state) => state.uploadedFile.rerender);
  
  const [chatInput, setChatInput] = useState('');
  
  const sessionKey = `chatHistory_${activeCsvFile?.name || 'default'}`;

  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = sessionStorage.getItem(sessionKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse chat history", e);
    }
    return [
      {
        role: 'assistant',
        content: "Hello! I am your AI Data Lab Assistant. I've analyzed your uploaded dataset. How would you like to proceed? I can help you impute missing values, drop columns, or generate visualizations."
      }
    ];
  });

  useEffect(() => {
    if (activeCsvFile?.name && chatHistory.length > 0) {
       sessionStorage.setItem(sessionKey, JSON.stringify(chatHistory));
    }
  }, [chatHistory, sessionKey, activeCsvFile]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    const newUserMessage = { role: 'user', content: userMessage };
    setChatHistory([...chatHistory, newUserMessage]);
    setChatInput('');
    setIsTyping(true);

    try {
      // Build Dataset Context
      const keys = csvData && csvData.length > 0 ? Object.keys(csvData[0]) : [];
      let missingValuesCount = {};
      if (csvData && csvData.length > 0) {
        keys.forEach(k => {
           missingValuesCount[k] = csvData.filter(row => row[k] === null || row[k] === '' || row[k] === undefined).length;
        });
      }
      
      const datasetContext = {
        columns: keys,
        row_count: csvData ? csvData.length : 0,
        missing_values: missingValuesCount
      };

      const response = await fetch(`${import.meta.env.VITE_APP_API_URL || 'http://localhost:8000'}/api/chatbot/lab_assistant/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          dataset_context: datasetContext,
          conversation_history: chatHistory.filter(m => m.role !== 'system')
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.message || "I've analyzed your request.",
          actions: data.actions || [] // Store the JSON actions for the UI
        }
      ]);

    } catch (err) {
      console.error("Chatbot API Error:", err);
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: Unable to connect to the Assistant API. Ensure your backend is running and keys are valid. (${err.message})`,
          isError: true
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const executeAction = async (action) => {
    try {
      if (!csvData || !activeCsvFile) {
        toast.error("No active dataset to modify!");
        return;
      }
      
      const fileName = activeCsvFile.name;
      const fn = action.function;
      const p = action.parameters;
      let newData = null;

      if (fn === 'SCALE_FEATURES') {
         newData = await apiService.matflow.featureEngineering.scaling({
          options: "Select Columns",
          method: p.method || "Min-Max Scaler",
          default_value: p.columns === "numerical" ? "Numerical" : (p.columns === "all" ? "All" : "Blank"),
          select_column: Array.isArray(p.columns) ? p.columns : [],
          file: csvData,
        });
      } 
      else if (fn === 'DROP_COLUMNS') {
         newData = await apiService.matflow.featureEngineering.dropColumn({
          default_value: "Blank",
          select_columns: p.columns,
          file: csvData,
        });
      }
      else if (fn === 'FILL_MISSING_VALUES') {
        let currentData = csvData;
        const columnsToImpute = Array.isArray(p.columns) ? p.columns : [p.columns];
        if (columnsToImpute[0]) {
            for (const col of columnsToImpute) {
               const res = await apiService.matflow.featureEngineering.imputationResult({
                strategy: p.strategy || 'mean',
                fill_group: "-",
                Select_columns: col,
                constant: p.constant_value || 0,
                file: currentData,
              });
              currentData = res.dataset ? res.dataset : res;
            }
        }
        newData = currentData;
      }
      else if (fn === 'RENAME_COLUMN') {
         newData = await apiService.matflow.featureEngineering.alterFieldName({
          number_of_columns: 1,
          data: [{ column_name: p.old_name, new_field_name: p.new_name }],
          file: csvData,
        });
      }
      else if (fn === 'CHANGE_DATA_TYPE') {
         // handle column or columns
         const colParam = p.column || p.columns;
         const cols = Array.isArray(colParam) ? colParam : [colParam];
         
         // safely map the dtype string to backend choices (int, float, str, complex)
         let dtypeMap = p.dtype || "str";
         dtypeMap = dtypeMap.toLowerCase();
         if (dtypeMap.includes('int')) dtypeMap = 'int';
         else if (dtypeMap.includes('float')) dtypeMap = 'float';
         else if (dtypeMap.includes('bool')) dtypeMap = 'int'; // bool -> int 0/1 is safer
         else if (dtypeMap.includes('object') || dtypeMap.includes('string')) dtypeMap = 'str';
         else dtypeMap = 'str'; // default fallback
         
         const dataPayload = cols.map(c => ({
            column_name: c,
            desired_dtype: dtypeMap,
            desired_bit_length: "64"
         }));
         
         newData = await apiService.matflow.featureEngineering.changeDtype({
          number_of_columns: cols.length,
          data: dataPayload,
          file: csvData,
        });
      }
      else {
        toast.error(`Unsupported Assistant action: ${fn}`);
        return;
      }

      if (newData) {
        // If dataset comes back nested (like imputation sometimes does)
        const resultingData = newData.dataset ? newData.dataset : newData;
        
        let cleanedFileName = fileName;
        if (cleanedFileName.startsWith('/')) {
            cleanedFileName = cleanedFileName.substring(1);
        }
        
        const baseName = cleanedFileName.replace(/\.csv$/i, '');
        const newFileName = `${baseName}_${fn.toLowerCase()}_${Math.floor(Date.now() / 1000).toString().slice(-4)}.csv`;

        // Push to server
        await CreateFile({
          projectId,
          data: resultingData,
          filename: newFileName,
          foldername: activeFolder || "",
        });

        // The UI tree components often expect the leading slash for files at root 
        const dbKeyName = fileName.startsWith('/') ? `/${newFileName}` : newFileName;

        // Cache in browser storage for instant reload
        await updateDataInIndexedDB(dbKeyName, resultingData);
        
        // Auto-switch UI to the new dataset output
        dispatch(setActiveFile({ name: dbKeyName }));
        dispatch(setReRender(!render));
        setCsvData(resultingData);
        toast.success(`Action executed successfully! Saved copy as ${newFileName}`);
      }

    } catch (err) {
      console.error(err);
      toast.error(`Failed to execute ${action.function}. See console.`);
    }
  };

  return (
    <div className="h-full w-full flex bg-[#f8fafc] overflow-hidden">
      {/* LEFT PANEL: The Unified Lab Views */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-slate-200 bg-white">
        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-auto p-4 bg-slate-50">
          <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-auto">
            {activeFunction === 'Data Table' && (
              <DatasetDisplay csvData={csvData} setCsvData={setCsvData} />
            )}
            {activeFunction === 'Statistics' && (
              <DatasetStatistics csvData={csvData} />
            )}
            {activeFunction === 'Visualizations' && (
              <UnifiedEDA csvData={csvData} />
            )}
            {activeFunction === 'Data Preparation' && (
              <UnifiedFeatureEngineering csvData={csvData} setCsvData={setCsvData} />
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: AI Lab Assistant */}
      <div className="w-[320px] xl:w-[380px] flex-shrink-0 bg-white flex flex-col h-full overflow-hidden shadow-[-4px_0_12px_rgba(0,0,0,0.03)] z-10">
        
        {/* Assistant Header */}
        <div className="px-4 py-4 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-indigo-50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-sm">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              Lab Assistant <Sparkles size={14} className="text-amber-500" />
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Powered by AI</p>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1 tracking-wider">
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </span>
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-teal-600 text-white rounded-tr-sm' 
                    : msg.isError ? 'bg-red-50 border border-red-200 text-red-700 rounded-tl-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                }`}
              >
                {msg.content}
                
                {/* Action Proposals */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.actions.map((act, actIdx) => (
                      <div key={actIdx} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-[11px] text-teal-700 bg-teal-100/50 px-2 py-0.5 rounded-full border border-teal-200 uppercase tracking-wider">
                            {act.function.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <pre className="text-[10px] text-slate-500 overflow-x-auto bg-white p-2 rounded border border-slate-100 mb-2">
                          {JSON.stringify(act.parameters, null, 2)}
                        </pre>
                        <button 
                          onClick={() => executeAction(act)}
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5"
                        >
                           <Sparkles size={12} /> Execute Action
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1 tracking-wider">Assistant</span>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1 shadow-sm">
                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Pre-built Suggestion Chips */}
        <div className="px-3 pb-2 pt-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 bg-white">
          <button onClick={() => setChatInput("Check for missing values")} className="flex-shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-[11px] font-medium transition-colors border border-slate-200">
            Check missing values
          </button>
          <button onClick={() => setChatInput("What are the most correlated features?")} className="flex-shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-[11px] font-medium transition-colors border border-slate-200">
            Find correlations
          </button>
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask for data insights or transformations..."
              className="w-full bg-slate-100 border-none rounded-xl pl-4 pr-10 py-3 text-sm focus:ring-2 focus:ring-teal-500/30 focus:bg-white transition-all outline-none"
            />
            <button 
              type="submit" 
              disabled={!chatInput.trim()}
              className="absolute right-2 p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
