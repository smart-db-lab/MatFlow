import React from "react";
import FileTreeFileRow from "./FileTreeFileRow";
import FileTreeFolderRow from "./FileTreeFolderRow";

function FileTreeView({
    structure,
    parentFolder = "",
    depth = 0,
    fileActiveId,
    activeFolder,
    expandedFolders,
    renameTarget,
    renameValue,
    renameInputRef,
    onRenameValueChange,
    onConfirmRename,
    onCancelRename,
    onFileSelect,
    getFileIcon,
    onDownloadFile,
    onDownloadFolder,
    onStartRename,
    onRequestDelete,
    getFolderActionConfig,
    getFileActionConfig,
    onSetActiveFolderWithoutToggling,
    onToggleFolderExpansion,
    formatFolderDisplayName,
}) {
    return Object.keys(structure).map((key) => {
        if (key === "files") {
            return structure[key].map((file) => (
                <FileTreeFileRow
                    key={`${parentFolder}/${file}`}
                    file={file}
                    parentFolder={parentFolder}
                    depth={depth}
                    isFileActive={fileActiveId === `${parentFolder}/${file}`}
                    isRenameMode={
                        renameTarget &&
                        renameTarget.name === file &&
                        renameTarget.parentFolder === parentFolder &&
                        renameTarget.type === "file"
                    }
                    renameValue={renameValue}
                    renameInputRef={renameInputRef}
                    onRenameValueChange={onRenameValueChange}
                    onConfirmRename={onConfirmRename}
                    onCancelRename={onCancelRename}
                    onFileSelect={onFileSelect}
                    getFileIcon={getFileIcon}
                    onDownloadFile={onDownloadFile}
                    onStartRename={onStartRename}
                    onRequestDelete={onRequestDelete}
                    actionConfig={getFileActionConfig(parentFolder, file)}
                />
            ));
        }

        const newParentFolder = parentFolder ? `${parentFolder}/${key}` : key;
        const isExpanded = expandedFolders.includes(newParentFolder);
        const isSelectedFolder = activeFolder === newParentFolder;
        const isActive = isSelectedFolder && !fileActiveId;

        return (
            <FileTreeFolderRow
                key={newParentFolder}
                folderName={key}
                parentFolder={parentFolder}
                depth={depth}
                displayFolderName={formatFolderDisplayName(key)}
                isExpanded={isExpanded}
                isSelectedFolder={isSelectedFolder}
                isActive={isActive}
                isRenameMode={
                    renameTarget &&
                    renameTarget.name === key &&
                    renameTarget.parentFolder === parentFolder &&
                    renameTarget.type === "folder"
                }
                renameValue={renameValue}
                renameInputRef={renameInputRef}
                onRenameValueChange={onRenameValueChange}
                onConfirmRename={onConfirmRename}
                onCancelRename={onCancelRename}
                onFolderToggle={(folderPath) => {
                    onSetActiveFolderWithoutToggling(folderPath);
                    onToggleFolderExpansion(folderPath);
                }}
                onDownloadFolder={onDownloadFolder}
                onStartRename={onStartRename}
                onRequestDelete={onRequestDelete}
                actionConfig={getFolderActionConfig(newParentFolder)}
            >
                <FileTreeView
                    structure={structure[key]}
                    parentFolder={newParentFolder}
                    depth={depth + 1}
                    fileActiveId={fileActiveId}
                    activeFolder={activeFolder}
                    expandedFolders={expandedFolders}
                    renameTarget={renameTarget}
                    renameValue={renameValue}
                    renameInputRef={renameInputRef}
                    onRenameValueChange={onRenameValueChange}
                    onConfirmRename={onConfirmRename}
                    onCancelRename={onCancelRename}
                    onFileSelect={onFileSelect}
                    getFileIcon={getFileIcon}
                    onDownloadFile={onDownloadFile}
                    onDownloadFolder={onDownloadFolder}
                    onStartRename={onStartRename}
                    onRequestDelete={onRequestDelete}
                    getFolderActionConfig={getFolderActionConfig}
                    getFileActionConfig={getFileActionConfig}
                    onSetActiveFolderWithoutToggling={
                        onSetActiveFolderWithoutToggling
                    }
                    onToggleFolderExpansion={onToggleFolderExpansion}
                    formatFolderDisplayName={formatFolderDisplayName}
                />
            </FileTreeFolderRow>
        );
    });
}

export default FileTreeView;
