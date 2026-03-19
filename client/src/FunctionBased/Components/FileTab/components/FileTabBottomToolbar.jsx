import React from "react";
import { FolderPlus, Upload, ArrowLeftRight } from "lucide-react";

function FileTabBottomToolbar({
    activeFolder,
    rootLabel,
    selectedDirectoryLabel,
    newFolderName,
    hasProjectSelected,
    onNewFolderChange,
    onCreateFolder,
    onUploadClick,
    onConvertClick,
}) {
    return (
        <div className="sticky bottom-0 z-10 shrink-0 border-t border-gray-200 bg-gray-50 px-3 py-2.5">
            <div className="mb-2 px-0.5 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                    Selected directory
                </span>
                <span
                    className="max-w-[150px] truncate rounded-full bg-[#E6F7F5] px-2 py-0.5 text-[11px] font-medium text-[#0D9488]"
                    title={activeFolder || rootLabel}
                >
                    {selectedDirectoryLabel}
                </span>
            </div>
            <div className="flex items-center gap-1.5">
                <input
                    type="text"
                    placeholder="New folder..."
                    value={newFolderName}
                    disabled={!hasProjectSelected}
                    onChange={(e) => onNewFolderChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onCreateFolder();
                    }}
                    className="flex-1 min-w-0 bg-white text-gray-700 text-xs border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-[#0D9488] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
                <button
                    disabled={!hasProjectSelected}
                    onClick={onCreateFolder}
                    className="w-7 h-7 rounded border border-[#0D9488]/30 bg-white hover:bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    title="Create folder"
                >
                    <FolderPlus size={14} />
                </button>
                <button
                    disabled={!hasProjectSelected}
                    onClick={onUploadClick}
                    className="w-7 h-7 rounded border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-600 flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    title="Upload CSV file"
                >
                    <Upload size={14} />
                </button>
                <button
                    disabled={!hasProjectSelected}
                    onClick={onConvertClick}
                    className="w-7 h-7 rounded border border-amber-300 bg-white hover:bg-amber-50 text-amber-600 flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    title="Convert dataset format"
                >
                    <ArrowLeftRight size={14} />
                </button>
            </div>
        </div>
    );
}

export default FileTabBottomToolbar;
