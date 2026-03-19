import React from "react";
import { Download, MoreVertical, Pencil, Trash2 } from "lucide-react";

function FileTreeFileRow({
    file,
    parentFolder,
    depth,
    isFileActive,
    isRenameMode,
    renameValue,
    renameInputRef,
    onRenameValueChange,
    onConfirmRename,
    onCancelRename,
    onFileSelect,
    getFileIcon,
    onDownloadFile,
    onStartRename,
    onRequestDelete,
    actionConfig,
}) {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const menuRef = React.useRef(null);
    const indent = depth * 14 + 10;
    const canDownload = actionConfig?.canDownload !== false;
    const canRename = actionConfig?.canRename !== false;
    const canDelete = Boolean(actionConfig?.canDelete);

    React.useEffect(() => {
        if (!menuOpen) return undefined;
        const handleOutsideClick = (event) => {
            if (!menuRef.current?.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [menuOpen]);

    return (
        <div
            key={`${parentFolder}/${file}`}
            style={{ paddingLeft: `${indent}px` }}
            onClick={(e) => e.stopPropagation()}
            className={`flex cursor-pointer items-center group justify-between mt-2 pr-2 py-2 rounded-lg transition-all duration-200 ${
                isFileActive
                    ? "bg-[#E6F7F5] text-gray-800 ring-1 ring-[#0D9488]/20"
                    : "text-gray-700 hover:bg-gray-100"
            }`}
        >
            {isRenameMode ? (
                <div
                    className="flex flex-1 min-w-0 items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                >
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
                        className="flex-1 min-w-0 text-sm px-1.5 py-0.5 border border-[#0D9488] rounded outline-none bg-white text-gray-800"
                    />
                </div>
            ) : (
                <>
                    <div
                        className={`flex flex-1 min-w-0 tracking-wide gap-2 items-center transition-all cursor-pointer ${
                            isFileActive ? "font-semibold" : "font-normal"
                        }`}
                        onClick={() => onFileSelect(parentFolder, file)}
                    >
                        <span className="flex-shrink-0">{getFileIcon(file)}</span>
                        <span className="truncate text-sm" title={file}>
                            {file}
                        </span>
                    </div>
                    <div
                        className="relative flex gap-1.5 flex-shrink-0 items-center ml-2"
                        ref={menuRef}
                    >
                        <button
                            type="button"
                            className="w-6 h-6 rounded border border-gray-200 bg-white flex items-center justify-center transition-all hover:bg-gray-50 text-gray-600"
                            title={`${file} actions`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen((prev) => !prev);
                            }}
                        >
                            <MoreVertical size={12} />
                        </button>
                        {menuOpen && (
                            <div
                                className="absolute right-0 top-8 z-20 min-w-[154px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {canDownload && (
                                    <button
                                        type="button"
                                        className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onDownloadFile(parentFolder, file);
                                        }}
                                    >
                                        <Download size={12} className="text-emerald-600" />
                                        <span>Download</span>
                                    </button>
                                )}
                                {canRename && (
                                    <button
                                        type="button"
                                        className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onStartRename(file, parentFolder, "file");
                                        }}
                                    >
                                        <Pencil size={12} className="text-[#0D9488]" />
                                        <span>Rename</span>
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        type="button"
                                        className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onRequestDelete({
                                                type: "file",
                                                folder: parentFolder,
                                                file,
                                                displayName: file,
                                            });
                                        }}
                                    >
                                        <Trash2 size={12} />
                                        <span>Delete</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default FileTreeFileRow;
