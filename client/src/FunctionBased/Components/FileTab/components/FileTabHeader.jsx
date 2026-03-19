import React from "react";
import { FolderOpen, Search, Upload, ArrowLeftRight, Pencil, Trash2, X } from "lucide-react";

function FileTabHeader({
    isProjectRootSelected,
    renameTarget,
    renameValue,
    renameInputRef,
    onRenameValueChange,
    onConfirmRename,
    onCancelRename,
    displayProjectName,
    showSearchInput,
    directorySearchQuery,
    onToggleSearch,
    onSearchChange,
    onClearSearch,
    onUploadRoot,
    onConvertRoot,
    onStartProjectRename,
    onDeleteProject,
}) {
    return (
        <>
            <div
                className={`group w-full flex items-center gap-2 px-2.5 py-2.5 cursor-pointer transition-colors duration-150 shadow-[0_2px_6px_-5px_rgba(15,23,42,0.45)] ${
                    isProjectRootSelected
                        ? "bg-[#E6F7F5] text-[#0F766E]"
                        : "bg-transparent text-gray-800 hover:bg-[#F5FAF9]"
                }`}
            >
                <FolderOpen
                    size={14}
                    className={
                        isProjectRootSelected ? "text-[#0F766E]" : "text-[#0D9488]"
                    }
                />
                {renameTarget && renameTarget.type === "project" ? (
                    <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => onRenameValueChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") onConfirmRename();
                            if (e.key === "Escape") onCancelRename();
                        }}
                        onBlur={onConfirmRename}
                        className="flex-1 min-w-0 bg-white text-gray-700 text-sm border border-gray-300 rounded px-2 py-1 outline-none focus:border-[#0D9488]"
                    />
                ) : (
                    <span
                        className={`flex-1 text-sm truncate ${
                            isProjectRootSelected
                                ? "font-bold text-[#0F766E]"
                                : "font-semibold text-gray-800"
                        }`}
                        title={displayProjectName}
                    >
                        {displayProjectName}
                    </span>
                )}
                {!(renameTarget && renameTarget.type === "project") && (
                    <div className="ml-auto flex items-center gap-1.5">
                        <button
                            onClick={onToggleSearch}
                            className="w-7 h-7 rounded border border-amber-300 bg-white hover:bg-amber-50 text-amber-600 flex items-center justify-center transition-all hover:scale-110"
                            title="Search in project directory"
                        >
                            <Search size={14} />
                        </button>
                        <button
                            onClick={onUploadRoot}
                            className="w-7 h-7 rounded border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-600 flex items-center justify-center transition-all hover:scale-110"
                            title="Upload dataset to project root"
                        >
                            <Upload size={14} />
                        </button>
                        <button
                            onClick={onConvertRoot}
                            className="w-7 h-7 rounded border border-amber-300 bg-white hover:bg-amber-50 text-amber-600 flex items-center justify-center transition-all hover:scale-110"
                            title="Convert dataset in project root"
                        >
                            <ArrowLeftRight size={14} />
                        </button>
                        <button
                            onClick={onStartProjectRename}
                            className="w-7 h-7 rounded border border-blue-300 bg-white hover:bg-blue-50 text-blue-600 flex items-center justify-center transition-all hover:scale-110"
                            title="Rename project"
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            onClick={onDeleteProject}
                            className="w-7 h-7 rounded border border-red-300 bg-white hover:bg-red-50 text-red-500 flex items-center justify-center transition-all hover:scale-110"
                            title="Delete project"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>
            {showSearchInput && (
                <div
                    className="mt-2 flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Search size={14} className="text-gray-400" />
                    <input
                        type="text"
                        value={directorySearchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search files, charts, folders..."
                        className="flex-1 min-w-0 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
                        autoFocus
                    />
                    {directorySearchQuery && (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            className="p-1 rounded hover:bg-gray-100 text-gray-500"
                            title="Clear search"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            )}
        </>
    );
}

export default FileTabHeader;
