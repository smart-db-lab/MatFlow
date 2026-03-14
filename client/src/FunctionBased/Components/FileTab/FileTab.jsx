import React, { useEffect, useState, useRef } from "react";
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import { MdDriveFileMove } from "react-icons/md";
import {
    FileText,
    FileSpreadsheet,
    Pencil,
    Trash2,
    Upload,
    ArrowLeftRight,
    FolderPlus,
    FolderOpen,
    Folder,
    Search,
    X,
} from "lucide-react";
import * as Papa from "papaparse";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    setActiveFile,
    setActiveFolderAction,
} from "../../../Slices/UploadedFileSlice";
import { setActiveWorkspace } from "../../../Slices/workspaceSlice";
import { toast } from "react-toastify";
import {
    clearIndexedDB,
    deleteIndexedDB,
    storeDataInIndexedDB,
} from "../../../util/indexDB";
import { setActiveFunction } from "../../../Slices/SideBarSlice";
import { apiService, commonApi } from "../../../services/api/apiService";
import ConfirmDeleteModal from "../../../Components/ConfirmDeleteModal";
import {
    sessionGetJson,
    sessionGetString,
    sessionSetJson,
    sessionSetString,
} from "../../../util/sessionProjectStorage";
import { syncSplitAndModelCache } from "../../../util/modelDatasetSync";

const ENABLE_MOVE_UI = false;

function FileTab({ projectId, projectName }) {
    const navigate = useNavigate();
    const [directoryStructure, setDirectoryStructure] = useState({}); // Fetched directory structure
    const [isDirectoryLoading, setIsDirectoryLoading] = useState(false);
    const [fileActiveId, setFileActiveId] = useState(""); // Active file ID
    const [activeFolder, setActiveFolder] = useState(""); // Active folder ID
    const [uploadedFile, setUploadedFile] = useState(""); // Uploaded file
    const [newFolderName, setNewFolderName] = useState(""); // New folder creation
    const [expandedFolders, setExpandedFolders] = useState([]); // Track expanded folders
    const [convertFile, setConvertFile] = useState(null); // File selected for conversion
    const [showConvertModal, setShowConvertModal] = useState(false); // Modal visibility
    const [showUploadModal, setShowUploadModal] = useState(false); // CSV upload preview modal visibility
    const [renameTarget, setRenameTarget] = useState(null); // { name, parentFolder, type:'file'|'folder' }
    const [renameValue, setRenameValue] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null); // { type:'project' } | { folder, file?, displayName }
    const [moveTarget, setMoveTarget] = useState(null); // { type:'file'|'folder', name, parentFolder, sourcePath }
    const [moveDestination, setMoveDestination] = useState("");
    const [displayProjectName, setDisplayProjectName] = useState(
        projectName || "Project Files",
    );
    const [showSearchInput, setShowSearchInput] = useState(false);
    const [directorySearchQuery, setDirectorySearchQuery] = useState("");

    const dispatch = useDispatch();
    const render = useSelector((state) => state.uploadedFile.rerender);
    const inputRef = useRef();
    const convertInputRef = useRef();
    const renameInputRef = useRef();
    const LEGACY_ROOT_OUTPUT_KEYS = new Set(["output", "Output"]);

    const sanitizeDirectoryStructure = (rawStructure) => {
        if (!rawStructure || typeof rawStructure !== "object") return {};
        const next = { ...rawStructure };
        for (const key of Object.keys(next)) {
            if (LEGACY_ROOT_OUTPUT_KEYS.has(String(key || "").trim())) {
                delete next[key];
            }
        }
        return next;
    };

    useEffect(() => {
        setDisplayProjectName(projectName || "Project Files");
    }, [projectName]);

    // Initialise project-scoped local state when projectId changes
    useEffect(() => {
        if (!projectId) {
            setDirectoryStructure({});
            setIsDirectoryLoading(false);
            setFileActiveId("");
            setActiveFolder("");
            setExpandedFolders([]);
            return;
        }

        const storedActiveFileId = sessionGetString("activeFileId", projectId);
        const storedActiveFolder = sessionGetString("activeFolder", projectId);
        const storedExpanded = sessionGetJson("expandedFolders", projectId, []);

        setFileActiveId(storedActiveFileId);
        setActiveFolder(storedActiveFolder);
        setExpandedFolders(Array.isArray(storedExpanded) ? storedExpanded : []);

        fetchDirectoryStructure();
    }, [dispatch, render, projectId]);

    // Fetch directory structure from backend
    const fetchDirectoryStructure = async () => {
        if (!projectId) return;
        setIsDirectoryLoading(true);
        try {
            const data =
                await apiService.matflow.dataset.getAllFiles(projectId);
            const sanitized = sanitizeDirectoryStructure(data);
            setDirectoryStructure(sanitized);
            if (
                activeFolder &&
                LEGACY_ROOT_OUTPUT_KEYS.has(
                    String(activeFolder.split("/")[0] || "").trim(),
                )
            ) {
                setActiveFolder("");
            }
        } catch (error) {
            console.error("Error fetching directory structure:", error);
        } finally {
            setIsDirectoryLoading(false);
        }
    };

    // Save expandedFolders to localStorage whenever it changes
    useEffect(() => {
        if (!projectId) return;
        sessionSetJson("expandedFolders", projectId, expandedFolders);
    }, [expandedFolders, projectId]);

    // Save activeFolder to localStorage whenever it changes
    useEffect(() => {
        if (!projectId) return;
        sessionSetString("activeFolder", projectId, activeFolder);
        dispatch(setActiveFolderAction(activeFolder));
    }, [activeFolder]);

    // Save activeFileId to localStorage whenever it changes
    useEffect(() => {
        dispatch(setActiveFile({ name: fileActiveId }));
        if (projectId) {
            sessionSetString("activeFileId", projectId, fileActiveId);
        }
        let folder = fileActiveId.split("/");
        folder = folder.slice(0, folder.length - 1).join("/");
        dispatch(setActiveFolderAction(folder));
    }, [fileActiveId, dispatch]);

    const setActiveFolderWithoutToggling = (folder) => {
        setActiveFolder(folder);
    };

    const toggleFolderExpansion = (folder) => {
        setExpandedFolders((prev) => {
            const isExpanded = prev.includes(folder);
            if (isExpanded) {
                return prev.filter((f) => f !== folder);
            }
            return [...prev, folder];
        });
    };

    const getFileIcon = (fileName) => {
        const fileExtension = fileName.split(".").pop().toLowerCase();
        if (["xls", "xlsx"].includes(fileExtension)) {
            return <FileSpreadsheet size={15} className="text-[#0D9488]" />;
        }
        return <FileText size={15} className="text-[#0D9488]" />;
    };

    const handleFileSelect = (folder, name) => {
        const fullPath = `${folder}/${name}`.replace(/\\/g, "/").toLowerCase();
        const modelExtensions = [".joblib", ".pkl", ".pth", ".pt"];
        const isModelFile =
            fullPath.includes("/output/models/") ||
            modelExtensions.some((ext) => fullPath.endsWith(ext));
        const nextFunction = isModelFile
            ? "Materials Property Prediction"
            : "Dataset Preview";

        // Set the file immediately so the sidebar highlights at once.
        // Jump straight to "Materials Property Preview" so DatasetDisplay renders its
        // paginated preview without waiting for the full CSV load in DashBoardRight.
        setFileActiveId(`${folder}/${name}`);
        if (projectId) {
            sessionSetString("activeFunction", projectId, nextFunction);
        }
        dispatch(setActiveFunction(nextFunction));
    };

    const handleDelete = async (folder, file = null) => {
        try {
            const deleted = await apiService.matflow.dataset.delete(
                projectId,
                folder,
                file,
            );

            if (deleted) {
                toast.success(
                    `${file ? "File" : "Folder"} deleted successfully!`,
                );
                if (file) {
                    await deleteIndexedDB(`${folder}/${file}`);
                }
                await syncSplitAndModelCache(projectId).catch(() => null);
                fetchDirectoryStructure(); // Refresh directory structure
            } else {
                throw new Error("Failed to delete item");
            }
        } catch (error) {
            toast.error(`Error deleting ${file ? "file" : "folder"}`);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedFile(file);
            setShowUploadModal(true);
        }
    };

    const handleConvertFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setConvertFile(file);
            setShowConvertModal(true);
        }
    };

    const handleConvertClick = () => {
        // Trigger file input - modal will open after file is selected
        convertInputRef.current?.click();
    };

    const handleCreateFolder = async () => {
        const trimmedFolderName = newFolderName.trim();
        if (!trimmedFolderName) {
            toast.warning("Please enter a folder name before creating.");
            return;
        }

        try {
            const created = await apiService.matflow.dataset.createFolder(
                projectId,
                trimmedFolderName,
                activeFolder || "",
            );
            const createdFolderName = created?.folder_name || trimmedFolderName;
            if (created?.renamed || createdFolderName !== trimmedFolderName) {
                toast.info(
                    `Folder already exists. Created as "${createdFolderName}".`,
                );
            } else {
                toast.success("Folder created successfully!");
            }
            setNewFolderName("");
            fetchDirectoryStructure();
        } catch (error) {
            const msg =
                error?.data?.error || error?.data?.detail || error?.message;
            const isAuthError =
                typeof msg === "string" &&
                /auth|credentials|login|unauthorized/i.test(msg);
            toast.error(
                isAuthError
                    ? "Please log in to create a folder."
                    : msg || "Error creating folder!",
            );
        }
    };

    // Function to clear active folder
    const clearActiveFolder = () => {
        setActiveFolder("");
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

    const startRename = (name, parentFolder, type) => {
        setRenameTarget({ name, parentFolder, type });
        setRenameValue(name);
    };

    const confirmRename = async () => {
        if (!renameTarget) return;
        const { name, parentFolder, type } = renameTarget;
        if (renameValue.trim() && renameValue !== name) {
            if (type === "project") {
                await handleProjectRename(renameValue.trim());
            } else {
                await handleRename(name, renameValue.trim(), parentFolder);
            }
        }
        setRenameTarget(null);
        setRenameValue("");
    };

    const cancelRename = () => {
        setRenameTarget(null);
        setRenameValue("");
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        if (deleteTarget.type === "project") {
            await handleProjectDelete();
        } else {
            await handleDelete(deleteTarget.folder, deleteTarget.file || null);
        }
        setDeleteTarget(null);
    };

    const startMove = (name, parentFolder, type) => {
        const sourcePath = parentFolder ? `${parentFolder}/${name}` : name;
        const workspaceRoot = getWorkspaceRootFromPath(sourcePath);
        setMoveTarget({ type, name, parentFolder, sourcePath });
        setMoveDestination(workspaceRoot);
    };

    const closeMoveModal = () => {
        setMoveTarget(null);
        setMoveDestination("");
    };

    const confirmMove = async () => {
        if (!moveTarget || !moveDestination) return;
        try {
            await apiService.matflow.dataset.move(
                projectId,
                moveTarget.sourcePath,
                moveDestination,
            );

            // Clear stale selection references if they were inside moved folder/file.
            const sourcePath = moveTarget.sourcePath;
            if (moveTarget.type === "file" && fileActiveId === sourcePath) {
                setFileActiveId("");
            }
            if (moveTarget.type === "folder") {
                if (
                    activeFolder === sourcePath ||
                    activeFolder.startsWith(`${sourcePath}/`)
                ) {
                    setActiveFolder("");
                }
                if (
                    fileActiveId === sourcePath ||
                    fileActiveId.startsWith(`${sourcePath}/`)
                ) {
                    setFileActiveId("");
                }
            }

            toast.success("Moved successfully!");
            closeMoveModal();
            fetchDirectoryStructure();
        } catch (error) {
            const msg =
                error?.data?.error || error?.data?.detail || error?.message;
            toast.error(msg || "Error moving item!");
        }
    };

    const handleProjectRename = async (newName) => {
        if (!newName?.trim()) {
            toast.error("Project name cannot be empty!");
            return;
        }

        try {
            await commonApi.projects.update(projectId, {
                name: newName.trim(),
            });
            setDisplayProjectName(newName.trim());
            toast.success("Project renamed successfully!");
        } catch (error) {
            const msg =
                error?.data?.error || error?.data?.detail || error?.message;
            toast.error(msg || "Error renaming project!");
        }
    };

    const handleProjectDelete = async () => {
        try {
            await commonApi.projects.remove(projectId);
            try {
                await clearIndexedDB(`models:${projectId}`);
                await clearIndexedDB(`splitted_dataset:${projectId}`);
            } catch (_) {}
            toast.success("Project deleted successfully!");
            navigate("/matflow/dashboard");
        } catch (error) {
            const msg =
                error?.data?.error || error?.data?.detail || error?.message;
            toast.error(msg || "Error deleting project!");
        }
    };

    const handleRename = async (currentName, newName, parentFolder = "") => {
        if (!newName.trim()) {
            toast.error("Name cannot be empty!");
            return;
        }

        try {
            await apiService.matflow.dataset.rename(
                projectId,
                currentName,
                newName,
                parentFolder,
            );

            toast.success("Renamed successfully!");
            fetchDirectoryStructure(); // Refresh the directory structure
        } catch (error) {
            toast.error("Error renaming item!");
        }
    };

    const filterDirectoryStructure = (structure, query) => {
        if (!query) return structure;
        const loweredQuery = query.toLowerCase();

        const walk = (node) => {
            const result = {};
            const directFiles = Array.isArray(node.files) ? node.files : [];

            const matchedFiles = directFiles.filter((fileName) =>
                String(fileName).toLowerCase().includes(loweredQuery),
            );

            if (matchedFiles.length > 0) {
                result.files = matchedFiles;
            }

            Object.keys(node).forEach((key) => {
                if (key === "files") return;
                const child = node[key];
                if (!child || typeof child !== "object" || Array.isArray(child))
                    return;

                const folderMatches = key.toLowerCase().includes(loweredQuery);
                if (folderMatches) {
                    result[key] = child;
                    return;
                }

                const filteredChild = walk(child);
                if (Object.keys(filteredChild).length > 0) {
                    result[key] = filteredChild;
                }
            });

            return result;
        };

        return walk(structure);
    };

    const collectFolderPaths = (structure, parentPath = "") => {
        let paths = [];
        Object.keys(structure || {}).forEach((key) => {
            if (key === "files") return;
            const childPath = parentPath ? `${parentPath}/${key}` : key;
            paths.push(childPath);
            paths = paths.concat(collectFolderPaths(structure[key], childPath));
        });
        return paths;
    };

    const getWorkspaceRootFromPath = (pathValue) => {
        const normalized = String(pathValue || "")
            .replace(/\\/g, "/")
            .trim();
        if (!normalized) return "";
        return normalized.split("/")[0] || "";
    };

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

    const renderFolderStructure = (structure, parentFolder = "", depth = 0) => {
        return Object.keys(structure).map((key) => {
            if (key === "files") {
                return structure[key].map((file) => {
                    const isFileActive =
                        fileActiveId === `${parentFolder}/${file}`;
                    const indent = depth * 14 + 10;
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
                            {renameTarget &&
                            renameTarget.name === file &&
                            renameTarget.parentFolder === parentFolder &&
                            renameTarget.type === "file" ? (
                                <div
                                    className="flex flex-1 min-w-0 items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <input
                                        ref={renameInputRef}
                                        type="text"
                                        value={renameValue}
                                        onChange={(e) =>
                                            setRenameValue(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter")
                                                confirmRename();
                                            if (e.key === "Escape")
                                                cancelRename();
                                        }}
                                        onBlur={confirmRename}
                                        className="flex-1 min-w-0 text-sm px-1.5 py-0.5 border border-[#0D9488] rounded outline-none bg-white text-gray-800"
                                    />
                                </div>
                            ) : (
                                <>
                                    <div
                                        className={`flex flex-1 min-w-0 tracking-wide gap-2 items-center transition-all cursor-pointer ${
                                            isFileActive
                                                ? "font-semibold"
                                                : "font-normal"
                                        }`}
                                        onClick={() =>
                                            handleFileSelect(parentFolder, file)
                                        }
                                    >
                                        <span className="flex-shrink-0">
                                            {getFileIcon(file)}
                                        </span>
                                        <span
                                            className="truncate text-sm"
                                            title={file}
                                        >
                                            {file}
                                        </span>
                                    </div>
                                    <div className="flex gap-1.5 flex-shrink-0 items-center ml-2">
                                        {ENABLE_MOVE_UI && (
                                            <button
                                                className="w-6 h-6 rounded border border-indigo-300 bg-white flex items-center justify-center transition-all hover:scale-110 hover:bg-indigo-50 text-indigo-600"
                                                title="Move file"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startMove(
                                                        file,
                                                        parentFolder,
                                                        "file",
                                                    );
                                                }}
                                            >
                                                <MdDriveFileMove size={13} />
                                            </button>
                                        )}
                                        <button
                                            className="w-6 h-6 rounded border border-blue-300 bg-white flex items-center justify-center transition-all hover:scale-110 hover:bg-blue-50 text-blue-500"
                                            title="Rename"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startRename(
                                                    file,
                                                    parentFolder,
                                                    "file",
                                                );
                                            }}
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button
                                            className="w-6 h-6 rounded border border-red-300 bg-white flex items-center justify-center transition-all hover:scale-110 hover:bg-red-50 text-red-500"
                                            title="Delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteTarget({
                                                    folder: parentFolder,
                                                    file,
                                                    displayName: file,
                                                });
                                            }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                });
            } else {
                const newParentFolder = parentFolder
                    ? `${parentFolder}/${key}`
                    : key;
                const isExpanded = expandedFolders.includes(newParentFolder);
                const isSelectedFolder = activeFolder === newParentFolder;
                const isActive = isSelectedFolder && !fileActiveId;
                const indent = depth * 14 + 8;

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
                                    setActiveFolderWithoutToggling(
                                        newParentFolder,
                                    );
                                    toggleFolderExpansion(newParentFolder);
                                }}
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    {isExpanded ? (
                                        <IoIosArrowDown
                                            className={`flex-shrink-0 transition-colors ${
                                                isActive
                                                    ? "text-[#0D9488]"
                                                    : "text-gray-500"
                                            }`}
                                        />
                                    ) : (
                                        <IoIosArrowForward
                                            className={`flex-shrink-0 transition-colors ${
                                                isActive
                                                    ? "text-[#0D9488]"
                                                    : "text-gray-500"
                                            }`}
                                        />
                                    )}
                                    <Folder
                                        size={14}
                                        className={
                                            isActive
                                                ? "text-amber-600"
                                                : "text-amber-500"
                                        }
                                    />
                                </span>
                                {renameTarget &&
                                renameTarget.name === key &&
                                renameTarget.parentFolder === parentFolder &&
                                renameTarget.type === "folder" ? (
                                    <div
                                        className="flex-1 min-w-0"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            ref={renameInputRef}
                                            type="text"
                                            value={renameValue}
                                            onChange={(e) =>
                                                setRenameValue(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter")
                                                    confirmRename();
                                                if (e.key === "Escape")
                                                    cancelRename();
                                            }}
                                            onBlur={confirmRename}
                                            className="w-full text-sm px-1.5 py-0.5 border border-[#0D9488] rounded outline-none bg-white text-gray-800"
                                        />
                                    </div>
                                ) : (
                                    <span
                                        className="truncate text-sm flex items-center gap-1.5"
                                        title={key}
                                    >
                                        {isSelectedFolder && (
                                            <span className="mx-0.5 h-1 w-1 rounded-full bg-[#14B8A6] ring-1 ring-[#99F6E4] flex-shrink-0" />
                                        )}
                                        <span className="truncate">{key}</span>
                                    </span>
                                )}
                            </div>
                            {!(
                                renameTarget &&
                                renameTarget.name === key &&
                                renameTarget.parentFolder === parentFolder &&
                                renameTarget.type === "folder"
                            ) && (
                                <div className="flex gap-1.5 flex-shrink-0 items-center ml-2">
                                    <button
                                        className="w-6 h-6 rounded border border-emerald-300 bg-white flex items-center justify-center transition-all hover:scale-110 hover:bg-emerald-50 text-emerald-600"
                                        title="Upload dataset here"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveFolder(newParentFolder);
                                            setTimeout(
                                                () => inputRef.current?.click(),
                                                0,
                                            );
                                        }}
                                    >
                                        <Upload size={12} />
                                    </button>
                                    <button
                                        className="w-6 h-6 rounded border border-amber-300 bg-white flex items-center justify-center transition-all hover:scale-110 hover:bg-amber-50 text-amber-600"
                                        title="Dataset format conversion"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveFolder(newParentFolder);
                                            setTimeout(
                                                () =>
                                                    convertInputRef.current?.click(),
                                                0,
                                            );
                                        }}
                                    >
                                        <ArrowLeftRight size={12} />
                                    </button>
                                    {ENABLE_MOVE_UI && (
                                        <button
                                            className="w-6 h-6 rounded border border-indigo-300 bg-white flex items-center justify-center transition-all hover:scale-110 hover:bg-indigo-50 text-indigo-600"
                                            title="Move folder"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startMove(
                                                    key,
                                                    parentFolder,
                                                    "folder",
                                                );
                                            }}
                                        >
                                            <MdDriveFileMove size={13} />
                                        </button>
                                    )}
                                    <button
                                        className="w-6 h-6 rounded border border-blue-300 bg-white flex items-center justify-center transition-all hover:scale-110 hover:bg-blue-50 text-blue-500"
                                        title="Rename folder"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            startRename(
                                                key,
                                                parentFolder,
                                                "folder",
                                            );
                                        }}
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button
                                        className="w-6 h-6 rounded border border-red-300 bg-white flex items-center justify-center transition-all hover:scale-110 hover:bg-red-50 text-red-500"
                                        title="Delete folder"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteTarget({
                                                folder: newParentFolder,
                                                file: null,
                                                displayName: key,
                                            });
                                        }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                        {isExpanded && (
                            <div className="ml-4 border-l border-gray-300/80">
                                {renderFolderStructure(
                                    structure[key],
                                    newParentFolder,
                                    depth + 1,
                                )}
                            </div>
                        )}
                    </div>
                );
            }
        });
    };

    const hasProjectSelected = Boolean(projectId);
    const hasDirectoryContent =
        directoryStructure && Object.keys(directoryStructure).length > 0;
    const rootLabel = displayProjectName || "Project Files";
    const isProjectRootSelected = !activeFolder && !fileActiveId;
    const trimmedSearchQuery = directorySearchQuery.trim();
    const filteredDirectoryStructure = trimmedSearchQuery
        ? filterDirectoryStructure(directoryStructure || {}, trimmedSearchQuery)
        : directoryStructure;
    const hasFilteredResults =
        filteredDirectoryStructure &&
        Object.keys(filteredDirectoryStructure).length > 0;

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
                        <div
                            className={`group w-full flex items-center gap-2 px-2.5 py-2.5 cursor-pointer transition-colors duration-150 shadow-[0_2px_6px_-5px_rgba(15,23,42,0.45)] ${
                                isProjectRootSelected
                                    ? "bg-[#E6F7F5] text-[#0F766E]"
                                    : "bg-transparent text-gray-800 hover:bg-[#F5FAF9]"
                            }`}
                            onClick={() => {
                                setFileActiveId("");
                                setActiveFolder("");
                            }}
                        >
                            <FolderOpen
                                size={14}
                                className={
                                    isProjectRootSelected
                                        ? "text-[#0F766E]"
                                        : "text-[#0D9488]"
                                }
                            />
                            {renameTarget && renameTarget.type === "project" ? (
                                <input
                                    ref={renameInputRef}
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) =>
                                        setRenameValue(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") confirmRename();
                                        if (e.key === "Escape") cancelRename();
                                    }}
                                    onBlur={confirmRename}
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
                            {!(
                                renameTarget && renameTarget.type === "project"
                            ) && (
                                <div className="ml-auto flex items-center gap-1.5">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowSearchInput((prev) => !prev);
                                            if (showSearchInput)
                                                setDirectorySearchQuery("");
                                        }}
                                        className="w-7 h-7 rounded border border-amber-300 bg-white hover:bg-amber-50 text-amber-600 flex items-center justify-center transition-all hover:scale-110"
                                        title="Search in project directory"
                                    >
                                        <Search size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveFolder("");
                                            inputRef.current?.click();
                                        }}
                                        className="w-7 h-7 rounded border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-600 flex items-center justify-center transition-all hover:scale-110"
                                        title="Upload dataset to project root"
                                    >
                                        <Upload size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveFolder("");
                                            handleConvertClick();
                                        }}
                                        className="w-7 h-7 rounded border border-amber-300 bg-white hover:bg-amber-50 text-amber-600 flex items-center justify-center transition-all hover:scale-110"
                                        title="Convert dataset in project root"
                                    >
                                        <ArrowLeftRight size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            startRename(
                                                displayProjectName,
                                                "",
                                                "project",
                                            );
                                        }}
                                        className="w-7 h-7 rounded border border-blue-300 bg-white hover:bg-blue-50 text-blue-600 flex items-center justify-center transition-all hover:scale-110"
                                        title="Rename project"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteTarget({
                                                type: "project",
                                                displayName: displayProjectName,
                                            });
                                        }}
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
                                    onChange={(e) =>
                                        setDirectorySearchQuery(e.target.value)
                                    }
                                    placeholder="Search files, charts, folders..."
                                    className="flex-1 min-w-0 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
                                    autoFocus
                                />
                                {directorySearchQuery && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDirectorySearchQuery("")
                                        }
                                        className="p-1 rounded hover:bg-gray-100 text-gray-500"
                                        title="Clear search"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="mt-1 ml-4 flex-1 min-h-0">
                            {hasDirectoryContent ? (
                                hasFilteredResults ? (
                                    renderFolderStructure(
                                        filteredDirectoryStructure,
                                        "",
                                        0,
                                    )
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
            <div className="sticky bottom-0 z-10 shrink-0 border-t border-gray-200 bg-gray-50 px-3 py-2.5">
                <div className="mb-2 px-0.5 flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                        Selected directory
                    </span>
                    <span
                        className="max-w-[150px] truncate rounded-full bg-[#E6F7F5] px-2 py-0.5 text-[11px] font-medium text-[#0D9488]"
                        title={activeFolder || rootLabel}
                    >
                        {activeFolder || rootLabel}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <input
                        type="text"
                        placeholder="New folder..."
                        value={newFolderName}
                        disabled={!hasProjectSelected}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateFolder();
                        }}
                        className="flex-1 min-w-0 bg-white text-gray-700 text-xs border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-[#0D9488] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    />
                    <button
                        disabled={!hasProjectSelected}
                        onClick={handleCreateFolder}
                        className="w-7 h-7 rounded border border-[#0D9488]/30 bg-white hover:bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                        title="Create folder"
                    >
                        <FolderPlus size={14} />
                    </button>
                    <button
                        disabled={!hasProjectSelected}
                        onClick={() => inputRef.current?.click()}
                        className="w-7 h-7 rounded border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-600 flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                        title="Upload CSV file"
                    >
                        <Upload size={14} />
                    </button>
                    <button
                        disabled={!hasProjectSelected}
                        onClick={handleConvertClick}
                        className="w-7 h-7 rounded border border-amber-300 bg-white hover:bg-amber-50 text-amber-600 flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                        title="Convert dataset format"
                    >
                        <ArrowLeftRight size={14} />
                    </button>
                </div>
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
            </div>

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
                    <div className="mb-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                        <h3 className="text-lg font-semibold mb-2 flex-shrink-0">
                            Preview (First 100 rows)
                        </h3>
                        <div className="border border-gray-300 rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
                            <div
                                className="overflow-x-auto overflow-y-auto flex-1"
                                style={{ maxHeight: "calc(90vh - 300px)" }}
                            >
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            {columns.map((col, idx) => (
                                                <th
                                                    key={idx}
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {csvData
                                            .slice(0, 100)
                                            .map((row, rowIdx) => (
                                                <tr
                                                    key={rowIdx}
                                                    className="hover:bg-gray-50"
                                                >
                                                    {columns.map(
                                                        (col, colIdx) => (
                                                            <td
                                                                key={colIdx}
                                                                className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                                                            >
                                                                {row[col] !==
                                                                    null &&
                                                                row[col] !==
                                                                    undefined
                                                                    ? String(
                                                                          row[
                                                                              col
                                                                          ],
                                                                      )
                                                                    : ""}
                                                            </td>
                                                        ),
                                                    )}
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                            {csvData.length > 100 && (
                                <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 text-center">
                                    Showing first 100 rows of {csvData.length}{" "}
                                    total rows
                                </div>
                            )}
                        </div>
                    </div>
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
                    <div className="mb-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                        <h3 className="text-lg font-semibold mb-2 flex-shrink-0">
                            Preview (CSV Format)
                        </h3>
                        <div className="border border-gray-300 rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
                            <div
                                className="overflow-x-auto overflow-y-auto flex-1"
                                style={{ maxHeight: "calc(90vh - 300px)" }}
                            >
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            {columns.map((col, idx) => (
                                                <th
                                                    key={idx}
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {csvData
                                            .slice(0, 100)
                                            .map((row, rowIdx) => (
                                                <tr
                                                    key={rowIdx}
                                                    className="hover:bg-gray-50"
                                                >
                                                    {columns.map(
                                                        (col, colIdx) => (
                                                            <td
                                                                key={colIdx}
                                                                className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                                                            >
                                                                {row[col] !==
                                                                    null &&
                                                                row[col] !==
                                                                    undefined
                                                                    ? String(
                                                                          row[
                                                                              col
                                                                          ],
                                                                      )
                                                                    : ""}
                                                            </td>
                                                        ),
                                                    )}
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                            {csvData.length > 100 && (
                                <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 text-center">
                                    Showing first 100 rows of {csvData.length}{" "}
                                    total rows
                                </div>
                            )}
                        </div>
                    </div>
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
