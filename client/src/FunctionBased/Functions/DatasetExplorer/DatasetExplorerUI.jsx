import React, { useState } from 'react';
import { Bot, Sparkles, Send } from 'lucide-react';

// Import existing MatFlow components
import DatasetDisplay from '../Dataset/DatasetDisplay';
import DatasetStatistics from '../Dataset/DatasetStatistics';
import UnifiedEDA from '../EDA/UnifiedEDA';
import UnifiedFeatureEngineering from '../Feature Engineering/UnifiedFeatureEngineering';

export default function DatasetExplorerUI({ csvData, setCsvData, activeFunction = 'Data Table' }) {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your AI Data Lab Assistant. I've analyzed your uploaded dataset. How would you like to proceed? I can help you impute missing values, drop columns, or generate visualizations."
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newUserMessage = { role: 'user', content: chatInput };
    setChatHistory([...chatHistory, newUserMessage]);
    setChatInput('');
    setIsTyping(true);

    // Mock LLM Response
    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I can write a Python snippet to perform that operation, or you can use the 'Data Preparation' tab to apply it visually. For now, this chat is a UI placeholder ready to be connected to your backend LLM router!"
        }
      ]);
      setIsTyping(false);
    }, 1500);
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
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                }`}
              >
                {msg.content}
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
