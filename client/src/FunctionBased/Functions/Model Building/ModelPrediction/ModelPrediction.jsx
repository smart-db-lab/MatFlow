import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { setActiveFunction } from "../../../../Slices/SideBarSlice";
import { setActiveWorkspace } from "../../../../Slices/workspaceSlice";
import { toast } from "react-toastify";
import { getAuthHeaders } from "../../../../util/adminAuth";
import { fetchDataFromIndexedDB } from "../../../../util/indexDB";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import AgGridComponent from "../../../Components/AgGridComponent/AgGridComponent";
import LayoutSelector from "../../../Components/LayoutSelector/LayoutSelector";
import Plot from "react-plotly.js";
import { Modal } from "../../Feature Engineering/muiCompat";
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";
import { applyPlotlyTheme } from "../../../../shared/plotlyTheme";
import { syncSplitAndModelCache } from "../../../../util/modelDatasetSync";
import { ReadFile, getWorkspaceRootFromPath } from "../../../../util/utils";
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
    "QQ Plot",
    "Box Plot of Residuals",
];

function ModelPrediction({ csvData }) {
    const dispatch = useDispatch();
    const { projectId } = useParams();
    const splitDbName = projectId
        ? `splitted_dataset:${projectId}`
        : "splitted_dataset";
    const modelsDbName = projectId ? `models:${projectId}` : "models";
    const activeWorkspaceId = useSelector(
        (state) => state.workspace?.activeWorkspaceId,
    );
    const [selectDataset, setSelectDataset] = useState();
    const [allDataset, setAllDataset] = useState();
    const [allModels, setAllModels] = useState();
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

    const [visible, setVisible] = useState(false);

    const openModal = () => setVisible(true);
    const closeModal = () => setVisible(false);
    const sanitizeNamePart = (value) => {
        return String(value || "unknown")
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_+|_+$/g, "")
            .toLowerCase();
    };

    const getPredictionRows = (predictionResponse) => {
        const table = predictionResponse?.table;
        if (!table) return null;
        if (Array.isArray(table)) return table;
        if (typeof table === "string") {
            try {
                const parsed = JSON.parse(table);
                return Array.isArray(parsed) ? parsed : null;
            } catch {
                return null;
            }
        }
        return null;
    };

    const saveChartOutput = async (predictionResponse) => {
        if (!projectId || !predictionResponse?.graph) return;
        try {
            const workspaceRoot = getWorkspaceRootFromPath(
                selectedSplitMeta?.[5] || "",
            );
            if (!workspaceRoot) {
                throw new Error(
                    "Workspace context missing for chart persistence.",
                );
            }
            const chartOutputFolder = `${workspaceRoot}/output/charts`;
            const timestamp = Date.now();
            const datasetPart = sanitizeNamePart(selectDataset);
            const modelPart = sanitizeNamePart(select_model);
            const resultPart = sanitizeNamePart(result || "chart");
            const graphPayload =
                typeof predictionResponse.graph === "string"
                    ? predictionResponse.graph
                    : JSON.stringify(predictionResponse.graph, null, 2);

            const graphFileName = `${timestamp}__${datasetPart}_${modelPart}_${resultPart}.json`;
            const graphBlob = new Blob([graphPayload], {
                type: "application/json",
            });
            const graphFile = new File([graphBlob], graphFileName, {
                type: "application/json",
            });

            const formData = new FormData();
            formData.append("project_id", projectId);
            formData.append("folder", chartOutputFolder);
            formData.append("file", graphFile);
            await apiService.matflow.dataset.uploadFile(formData);

            toast.success(`Prediction chart saved: "${graphFileName}".`);
        } catch (chartSaveError) {
            toast.warning(
                `Prediction completed, but chart save failed.${chartSaveError?.message ? ` ${chartSaveError.message}` : ""}`,
            );
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const synced = await syncSplitAndModelCache(projectId);
            setAllDataset(synced.splitNames || []);
            setAllModels(synced.modelEntries || []);
        };

        fetchData();
    }, [projectId]);

    useEffect(() => {
        if (type === "Categorical") setResult("Confusion Matrix");
        else setResult(RESULT_REGRESSOR[0]);
    }, [type]);

    const handleSelectDataset = async (e) => {
        setData();
        setSelectDataset(e);
        setSelectModel(undefined);
        setModelData(undefined);

        let temp = (allModels || []).map((val) => {
            if (Object.keys(val)[0] === e) {
                return val[e];
            }
            return undefined;
        });
        temp = temp.filter((val) => val !== undefined && val !== null)[0];
        if (!temp || typeof temp !== "object") {
            setCurrentModels([]);
            setType(undefined);
            setSelectData(undefined);
            setTargetVariable("");
            return;
        }

        setCurrentModels(Object.keys(temp));
        let tempDatasets = await fetchDataFromIndexedDB(splitDbName).catch(
            () => [],
        );
        tempDatasets = (tempDatasets || []).map((val) => {
            if (Object.keys(val)[0] === e) {
                return val[e];
            }
            return undefined;
        });
        tempDatasets = tempDatasets.filter(
            (val) => val !== undefined && val !== null,
        )[0];
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

    const handleModelChange = async (e) => {
        setData();
        setSelectModel(e);
        let res = await fetchDataFromIndexedDB(modelsDbName).catch(() => []);

        res = (res || []).map((val) => val[selectDataset]);
        const modelGroup = res.filter(
            (val) => val !== undefined && val !== null,
        )[0];
        if (!modelGroup || !modelGroup[e]) {
            setModelData(undefined);
            return;
        }
        res = modelGroup[e];

        setModelData(res);
    };

    const handleSave = async () => {
        try {
            if (!modelData || !modelData.metrics) {
                toast.error("Please select a valid dataset and model first.");
                return;
            }
            if (!selectedSplitMeta || !Array.isArray(selectedSplitMeta)) {
                toast.error(
                    "Dataset metadata missing. Please reselect dataset.",
                );
                return;
            }

            setLoading(true);

            // Get workspace_id and filename from Redux (populated during dataset selection)
            const reduxWorkspaceId = activeWorkspaceId;
            const testFilename = selectedSplitMeta?.[2];

            console.log(
                "[handleSave] Redux activeWorkspaceId:",
                reduxWorkspaceId,
            );
            console.log("[handleSave] selectedSplitMeta:", selectedSplitMeta);
            console.log("[handleSave] testFilename:", testFilename);

            if (!reduxWorkspaceId) {
                console.error("[handleSave] Workspace ID missing from Redux");
                toast.error("Workspace ID not found. Please reselect dataset.");
                setLoading(false);
                return;
            }

            if (!testFilename) {
                console.error("[handleSave] Test filename missing");
                toast.error("Test dataset filename missing from metadata.");
                setLoading(false);
                return;
            }

            // Filename already includes extension from SplitDataset
            const filenameWithExt = testFilename;

            console.log("[handleSave] Sending API request:", {
                workspace_id: reduxWorkspaceId,
                filename: filenameWithExt,
                type: modelData.type,
            });

            const Data = await apiService.matflow.ml.predictModel({
                "Target Variable": target_variable,
                model: modelData.metrics_table,
                filename: filenameWithExt,
                workspace_id: reduxWorkspaceId,
                Result: result,
                y_pred: modelData.y_pred,
                type: modelData.type,
                regressor: modelData.regressor,
            });

            setData(Data);

            if (Data.error) {
                toast.error(JSON.stringify(Data.error), {
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
                setData();
            }

            // Auto-save prediction dataset (rows + Actual/Predicted) into project files
            if (projectId) {
                const predictionRows = getPredictionRows(Data);
                if (
                    Array.isArray(predictionRows) &&
                    predictionRows.length > 0 &&
                    Object.prototype.hasOwnProperty.call(
                        predictionRows[0],
                        "Actual",
                    ) &&
                    Object.prototype.hasOwnProperty.call(
                        predictionRows[0],
                        "Predicted",
                    )
                ) {
                    const workspaceRoot = getWorkspaceRootFromPath(
                        selectedSplitMeta?.[5] || "",
                    );
                    if (!workspaceRoot) {
                        throw new Error(
                            "Workspace context missing for prediction persistence.",
                        );
                    }
                    const predictionOutputFolder = `${workspaceRoot}/output/generated_datasets`;
                    const timestamp = Date.now();
                    const datasetPart = sanitizeNamePart(selectDataset);
                    const modelPart = sanitizeNamePart(select_model);
                    const fileName = `${timestamp}__${datasetPart}_${modelPart}`;
                    await apiService.matflow.dataset.createFile(
                        projectId,
                        predictionRows,
                        fileName,
                        predictionOutputFolder,
                    );
                    toast.success(
                        `Prediction dataset saved: "${fileName}.csv".`,
                    );
                }
                await saveChartOutput(Data);
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            toast.error(
                error?.message ||
                    "Prediction failed. Please reselect dataset/model and retry.",
            );
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
    if (!allModels || allModels.length === 0)
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
        if (normalizedTitle === "actual vs. predicted") {
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
            <div className="px-5 py-3.5 border-b border-gray-100">
                <h3 className={FE_SECTION_TITLE_CLASS}>{title}</h3>
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
                />
            </div>
        </div>
    );

    // Helper to render a graph card
    const renderGraphCard = (title, graphJson) => {
        const parsed =
            typeof graphJson === "string" ? JSON.parse(graphJson) : graphJson;

        // Check if it's an array with ECharts format (new backend returns array of options)
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.xAxis) {
            return (
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100">
                        <h3 className={FE_SECTION_TITLE_CLASS}>{title}</h3>
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
                <div className="px-5 py-3.5 border-b border-gray-100">
                    <h3 className={FE_SECTION_TITLE_CLASS}>{title}</h3>
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
        "QQ Plot",
        "Box Plot of Residuals",
        "Metrics Summary",
    ];

    return (
        <div className="w-full h-full flex flex-col gap-4">
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
                                        handleSelectDataset(e)
                                    }
                                />
                            </div>
                            <div>
                                <label className={FE_SUB_LABEL_CLASS}>
                                    Model
                                </label>
                                <SingleDropDown
                                    columnNames={currentModels || []}
                                    onValueChange={(e) => handleModelChange(e)}
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
                                        type === "Categorical"
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
                                                    "Actual vs. Predicted",
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
                                                    "Actual vs. Predicted",
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
                                        data.graph && (
                                            <>
                                                {renderTableCard(
                                                    "Actual vs. Predicted",
                                                    JSON.parse(data.table),
                                                    Object.keys(
                                                        JSON.parse(
                                                            data.table,
                                                        )[0],
                                                    ),
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
                                                    "Actual vs. Predicted",
                                                    JSON.parse(data.table),
                                                    Object.keys(
                                                        JSON.parse(
                                                            data.table,
                                                        )[0],
                                                    ),
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
