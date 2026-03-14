import { FetchFileNames } from "./utils";
import { fetchDataFromIndexedDB, updateDataInIndexedDB } from "./indexDB";

const normalizePath = (folder = "", filename = "") => {
    const safeFolder = (folder || "").trim();
    const safeFile = (filename || "").trim();
    if (!safeFile) return "";
    return safeFolder
        ? `${safeFolder}/${safeFile}`.replace(/\\/g, "/")
        : safeFile;
};

const getDatasetName = (entry) => {
    if (!entry || typeof entry !== "object") return null;
    const keys = Object.keys(entry);
    return keys.length > 0 ? keys[0] : null;
};

export const syncSplitAndModelCache = async (projectId) => {
    const splitDbName = projectId
        ? `splitted_dataset:${projectId}`
        : "splitted_dataset";
    const modelsDbName = projectId ? `models:${projectId}` : "models";
    if (!projectId) {
        const splitEntries =
            (await fetchDataFromIndexedDB(splitDbName).catch(() => [])) || [];
        const modelEntries =
            (await fetchDataFromIndexedDB(modelsDbName).catch(() => [])) || [];
        const splitNames = Array.isArray(splitEntries)
            ? splitEntries.map((entry) => getDatasetName(entry)).filter(Boolean)
            : [];
        const splitNameSet = new Set(splitNames);
        const safeModelEntries = Array.isArray(modelEntries)
            ? modelEntries
            : [];
        const archivedModelEntries = safeModelEntries.filter((entry) => {
            const datasetName = getDatasetName(entry);
            return datasetName && !splitNameSet.has(datasetName);
        });

        return {
            splitEntries: Array.isArray(splitEntries) ? splitEntries : [],
            modelEntries: safeModelEntries,
            activeModelEntries: safeModelEntries.filter((entry) => {
                const datasetName = getDatasetName(entry);
                return datasetName && splitNameSet.has(datasetName);
            }),
            archivedModelEntries,
            splitNames,
            archivedModelNames: archivedModelEntries
                .map((entry) => getDatasetName(entry))
                .filter(Boolean),
        };
    }

    const [splitEntriesRaw, modelEntriesRaw, allFilePaths] = await Promise.all([
        fetchDataFromIndexedDB(splitDbName).catch(() => []),
        fetchDataFromIndexedDB(modelsDbName).catch(() => []),
        FetchFileNames({ projectId }).catch(() => []),
    ]);

    const splitEntries = Array.isArray(splitEntriesRaw) ? splitEntriesRaw : [];
    const modelEntries = Array.isArray(modelEntriesRaw) ? modelEntriesRaw : [];
    const fileList = Array.isArray(allFilePaths) ? allFilePaths : [];
    const fileSet = new Set(
        fileList.map((p) =>
            String(p).replace(/\\/g, "/"),
        ),
    );

    // If file list is empty or missing, skip validation (trust the cache)
    // This handles cases where backend file persistence is used and file sync is delayed
    if (fileList.length === 0) {
        console.log("File list unavailable - skipping split cache validation");
        return {
            splitEntries: splitEntries,
            modelEntries: modelEntries,
            activeModelEntries: modelEntries,
            archivedModelEntries: [],
            splitNames: splitEntries.map((entry) => getDatasetName(entry)).filter(Boolean),
            archivedModelNames: [],
        };
    }

    const validSplitEntries = splitEntries.filter((entry) => {
        const datasetName = getDatasetName(entry);
        if (!datasetName) return false;

        const meta = entry[datasetName];
        if (!Array.isArray(meta) || meta.length < 6) return false;

        const folder = meta[5] || "";
        const trainFile = `${meta[1]}`;
        const testFile = `${meta[2]}`;
        const trainFilePath = normalizePath(folder, trainFile);
        const testFilePath = normalizePath(folder, testFile);

        // Check exact path or just filename (for workspace files)
        const trainExists = fileSet.has(trainFilePath) || fileSet.has(trainFile);
        const testExists = fileSet.has(testFilePath) || fileSet.has(testFile);

        if (!trainExists || !testExists) {
            console.warn(`Split '${datasetName}' validation failed:`, {
                trainFile,
                testFile,
                folder,
                trainFilePath,
                testFilePath,
                trainExists,
                testExists,
            });
        }

        return trainExists && testExists;
    });

    const validDatasetNames = new Set(
        validSplitEntries.map((entry) => getDatasetName(entry)).filter(Boolean),
    );
    const validModelEntries = modelEntries.filter((entry) => {
        const datasetName = getDatasetName(entry);
        return datasetName && validDatasetNames.has(datasetName);
    });
    const archivedModelEntries = modelEntries.filter((entry) => {
        const datasetName = getDatasetName(entry);
        return datasetName && !validDatasetNames.has(datasetName);
    });

    const splitChanged = validSplitEntries.length !== splitEntries.length;

    if (splitChanged) {
        console.log(
            `Split cache validation: ${splitEntries.length} → ${validSplitEntries.length}`,
        );
        await updateDataInIndexedDB(splitDbName, validSplitEntries);
    }

    return {
        splitEntries: validSplitEntries,
        modelEntries: validModelEntries,
        activeModelEntries: validModelEntries,
        archivedModelEntries,
        splitNames: validSplitEntries
            .map((entry) => getDatasetName(entry))
            .filter(Boolean),
        archivedModelNames: archivedModelEntries
            .map((entry) => getDatasetName(entry))
            .filter(Boolean),
    };
};
