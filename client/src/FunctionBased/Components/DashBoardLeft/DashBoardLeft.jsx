import React, { useEffect, useState, useRef } from "react";
import { FolderOpen, Plus } from "lucide-react";
import { useSelector } from "react-redux";
import FileTab from "../FileTab/FileTab";
import FunctionTab from "../FunctionTab/FunctionTab";

function DashBoardLeft({ projectId, projectName, onOpenModal }) {
  const showLeftSideBar = useSelector((state) => state.sideBar.showLeftSideBar);
  const [currentTab, setCurrentTab] = useState("file");
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const newDropdownRef = useRef(null);
  const activeFile = useSelector((state) => state.uploadedFile.activeFile);

  const handleClick = (name) => {
    if (name === "function" && (!activeFile || !activeFile.name)) {
      return;
    }
    setCurrentTab(name);
    localStorage.setItem("currentTab", name);
  };

  useEffect(() => {
    const storedCurrentTab = localStorage.getItem("currentTab");
    if (storedCurrentTab) setCurrentTab(storedCurrentTab);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (newDropdownRef.current && !newDropdownRef.current.contains(e.target)) {
        setShowNewDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="h-full relative flex flex-shrink-0 transition-all duration-300 ease-in-out"
      style={{ 
        width: showLeftSideBar ? '320px' : '0px',
        background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
        borderRight: showLeftSideBar ? '1px solid #e5e7eb' : 'none',
        boxShadow: showLeftSideBar ? '4px 0 16px rgba(0, 0, 0, 0.08)' : 'none',
        opacity: showLeftSideBar ? 1 : 0,
      }}
    >
      <div className="w-80 h-full flex flex-col overflow-hidden">
        {/* Header with actions */}
        <div className="px-2 pt-3 pb-2.5 flex items-center justify-start gap-2 bg-[#f8fafc] border-b border-slate-200">
          <button
            onClick={() => onOpenModal?.("projects")}
            className="flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:text-[#0D9488] hover:border-[#0D9488]/40 hover:bg-[#f0fdfa] transition-colors"
          >
            <FolderOpen size={14} className="text-[#0D9488]" />
            <span>Projects</span>
          </button>
          <div className="relative" ref={newDropdownRef}>
            <button
              onClick={() => setShowNewDropdown(!showNewDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0D9488] border border-[#0D9488] hover:bg-[#0F766E] transition-colors"
            >
              <Plus size={14} className="text-white" />
              <span>New</span>
            </button>
            {showNewDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 w-36 py-1">
                <button
                  onClick={() => { setShowNewDropdown(false); onOpenModal?.("create"); }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-[#0D9488] transition-colors"
                >
                  Create New
                </button>
                <button
                  onClick={() => { setShowNewDropdown(false); onOpenModal?.("sample"); }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-[#0D9488] transition-colors"
                >
                  Try Sample
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex font-sans border-b border-gray-200 text-gray-700 bg-white">
          <button
            className={`py-2 flex-1 text-sm transition-all duration-200 ${
              currentTab === "file" 
                ? "text-[#0F766E] font-bold border-b-2 border-[#0F766E] bg-primary/10" 
                : "text-gray-600 hover:text-[#0D9488] hover:bg-gray-50/70"
            } border-b border-transparent outline-none`}
            onClick={() => handleClick("file")}
          >
            Project
          </button>
          <div className="w-px bg-gray-300 my-2" />
          <button
            className={`py-2 flex-1 text-sm transition-all duration-200 ${
              currentTab === "function" 
                ? "text-[#0F766E] font-bold border-b-2 border-[#0F766E] bg-primary/10" 
                : "text-gray-600 hover:text-[#0D9488] hover:bg-gray-50/70"
            } border-b border-transparent outline-none`}
            onClick={() => handleClick("function")}
          >
            Functions
          </button>
        </div>
        {currentTab === "file" ? <FileTab projectId={projectId} projectName={projectName} /> : <FunctionTab />}
      </div>
    </div>
  );
}

export default DashBoardLeft;
