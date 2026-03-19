import React from "react";
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import { Download, Folder, MoreVertical, Pencil, Trash2 } from "lucide-react";

function FileTreeFolderRow({
    folderName,
    parentFolder,
    depth,
    displayFolderName,
    isExpanded,
    isSelectedFolder,
    isActive,
    isRenameMode,
    renameValue,
    renameInputRef,
    onRenameValueChange,
    onConfirmRename,
    onCancelRename,
    onFolderToggle,
    onDownloadFolder,
    onStartRename,
    onRequestDelete,
    actionConfig,
    children,
}) {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const menuRef = React.useRef(null);
    const newParentFolder = parentFolder ? `${parentFolder}/${folderName}` : folderName;
    const indent = depth * 14 + 8;
    const canDownload = actionConfig?.canDownload !== false;
    const canRename = Boolean(actionConfig?.canRename);
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
        <div key={newParentFolder} className="relative">
            <div
                style={{ paddingLeft: `${indent}px` }}
                onClick={(e) => e.stopPropagation()}
                className={`flex items-center justify-between cursor-pointer group mt-2 pr-2 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                        ? "bg-[#E6F7F5] text-gray-800 ring-1 ring-[#0D9488]/20"
                        : isSelectedFolder
                          ? "bg-white text-gray-800 ring-1 ring-[#0D9488]/35"
                          : "hover:bg-gray-100"
                }`}
            >
                <div
                    className={`flex items-center gap-2 flex-1 min-w-0 ${
                        isExpanded
                            ? isActive
                                ? "text-gray-800"
                                : "text-gray-700"
                            : isActive
                              ? "text-gray-800"
                              : "text-gray-600"
                    } ${isActive ? "font-semibold" : "font-normal"}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onFolderToggle(newParentFolder);
                    }}
                >
                    <span className="inline-flex items-center gap-1.5">
                        {isExpanded ? (
                            <IoIosArrowDown
                                className={`flex-shrink-0 transition-colors ${
                                    isActive ? "text-[#0D9488]" : "text-gray-500"
                                }`}
                            />
                        ) : (
                            <IoIosArrowForward
                                className={`flex-shrink-0 transition-colors ${
                                    isActive ? "text-[#0D9488]" : "text-gray-500"
                                }`}
                            />
                        )}
                        <Folder
                            size={14}
                            className={isActive ? "text-amber-600" : "text-amber-500"}
                        />
                    </span>
                    {isRenameMode ? (
                        <div
                            className="flex-1 min-w-0"
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
                                className="w-full text-sm px-1.5 py-0.5 border border-[#0D9488] rounded outline-none bg-white text-gray-800"
                            />
                        </div>
                    ) : (
                        <span
                            className="truncate text-sm flex items-center gap-1.5"
                            title={displayFolderName}
                        >
                            {isSelectedFolder && (
                                <span className="mx-0.5 h-1 w-1 rounded-full bg-[#14B8A6] ring-1 ring-[#99F6E4] flex-shrink-0" />
                            )}
                            <span className="truncate">{displayFolderName}</span>
                        </span>
                    )}
                </div>
                {!isRenameMode && (
                    <div
                        className="relative flex gap-1.5 flex-shrink-0 items-center ml-2"
                        ref={menuRef}
                    >
                        <button
                            type="button"
                            className="w-6 h-6 rounded border border-gray-200 bg-white flex items-center justify-center transition-all hover:bg-gray-50 text-gray-600"
                            title={`${displayFolderName} actions`}
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
                                            onDownloadFolder(
                                                newParentFolder,
                                                displayFolderName,
                                            );
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
                                            onStartRename(folderName, parentFolder, "folder");
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
                                                type: "folder",
                                                folder: newParentFolder,
                                                displayName: displayFolderName,
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
                )}
            </div>
            {isExpanded && (
                <div className="ml-4 border-l border-gray-300/80">{children}</div>
            )}
        </div>
    );
}

export default FileTreeFolderRow;
