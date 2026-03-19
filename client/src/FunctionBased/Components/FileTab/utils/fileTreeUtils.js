export const RESERVED_SYSTEM_FOLDERS = new Set([
    "original_dataset",
    "output",
    "output/charts",
    "output/generated_datasets",
    "output/models",
    "output/train_test",
]);

export const SYSTEM_FOLDER_DISPLAY_NAMES = {
    output: "Outputs",
    original_dataset: "Original Dataset",
    charts: "Charts & Graphs",
    generated_datasets: "Generated Dataset",
    models: "Saved ML Models",
    train_test: "Train-Test Dataset",
};

export const LEGACY_ROOT_OUTPUT_KEYS = new Set(["output", "Output"]);

export const normalizePath = (value) =>
    String(value || "")
        .replace(/\\/g, "/")
        .replace(/^\/+|\/+$/g, "");

export const formatFolderDisplayName = (folderName) => {
    const normalized = String(folderName || "").trim().toLowerCase();
    return SYSTEM_FOLDER_DISPLAY_NAMES[normalized] || folderName;
};

export const getWorkspaceRelativeFolderPath = (folderPath) => {
    const normalized = normalizePath(folderPath);
    if (!normalized) return "";
    const parts = normalized.split("/");
    if (parts.length <= 1) return "";
    return parts.slice(1).join("/").toLowerCase();
};

export const isReservedSystemFolderPath = (folderPath) => {
    const normalized = normalizePath(folderPath).toLowerCase();
    const workspaceRelative = getWorkspaceRelativeFolderPath(folderPath);
    return (
        RESERVED_SYSTEM_FOLDERS.has(normalized) ||
        RESERVED_SYSTEM_FOLDERS.has(workspaceRelative)
    );
};

export const sanitizeDirectoryStructure = (rawStructure) => {
    if (!rawStructure || typeof rawStructure !== "object") return {};
    const next = { ...rawStructure };
    for (const key of Object.keys(next)) {
        if (LEGACY_ROOT_OUTPUT_KEYS.has(String(key || "").trim())) {
            delete next[key];
        }
    }
    return next;
};

export const filterDirectoryStructure = (structure, query) => {
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

export const collectFolderPaths = (structure, parentPath = "") => {
    let paths = [];
    Object.keys(structure || {}).forEach((key) => {
        if (key === "files") return;
        const childPath = parentPath ? `${parentPath}/${key}` : key;
        paths.push(childPath);
        paths = paths.concat(collectFolderPaths(structure[key], childPath));
    });
    return paths;
};

export const getWorkspaceRootFromPath = (pathValue) => {
    const normalized = String(pathValue || "")
        .replace(/\\/g, "/")
        .trim();
    if (!normalized) return "";
    return normalized.split("/")[0] || "";
};

export const getFolderNodeByPath = (structure, folderPath) => {
    const normalizedPath = String(folderPath || "")
        .replace(/\\/g, "/")
        .trim();
    if (!normalizedPath) return null;
    const segments = normalizedPath.split("/").filter(Boolean);
    let currentNode = structure;
    for (const segment of segments) {
        if (!currentNode || typeof currentNode !== "object") {
            return null;
        }
        currentNode = currentNode[segment];
    }
    return currentNode && typeof currentNode === "object" ? currentNode : null;
};

export const collectFolderFileEntries = (
    folderNode,
    folderPath,
    relativePrefix = "",
) => {
    if (!folderNode || typeof folderNode !== "object") return [];
    const entries = [];
    const files = Array.isArray(folderNode.files) ? folderNode.files : [];
    files.forEach((fileName) => {
        const zipPath = relativePrefix ? `${relativePrefix}/${fileName}` : fileName;
        entries.push({
            folder: folderPath,
            file: fileName,
            zipPath,
        });
    });

    Object.keys(folderNode).forEach((key) => {
        if (key === "files") return;
        const childNode = folderNode[key];
        if (!childNode || typeof childNode !== "object" || Array.isArray(childNode)) {
            return;
        }
        const childFolderPath = `${folderPath}/${key}`;
        const childRelativePrefix = relativePrefix
            ? `${relativePrefix}/${key}`
            : key;
        entries.push(
            ...collectFolderFileEntries(
                childNode,
                childFolderPath,
                childRelativePrefix,
            ),
        );
    });

    return entries;
};
