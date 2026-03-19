import { useState } from "react";
import JSZip from "jszip";
import { toast } from "react-toastify";
import { clearIndexedDB, deleteIndexedDB } from "../../../../util/indexDB";
import { apiService, commonApi } from "../../../../services/api/apiService";
import { syncSplitAndModelCache } from "../../../../util/modelDatasetSync";
import {
    collectFolderFileEntries,
    getFolderNodeByPath,
    getWorkspaceRootFromPath,
} from "../utils/fileTreeUtils";

export function useFileActions({
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
}) {
    const [uploadedFile, setUploadedFile] = useState("");
    const [newFolderName, setNewFolderName] = useState("");
    const [convertFile, setConvertFile] = useState(null);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [renameTarget, setRenameTarget] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [moveTarget, setMoveTarget] = useState(null);
    const [moveDestination, setMoveDestination] = useState("");

    const handleDelete = async (folder, file = null) => {
        try {
            const deleted = await apiService.matflow.dataset.delete(
                projectId,
                folder,
                file,
            );

            if (deleted) {
                toast.success(`${file ? "File" : "Folder"} deleted successfully.`);
                if (file) {
                    await deleteIndexedDB(`${folder}/${file}`);
                }
                await syncSplitAndModelCache(projectId).catch(() => null);
                fetchDirectoryStructure();
            } else {
                throw new Error("Failed to delete item");
            }
        } catch (error) {
            toast.error(`Error deleting ${file ? "file" : "folder"}`);
        }
    };

    const handleDownloadFile = async (folder, file) => {
        try {
            const response = await apiService.matflow.dataset.fetchProjectFile(
                projectId,
                folder,
                file,
            );
            if (!response?.ok) {
                throw new Error("Unable to fetch file for download.");
            }
            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = file;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error("Error downloading file:", error);
            toast.error("Failed to download file.");
        }
    };

    const handleDownloadFolder = async (folderPath, folderDisplayName) => {
        try {
            const folderNode = getFolderNodeByPath(directoryStructure, folderPath);
            if (!folderNode) {
                throw new Error("Unable to locate folder.");
            }

            const fileEntries = collectFolderFileEntries(folderNode, folderPath);
            if (!fileEntries.length) {
                toast.warning("This folder has no downloadable files.");
                return;
            }

            const zip = new JSZip();
            const blobs = await Promise.all(
                fileEntries.map(async ({ folder, file, zipPath }) => {
                    const response =
                        await apiService.matflow.dataset.fetchProjectFile(
                            projectId,
                            folder,
                            file,
                        );
                    if (!response?.ok) {
                        throw new Error(`Failed to fetch "${file}".`);
                    }
                    const blob = await response.blob();
                    return { zipPath, blob };
                }),
            );

            blobs.forEach(({ zipPath, blob }) => {
                zip.file(zipPath, blob);
            });

            const zipBlob = await zip.generateAsync({ type: "blob" });
            const zipUrl = URL.createObjectURL(zipBlob);
            const link = document.createElement("a");
            link.href = zipUrl;
            link.download = `${folderDisplayName || "folder"}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(zipUrl);
        } catch (error) {
            console.error("Error downloading folder:", error);
            toast.error("Failed to download folder as ZIP.");
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

    const handleRename = async (
        currentName,
        newName,
        parentFolder = "",
        type = "file",
    ) => {
        if (!newName.trim()) {
            toast.error("Name cannot be empty!");
            return;
        }

        if (type === "folder") {
            const fullFolderPath = parentFolder
                ? `${parentFolder}/${currentName}`
                : currentName;
            if (isReservedSystemFolderPath(fullFolderPath)) {
                toast.warning(
                    "System folders cannot be renamed: Original Dataset, Outputs, Charts & Graphs, Generated Dataset, Saved ML Models, Train-Test Dataset.",
                );
                return;
            }
        }

        try {
            await apiService.matflow.dataset.rename(
                projectId,
                currentName,
                newName,
                parentFolder,
            );
            toast.success("Renamed successfully!");
            fetchDirectoryStructure();
        } catch (error) {
            const msg =
                error?.data?.error || error?.data?.detail || error?.message;
            toast.error(msg || "Error renaming item!");
        }
    };

    const startRename = (name, parentFolder, type) => {
        if (type === "folder") {
            const fullFolderPath = parentFolder ? `${parentFolder}/${name}` : name;
            if (isReservedSystemFolderPath(fullFolderPath)) {
                toast.warning(
                    "System folders cannot be renamed: Original Dataset, Outputs, Charts & Graphs, Generated Dataset, Saved ML Models, Train-Test Dataset.",
                );
                return;
            }
        }
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
                await handleRename(name, renameValue.trim(), parentFolder, type);
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
        if (
            deleteTarget.type !== "project" &&
            !deleteTarget.file &&
            isReservedSystemFolderPath(deleteTarget.folder)
        ) {
            toast.warning(
                "System folders cannot be deleted: Original Dataset, Outputs, Charts & Graphs, Generated Dataset, Saved ML Models, Train-Test Dataset.",
            );
            setDeleteTarget(null);
            return;
        }
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

    return {
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
        setRenameTarget,
        renameValue,
        setRenameValue,
        deleteTarget,
        setDeleteTarget,
        moveTarget,
        moveDestination,
        setMoveDestination,
        handleDelete,
        handleDownloadFile,
        handleDownloadFolder,
        handleFileChange,
        handleConvertFileChange,
        handleCreateFolder,
        startRename,
        confirmRename,
        cancelRename,
        confirmDelete,
        startMove,
        closeMoveModal,
        confirmMove,
    };
}
