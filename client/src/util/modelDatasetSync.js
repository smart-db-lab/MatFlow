import { FetchFileNames } from "./utils";
import { fetchDataFromIndexedDB, updateDataInIndexedDB } from "./indexDB";

const normalizePath = (folder = "", filename = "") => {
  const safeFolder = (folder || "").trim();
  const safeFile = (filename || "").trim();
  if (!safeFile) return "";
  return safeFolder ? `${safeFolder}/${safeFile}`.replace(/\\/g, "/") : safeFile;
};

const getDatasetName = (entry) => {
  if (!entry || typeof entry !== "object") return null;
  const keys = Object.keys(entry);
  return keys.length > 0 ? keys[0] : null;
};

export const syncSplitAndModelCache = async (projectId) => {
  if (!projectId) {
    const splitEntries = (await fetchDataFromIndexedDB("splitted_dataset").catch(() => [])) || [];
    const modelEntries = (await fetchDataFromIndexedDB("models").catch(() => [])) || [];
    const splitNames = Array.isArray(splitEntries)
      ? splitEntries.map((entry) => getDatasetName(entry)).filter(Boolean)
      : [];
    const splitNameSet = new Set(splitNames);
    const safeModelEntries = Array.isArray(modelEntries) ? modelEntries : [];
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
    fetchDataFromIndexedDB("splitted_dataset").catch(() => []),
    fetchDataFromIndexedDB("models").catch(() => []),
    FetchFileNames({ projectId }).catch(() => []),
  ]);

  const splitEntries = Array.isArray(splitEntriesRaw) ? splitEntriesRaw : [];
  const modelEntries = Array.isArray(modelEntriesRaw) ? modelEntriesRaw : [];
  const fileSet = new Set((Array.isArray(allFilePaths) ? allFilePaths : []).map((p) => String(p).replace(/\\/g, "/")));

  const validSplitEntries = splitEntries.filter((entry) => {
    const datasetName = getDatasetName(entry);
    if (!datasetName) return false;

    const meta = entry[datasetName];
    if (!Array.isArray(meta) || meta.length < 6) return false;

    const folder = meta[5] || "";
    const trainFilePath = normalizePath(folder, `${meta[1]}.csv`);
    const testFilePath = normalizePath(folder, `${meta[2]}.csv`);

    return fileSet.has(trainFilePath) && fileSet.has(testFilePath);
  });

  const validDatasetNames = new Set(validSplitEntries.map((entry) => getDatasetName(entry)).filter(Boolean));
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
    await updateDataInIndexedDB("splitted_dataset", validSplitEntries);
  }

  return {
    splitEntries: validSplitEntries,
    modelEntries: validModelEntries,
    activeModelEntries: validModelEntries,
    archivedModelEntries,
    splitNames: validSplitEntries.map((entry) => getDatasetName(entry)).filter(Boolean),
    archivedModelNames: archivedModelEntries
      .map((entry) => getDatasetName(entry))
      .filter(Boolean),
  };
};
