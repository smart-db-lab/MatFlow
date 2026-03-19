import React, { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import { AiOutlineDelete, AiOutlineDownload } from "react-icons/ai";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import { syncSplitAndModelCache } from "../../../../util/modelDatasetSync";
import {
  FE_SECTION_TITLE_CLASS,
  FE_SUB_LABEL_CLASS,
} from "../../Feature Engineering/feUi";
import { apiService } from "../../../../services/api/apiService";
import { getWorkspaceRootFromPath } from "../../../../util/utils";

function Models({ csvData }) {
  const { projectId } = useParams();
  const modelsDbName = projectId ? `models:${projectId}` : "models";
  const splitDbName = projectId
    ? `splitted_dataset:${projectId}`
    : "splitted_dataset";
  const [allModels, setAllModels] = useState({});
  const [activeDatasets, setActiveDatasets] = useState([]);
  const [archivedDatasets, setArchivedDatasets] = useState([]);
  const [activeModelsByDataset, setActiveModelsByDataset] = useState({});
  const [archivedModelsByDataset, setArchivedModelsByDataset] = useState({});
  const [render, setRender] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getModelCount = (datasetMap = {}) =>
    Object.values(datasetMap).reduce(
      (total, models) => total + Object.keys(models || {}).length,
      0,
    );

  const toIndexedDbShape = (datasetMap = {}) =>
    Object.entries(datasetMap).map(([datasetName, models]) => ({
      [datasetName]: models,
    }));

  const buildDatasetMap = (entries = []) => {
    const temp = {};
    (entries || []).forEach((entry) => {
      if (!entry || typeof entry !== "object") return;
      const datasetName = Object.keys(entry)[0];
      if (!datasetName) return;
      temp[datasetName] = entry[datasetName] || {};
    });
    return temp;
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const serverRegistry = await apiService.matflow.ml
          .listModelsRegistry(projectId)
          .catch(() => null);
        const serverModels = Array.isArray(serverRegistry?.models)
          ? serverRegistry.models
          : [];

        if (serverModels.length > 0) {
          const rawMap = {};
          const activeMap = {};
          const archivedMap = {};

          serverModels.forEach((row) => {
            const datasetName =
              row.dataset_name || row.workspace_name || "Unknown Dataset";
            const modelName = row.model_name;
            if (!modelName) return;

            const modelPayload = {
              id: row.id,
              metrics:
                row.metrics && typeof row.metrics === "object"
                  ? row.metrics
                  : {},
              metrics_table: Array.isArray(row.metrics_table)
                ? row.metrics_table
                : [],
              y_pred: Array.isArray(row.y_pred) ? row.y_pred : [],
              type: row.model_type || "",
              regressor: row.algorithm || "",
              model_deploy: row.model_deploy || "",
              input_schema: Array.isArray(row.input_schema)
                ? row.input_schema
                : [],
              feature_columns: Array.isArray(row.feature_columns)
                ? row.feature_columns
                : [],
              workspace_model_file: row.model_file || "",
              workspace_metadata_file: row.metadata_file || "",
              split_folder: row.split_folder || "",
            };

            if (!rawMap[datasetName]) rawMap[datasetName] = {};
            rawMap[datasetName][modelName] = modelPayload;

            if (row.active) {
              if (!activeMap[datasetName]) activeMap[datasetName] = {};
              activeMap[datasetName][modelName] = modelPayload;
            } else {
              if (!archivedMap[datasetName]) archivedMap[datasetName] = {};
              archivedMap[datasetName][modelName] = modelPayload;
            }
          });

          setAllModels(rawMap);
          setActiveModelsByDataset(activeMap);
          setArchivedModelsByDataset(archivedMap);
          setActiveDatasets(Object.keys(activeMap));
          setArchivedDatasets(Object.keys(archivedMap));

          // Keep local cache as fallback when server is temporarily unavailable.
          await updateDataInIndexedDB(modelsDbName, toIndexedDbShape(rawMap)).catch(
            () => {},
          );
          setIsLoading(false);
          return;
        }

        const synced = await syncSplitAndModelCache(projectId);
        const rawModels = await fetchDataFromIndexedDB(modelsDbName);
        const activeMap = buildDatasetMap(
          synced.activeModelEntries || synced.modelEntries || [],
        );
        const archivedMap = buildDatasetMap(synced.archivedModelEntries || []);
        const rawMap = buildDatasetMap(rawModels || []);

        setAllModels(rawMap);
        setActiveModelsByDataset(activeMap);
        setArchivedModelsByDataset(archivedMap);
        setActiveDatasets(Object.keys(activeMap));
        setArchivedDatasets(Object.keys(archivedMap));
      } catch {
        setAllModels({});
        setActiveModelsByDataset({});
        setArchivedModelsByDataset({});
        setActiveDatasets([]);
        setArchivedDatasets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [render, projectId]);

  const handleDelete = async (datasetName, modelName) => {
    try {
      const serverModelId = allModels?.[datasetName]?.[modelName]?.id;
      if (serverModelId) {
        await apiService.matflow.ml.deleteModelRegistry(serverModelId, projectId);
        setRender(!render);
        toast.success("Model deleted successfully.");
        return;
      }

      let allModels = await fetchDataFromIndexedDB(modelsDbName).catch(() => []);
      if (!Array.isArray(allModels)) {
        allModels = [];
      }
      const ind = allModels.findIndex((obj) => datasetName in obj);
      if (ind !== -1) {
        if (
          Object.keys(allModels[ind][datasetName]).length > 0 &&
          allModels[ind][datasetName]
        ) {
          if (allModels[ind][datasetName][modelName]) {
            delete allModels[ind][datasetName][modelName];
          }
          if (
            !(
              Object.keys(allModels[ind][datasetName]).length > 0 &&
              allModels[ind][datasetName]
            )
          ) {
            allModels = allModels.filter((val, i) => i !== ind);
          }
        } else {
          allModels = allModels.filter((val, i) => i !== ind);
        }
      } else {
        toast.info("Model not found.");
        return;
      }
      await updateDataInIndexedDB(modelsDbName, allModels);
      setRender(!render);
      toast.success("Model deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete model.");
    }
  };

  const handleDownload = async (datasetName, modelName) => {
    try {
      const serverModel = allModels?.[datasetName]?.[modelName];
      if (serverModel?.id) {
        const response = await apiService.matflow.ml.downloadModelRegistry(
          serverModel.id,
          projectId,
        );
        if (!response.ok) {
          throw new Error("Model file unavailable.");
        }
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const fileName =
          serverModel.workspace_model_file || `${modelName}.joblib`;
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        toast.success("Download started.");
        return;
      }

      const modelPayload = allModels?.[datasetName]?.[modelName];
      const modelEncoded = modelPayload?.model_deploy;

      if (!modelEncoded) {
        toast.error("Model file unavailable.");
        return;
      }

      const binaryString = window.atob(modelEncoded);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i += 1) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "application/octet-stream" });
      const fileName = `${modelName}.joblib`;
      const resolveWorkspaceRoot = async () => {
        const splitEntries = await fetchDataFromIndexedDB(splitDbName).catch(
          () => [],
        );
        const splitMeta = (splitEntries || [])
          .map((entry) => {
            if (Object.keys(entry || {})[0] === datasetName) {
              return entry[datasetName];
            }
            return undefined;
          })
          .filter((value) => value !== undefined && value !== null)[0];
        if (!Array.isArray(splitMeta) || !splitMeta[5]) return "";
        return getWorkspaceRootFromPath(splitMeta[5]);
      };

      const persistInWorkspace = async () => {
        if (!projectId) return false;
        const workspaceRoot = await resolveWorkspaceRoot();
        if (!workspaceRoot) return false;
        const formData = new FormData();
        formData.append("project_id", projectId);
        formData.append("folder", `${workspaceRoot}/output/models`);
        formData.append(
          "file",
          new File([blob], fileName, { type: "application/octet-stream" }),
        );
        await apiService.matflow.dataset.uploadFile(formData);
        return true;
      };

      const supportsSavePicker =
        typeof window !== "undefined" &&
        typeof window.showSaveFilePicker === "function";
      let localStatus = "started";

      if (supportsSavePicker) {
        try {
          const picker = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: "Joblib Model File",
                accept: {
                  "application/octet-stream": [".joblib"],
                },
              },
            ],
          });
          const writable = await picker.createWritable();
          await writable.write(blob);
          await writable.close();
          localStatus = "saved";
        } catch (pickerError) {
          if (pickerError?.name === "AbortError") {
            toast.info("Download cancelled.");
            return;
          }
          throw pickerError;
        }
      }

      if (!supportsSavePicker) {
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }

      try {
        await persistInWorkspace();
      } catch (_) {
        // Workspace persistence is best-effort.
      }

      if (localStatus === "saved") {
        toast.success("Model saved successfully.");
      } else {
        toast.success("Download started.");
      }
    } catch (error) {
      toast.error("Failed to download model.");
    }
  };

  const renderDatasetSection = ({
    title,
    subtitle,
    datasets,
    datasetModelMap,
    sectionType = "active",
  }) => {
    const rows = datasets.flatMap((datasetName) => {
      const modelNames = Object.keys(datasetModelMap[datasetName] || {});
      return modelNames.map((modelName, index) => ({
        datasetName,
        modelName,
        isFirstInGroup: index === 0,
        groupSize: modelNames.length,
      }));
    });

    return (
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
        <div>
          <h3 className={FE_SECTION_TITLE_CLASS}>
            {title}
          </h3>
          {subtitle ? (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          ) : null}
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            sectionType === "archived"
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {datasets.length} dataset{datasets.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="p-4">
        {datasets.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center">
            <p className="text-sm text-gray-500">
              {sectionType === "archived"
                ? "No archived models."
                : "No active models available."}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 px-4 py-2.5">
              <div className={`col-span-4 ${FE_SUB_LABEL_CLASS} !mb-0`}>Dataset</div>
              <div className={`col-span-5 ${FE_SUB_LABEL_CLASS} !mb-0`}>Model</div>
              <div className={`col-span-3 text-right ${FE_SUB_LABEL_CLASS} !mb-0`}>Actions</div>
            </div>

            {rows.map((row, index) => (
              <div
                key={`${sectionType}-${row.datasetName}-${row.modelName}`}
                className={`grid grid-cols-12 items-center px-4 py-3 ${
                  index !== rows.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="col-span-4 min-w-0 pr-3">
                  {row.isFirstInGroup ? (
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {row.datasetName}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-300">-</p>
                  )}
                </div>

                <div className="col-span-5 min-w-0 pr-3">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {row.modelName}
                  </p>
                </div>

                <div className="col-span-3 flex items-center justify-end gap-2">
                  <button
                    className="rounded-md border border-blue-300 bg-white px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center gap-1.5"
                    onClick={() => handleDownload(row.datasetName, row.modelName)}
                  >
                    Download
                    <AiOutlineDownload className="text-sm" />
                  </button>
                  <button
                    className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors inline-flex items-center justify-center gap-1.5"
                    onClick={() => handleDelete(row.datasetName, row.modelName)}
                  >
                    Delete
                    <AiOutlineDelete className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  };
  
  if (isLoading)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-600">
          <CircularProgress size={34} sx={{ color: "#0D9488" }} />
          <p className="text-sm font-medium">Loading models...</p>
        </div>
      </div>
    );

  if (
    activeDatasets.length === 0 &&
    archivedDatasets.length === 0
  )
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-700">No Models Found</p>
        <p className="text-sm text-gray-400">Build a model first to see saved models.</p>
      </div>
    );

  const totalModelCount =
    getModelCount(activeModelsByDataset) + getModelCount(archivedModelsByDataset);
  const shouldEnableScrollForLargeLists = totalModelCount > 10;

  return (
    <div className="mt-2 mb-3 matflow-unified-input-height">
      <div
        className={
          shouldEnableScrollForLargeLists
            ? "space-y-4 max-h-[62vh] overflow-y-auto pr-1"
            : "space-y-4"
        }
      >
        {renderDatasetSection({
          title: "Active Models",
          subtitle: "Available in current model building flow.",
          datasets: activeDatasets,
          datasetModelMap: activeModelsByDataset,
          sectionType: "active",
        })}

        {renderDatasetSection({
          title: "Archived Models",
          subtitle: "These models can still be downloaded or permanently deleted.",
          datasets: archivedDatasets,
          datasetModelMap: archivedModelsByDataset,
          sectionType: "archived",
        })}
      </div>
    </div>
  );
}

export default Models;
