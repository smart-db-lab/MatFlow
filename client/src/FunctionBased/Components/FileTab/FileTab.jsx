import React, { useEffect, useState, useRef } from "react";
import {
    FileText,
    FileSpreadsheet,
} from "lucide-react";
import * as Papa from "papaparse";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setActiveWorkspace } from "../../../Slices/workspaceSlice";
import { toast } from "react-toastify";
import { apiService, commonApi } from "../../../services/api/apiService";
import ConfirmDeleteModal from "../../../Components/ConfirmDeleteModal";
import {
    formatFolderDisplayName,
    isReservedSystemFolderPath,
    filterDirectoryStructure,
    collectFolderPaths,
    getWorkspaceRootFromPath,
    getWorkspaceRelativeFolderPath,
} from "./utils/fileTreeUtils";
import FileTreeView from "./components/FileTreeView";
import FileTabHeader from "./components/FileTabHeader";
import FileTabBottomToolbar from "./components/FileTabBottomToolbar";
import DataPreviewTable from "./components/DataPreviewTable";
import { useFileTreeState } from "./hooks/useFileTreeState";
import { useFileActions } from "./hooks/useFileActions";

const ENABLE_MOVE_UI = false;

function FileTab({ projectId, projectName }) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const render = useSelector((state) => state.uploadedFile.rerender);
    const inputRef = useRef();
    const convertInputRef = useRef();
    const renameInputRef = useRef();
    const {
        directoryStructure,
        isDirectoryLoading,
        fileActiveId,
        setFileActiveId,
        activeFolder,
        setActiveFolder,
        expandedFolders,
        setExpandedFolders,
        displayProjectName,
        setDisplayProjectName,
        showSearchInput,
        setShowSearchInput,
        directorySearchQuery,
        setDirectorySearchQuery,
        fetchDirectoryStructure,
        setActiveFolderWithoutToggling,
        toggleFolderExpansion,
        handleFileSelect,
        clearActiveFolder,
    } = useFileTreeState({
        projectId,
        projectName,
        render,
        dispatch,
    });

    const {
        uploadedFile,
        setUploadedFile,
        newFolderName,
        setNewFolderName,
        convertFile,
        setConvertFile,
        showConvertModal,
        setShowConvertModal,
        showUploadModal,
        setShowUploadModal,
        renameTarget,
        renameValue,
        setRenameValue,
        deleteTarget,
        setDeleteTarget,
        moveTarget,
        moveDestination,
        setMoveDestination,
        handleDownloadFile,
        handleDownloadFolder,
        handleFileChange,
        handleConvertFileChange,
        handleCreateFolder,
        startRename,
        confirmRename,
        cancelRename,
        confirmDelete,
        closeMoveModal,
        confirmMove,
    } = useFileActions({
        projectId,
        activeFolder,
        setActiveFolder,
        fileActiveId,
        setFileActiveId,
        directoryStructure,
        fetchDirectoryStructure,
        navigate,
        setDisplayProjectName,
        isReservedSystemFolderPath,
    });

    const getFileIcon = (fileName) => {
        const fileExtension = fileName.split(".").pop().toLowerCase();
        if (["xls", "xlsx"].includes(fileExtension)) {
            return <FileSpreadsheet size={15} className="text-[#0D9488]" />;
        }
        return <FileText size={15} className="text-[#0D9488]" />;
    };

    const handleConvertClick = () => {
        // Trigger file input - modal will open after file is selected
        convertInputRef.current?.click();
    };

    useEffect(() => {
        if (renameTarget && renameInputRef.current) {
            renameInputRef.current.focus();
            const dotIndex = renameValue.lastIndexOf(".");
            renameInputRef.current.setSelectionRange(
                0,
                dotIndex > 0 ? dotIndex : renameValue.length,
            );
        }
    }, [renameTarget]);


    const getMoveDestinationOptions = () => {
        if (!moveTarget) return [];
        const allFolders = collectFolderPaths(directoryStructure || {});
        const sourcePath = String(moveTarget.sourcePath || "").replace(
            /\\/g,
            "/",
        );
        const sourceParent = String(moveTarget.parentFolder || "").replace(
            /\\/g,
            "/",
        );
        const sourceWorkspace = getWorkspaceRootFromPath(sourcePath);

        return allFolders.filter((folderPath) => {
            const normalized = String(folderPath || "").replace(/\\/g, "/");
            if (!normalized) return false;

            // Keep moves inside the same workspace.
            if (getWorkspaceRootFromPath(normalized) !== sourceWorkspace) {
                return false;
            }

            if (moveTarget.type === "file") {
                return normalized !== sourceParent;
            }

            // Folder move: disallow same folder, parent no-op and descendants.
            if (normalized === sourcePath) return false;
            if (normalized === sourceParent) return false;
            if (normalized.startsWith(`${sourcePath}/`)) return false;
            return true;
        });
    };

    const hasProjectSelected = Boolean(projectId);
    const hasDirectoryContent =
        directoryStructure && Object.keys(directoryStructure).length > 0;
    const rootLabel = displayProjectName || "Project Files";
    const selectedFolderName = activeFolder
        ? activeFolder.split("/").filter(Boolean).pop() || rootLabel
        : rootLabel;
    const selectedDirectoryLabel = activeFolder
        ? formatFolderDisplayName(selectedFolderName)
        : rootLabel;
    const isProjectRootSelected = !activeFolder && !fileActiveId;
    const trimmedSearchQuery = directorySearchQuery.trim();
    const filteredDirectoryStructure = trimmedSearchQuery
        ? filterDirectoryStructure(directoryStructure || {}, trimmedSearchQuery)
        : directoryStructure;
    const hasFilteredResults =
        filteredDirectoryStructure &&
        Object.keys(filteredDirectoryStructure).length > 0;

    const getFolderActionConfig = (folderPath) => {
        if (isReservedSystemFolderPath(folderPath)) {
            return {
                canDownload: true,
                canRename: false,
                canDelete: false,
            };
        }
        return {
            canDownload: true,
            canRename: true,
            canDelete: true,
        };
    };

    const isOutputPath = (folderPath) => {
        const normalized = String(folderPath || "")
            .replace(/\\/g, "/")
            .toLowerCase();
        const workspaceRelative = getWorkspaceRelativeFolderPath(folderPath);
        return (
            normalized === "output" ||
            normalized.startsWith("output/") ||
            workspaceRelative === "output" ||
            workspaceRelative.startsWith("output/")
        );
    };

    const getFileActionConfig = (folderPath) => ({
        canDownload: true,
        canRename: true,
        canDelete: isOutputPath(folderPath),
    });

    useEffect(() => {
        if (!trimmedSearchQuery) return;
        setExpandedFolders((prev) => {
            const autoExpandedFolders = collectFolderPaths(
                filteredDirectoryStructure || {},
            );
            const merged = new Set([...prev, ...autoExpandedFolders]);
            return Array.from(merged);
        });
    }, [trimmedSearchQuery, filteredDirectoryStructure]);

    return (
        <div
            className="flex h-full min-h-0 flex-col text-gray-700"
            style={{ backgroundColor: "transparent" }}
        >
            <div
                className="w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-0 pb-4 pl-0 pr-0"
                onClick={clearActiveFolder}
            >
                {!hasProjectSelected ? (
                    <p className="text-center mt-4 font-semibold tracking-wide text-gray-600">
                        Select or create a project.
                    </p>
                ) : isDirectoryLoading ? (
                    <p className="text-center mt-4 font-bold tracking-wide text-gray-600">
                        Loading directory structure...
                    </p>
                ) : (
                    <div className="h-full min-h-0 flex flex-col">
                        <FileTabHeader
                            isProjectRootSelected={isProjectRootSelected}
                            renameTarget={renameTarget}
                            renameValue={renameValue}
                            renameInputRef={renameInputRef}
                            onRenameValueChange={setRenameValue}
                            onConfirmRename={confirmRename}
                            onCancelRename={cancelRename}
                            displayProjectName={displayProjectName}
                            showSearchInput={showSearchInput}
                            directorySearchQuery={directorySearchQuery}
                            onToggleSearch={(e) => {
                                e.stopPropagation();
                                setShowSearchInput((prev) => !prev);
                                if (showSearchInput) setDirectorySearchQuery("");
                            }}
                            onSearchChange={setDirectorySearchQuery}
                            onClearSearch={() => setDirectorySearchQuery("")}
                            onUploadRoot={(e) => {
                                e.stopPropagation();
                                setActiveFolder("");
                                inputRef.current?.click();
                            }}
                            onConvertRoot={(e) => {
                                e.stopPropagation();
                                setActiveFolder("");
                                handleConvertClick();
                            }}
                            onStartProjectRename={(e) => {
                                e.stopPropagation();
                                startRename(displayProjectName, "", "project");
                            }}
                            onDeleteProject={(e) => {
                                e.stopPropagation();
                                setDeleteTarget({
                                    type: "project",
                                    displayName: displayProjectName,
                                });
                            }}
                        />
                        <div className="mt-1 ml-4 flex-1 min-h-0">
                            {hasDirectoryContent ? (
                                hasFilteredResults ? (
                                    <FileTreeView
                                        structure={filteredDirectoryStructure}
                                        parentFolder=""
                                        depth={0}
                                        fileActiveId={fileActiveId}
                                        activeFolder={activeFolder}
                                        expandedFolders={expandedFolders}
                                        renameTarget={renameTarget}
                                        renameValue={renameValue}
                                        renameInputRef={renameInputRef}
                                        onRenameValueChange={setRenameValue}
                                        onConfirmRename={confirmRename}
                                        onCancelRename={cancelRename}
                                        onFileSelect={handleFileSelect}
                                        getFileIcon={getFileIcon}
                                        onDownloadFile={handleDownloadFile}
                                        onDownloadFolder={handleDownloadFolder}
                                        onStartRename={startRename}
                                        onRequestDelete={setDeleteTarget}
                                        getFolderActionConfig={
                                            getFolderActionConfig
                                        }
                                        getFileActionConfig={getFileActionConfig}
                                        onSetActiveFolderWithoutToggling={
                                            setActiveFolderWithoutToggling
                                        }
                                        onToggleFolderExpansion={
                                            toggleFolderExpansion
                                        }
                                        formatFolderDisplayName={
                                            formatFolderDisplayName
                                        }
                                    />
                                ) : (
                                    <p className="mt-3 text-xs text-gray-500">
                                        No files or folders match "
                                        {trimmedSearchQuery}".
                                    </p>
                                )
                            ) : (
                                <div className="h-full flex items-center justify-center pr-2">
                                    <p className="text-center font-semibold tracking-wide text-gray-600">
                                        Upload your dataset to get started.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom toolbar */}
            <FileTabBottomToolbar
                activeFolder={activeFolder}
                rootLabel={rootLabel}
                selectedDirectoryLabel={selectedDirectoryLabel}
                newFolderName={newFolderName}
                hasProjectSelected={hasProjectSelected}
                onNewFolderChange={setNewFolderName}
                onCreateFolder={handleCreateFolder}
                onUploadClick={() => inputRef.current?.click()}
                onConvertClick={handleConvertClick}
            />
            <input
                ref={inputRef}
                type="file"
                id="input-file-upload"
                hidden
                accept=".csv"
                onChange={handleFileChange}
            />
            <input
                ref={convertInputRef}
                type="file"
                id="input-file-convert"
                hidden
                accept=".txt,.xls,.xlsx,.xlsm"
                onChange={handleConvertFileChange}
            />

            <ConfirmDeleteModal
                isOpen={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title={
                    deleteTarget?.type === "project"
                        ? "Delete Project"
                        : "Confirm Delete"
                }
                itemName={deleteTarget?.displayName || "this item"}
                itemTypeLabel={
                    deleteTarget?.type === "project"
                        ? "project"
                        : deleteTarget?.file
                          ? "file"
                          : "folder"
                }
            />

            {ENABLE_MOVE_UI && (
                <MoveItemModal
                    isOpen={Boolean(moveTarget)}
                    target={moveTarget}
                    destination={moveDestination}
                    destinationOptions={getMoveDestinationOptions()}
                    onDestinationChange={setMoveDestination}
                    onClose={closeMoveModal}
                    onConfirm={confirmMove}
                />
            )}

            {/* Convert File Modal */}
            {showUploadModal && uploadedFile && (
                <UploadFileModal
                    projectId={projectId}
                    file={uploadedFile}
                    activeFolder={activeFolder}
                    projectName={rootLabel}
                    onClose={() => {
                        setShowUploadModal(false);
                        setUploadedFile("");
                        if (inputRef.current) {
                            inputRef.current.value = "";
                        }
                    }}
                    onUploadSuccess={() => {
                        fetchDirectoryStructure();
                        setShowUploadModal(false);
                        setUploadedFile("");
                        if (inputRef.current) {
                            inputRef.current.value = "";
                        }
                    }}
                />
            )}

            {/* Convert File Modal */}
            {showConvertModal && (
                <ConvertFileModal
                    projectId={projectId}
                    file={convertFile}
                    activeFolder={activeFolder}
                    onClose={() => {
                        setShowConvertModal(false);
                        setConvertFile(null);
                        if (convertInputRef.current) {
                            convertInputRef.current.value = "";
                        }
                    }}
                    onUploadSuccess={() => {
                        fetchDirectoryStructure();
                    }}
                />
            )}
        </div>
    );
}

function MoveItemModal({
    isOpen,
    target,
    destination,
    destinationOptions,
    onDestinationChange,
    onClose,
    onConfirm,
}) {
    if (!isOpen || !target) return null;

    const hasOptions = Array.isArray(destinationOptions)
        ? destinationOptions.length > 0
        : false;
    const canConfirm = Boolean(destination) && hasOptions;
    const targetLabel = target.type === "folder" ? "Folder" : "File";
    const sourcePath = String(target.sourcePath || "");

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-[0_20px_55px_rgba(15,23,42,0.22)] border border-gray-200 max-w-xl w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="border-b border-gray-200 px-5 py-4">
                    <h3 className="text-base font-semibold text-gray-900">
                        Move {targetLabel}
                    </h3>
                    <div className="mt-2.5 space-y-1.5 rounded-lg border border-[#D9ECE9] bg-[#F0FDFA] px-3 py-2.5">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="shrink-0 font-medium text-gray-500">
                                Name
                            </span>
                            <span
                                className="min-w-0 flex-1 truncate font-semibold text-gray-800"
                                title={target.name}
                            >
                                {target.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="shrink-0 font-medium text-gray-500">
                                From
                            </span>
                            <span
                                className="min-w-0 flex-1 truncate text-gray-700"
                                title={sourcePath}
                            >
                                {sourcePath}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 px-5 py-4">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Destination folder
                    </label>
                    <select
                        value={destination}
                        onChange={(e) => onDestinationChange(e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none focus:border-[#0D9488]"
                    >
                        {hasOptions ? (
                            destinationOptions.map((folderPath) => (
                                <option key={folderPath} value={folderPath}>
                                    {folderPath}
                                </option>
                            ))
                        ) : (
                            <option value="">
                                No valid destination available
                            </option>
                        )}
                    </select>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!canConfirm}
                        className="rounded-lg border border-[#0D9488] bg-[#0D9488] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#0F766E] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    >
                        Move
                    </button>
                </div>
            </div>
        </div>
    );
}

function UploadFileModal({
    projectId,
    file,
    activeFolder,
    onClose,
    onUploadSuccess,
    projectName,
}) {
    const dispatch = useDispatch(); // Get dispatch for this component
    const [csvData, setCsvData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const parseCsv = async () => {
            if (!file) return;
            setLoading(true);
            setError(null);
            setCsvData([]);
            setColumns([]);

            try {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const rows = Array.isArray(results?.data)
                            ? results.data
                            : [];
                        const validRows = rows.filter(
                            (row) => row && Object.keys(row).length > 0,
                        );
                        const inferredColumns =
                            validRows.length > 0
                                ? Object.keys(validRows[0])
                                : Array.isArray(results?.meta?.fields)
                                  ? results.meta.fields
                                  : [];

                        setColumns(inferredColumns);
                        setCsvData(validRows);
                        setLoading(false);
                    },
                    error: (err) => {
                        setError(err?.message || "Failed to read CSV file");
                        setLoading(false);
                    },
                });
            } catch (err) {
                setError(err?.message || "Failed to read CSV file");
                setLoading(false);
            }
        };

        parseCsv();
    }, [file]);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            // Upload via the new workspace system so the full folder structure
            // (original_dataset/, output/generated_datasets/, etc.) is created on disk.
            console.log("[FileTab] Starting upload for file:", file.name);
            const workspaceData = await commonApi.projects.uploadDataset(
                projectId,
                file,
            );

            console.log("[FileTab] Upload response received:", workspaceData);
            console.log("[FileTab] Response ID:", workspaceData?.id);
            console.log(
                "[FileTab] Response dataset_filename:",
                workspaceData?.dataset_filename,
            );

            // Capture workspace ID from the response and dispatch to Redux
            if (workspaceData && workspaceData.id) {
                console.log(
                    "[FileTab] Dataset uploaded. Workspace ID:",
                    workspaceData.id,
                );
                try {
                    console.log(
                        "[FileTab] Dispatching setActiveWorkspace with:",
                        {
                            workspaceId: workspaceData.id,
                            filename: workspaceData.dataset_filename,
                        },
                    );
                    dispatch(
                        setActiveWorkspace({
                            workspaceId: workspaceData.id,
                            filename: workspaceData.dataset_filename,
                        }),
                    );
                    console.log("[FileTab] Successfully dispatched to Redux");
                } catch (dispatchErr) {
                    console.error(
                        "[FileTab] Failed to dispatch to Redux:",
                        dispatchErr,
                    );
                    // Continue anyway - upload was successful even if Redux dispatch failed
                }
            } else {
                console.warn(
                    "[FileTab] Upload successful but response missing id:",
                    workspaceData,
                );
            }

            toast.success("File uploaded successfully!");
            onUploadSuccess?.();
        } catch (err) {
            console.error("[FileTab] Upload error:", err);
            toast.error(err?.message || "Error uploading file!");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col p-6 relative z-[10000]">
                <div className="flex justify-between items-start mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold">
                            Upload Materials Property Preview
                        </h2>
                        <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">File:</span>{" "}
                                {file?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">
                                    Target Folder:
                                </span>{" "}
                                {activeFolder || projectName || "Project Files"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {loading && (
                    <div className="flex flex-col justify-center items-center py-12 flex-shrink-0">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-btn mb-4"></div>
                        <p className="text-gray-600 text-lg">
                            Preparing dataset preview...
                        </p>
                    </div>
                )}

                {error && !loading && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
                        <p className="text-sm text-red-600 font-medium">
                            Error: {error}
                        </p>
                    </div>
                )}

                {!loading && !error && csvData.length > 0 && (
                    <DataPreviewTable
                        columns={columns}
                        csvData={csvData}
                        title="Preview (First 100 rows)"
                    />
                )}

                {!loading && !error && csvData.length === 0 && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex-shrink-0">
                        <p className="text-sm text-amber-700 font-medium">
                            The file appears empty. Please choose a valid CSV
                            file.
                        </p>
                    </div>
                )}

                <div className="flex gap-3 pt-4 flex-shrink-0">
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={
                            loading ||
                            uploading ||
                            !!error ||
                            csvData.length === 0
                        }
                        className="flex-1 bg-primary-btn text-white px-4 py-2 rounded-md font-medium shadow-sm hover:bg-primary-btn/90 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed duration-150"
                    >
                        {uploading ? "Uploading..." : "Confirm Upload"}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={uploading}
                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed duration-150 font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// Convert File Modal Component
function ConvertFileModal({
    projectId,
    file,
    onClose,
    activeFolder,
    onUploadSuccess,
}) {
    const [csvData, setCsvData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [waitingForFile, setWaitingForFile] = useState(!file);

    // Convert file to CSV when file is provided
    useEffect(() => {
        if (file) {
            setWaitingForFile(false);
            handleConvertFile();
        } else {
            setWaitingForFile(true);
            setLoading(false);
            setError(null);
            setCsvData([]);
            setColumns([]);
        }
    }, [file]);

    const handleConvertFile = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const data = await apiService.matflow.dataset.convertToCsv(file);

            if (Array.isArray(data) && data.length > 0) {
                // Extract column names from first row
                const columnNames = Object.keys(data[0]);
                setColumns(columnNames);
                setCsvData(data);
            } else {
                setError("No data found in converted file");
            }
        } catch (err) {
            setError(err.message || "Error converting file to CSV");
            toast.error(err.message || "Error converting file to CSV");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!csvData || csvData.length === 0) {
            toast.error("No data to upload");
            return;
        }

        setUploading(true);

        try {
            const fileName = file.name.replace(/\.[^/.]+$/, "") + ".csv"; // Replace extension with .csv

            // Use the selected folder or empty string for root dataset folder
            const folderName = activeFolder || "";

            await apiService.matflow.dataset.createFile(
                projectId,
                csvData,
                fileName,
                folderName,
            );

            toast.success("File uploaded successfully!");
            if (onUploadSuccess) {
                onUploadSuccess();
            }
            onClose();
        } catch (err) {
            toast.error(err.message || "Error uploading file");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col p-6 relative z-[10000]">
                <div className="flex justify-between items-start mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold">
                            Convert File Preview
                        </h2>
                        {file && (
                            <div className="mt-2">
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">File:</span>{" "}
                                    {file.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Size:</span>{" "}
                                    {(file.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {waitingForFile && (
                    <div className="flex flex-col justify-center items-center py-12 flex-shrink-0">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-btn mb-4"></div>
                        <p className="text-gray-600 text-lg">
                            Please select a file to convert
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                            The file picker should open automatically...
                        </p>
                    </div>
                )}

                {loading && !waitingForFile && (
                    <div className="flex flex-col justify-center items-center py-12 flex-shrink-0">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-btn mb-4"></div>
                        <p className="text-gray-600 text-lg">
                            Converting file to CSV...
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                            Processing on server, please wait
                        </p>
                    </div>
                )}

                {error && !loading && !waitingForFile && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
                        <p className="text-sm text-red-600 font-medium">
                            Error: {error}
                        </p>
                    </div>
                )}

                {!loading && !error && csvData.length > 0 && (
                    <DataPreviewTable
                        columns={columns}
                        csvData={csvData}
                        title="Preview (CSV Format)"
                    />
                )}

                <div className="flex gap-3 pt-4 flex-shrink-0">
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={
                            loading ||
                            uploading ||
                            csvData.length === 0 ||
                            waitingForFile
                        }
                        className="flex-1 bg-primary-btn text-white px-4 py-2 rounded-md font-medium shadow-sm hover:bg-primary-btn/90 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed duration-150"
                    >
                        {uploading ? "Uploading..." : "Upload"}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={uploading}
                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed duration-150 font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FileTab;
