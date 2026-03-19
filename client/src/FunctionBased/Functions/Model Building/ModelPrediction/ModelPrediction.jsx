import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { setActiveFunction } from "../../../../Slices/SideBarSlice";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import { setActiveWorkspace } from "../../../../Slices/workspaceSlice";
import { toast } from "react-toastify";
import { getAuthHeaders } from "../../../../util/adminAuth";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import AgGridComponent from "../../../Components/AgGridComponent/AgGridComponent";
import LayoutSelector from "../../../Components/LayoutSelector/LayoutSelector";
import Plot from "react-plotly.js";
import { Modal } from "../../Feature Engineering/muiCompat";
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";
import { applyPlotlyTheme } from "../../../../shared/plotlyTheme";
import { getWorkspaceRootFromPath } from "../../../../util/utils";
import {
    FE_SECTION_TITLE_CLASS,
    FE_SUB_LABEL_CLASS,
} from "../../Feature Engineering/feUi";

const RESULT_CLASSIFIER = [
    "Confusion Matrix",
    "Target Value",
    "Class-wise Metrics",
    "Accuracy",
    "Precision",
    "Recall",
    "F1-Score",
    "Classification Report",
    "Actual vs. Predicted",
    "Precision-Recall Curve",
    "ROC Curve",
];

const RESULT_REGRESSOR = [
    "Target Value",
    "Metrics Summary",
    "R-Squared",
    "Mean Absolute Error",
    "Mean Squared Error",
    "Root Mean Squared Error",
    "Regression Line Plot",
    "Actual vs. Predicted",
    "Residuals vs. Predicted",
    "Histogram of Residuals",
    "Quantile-Quantile (Q-Q) Plot",
    "Box Plot of Residuals",
];

function ModelPrediction({ csvData }) {
    const dispatch = useDispatch();
    const { projectId } = useParams();
    const activeWorkspaceId = useSelector(
        (state) => state.workspace?.activeWorkspaceId,
    );
    const rerender = useSelector((state) => state.uploadedFile.rerender);
    const [selectDataset, setSelectDataset] = useState();
    const [allDataset, setAllDataset] = useState();
    const [allModels, setAllModels] = useState();
    const [datasetModelOrderMap, setDatasetModelOrderMap] = useState({});
    const [select_data, setSelectData] = useState();
    const [target_variable, setTargetVariable] = useState("Vertical");
    const [select_model, setSelectModel] = useState();
    const [currentModels, setCurrentModels] = useState();
    const [modelData, setModelData] = useState();
    const [result, setResult] = useState();
    const [data, setData] = useState();
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState();
    const [selectedSplitMeta, setSelectedSplitMeta] = useState(null);
    const [datasetMetaMap, setDatasetMetaMap] = useState({});
    const hasUserSelectedDatasetRef = useRef(false);
    const hasUserSelectedModelRef = useRef(false);

    const [visible, setVisible] = useState(false);

    const openModal = () => setVisible(true);
    const closeModal = () => setVisible(false);
    const isCategoricalType = (modelType) => {
        const normalized = String(modelType || "")
            .trim()
            .toLowerCase();
        return (
            normalized === "categorical" ||
            normalized === "classifier" ||
            normalized === "classification"
        );
    };
    const getFriendlyPredictionError = (rawError) => {
        const text =
            typeof rawError === "string"
                ? rawError
                : JSON.stringify(rawError || "");
        const normalized = text.toLowerCase();

        if (normalized.includes("could not convert string to float")) {
            return "Prediction failed. Non-numeric values found (e.g., Iris-versicolor). Encode categorical columns first.";
        }
        return "Prediction failed. Please check input data and try again.";
    };
    const parseJsonSafe = (value, fallback = null) => {
        if (value === null || value === undefined) return fallback;
        if (typeof value === "string") {
            try {
                return JSON.parse(value);
            } catch {
                return fallback;
            }
        }
        return value;
    };
    const normalizeResultForApi = (selectedResult, modelType) => {
        if (isCategoricalType(modelType)) return selectedResult;
        const map = {
            "R-Squared": "R2 Score",
            "Mean Absolute Error": "MAE",
            "Mean Squared Error": "MSE",
            "Root Mean Squared Error": "RMSE",
            "Quantile-Quantile (Q-Q) Plot": "QQ Plot",
        };
        return map[selectedResult] || selectedResult;
    };
    const extractWorkspaceIdFromPath = (pathValue = "") => {
        const normalized = String(pathValue || "");
        const match = normalized.match(
            /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
        );
        return match ? match[0] : "";
    };
    const persistPredictionDatasetOnDownload = async (rows, fileName) => {
        if (!projectId || !Array.isArray(rows) || rows.length === 0) return;
        try {
            const resolvedWorkspaceId =
                activeWorkspaceId ||
                extractWorkspaceIdFromPath(modelData?.workspace_model_file) ||
                extractWorkspaceIdFromPath(modelData?.workspace_metadata_file) ||
                extractWorkspaceIdFromPath(modelData?.split_folder) ||
                extractWorkspaceIdFromPath(selectedSplitMeta?.[5]);

            const workspaceRoot = getWorkspaceRootFromPath(
                modelData?.split_folder || selectedSplitMeta?.[5] || "",
            );
            const targetFolder = resolvedWorkspaceId
                ? "output/generated_datasets"
                : `${workspaceRoot}/output/generated_datasets`;

            if (!resolvedWorkspaceId && !workspaceRoot) {
                toast.warning("Select a dataset first.");
                return;
            }
            await apiService.matflow.dataset.createFile(
                projectId,
                rows,
                fileName,
                targetFolder,
                resolvedWorkspaceId,
            );
            dispatch(setReRender(!rerender));
            toast.success("Dataset saved successfully.");
        } catch (err) {
            toast.error(err?.message || "Failed to save dataset.");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const serverRegistry = await apiService.matflow.ml
                .listModelsRegistry(projectId)
                .catch(() => null);
            const rows = Array.isArray(serverRegistry?.models)
                ? serverRegistry.models
                : [];
            const orderedRows = [...rows].sort(
                (a, b) =>
                    new Date(b?.updated_at || 0).getTime() -
                    new Date(a?.updated_at || 0).getTime(),
            );
            const groupedModels = {};
            const groupedMeta = {};
            const datasetOrder = [];
            const modelOrderByDataset = {};
            const seenModelByDataset = {};

            orderedRows.forEach((row) => {
                const datasetName = String(row?.dataset_name || "").trim();
                const modelName = String(row?.model_name || "").trim();
                if (!datasetName || !modelName) return;

                if (!groupedModels[datasetName]) {
                    groupedModels[datasetName] = {};
                    datasetOrder.push(datasetName);
                    modelOrderByDataset[datasetName] = [];
                    seenModelByDataset[datasetName] = new Set();
                }
                if (!seenModelByDataset[datasetName].has(modelName)) {
                    seenModelByDataset[datasetName].add(modelName);
                    modelOrderByDataset[datasetName].push(modelName);
                }
                groupedModels[datasetName][modelName] = {
                    id: row?.id || "",
                    metrics: row?.metrics || {},
                    metrics_table: row?.metrics_table || {},
                    y_pred: row?.y_pred || [],
                    type: row?.model_type || "",
                    regressor: row?.algorithm || "",
                    split_folder: row?.split_folder || "",
                    workspace_model_file: row?.model_file || "",
                    workspace_metadata_file: row?.metadata_file || "",
                };

                if (!groupedMeta[datasetName]) {
                    const rawType = String(row?.model_type || "").toLowerCase();
                    groupedMeta[datasetName] = [
                        rawType === "classifier" ? "Categorical" : "Continuous",
                        row?.train_filename || "",
                        row?.test_filename || "",
                        row?.target_var || "",
                        row?.test_filename || "",
                        row?.split_folder || "",
                    ];
                }
            });

            setAllDataset(datasetOrder);
            setAllModels(groupedModels);
            setDatasetModelOrderMap(modelOrderByDataset);
            setDatasetMetaMap(groupedMeta);
        };

        fetchData();
    }, [projectId]);

    useEffect(() => {
        if (type === "Categorical") setResult("Confusion Matrix");
        else setResult(RESULT_REGRESSOR[0]);
    }, [type]);

    useEffect(() => {
        if (!Array.isArray(allDataset) || allDataset.length === 0) return;
        const hasValidDataset =
            !!selectDataset && allDataset.includes(selectDataset);
        if (hasUserSelectedDatasetRef.current && hasValidDataset) return;

        const nextDataset = hasValidDataset ? selectDataset : allDataset[0];
        if (nextDataset && nextDataset !== selectDataset) {
            handleSelectDataset(nextDataset, { fromAuto: true });
        }
    }, [
        allDataset,
        allModels,
        datasetMetaMap,
        datasetModelOrderMap,
        selectDataset,
    ]);

    useEffect(() => {
        if (!selectDataset) return;
        const orderedModels = datasetModelOrderMap?.[selectDataset] || [];
        if (!Array.isArray(orderedModels) || orderedModels.length === 0) return;

        const hasValidModel =
            !!select_model && orderedModels.includes(select_model);
        if (hasUserSelectedModelRef.current && hasValidModel) return;

        const nextModel = hasValidModel ? select_model : orderedModels[0];
        if (nextModel && nextModel !== select_model) {
            handleModelChange(nextModel, { fromAuto: true });
        }
    }, [allModels, datasetModelOrderMap, selectDataset, select_model]);

    const handleSelectDataset = async (e, options = {}) => {
        const { fromAuto = false } = options;
        hasUserSelectedDatasetRef.current = !fromAuto;
        hasUserSelectedModelRef.current = false;
        setData();
        setSelectDataset(e);
        setSelectModel(undefined);
        setModelData(undefined);

        const temp = allModels?.[e];
        if (!temp || typeof temp !== "object") {
            setCurrentModels([]);
            setType(undefined);
            setSelectData(undefined);
            setTargetVariable("");
            return;
        }

        setCurrentModels(datasetModelOrderMap?.[e] || Object.keys(temp));
        const tempDatasets = datasetMetaMap?.[e];
        if (!tempDatasets || !Array.isArray(tempDatasets)) {
            setType(undefined);
            setSelectData(undefined);
            setTargetVariable("");
            setSelectedSplitMeta(null);
            return;
        }
        setType(tempDatasets[0]);
        setSelectData(tempDatasets[4]);
        setTargetVariable(tempDatasets[3]);
        setSelectedSplitMeta(tempDatasets);

        const testFilename = tempDatasets[2] || "";

        console.log("[handleSelectDataset] Split metadata:", tempDatasets);
        console.log("[handleSelectDataset] Test filename:", testFilename);

        // Note: Workspace ID comes from Redux state when dataset is selected from workspace context
        // No longer stored in split metadata to avoid null values
    };

    const handleModelChange = async (e, options = {}) => {
        const { fromAuto = false } = options;
        hasUserSelectedModelRef.current = !fromAuto;
        setData();
        setSelectModel(e);
        const modelGroup = allModels?.[selectDataset];
        if (!modelGroup || !modelGroup[e]) {
            setModelData(undefined);
            return;
        }
        const res = modelGroup[e];

        setModelData(res);
        // Prefer model metadata type when available.
        if (res?.type) {
            setType(isCategoricalType(res.type) ? "Categorical" : "Continuous");
        }
    };

    const handleSave = async () => {
        try {
            if (!modelData || !modelData.metrics) {
                toast.error("Select dataset and model first.");
                return;
            }
            if (!selectedSplitMeta || !Array.isArray(selectedSplitMeta)) {
                toast.error("Dataset metadata missing.");
                return;
            }

            setLoading(true);

            // Resolve workspace_id from Redux first, then model/split metadata fallback.
            const resolvedWorkspaceId =
                activeWorkspaceId ||
                extractWorkspaceIdFromPath(modelData?.workspace_model_file) ||
                extractWorkspaceIdFromPath(modelData?.workspace_metadata_file) ||
                extractWorkspaceIdFromPath(modelData?.split_folder) ||
                extractWorkspaceIdFromPath(selectedSplitMeta?.[5]);
            const testFilename = selectedSplitMeta?.[2];

            console.log(
                "[handleSave] Resolved workspaceId:",
                resolvedWorkspaceId,
            );
            console.log("[handleSave] selectedSplitMeta:", selectedSplitMeta);
            console.log("[handleSave] testFilename:", testFilename);

            if (!resolvedWorkspaceId) {
                console.error(
                    "[handleSave] Workspace ID missing from Redux and metadata",
                );
                toast.error("Workspace context missing.");
                setLoading(false);
                return;
            }

            if (!testFilename) {
                console.error("[handleSave] Test filename missing");
                toast.error("Dataset file missing.");
                setLoading(false);
                return;
            }

            // Filename already includes extension from SplitDataset
            const filenameWithExt = testFilename;

            // Keep Redux workspace context in sync if we recovered it from metadata.
            if (!activeWorkspaceId && resolvedWorkspaceId) {
                dispatch(
                    setActiveWorkspace({
                        workspaceId: resolvedWorkspaceId,
                        filename: filenameWithExt || null,
                    }),
                );
            }

            console.log("[handleSave] Sending API request:", {
                workspace_id: resolvedWorkspaceId,
                filename: filenameWithExt,
                type: modelData.type,
            });

            const resultForApi = normalizeResultForApi(result, type);
            const Data = await apiService.matflow.ml.predictModel({
                model_id: modelData?.id || undefined,
                project_id: projectId,
                "Target Variable": target_variable,
                model: modelData.metrics_table,
                filename: filenameWithExt,
                workspace_id: resolvedWorkspaceId,
                Result: resultForApi,
                y_pred: modelData.y_pred,
                type: modelData.type,
                regressor: modelData.regressor,
            });

            const normalizedData =
                Data &&
                typeof Data === "object" &&
                Data !== null &&
                Object.prototype.hasOwnProperty.call(Data, "value") &&
                !Object.prototype.hasOwnProperty.call(Data, "graph") &&
                !Object.prototype.hasOwnProperty.call(Data, "table")
                    ? Data.value
                    : Data;

            setData(normalizedData);

            if (normalizedData?.error) {
                toast.error(getFriendlyPredictionError(normalizedData.error));
                setData();
            }

            setLoading(false);
        } catch (error) {
            setLoading(false);
            toast.error(getFriendlyPredictionError(error?.message || error));
        }
    };

    if (!allDataset)
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3 text-gray-400">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                    <span className="text-sm font-medium">
                        Loading datasets...
                    </span>
                </div>
            </div>
        );
    if (!allModels || Object.keys(allModels).length === 0)
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg
                        className="w-7 h-7 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                    </svg>
                </div>
                <p className="text-lg font-semibold text-gray-700">
                    No Models Found
                </p>
                <p className="text-sm text-gray-400">
                    Build a model first to see predictions.
                </p>
            </div>
        );

    // Helper to render a table card
    const getDownloadFileName = (title) => {
        const normalizedTitle = String(title || "")
            .trim()
            .toLowerCase();
        if (
            normalizedTitle === "actual vs. predicted" ||
            normalizedTitle === "model predicted result"
        ) {
            return `actualvspredicted_${Date.now()}.csv`;
        }
        const safe = String(title || "table")
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .toLowerCase();
        return `${safe}_${Date.now()}.csv`;
    };

    const renderTableCard = (title, rowData, colKeys) => (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm">
            <div className="px-5 py-3.5 border-b border-[#99f6e4] bg-[#f0fdfa] flex items-center justify-between gap-3">
                <h3 className={`${FE_SECTION_TITLE_CLASS} !mb-0 text-[#115e59]`}>
                    {title}
                </h3>
                <span className="inline-flex items-center rounded-full border border-[#99f6e4] bg-white px-2.5 py-0.5 text-xs font-semibold text-[#0f766e]">
                    Table
                </span>
            </div>
            <div className="p-4">
                <AgGridComponent
                    rowData={rowData}
                    columnDefs={colKeys.map((val) => ({
                        headerName: val,
                        field: val,
                        flex: 1,
                        minWidth: 150,
                    }))}
                    height={450}
                    download={true}
                    downloadFileName={getDownloadFileName(title)}
                    onDownload={({ fileName, rows }) =>
                        persistPredictionDatasetOnDownload(rows, fileName)
                    }
                />
            </div>
        </div>
    );

    // Helper to render a graph card
    const renderGraphCard = (_title, graphJson) => {
        const parsed = parseJsonSafe(graphJson);
        if (!parsed) return null;

        // Check if it's an array with ECharts format (new backend returns array of options)
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.xAxis) {
            return (
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-[#bfdbfe] bg-[#eff6ff] flex items-center justify-between gap-3">
                        <h3 className={`${FE_SECTION_TITLE_CLASS} !mb-0 text-[#115e59]`}>
                            Graph Visualization
                        </h3>
                        <span className="inline-flex items-center rounded-full border border-[#99f6e4] bg-white px-2.5 py-0.5 text-xs font-semibold text-[#0f766e]">
                            Graph
                        </span>
                    </div>
                    <div className="p-4">
                        <LayoutSelector echartsData={parsed} />
                    </div>
                </div>
            );
        }

        // Otherwise it's Plotly format
        return (
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#99f6e4] bg-[#ecfeff] flex items-center justify-between gap-3">
                    <h3 className={`${FE_SECTION_TITLE_CLASS} !mb-0 text-[#115e59]`}>
                        Graph Visualization
                    </h3>
                    <span className="inline-flex items-center rounded-full border border-[#99f6e4] bg-white px-2.5 py-0.5 text-xs font-semibold text-[#0f766e]">
                        Graph
                    </span>
                </div>
                <div className="p-4">
                    <Plot
                        data={parsed.data}
                        layout={applyPlotlyTheme(parsed.layout)}
                        config={{ editable: true, responsive: true }}
                        style={{ width: "100%", height: "100%" }}
                    />
                </div>
            </div>
        );
    };

    // Helper to render a metric scorecard
    const renderMetricCard = (label, value) => (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-6 flex flex-col items-center justify-center min-h-[200px] gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {label}
            </span>
            <span
                className="text-4xl font-bold text-gray-900"
                style={{ fontFeatureSettings: "'tnum'" }}
            >
                {typeof value === "number" ? value.toFixed(4) : value}
            </span>
        </div>
    );

    // Determine which classification graph results to render
    const CLASSIFIER_GRAPH_RESULTS = [
        "Confusion Matrix",
        "ROC Curve",
        "Precision-Recall Curve",
        "Class-wise Metrics",
    ];
    const REGRESSOR_GRAPH_RESULTS = [
        "Regression Line Plot",
        "Residuals vs. Predicted",
        "Histogram of Residuals",
        "Quantile-Quantile (Q-Q) Plot",
        "QQ Plot",
        "Box Plot of Residuals",
        "Metrics Summary",
    ];
    const parsedTableData = Array.isArray(data?.table)
        ? data.table
        : parseJsonSafe(data?.table, []);
    const parsedTableCols =
        Array.isArray(parsedTableData) && parsedTableData.length > 0
            ? Object.keys(parsedTableData[0] || {})
            : [];

    return (
        <div className="w-full h-full flex flex-col gap-4 matflow-unified-input-height">
            <div className="flex-1 flex gap-5">
                {/* ── Left Panel: Controls ── */}
                <div className="w-[340px] min-w-[300px] max-w-[400px]">
                    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm">
                        {/* Panel header */}
                        <div className="px-5 py-3.5 border-b border-gray-100">
                            <h3 className={FE_SECTION_TITLE_CLASS}>
                                Configuration
                            </h3>
                        </div>

                        <div className="px-5 py-4 space-y-5">
                            <div>
                                <label className={FE_SUB_LABEL_CLASS}>
                                    Dataset
                                </label>
                                <SingleDropDown
                                    columnNames={allDataset}
                                    onValueChange={(e) =>
                                        handleSelectDataset(e, {
                                            fromAuto: false,
                                        })
                                    }
                                    initValue={selectDataset}
                                />
                            </div>
                            <div>
                                <label className={FE_SUB_LABEL_CLASS}>
                                    Model
                                </label>
                                <SingleDropDown
                                    columnNames={currentModels || []}
                                    onValueChange={(e) =>
                                        handleModelChange(e, {
                                            fromAuto: false,
                                        })
                                    }
                                    initValue={select_model}
                                />
                            </div>
                            <div>
                                <label className={FE_SUB_LABEL_CLASS}>
                                    Data
                                </label>
                                <SingleDropDown
                                    columnNames={
                                        select_data ? [select_data] : []
                                    }
                                    initValue={select_data}
                                    onValueChange={setSelectData}
                                />
                            </div>
                            <div>
                                <label className={FE_SUB_LABEL_CLASS}>
                                    Target Variable
                                </label>
                                <SingleDropDown
                                    columnNames={
                                        target_variable ? [target_variable] : []
                                    }
                                    initValue={target_variable}
                                    onValueChange={setTargetVariable}
                                />
                            </div>
                            <div>
                                <label className={FE_SUB_LABEL_CLASS}>
                                    Result Type
                                </label>
                                <SingleDropDown
                                    columnNames={
                                        isCategoricalType(type)
                                            ? RESULT_CLASSIFIER
                                            : RESULT_REGRESSOR
                                    }
                                    initValue={result}
                                    onValueChange={(e) => {
                                        setResult(e);
                                        setData();
                                    }}
                                />
                            </div>
                        </div>

                        {/* Actions footer */}
                        <div className="px-5 py-4 border-t border-gray-100 space-y-2.5">
                            <button
                                className="w-full px-4 py-2 text-sm font-medium rounded-md bg-primary hover:bg-primary-dark active:bg-primary-dark text-white shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleSave}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg
                                            className="animate-spin h-4 w-4"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                        Loading...
                                    </span>
                                ) : (
                                    "Show Result"
                                )}
                            </button>
                            {!loading && data && (
                                <button
                                    className="w-full px-4 py-2 text-sm font-medium rounded-md bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 hover:shadow-md hover:shadow-emerald-500/25 transition-all duration-150 flex items-center justify-center gap-2"
                                    onClick={() =>
                                        dispatch(setActiveFunction("Models"))
                                    }
                                >
                                    Models
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right Panel: Output ── */}
                <div className="flex-1">
                    {/* Loading state */}
                    {loading && (
                        <div className="flex items-center justify-center h-full min-h-[400px]">
                            <div className="flex items-center gap-3 text-gray-400">
                                <svg
                                    className="animate-spin h-5 w-5"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                <span className="text-sm font-medium">
                                    Generating results...
                                </span>
                            </div>
                        </div>
                    )}

                    {!loading && data && (
                        <div className="flex flex-col gap-5 h-full">
                            {type === "Categorical" ? (
                                <>
                                    {/* Target Value: table + graph */}
                                    {result === "Target Value" &&
                                        data.table &&
                                        data.graph && (
                                            <>
                                                {renderTableCard(
                                                    "Model Predicted Result",
                                                    data.table,
                                                    Object.keys(data.table[0]),
                                                )}
                                                <div className="mt-1">
                                                    {renderGraphCard(
                                                        "Visualization",
                                                        data.graph,
                                                    )}
                                                </div>
                                            </>
                                        )}

                                    {/* Actual vs. Predicted: table + download + graph */}
                                    {result === "Actual vs. Predicted" &&
                                        data.table &&
                                        data.graph && (
                                            <>
                                                {renderTableCard(
                                                    "Model Predicted Result",
                                                    data.table,
                                                    Object.keys(data.table[0]),
                                                )}
                                                <div className="mt-1">
                                                    {renderGraphCard(
                                                        "Visualization",
                                                        data.graph,
                                                    )}
                                                </div>
                                            </>
                                        )}

                                    {/* Graph-only classification results */}
                                    {CLASSIFIER_GRAPH_RESULTS.includes(
                                        result,
                                    ) &&
                                        data.graph &&
                                        renderGraphCard(result, data.graph)}

                                    {/* Classification Report */}
                                    {result === "Classification Report" &&
                                        typeof data === "string" && (
                                            <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
                                                <div className="px-5 py-3.5 border-b border-gray-100">
                                                    <h3
                                                        className={
                                                            FE_SECTION_TITLE_CLASS
                                                        }
                                                    >
                                                        Classification Report
                                                    </h3>
                                                </div>
                                                <div className="p-5">
                                                    <pre className="text-[13px] leading-relaxed text-gray-800 whitespace-pre-wrap font-mono bg-gray-50/80 p-4 rounded-lg border border-gray-100">
                                                        {data}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}

                                    {/* Scalar Metrics */}
                                    {(result === "Accuracy" ||
                                        result === "Precision" ||
                                        result === "Recall" ||
                                        result === "F1-Score") &&
                                        renderMetricCard(result, data)}
                                </>
                            ) : (
                                <>
                                    {/* Regressor Target Value: table + graph */}
                                    {result === "Target Value" &&
                                        data.table &&
                                        data.graph &&
                                        parsedTableCols.length > 0 && (
                                            <>
                                                {renderTableCard(
                                                    "Model Predicted Result",
                                                    parsedTableData,
                                                    parsedTableCols,
                                                )}
                                                <div className="mt-1">
                                                    {renderGraphCard(
                                                        "Visualization",
                                                        data.graph,
                                                    )}
                                                </div>
                                            </>
                                        )}

                                    {/* Actual vs. Predicted: table + download + graph */}
                                    {result === "Actual vs. Predicted" &&
                                        data.table &&
                                        data.graph &&
                                        parsedTableCols.length > 0 && (
                                            <>
                                                {renderTableCard(
                                                    "Model Predicted Result",
                                                    parsedTableData,
                                                    parsedTableCols,
                                                )}
                                                <div className="mt-1">
                                                    {renderGraphCard(
                                                        "Visualization",
                                                        data.graph,
                                                    )}
                                                </div>
                                            </>
                                        )}

                                    {/* Graph-only regression results */}
                                    {REGRESSOR_GRAPH_RESULTS.includes(result) &&
                                        data.graph &&
                                        renderGraphCard(result, data.graph)}

                                    {/* Scalar Metrics */}
                                    {(result === "R-Squared" ||
                                        result === "Mean Absolute Error" ||
                                        result === "Mean Squared Error" ||
                                        result === "Root Mean Squared Error") &&
                                        renderMetricCard(result, data)}
                                </>
                            )}
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && !data && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                <svg
                                    className="w-8 h-8 text-gray-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                                    />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-500">
                                No results yet
                            </p>
                            <p className="text-xs text-gray-400">
                                Select options and click{" "}
                                <span className="font-semibold text-primary">
                                    "Show Result"
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* DOCS FAB */}
            <button
                className="fixed bottom-20 right-5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold rounded-full w-10 h-10 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                onClick={openModal}
            >
                ?
            </button>
            <Modal
                open={visible}
                onClose={closeModal}
                aria-labelledby="help-modal"
                aria-describedby="help-modal-description"
                width="800px"
                scroll
                closeButton
            >
                <div className="bg-white text-left rounded-lg shadow-lg px-6 overflow-auto">
                    <Docs section={"modelPrediction"} />
                </div>
            </Modal>
        </div>
    );
}

export default ModelPrediction;
