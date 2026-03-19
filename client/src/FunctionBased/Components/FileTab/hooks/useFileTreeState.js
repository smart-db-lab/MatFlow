import { useEffect, useState } from "react";
import { setActiveFile, setActiveFolderAction } from "../../../../Slices/UploadedFileSlice";
import { setActiveFunction } from "../../../../Slices/SideBarSlice";
import { setActiveWorkspace } from "../../../../Slices/workspaceSlice";
import { apiService, commonApi } from "../../../../services/api/apiService";
import {
    sessionGetJson,
    sessionGetString,
    sessionSetJson,
    sessionSetString,
} from "../../../../util/sessionProjectStorage";
import { sanitizeDirectoryStructure } from "../utils/fileTreeUtils";

export function useFileTreeState({ projectId, projectName, render, dispatch }) {
    const [directoryStructure, setDirectoryStructure] = useState({});
    const [isDirectoryLoading, setIsDirectoryLoading] = useState(false);
    const [fileActiveId, setFileActiveId] = useState("");
    const [activeFolder, setActiveFolder] = useState("");
    const [expandedFolders, setExpandedFolders] = useState([]);
    const [displayProjectName, setDisplayProjectName] = useState(
        projectName || "Project Files",
    );
    const [showSearchInput, setShowSearchInput] = useState(false);
    const [directorySearchQuery, setDirectorySearchQuery] = useState("");

    useEffect(() => {
        setDisplayProjectName(projectName || "Project Files");
    }, [projectName]);

    const fetchDirectoryStructure = async () => {
        if (!projectId) return;
        setIsDirectoryLoading(true);
        try {
            const data = await apiService.matflow.dataset.getAllFiles(projectId);
            const sanitized = sanitizeDirectoryStructure(data);
            setDirectoryStructure(sanitized);
            if (
                activeFolder &&
                (String(activeFolder.split("/")[0] || "").trim() === "output" ||
                    String(activeFolder.split("/")[0] || "").trim() === "Output")
            ) {
                setActiveFolder("");
            }
        } catch (error) {
            console.error("Error fetching directory structure:", error);
        } finally {
            setIsDirectoryLoading(false);
        }
    };

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, render, projectId]);

    useEffect(() => {
        if (!projectId) return;
        sessionSetJson("expandedFolders", projectId, expandedFolders);
    }, [expandedFolders, projectId]);

    useEffect(() => {
        if (!projectId) return;
        sessionSetString("activeFolder", projectId, activeFolder);
        dispatch(setActiveFolderAction(activeFolder));
    }, [activeFolder, dispatch, projectId]);

    useEffect(() => {
        dispatch(setActiveFile({ name: fileActiveId }));
        if (projectId) {
            sessionSetString("activeFileId", projectId, fileActiveId);
        }
        let folder = fileActiveId.split("/");
        folder = folder.slice(0, folder.length - 1).join("/");
        dispatch(setActiveFolderAction(folder));

        const syncWorkspaceFromActiveFile = async () => {
            if (!projectId || !fileActiveId) return;
            const normalized = String(fileActiveId || "")
                .replace(/\\/g, "/")
                .trim();
            if (!normalized) return;
            const workspaceName = normalized.split("/")[0] || "";
            if (!workspaceName) return;

            try {
                const workspaces = await commonApi.projects.listWorkspaces(projectId);
                const list = Array.isArray(workspaces) ? workspaces : [];
                const matched = list.find(
                    (w) => String(w?.name || "") === String(workspaceName),
                );
                if (matched?.id) {
                    dispatch(
                        setActiveWorkspace({
                            workspaceId: matched.id,
                            filename:
                                matched.dataset_filename ||
                                normalized.split("/").pop() ||
                                null,
                        }),
                    );
                }
            } catch (err) {
                console.warn(
                    "[FileTab] Failed to sync active workspace from file selection:",
                    err,
                );
            }
        };

        syncWorkspaceFromActiveFile();
    }, [fileActiveId, dispatch, projectId]);

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

    const handleFileSelect = (folder, name) => {
        const fullPath = `${folder}/${name}`.replace(/\\/g, "/").toLowerCase();
        const modelExtensions = [".joblib", ".pkl", ".pth", ".pt"];
        const chartExtensions = [".png", ".jpg", ".jpeg", ".svg", ".webp", ".json"];
        const isModelFile =
            fullPath.includes("/output/models/") ||
            modelExtensions.some((ext) => fullPath.endsWith(ext));
        const isChartFile =
            fullPath.includes("/output/charts/") &&
            chartExtensions.some((ext) => fullPath.endsWith(ext));
        const nextFunction = isModelFile
            ? "Materials Property Prediction"
            : isChartFile
              ? "Chart Preview"
              : "Dataset Preview";

        setFileActiveId(`${folder}/${name}`);
        if (projectId) {
            sessionSetString("activeFunction", projectId, nextFunction);
        }
        dispatch(setActiveFunction(nextFunction));
    };

    const clearActiveFolder = () => {
        setActiveFolder("");
    };

    return {
        directoryStructure,
        setDirectoryStructure,
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
    };
}
