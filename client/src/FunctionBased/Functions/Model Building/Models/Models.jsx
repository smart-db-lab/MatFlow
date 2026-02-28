import React, { useEffect, useState } from "react";
import { AiOutlineDelete, AiOutlineDownload } from "react-icons/ai";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import { syncSplitAndModelCache } from "../../../../util/modelDatasetSync";

function Models({ csvData }) {
  const { projectId } = useParams();
  const [allModels, setAllModels] = useState({});
  const [activeDatasets, setActiveDatasets] = useState([]);
  const [archivedDatasets, setArchivedDatasets] = useState([]);
  const [activeModelsByDataset, setActiveModelsByDataset] = useState({});
  const [archivedModelsByDataset, setArchivedModelsByDataset] = useState({});
  const [render, setRender] = useState(false);

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
      const synced = await syncSplitAndModelCache(projectId);
      const rawModels = await fetchDataFromIndexedDB("models");
      const activeMap = buildDatasetMap(synced.activeModelEntries || synced.modelEntries || []);
      const archivedMap = buildDatasetMap(synced.archivedModelEntries || []);
      const rawMap = buildDatasetMap(rawModels || []);

      setAllModels(rawMap);
      setActiveModelsByDataset(activeMap);
      setArchivedModelsByDataset(archivedMap);
      setActiveDatasets(Object.keys(activeMap));
      setArchivedDatasets(Object.keys(archivedMap));
    };

    fetchData();
  }, [render, projectId]);

  const handleDelete = async (datasetName, modelName) => {
    let allModels = await fetchDataFromIndexedDB("models");
    const ind = allModels.findIndex((obj) => datasetName in obj);
    if (ind !== -1) {
      if (
        Object.keys(allModels[ind][datasetName]).length > 0 &&
        allModels[ind][datasetName]
      ) {
        if (allModels[ind][datasetName][modelName])
          delete allModels[ind][datasetName][modelName];
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
    }
    await updateDataInIndexedDB("models", allModels);
    setRender(!render);
  };

  const handleDownload = async (datasetName, modelName) => {
    try {
      const modelPayload = allModels?.[datasetName]?.[modelName];
      const modelEncoded = modelPayload?.model_deploy;

      if (!modelEncoded) {
        toast.error("Model file is not available for download.");
        return;
      }

      const binaryString = window.atob(modelEncoded);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i += 1) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "application/octet-stream" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${modelName}.joblib`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
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
          <h3 className="text-[13px] font-semibold text-gray-800 uppercase tracking-wider">
            {title}
          </h3>
          {subtitle ? (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
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
            <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-4">Dataset</div>
              <div className="col-span-5">Model</div>
              <div className="col-span-3 text-right">Actions</div>
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
                    className="rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center gap-1.5"
                    onClick={() => handleDownload(row.datasetName, row.modelName)}
                  >
                    Download
                    <AiOutlineDownload className="text-sm" />
                  </button>
                  <button
                    className="rounded-lg border border-red-300 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors inline-flex items-center justify-center gap-1.5"
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

  return (
    <div className="my-6 space-y-4">
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
  );
}

export default Models;
