import { apiService } from "../services/api/apiService";

export const getWorkspaceRootFromPath = (pathValue = "") => {
    const normalized = String(pathValue || "")
        .replace(/\\/g, "/")
        .trim();
    if (!normalized) return "";
    const [root] = normalized.split("/");
    return root || "";
};

export const CreateFile = async ({
    projectId,
    data,
    filename,
    foldername = "",
}) => {
    try {
        await apiService.matflow.dataset.createFile(
            projectId,
            data,
            filename,
            foldername,
        );
        console.log("File created successfully!");
    } catch (error) {
        console.error("Error creating file:", error);
        throw new Error(
            error.message ||
                error?.data?.error ||
                "An error occurred while creating the file",
        );
    }
};

/**
 * Returns the correct folder path for a newly generated dataset.
 * For workspace files (activeFolder = "ws_name/original_dataset"), saves to
 * "ws_name/output/generated_datasets" (or train_test for splits).
 * For legacy (non-workspace) files, saves to a top-level subfolder.
 *
 * @param {string} activeFolder  - current Redux activeFolder value
 * @param {string} type          - "generated_datasets" (default) | "train_test"
 */
export const getNewDatasetFolder = (
    activeFolder,
    type = "generated_datasets",
    activeFilePath = "",
) => {
    const subFolder =
        type === "train_test" ? "train_test" : "generated_datasets";
    const workspaceRoot =
        getWorkspaceRootFromPath(activeFolder) ||
        getWorkspaceRootFromPath(activeFilePath);
    if (!workspaceRoot) {
        throw new Error(
            "Workspace context is required to save generated datasets.",
        );
    }
    return `${workspaceRoot}/output/${subFolder}`;
};

export const UpdateFile = async ({
    projectId,
    data,
    filename,
    foldername = "",
}) => {
    try {
        await apiService.matflow.dataset.updateFile(
            projectId,
            data,
            filename,
            foldername,
        );
        console.log("File updated on server successfully!");
    } catch (error) {
        console.error("Error updating file on server:", error);
        // Non-fatal: log and continue so IndexedDB update still succeeds
        console.warn(
            "Server update failed – changes are only cached locally:",
            error.message,
        );
    }
};

export const ReadFile = async ({
    projectId,
    workspaceId,
    foldername = "",
    logicalFolder,
    filename,
}) => {
    if (!projectId || !filename) {
        throw new Error("projectId and filename are required to read a file.");
    }
    try {
        const fileData = await apiService.matflow.dataset.readFile({
            projectId,
            workspaceId,
            folder: logicalFolder || foldername,
            filename,
        });
        return fileData;
    } catch (error) {
        console.error("Error reading file:", error);
        throw new Error(
            error.message || "An error occurred while reading the file",
        );
    }
};

// Recursively extract all file paths from the nested structure
const getAllFiles = (structure, parentPath = "") => {
    let files = [];
    for (const key in structure) {
        if (key === "files") {
            files = files.concat(
                structure[key].map((file) =>
                    parentPath ? `${parentPath}/${file}` : file,
                ),
            );
        } else {
            const subFiles = getAllFiles(
                structure[key],
                parentPath ? `${parentPath}/${key}` : key,
            );
            files = files.concat(subFiles);
        }
    }
    return files;
};

export const FetchFileNames = async ({ projectId }) => {
    try {
        if (!projectId) {
            throw new Error("projectId is required to fetch file names");
        }
        const data = await apiService.matflow.dataset.getAllFiles(projectId);
        const files = getAllFiles(data);
        return files;
    } catch (err) {
        console.error(err);
        throw new Error(err);
    }
};
