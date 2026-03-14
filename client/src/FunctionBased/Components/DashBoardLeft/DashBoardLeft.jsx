import React, { useEffect, useState, useRef } from "react";
import { FolderOpen, Plus, FolderPlus, FlaskConical } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setActiveFunction } from "../../../Slices/SideBarSlice";
import { setActiveFile, setActiveFolderAction } from "../../../Slices/UploadedFileSlice";
import FileTab from "../FileTab/FileTab";
import FunctionTab from "../FunctionTab/FunctionTab";
import { getProjectSessionKey, sessionGetString, sessionSetString } from "../../../util/sessionProjectStorage";

function DashBoardLeft({ projectId, projectName, onOpenModal, sidebarWidth = 320 }) {
  const dispatch = useDispatch();
  const showLeftSideBar = useSelector((state) => state.sideBar.showLeftSideBar);
  const [currentTab, setCurrentTab] = useState("file");
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const newDropdownRef = useRef(null);
  const activeFile = useSelector((state) => state.uploadedFile.activeFile);
  const scopedCurrentTabKey = getProjectSessionKey("currentTab", projectId);

  const handleClick = (name) => {
    if (name === "function" && (!activeFile || !activeFile.name)) {
      return;
    }

    if (name === "file") {
      dispatch(setActiveFunction(""));
      dispatch(setActiveFile(""));
      dispatch(setActiveFolderAction(""));
      if (projectId) {
        sessionSetString("activeFunction", projectId, "");
      }
    }

    setCurrentTab(name);
    sessionSetString("currentTab", projectId, name);
  };

  useEffect(() => {
    const storedCurrentTab = sessionGetString("currentTab", projectId);
    if (!storedCurrentTab) return;
    const hasStoredFileForProject = projectId
      ? Boolean(sessionGetString("activeFileId", projectId))
      : false;
    if (storedCurrentTab === "function" && !hasStoredFileForProject) {
      setCurrentTab("file");
      return;
    }
    setCurrentTab(storedCurrentTab);
  }, [projectId, scopedCurrentTabKey]);

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
        width: showLeftSideBar ? `${sidebarWidth}px` : '0px',
        background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
        borderRight: showLeftSideBar ? '1px solid #e5e7eb' : 'none',
        boxShadow: showLeftSideBar ? '4px 0 16px rgba(0, 0, 0, 0.08)' : 'none',
        opacity: showLeftSideBar ? 1 : 0,
      }}
    >
      <div className="h-full flex flex-col overflow-hidden" style={{ width: `${sidebarWidth}px` }}>
        {/* Header with actions */}
        <div className="px-2.5 pt-3 pb-2.5 flex items-center justify-between bg-gradient-to-r from-teal-50 via-slate-50 to-cyan-50 border-b border-[#cfe9e6]">
          <button
            onClick={() => onOpenModal?.("projects")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:text-[#0D9488] hover:border-[#0D9488]/40 hover:bg-white transition-colors"
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
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#DCEAFD] rounded-xl shadow-xl z-30 w-52 p-1.5">
                <button
                  onClick={() => { setShowNewDropdown(false); onOpenModal?.("create"); }}
                  className="w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-[#E6F7F5] hover:text-[#0F766E] transition-colors"
                >
                  <span className="h-7 w-7 rounded-md bg-[#E6F7F5] text-[#0D9488] flex items-center justify-center">
                    <FolderPlus size={14} />
                  </span>
                  <span className="font-medium">Create New</span>
                </button>
                <button
                  onClick={() => { setShowNewDropdown(false); onOpenModal?.("sample"); }}
                  className="w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-[#E6F7F5] hover:text-[#0F766E] transition-colors"
                >
                  <span className="h-7 w-7 rounded-md bg-[#E6F7F5] text-[#0D9488] flex items-center justify-center">
                    <FlaskConical size={14} />
                  </span>
                  <span className="font-medium">Explore Sample Data</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex font-sans border-b border-gray-200 text-gray-700 bg-white">
          <button
            className={`py-2 flex-1 text-sm transition-all duration-200 ${
              currentTab === "file" 
                ? "text-[#0F766E] font-bold border-b-2 border-[#14B8A6] bg-[#ECFEF9]" 
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
                ? "text-[#0F766E] font-bold border-b-2 border-[#14B8A6] bg-[#ECFEF9]" 
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
