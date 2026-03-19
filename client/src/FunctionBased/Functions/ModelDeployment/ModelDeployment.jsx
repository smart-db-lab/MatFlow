import { Input, Modal } from "../Feature Engineering/muiCompat";
import { CircularProgress, LinearProgress } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import { setReRender } from "../../../Slices/UploadedFileSlice";
import { ReadFile, getWorkspaceRootFromPath } from "../../../util/utils";
import Docs from "../../../Docs/Docs";
import { apiService } from "../../../services/api/apiService";

function ModelDeployment({ csvData }) {
    const dispatch = useDispatch();
    const rerender = useSelector((state) => state.uploadedFile.rerender);
    const activeWorkspaceId = useSelector(
        (state) => state.workspace?.activeWorkspaceId,
    );
    const [allColumnNames, setAllColumnNames] = useState([]);
    const [allColumnValues, setAllColumnValues] = useState([]);
    const [modelInputSchema, setModelInputSchema] = useState([]);
    const [modelCatalog, setModelCatalog] = useState([]);
    const [select_columns, setSelectColumns] = useState("all");
    const [filtered_column, setFilteredColumn] = useState(allColumnValues);
    const [train_data, setTrainData] = useState();
    const [target_val, setTargetVal] = useState();
    const [currentModelId, setCurrentModelId] = useState("");
    const [current_model, setCurrentModel] = useState();
    const [pred_result, setPredResult] = useState();
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [singleLoading, setSingleLoading] = useState(false);
    const [dataframe, setDataframe] = useState();
    const [rowDef, setRowDef] = useState();
    const [columnDefs, setColumnDefs] = useState();
    const [featureSearch, setFeatureSearch] = useState("");
    const [singlePage, setSinglePage] = useState(1);
    const [useSourceSample, setUseSourceSample] = useState(false);
    const { projectId } = useParams();

    // Batch prediction state
    const [predMode, setPredMode] = useState("single"); // "single" | "batch"
    const [batchLoading, setBatchLoading] = useState(false);
    const [batchResult, setBatchResult] = useState(null); // { predictions, skipped, total, predicted_count, skipped_count }
    const [batchPreviewRows, setBatchPreviewRows] = useState([]);
    const [batchStatus, setBatchStatus] = useState("IDLE");
    const [batchTaskId, setBatchTaskId] = useState("");
    const [batchProgress, setBatchProgress] = useState({
        processed: 0,
        total: 0,
        percent: 0,
    });
    const batchFileRef = useRef(null);
    const batchPollTimerRef = useRef(null);
    const batchPollInFlightRef = useRef(false);

    const [visible, setVisible] = useState(false);

    const openModal = () => setVisible(true);
    const closeModal = () => setVisible(false);

    const buildModelCatalog = (registryRows = []) => {
        const flattened = [];
        (registryRows || []).forEach((row) => {
            const datasetName = String(row?.dataset_name || "").trim();
            const modelName = String(row?.model_name || "").trim();
            if (!datasetName || !modelName) return;
            flattened.push({
                id: String(row?.id || `${datasetName}::${modelName}`),
                label: modelName,
                datasetName,
                workspaceId: row?.workspace_id || "",
                targetVar: row?.target_var || "",
                folder: row?.split_folder || "",
                trainFile: row?.train_filename || "",
                inputSchema: Array.isArray(row?.input_schema)
                    ? row.input_schema
                    : [],
            });
        });

        return flattened.sort((a, b) => b.label.localeCompare(a.label));
    };

    useEffect(() => {
        const fetchData = async () => {
            setCatalogLoading(true);
            try {
                const serverRegistry = await apiService.matflow.ml
                    .listModelsRegistry(projectId)
                    .catch(() => null);
                const rows = Array.isArray(serverRegistry?.models)
                    ? serverRegistry.models
                    : [];
                setModelCatalog(buildModelCatalog(rows));
            } catch {
                setModelCatalog([]);
            } finally {
                setCatalogLoading(false);
            }
        };
        fetchData();
    }, [projectId]);

    useEffect(() => {
        if (dataframe) {
            const temp =
                dataframe && dataframe.length > 0
                    ? Object.keys(dataframe[0]).map((key) => ({
                          headerName: key,
                          field: key,
                          valueGetter: (params) => {
                              return params.data[key];
                          },
                      }))
                    : [];
            setColumnDefs(temp);
            let tempFilteredCol = filtered_column.map((val) => val.col);
            tempFilteredCol = new Set(tempFilteredCol);

            const tempRow = dataframe.filter((val) =>
                tempFilteredCol.has(val["Name of Features"]),
            );

            setRowDef(tempRow);
        }
    }, [dataframe, filtered_column]);

    useEffect(() => {
        setSinglePage(1);
    }, [featureSearch, filtered_column]);

    const stopBatchPolling = () => {
        if (batchPollTimerRef.current) {
            clearInterval(batchPollTimerRef.current);
            batchPollTimerRef.current = null;
        }
        batchPollInFlightRef.current = false;
    };

    useEffect(() => {
        return () => {
            stopBatchPolling();
        };
    }, []);

    const handleModelSelection = async (selectedLabel) => {
        setPredResult("");
        setBatchResult(null);
        setBatchPreviewRows([]);
        setBatchTaskId("");
        setBatchStatus("IDLE");
        setBatchProgress({ processed: 0, total: 0, percent: 0 });
        setFeatureSearch("");
        setSinglePage(1);
        setUseSourceSample(false);
        setSelectColumns("all");
        setAllColumnNames([]);
        setAllColumnValues([]);
        setFilteredColumn([]);
        setModelInputSchema([]);
        setCurrentModelId("");
        setCurrentModel(selectedLabel);
        const selectedModelMeta = (modelCatalog || []).find(
            (item) => item.label === selectedLabel,
        );
        if (!selectedModelMeta) return;

        setCurrentModelId(String(selectedModelMeta.id || ""));
        setTargetVal(selectedModelMeta.targetVar || "");

        const savedSchema = Array.isArray(selectedModelMeta.inputSchema)
            ? selectedModelMeta.inputSchema
            : [];

        if (savedSchema.length > 0) {
            const deploymentInputs = savedSchema.map((feature) => ({
                ...feature,
                // Keep single-prediction inputs empty on initial load.
                value: "",
            }));
            setModelInputSchema(deploymentInputs);
            setAllColumnValues(deploymentInputs);
            setAllColumnNames(deploymentInputs.map((val) => val.col));
            setFilteredColumn(deploymentInputs);
        }

        if (!selectedModelMeta.trainFile) {
            toast.error(
                "Selected model is missing source train dataset metadata.",
            );
            return;
        }

        let train;
        try {
            console.log(
                "[ModelDeployment] Reading train file for selected model",
                {
                    modelId: selectedModelMeta.id,
                    modelName: selectedModelMeta.label,
                    workspaceId: selectedModelMeta.workspaceId,
                    logicalFolder: selectedModelMeta.folder || "train_test",
                    trainFile: selectedModelMeta.trainFile,
                },
            );
            train = await ReadFile({
                projectId,
                workspaceId: selectedModelMeta.workspaceId || undefined,
                logicalFolder: selectedModelMeta.folder || "train_test",
                foldername: selectedModelMeta.folder || "",
                filename: `${selectedModelMeta.trainFile}`,
            });
        } catch (err) {
            console.error("[ModelDeployment] Train file read failed", {
                modelId: selectedModelMeta.id,
                workspaceId: selectedModelMeta.workspaceId,
                logicalFolder: selectedModelMeta.folder || "train_test",
                trainFile: selectedModelMeta.trainFile,
                error: err,
            });
            toast.error(
                `Train file not found for selected model (${selectedModelMeta.trainFile}). Please re-build model or verify workspace files.`,
            );
            return;
        }

        setTrainData(train);

        // If schema is already saved with the model, we don't need an extra
        // deploy_data call just to build single-input fields.
        if (savedSchema.length > 0) {
            setDataframe([]);
            return;
        }

        const data = await apiService.matflow.deployment.deployData({
            model_id: String(selectedModelMeta.id || ""),
            project_id: projectId,
        });

        if (data?.error) {
            const friendlyMessage = data.error.includes(
                "Error processing column",
            )
                ? "Some columns in this dataset are text-based. Please review input columns or continue with suggested defaults."
                : data.error;
            toast.error(
                friendlyMessage || "Could not prepare model deployment inputs.",
            );
            setDataframe([]);
            setAllColumnValues([]);
            setAllColumnNames([]);
            setFilteredColumn([]);
            return;
        }

        const deploymentInputs = Array.isArray(data?.result)
            ? data.result.map((feature) => ({
                  ...feature,
                  // Values must come from uploaded CSV, not from model selection.
                  value: "",
              }))
            : [];
        setDataframe(data?.correlations || []);
        setModelInputSchema(deploymentInputs);
        setAllColumnValues(deploymentInputs);
        setAllColumnNames(deploymentInputs.map((val) => val.col));
        setFilteredColumn(deploymentInputs);
    };

    const handleChangeValue = (ind, value) => {
        const updated = filtered_column.map((val, i) => {
            if (i === ind) {
                return {
                    ...val,
                    // Keep raw typed value; validate/cast right before submission.
                    value,
                };
            }
            return val;
        });
        setFilteredColumn(updated);

        if (useSourceSample) {
            const allCleared = updated.every(
                (item) =>
                    item?.value === "" ||
                    item?.value === null ||
                    item?.value === undefined,
            );
            if (allCleared) {
                setUseSourceSample(false);
            }
        }
    };

    const handleSelectColumnsMode = (mode) => {
        if (mode === "all") {
            setFilteredColumn(allColumnValues);
        } else {
            setFilteredColumn([]);
        }
        setSelectColumns(mode);
    };

    const normalizeDataType = (dataType) =>
        String(dataType || "")
            .trim()
            .toLowerCase();

    const isIntegerType = (dataType) =>
        ["int", "int64", "int32", "integer", "long"].includes(dataType);

    const isFloatType = (dataType) =>
        [
            "float",
            "float64",
            "float32",
            "double",
            "number",
            "decimal",
        ].includes(dataType);

    const isNumericType = (dataType) =>
        isIntegerType(dataType) || isFloatType(dataType);

    const isNumericString = (value) => {
        if (typeof value === "number") return Number.isFinite(value);
        if (typeof value !== "string") return false;
        const trimmed = value.trim();
        if (!trimmed) return false;
        return !Number.isNaN(Number(trimmed));
    };

    const castValueByType = (rawValue, dataType) => {
        const normalizedType = normalizeDataType(dataType);
        if (rawValue === null || rawValue === undefined || rawValue === "") {
            return "";
        }
        if (isFloatType(normalizedType)) {
            const parsed = parseFloat(rawValue);
            // Fall back to raw string when schema type is wrong (e.g. Smiles marked float).
            return Number.isNaN(parsed) ? String(rawValue) : parsed;
        }
        if (isIntegerType(normalizedType)) {
            const parsed = parseInt(rawValue, 10);
            return Number.isNaN(parsed) ? String(rawValue) : parsed;
        }
        return rawValue;
    };

    const normalizeColumnKey = (key) =>
        String(key || "")
            .trim()
            .toLowerCase()
            .replace(/[\s_\-]+/g, "");

    const getRowValueByFeatureKey = (row, featureKey) => {
        if (!row || typeof row !== "object") return undefined;
        if (Object.prototype.hasOwnProperty.call(row, featureKey)) {
            return row[featureKey];
        }

        const featureKeyLower = String(featureKey || "").toLowerCase();
        const exactCaseInsensitiveKey = Object.keys(row).find(
            (rowKey) => String(rowKey || "").toLowerCase() === featureKeyLower,
        );
        if (exactCaseInsensitiveKey) {
            return row[exactCaseInsensitiveKey];
        }

        const normalizedFeatureKey = normalizeColumnKey(featureKey);
        const normalizedKeyMatch = Object.keys(row).find(
            (rowKey) => normalizeColumnKey(rowKey) === normalizedFeatureKey,
        );
        if (normalizedKeyMatch) {
            return row[normalizedKeyMatch];
        }

        return undefined;
    };

    const isEmptyCellValue = (value) =>
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "");

    const getFirstNonEmptyFeatureValue = (rows, featureKey) => {
        if (!Array.isArray(rows) || rows.length === 0) return undefined;
        for (const row of rows) {
            const candidate = getRowValueByFeatureKey(row, featureKey);
            if (!isEmptyCellValue(candidate)) {
                return candidate;
            }
        }
        return getRowValueByFeatureKey(rows[0], featureKey);
    };

    const shouldUseNumberInput = (feature) => {
        const normalizedType = normalizeDataType(feature?.data_type);
        if (!isNumericType(normalizedType)) return false;

        const normalizedCol = normalizeColumnKey(feature?.col);
        if (normalizedCol.includes("smiles")) return false;

        const currentValue = feature?.value;
        if (
            typeof currentValue === "string" &&
            currentValue.trim() !== "" &&
            !isNumericString(currentValue)
        ) {
            return false;
        }
        return true;
    };

    const applyUploadedRowValues = (baseInputs, sourceRows) => {
        if (!Array.isArray(baseInputs) || baseInputs.length === 0) {
            return baseInputs || [];
        }
        const rows = Array.isArray(sourceRows)
            ? sourceRows
            : sourceRows
              ? [sourceRows]
              : [];
        if (rows.length === 0) {
            return baseInputs;
        }
        return baseInputs.map((feature) => ({
            ...feature,
            value: castValueByType(
                getFirstNonEmptyFeatureValue(rows, feature.col),
                feature.data_type,
            ),
        }));
    };

    // ── Batch prediction ──────────────────────────────────────────────
    const handleBatchFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!currentModelId) {
            toast.error("Please select a model first.");
            e.target.value = "";
            return;
        }

        setBatchResult(null);
        setBatchPreviewRows([]);
        setBatchProgress({ processed: 0, total: 0, percent: 0 });
        setBatchLoading(true);

        if (!Array.isArray(modelInputSchema) || modelInputSchema.length === 0) {
            toast.error("Model schema not ready. Please re-select model.");
            setBatchLoading(false);
            e.target.value = "";
            return;
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (parsed) => {
                try {
                    const rows = Array.isArray(parsed?.data) ? parsed.data : [];
                    if (rows.length === 0) {
                        toast.error("CSV has no rows to preview.");
                        setBatchPreviewRows([]);
                        return;
                    }

                    const uploadedHeaders = Object.keys(rows[0] || {});
                    const expectedHeaders = modelInputSchema.map(
                        (feature) => feature.col,
                    );
                    const uploadedSet = new Set(uploadedHeaders);
                    const missingHeaders = expectedHeaders.filter(
                        (header) => !uploadedSet.has(header),
                    );

                    if (missingHeaders.length > 0) {
                        const previewMissing = missingHeaders
                            .slice(0, 5)
                            .join(", ");
                        toast.error(
                            `Uploaded CSV columns do not match selected model. Missing: ${previewMissing}${missingHeaders.length > 5 ? "..." : ""}`,
                        );
                        setBatchPreviewRows([]);
                        setAllColumnNames([]);
                        setAllColumnValues([]);
                        setFilteredColumn([]);
                        return;
                    }

                    setBatchPreviewRows(rows);
                    toast.success(`Loaded ${rows.length} row(s).`);
                } catch (error) {
                    toast.error(
                        error?.message || "Could not prepare CSV preview.",
                    );
                } finally {
                    setBatchLoading(false);
                    e.target.value = "";
                }
            },
            error: (err) => {
                toast.error(`Failed to parse CSV: ${err.message}`);
                setBatchLoading(false);
                e.target.value = "";
            },
        });
    };

    useEffect(() => {
        if (!useSourceSample) return;
        if (!Array.isArray(train_data) || train_data.length === 0) return;
        if (!Array.isArray(modelInputSchema) || modelInputSchema.length === 0)
            return;

        const sourceFilledInputs = applyUploadedRowValues(
            modelInputSchema,
            train_data,
        );
        setAllColumnValues(sourceFilledInputs);
        setAllColumnNames(sourceFilledInputs.map((val) => val.col));
        if (select_columns === "all") {
            setFilteredColumn(sourceFilledInputs);
        } else {
            const selectedSet = new Set(
                (filtered_column || []).map((item) => item.col),
            );
            setFilteredColumn(
                sourceFilledInputs.filter((item) => selectedSet.has(item.col)),
            );
        }
    }, [useSourceSample, train_data, modelInputSchema, select_columns]);

    const handleSourceDatasetToggle = (checked) => {
        setUseSourceSample(checked);
        if (!checked) {
            const baseInputs = Array.isArray(allColumnValues)
                ? allColumnValues
                : [];
            const clearedInputs = baseInputs.map((feature) => ({
                ...feature,
                value: "",
            }));
            setAllColumnValues(clearedInputs);
            setAllColumnNames(clearedInputs.map((val) => val.col));

            if (select_columns === "all") {
                setFilteredColumn(clearedInputs);
            } else {
                const selectedSet = new Set(
                    (filtered_column || []).map((item) => item.col),
                );
                setFilteredColumn(
                    clearedInputs.filter((item) => selectedSet.has(item.col)),
                );
            }
        }
    };

    const pollBatchStatus = async (taskId) => {
        if (!taskId || batchPollInFlightRef.current) return;
        batchPollInFlightRef.current = true;
        try {
            const statusData =
                await apiService.matflow.deployment.deployBatchStatus(taskId);

            if (statusData?.error && !statusData?.status) {
                setBatchStatus("FAILURE");
                setBatchLoading(false);
                setBatchProgress({ processed: 0, total: 0, percent: 0 });
                stopBatchPolling();
                toast.error(statusData.error);
                return;
            }

            const state = statusData?.status;
            if (state === "PENDING") {
                setBatchStatus("PENDING");
                setBatchProgress((prev) => ({
                    processed: 0,
                    total:
                        Number(statusData?.total || 0) ||
                        Number(prev.total || 0),
                    percent: 0,
                }));
                return;
            }

            if (state === "PROGRESS") {
                setBatchStatus("PROGRESS");
                const processed = Number(statusData?.processed || 0);
                const total = Number(statusData?.total || 0);
                const rawPercent =
                    statusData?.percent !== undefined && statusData?.percent !== null
                        ? Number(statusData.percent)
                        : total > 0
                          ? (processed / total) * 100
                          : 0;
                const safePercent = Math.max(0, Math.min(100, rawPercent || 0));
                setBatchProgress({
                    processed,
                    total,
                    percent: safePercent,
                });
                return;
            }

            if (state === "SUCCESS") {
                setBatchStatus("SUCCESS");
                setBatchResult({
                    predictions: Array.isArray(statusData?.predictions)
                        ? statusData.predictions
                        : [],
                    skipped: Array.isArray(statusData?.skipped)
                        ? statusData.skipped
                        : [],
                    total: Number(statusData?.total || 0),
                    predicted_count: Number(statusData?.predicted_count || 0),
                    skipped_count: Number(statusData?.skipped_count || 0),
                });
                setBatchLoading(false);
                setBatchTaskId("");
                setBatchProgress({ processed: 1, total: 1, percent: 100 });
                stopBatchPolling();
                toast.success("Batch prediction completed.");
                return;
            }

            if (state === "CANCELLED" || state === "REVOKED") {
                setBatchStatus("CANCELLED");
                setBatchLoading(false);
                setBatchTaskId("");
                setBatchProgress({ processed: 0, total: 0, percent: 0 });
                stopBatchPolling();
                toast.info("Batch prediction cancelled.");
                return;
            }

            if (state === "FAILURE") {
                setBatchStatus("FAILURE");
                setBatchLoading(false);
                setBatchTaskId("");
                setBatchProgress({ processed: 0, total: 0, percent: 0 });
                stopBatchPolling();
                const details = String(statusData?.details || "").trim();
                toast.error(
                    details
                        ? `${statusData?.error || "Batch prediction failed."}\n${details}`
                        : statusData?.error || "Batch prediction failed.",
                );
                return;
            }
        } catch (error) {
            setBatchStatus("FAILURE");
            setBatchLoading(false);
            setBatchTaskId("");
            setBatchProgress({ processed: 0, total: 0, percent: 0 });
            stopBatchPolling();
            toast.error(error?.message || "Failed while polling batch status.");
        } finally {
            batchPollInFlightRef.current = false;
        }
    };

    const cancelBatchPrediction = async () => {
        if (!batchTaskId) {
            stopBatchPolling();
            setBatchLoading(false);
            setBatchStatus("CANCELLED");
            setBatchProgress({ processed: 0, total: 0, percent: 0 });
            return;
        }

        try {
            const cancelResponse =
                await apiService.matflow.deployment.deployBatchCancel(
                    batchTaskId,
                );
            if (cancelResponse?.error) {
                toast.error(cancelResponse.error);
                return;
            }
            stopBatchPolling();
            setBatchLoading(false);
            setBatchStatus("CANCELLED");
            setBatchTaskId("");
            setBatchProgress({ processed: 0, total: 0, percent: 0 });
            toast.info("Batch prediction cancelled.");
        } catch (error) {
            toast.error(error?.message || "Failed to cancel batch prediction.");
        }
    };

    const runBatchPrediction = async () => {
        if (!Array.isArray(batchPreviewRows) || batchPreviewRows.length === 0) {
            toast.error("Please upload a CSV file first.");
            return;
        }

        if (!Array.isArray(filtered_column) || filtered_column.length === 0) {
            toast.error(
                "Feature schema is not ready. Please re-select dataset/model.",
            );
            return;
        }

        if (!currentModelId) {
            toast.error(
                "Model artifacts are not ready. Please re-select model.",
            );
            return;
        }

        try {
            stopBatchPolling();
            setBatchLoading(true);
            setBatchResult(null);
            setBatchTaskId("");
            setBatchStatus("QUEUED");
            setBatchProgress({
                processed: 0,
                total: batchPreviewRows.length || 0,
                percent: 0,
            });

            const enqueueResponse =
                await apiService.matflow.deployment.deployBatch({
                    model_id: currentModelId,
                    project_id: projectId,
                    batch_data: batchPreviewRows,
                });

            if (enqueueResponse?.error) {
                setBatchStatus("FAILURE");
                setBatchLoading(false);
                setBatchProgress({ processed: 0, total: 0, percent: 0 });
                toast.error(enqueueResponse.error);
                return;
            }

            if (!enqueueResponse?.task_id) {
                setBatchStatus("FAILURE");
                setBatchLoading(false);
                setBatchProgress({ processed: 0, total: 0, percent: 0 });
                toast.error("Task id was not returned by server.");
                return;
            }

            const taskId = enqueueResponse.task_id;
            setBatchTaskId(taskId);
            setBatchStatus("PENDING");

            await pollBatchStatus(taskId);
            batchPollTimerRef.current = setInterval(() => {
                pollBatchStatus(taskId);
            }, 2000);
        } catch (error) {
            setBatchStatus("FAILURE");
            setBatchLoading(false);
            setBatchTaskId("");
            setBatchProgress({ processed: 0, total: 0, percent: 0 });
            toast.error(error?.message || "Failed to start batch prediction.");
        }
    };

    const downloadBatchCSV = async (rows, filename) => {
        if (!rows || rows.length === 0) return;
        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        if (!projectId) return;
        try {
            const selectedModelMeta = (modelCatalog || []).find(
                (item) => String(item?.id || "") === String(currentModelId || ""),
            );
            const resolvedWorkspaceId =
                activeWorkspaceId || selectedModelMeta?.workspaceId || "";
            const workspaceRoot = getWorkspaceRootFromPath(
                selectedModelMeta?.folder || "",
            );
            const targetFolder = resolvedWorkspaceId
                ? "output/generated_datasets"
                : `${workspaceRoot}/output/generated_datasets`;

            if (!resolvedWorkspaceId && !workspaceRoot) {
                toast.warning(
                    "Download completed. Workspace context not found, so project save was skipped.",
                );
                return;
            }

            await apiService.matflow.dataset.createFile(
                projectId,
                rows,
                filename,
                targetFolder,
                resolvedWorkspaceId || undefined,
            );
            dispatch(setReRender(!rerender));
            toast.success("Dataset Saved to Project Output.");
        } catch (err) {
            toast.error(err?.message || "Downloaded, but failed to save dataset.");
        }
    };
    const formatPredictionValue = (value) => {
        if (value === null || value === undefined || value === "") return "--";
        const numeric =
            typeof value === "number"
                ? value
                : typeof value === "string"
                  ? Number(value)
                  : NaN;
        if (Number.isFinite(numeric)) {
            return numeric.toFixed(4);
        }
        return String(value);
    };

    const handleSave = async () => {
        setSingleLoading(true);
        try {
            if (!currentModelId) {
                toast.error(
                    "Model is not ready. Please re-select dataset/model and try again.",
                );
                return;
            }

            let result = {};
            for (const val of filtered_column || []) {
                const rawValue = val?.value;
                if (
                    rawValue === "" ||
                    rawValue === null ||
                    rawValue === undefined
                ) {
                    toast.error(
                        `Invalid value for ${val?.col || "input field"}.`,
                    );
                    return;
                }
                const normalizedType = normalizeDataType(val?.data_type);
                const numericInput = shouldUseNumberInput(val);
                if (numericInput && !isNumericString(rawValue)) {
                    toast.error(
                        `Please enter a valid numeric value for ${val?.col || "input field"}.`,
                    );
                    return;
                }
                const finalValue =
                    numericInput && isIntegerType(normalizedType)
                        ? parseInt(rawValue, 10)
                        : numericInput && isFloatType(normalizedType)
                          ? parseFloat(rawValue)
                          : rawValue;
                result = { ...result, [val.col]: finalValue };
            }

            const dat = await apiService.matflow.deployment.deployResult({
                model_id: currentModelId,
                project_id: projectId,
                result,
            });

            if (dat?.error) {
                const details = String(dat?.details || "").trim();
                toast.error(details ? `${dat.error}\n${details}` : dat.error);
                return;
            }

            setPredResult(dat.pred ?? "");
        } catch (error) {
            console.error("[ModelDeployment] deployResult submit failed", {
                modelId: currentModelId,
                projectId,
                error,
            });
            toast.error(
                error?.message ||
                    "Prediction failed. Please check inputs and try again.",
            );
        } finally {
            setSingleLoading(false);
        }
    };

    if (catalogLoading)
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-gray-600">
                    <CircularProgress size={34} sx={{ color: "#0D9488" }} />
                    <p className="text-sm font-medium">Loading models...</p>
                </div>
            </div>
        );

    if (!modelCatalog || modelCatalog.length === 0)
        return (
            <div className="mt-8 font-semibold tracking-wide text-2xl">
                Build a model first...
            </div>
        );

    const filteredWithIndex = (filtered_column || [])
        .map((val, idx) => ({ ...val, __idx: idx }))
        .filter((val) =>
            (val.col || "")
                .toLowerCase()
                .includes((featureSearch || "").toLowerCase()),
        );
    const singlePageSize = 12;
    const singleTotalPages = Math.max(
        1,
        Math.ceil(filteredWithIndex.length / singlePageSize),
    );
    const safeSinglePage = Math.min(singlePage, singleTotalPages);
    const singleStart = (safeSinglePage - 1) * singlePageSize;
    const singleVisibleInputs = filteredWithIndex.slice(
        singleStart,
        singleStart + singlePageSize,
    );
    const batchPredictionRows = Array.isArray(batchResult?.predictions)
        ? batchResult.predictions
        : [];
    const batchPredictionColumnDefs =
        batchPredictionRows.length > 0
            ? Object.keys(batchPredictionRows[0] || {}).map((key) => ({
                  headerName: key,
                  field: key,
                  flex: 1,
                  minWidth: 140,
              }))
            : [];
    const skippedRows = Array.isArray(batchResult?.skipped)
        ? batchResult.skipped.map((row, idx) => ({
              id: idx + 1,
              row: row?.__row__ ?? "",
              reason: row?.skip_reason ?? "",
          }))
        : [];
    const skippedColumnDefs = [
        {
            headerName: "Row",
            field: "row",
            minWidth: 120,
            maxWidth: 160,
        },
        {
            headerName: "Reason",
            field: "reason",
            flex: 1,
            minWidth: 240,
        },
    ];
    return (
        <div className="my-4 matflow-unified-input-height">
            <div>
                <p className="mb-1 text-sm font-medium text-gray-700">
                    Select Model
                </p>
                <SingleDropDown
                    columnNames={modelCatalog.map((item) => item.label)}
                    onValueChange={(e) => handleModelSelection(e)}
                />
            </div>
            {current_model && (
                <>
                    {/* ── Mode toggle + batch actions ── */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPredMode("single")}
                                className={`px-5 py-2 rounded-md text-sm font-medium border-2 transition-colors ${
                                    predMode === "single"
                                        ? "bg-white border-primary-btn text-primary-btn shadow-[0_0_0_2px_rgba(13,148,136,0.18)]"
                                        : "border-gray-300 bg-white text-gray-600 hover:border-primary-btn hover:text-primary-btn"
                                }`}
                            >
                                Single Prediction
                            </button>
                            <button
                                onClick={() => setPredMode("batch")}
                                className={`px-5 py-2 rounded-md text-sm font-medium border-2 transition-colors ${
                                    predMode === "batch"
                                        ? "bg-white border-primary-btn text-primary-btn shadow-[0_0_0_2px_rgba(13,148,136,0.18)]"
                                        : "border-gray-300 bg-white text-gray-600 hover:border-primary-btn hover:text-primary-btn"
                                }`}
                            >
                                Batch Prediction
                            </button>
                        </div>

                        {predMode === "batch" && (
                            <div className="flex flex-wrap items-center gap-2">
                                <label className="cursor-pointer">
                                    <span
                                        className={`inline-flex items-center px-5 py-2 rounded-md text-sm font-medium border-2 border-primary-btn bg-primary-btn text-white transition-colors ${
                                            batchLoading
                                                ? "opacity-50 cursor-not-allowed"
                                                : "hover:bg-opacity-90"
                                        }`}
                                    >
                                        {batchLoading
                                            ? "Working..."
                                            : "Upload Dataset (CSV)"}
                                    </span>
                                    <input
                                        ref={batchFileRef}
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        disabled={batchLoading}
                                        onChange={handleBatchFile}
                                    />
                                </label>

                                <button
                                    type="button"
                                    onClick={runBatchPrediction}
                                    disabled={batchLoading}
                                    className={`px-5 py-2 rounded-md text-sm font-medium border-2 border-primary-btn bg-primary-btn text-white transition-colors ${
                                        batchLoading
                                            ? "opacity-70 cursor-not-allowed"
                                            : "hover:bg-opacity-90"
                                    }`}
                                >
                                    {batchLoading
                                        ? "Running Model..."
                                        : "Run Model to Predict"}
                                </button>
                                {batchLoading && (
                                    <button
                                        type="button"
                                        onClick={cancelBatchPrediction}
                                        className="px-5 py-2 rounded-md text-sm font-medium border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ══ SINGLE mode ══ */}
                    {predMode === "single" && (
                        <>
                            <div className="mt-3">
                                <p className="mb-1 text-sm font-medium text-gray-600">
                                    Select Columns
                                </p>
                                <div className="flex flex-wrap items-center gap-5">
                                    <label
                                        htmlFor="select-columns-all"
                                        className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800"
                                    >
                                        <input
                                            id="select-columns-all"
                                            type="radio"
                                            name="select-columns-mode"
                                            checked={select_columns === "all"}
                                            onChange={() =>
                                                handleSelectColumnsMode("all")
                                            }
                                            className="h-3.5 w-3.5 accent-[#0D9488]"
                                        />
                                        <span>All Columns</span>
                                    </label>
                                    <label
                                        htmlFor="select-columns-custom"
                                        className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800"
                                    >
                                        <input
                                            id="select-columns-custom"
                                            type="radio"
                                            name="select-columns-mode"
                                            checked={
                                                select_columns === "custom"
                                            }
                                            onChange={() =>
                                                handleSelectColumnsMode(
                                                    "custom",
                                                )
                                            }
                                            className="h-3.5 w-3.5 accent-[#0D9488]"
                                        />
                                        <span>Custom Columns</span>
                                    </label>
                                </div>
                            </div>
                            {select_columns === "custom" && (
                                <div className="mt-4">
                                    <p>Custom Columns</p>
                                    <MultipleDropDown
                                        columnNames={allColumnNames}
                                        setSelectedColumns={(e) => {
                                            const tempSet = new Set(e);
                                            const temp = allColumnValues.filter(
                                                (val) => tempSet.has(val.col),
                                            );
                                            setFilteredColumn(temp);
                                        }}
                                    />
                                </div>
                            )}
                            {filtered_column && filtered_column.length > 0 && (
                                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-4 mt-4">
                                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                                        <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                            <h3 className="text-lg font-semibold tracking-normal text-gray-900">
                                                Input Values
                                            </h3>
                                            <div className="flex items-center gap-4">
                                                <div className="text-sm text-gray-600">
                                                    {filteredWithIndex.length} /{" "}
                                                    {filtered_column.length}{" "}
                                                    feature(s)
                                                </div>
                                                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[#0F766E]">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 accent-[#0D9488]"
                                                        checked={
                                                            useSourceSample
                                                        }
                                                        onChange={(e) =>
                                                            handleSourceDatasetToggle(
                                                                e.target
                                                                    .checked,
                                                            )
                                                        }
                                                    />
                                                    <span>
                                                        Use source dataset
                                                        values
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <Input
                                                bordered
                                                color="success"
                                                clearable
                                                fullWidth
                                                size="sm"
                                                value={featureSearch}
                                                onChange={(e) =>
                                                    setFeatureSearch(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Search feature name..."
                                                sx={{
                                                    "& .MuiOutlinedInput-root":
                                                        {
                                                            minHeight: "34px",
                                                            borderRadius:
                                                                "10px",
                                                        },
                                                    "& .MuiInputBase-input": {
                                                        fontSize: "0.85rem",
                                                        padding: "7px 10px",
                                                    },
                                                }}
                                            />
                                        </div>

                                        {singleVisibleInputs.length === 0 ? (
                                            <div className="text-sm text-gray-500 py-8 text-center border border-dashed rounded-lg">
                                                No features match your search.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2 xl:grid-cols-3">
                                                {singleVisibleInputs.map(
                                                    (val) => {
                                                        const featureDataType =
                                                            normalizeDataType(
                                                                filtered_column[
                                                                    val.__idx
                                                                ]?.data_type,
                                                            );
                                                        const featureIsNumeric =
                                                            shouldUseNumberInput(
                                                                filtered_column[
                                                                    val.__idx
                                                                ],
                                                            );
                                                        const featureStep =
                                                            featureIsNumeric
                                                                ? isFloatType(
                                                                      featureDataType,
                                                                  )
                                                                    ? 0.01
                                                                    : 1
                                                                : undefined;
                                                        return (
                                                            <div
                                                                key={val.__idx}
                                                                className="rounded-md border border-gray-100 p-1"
                                                            >
                                                                <p className="mb-1 text-sm font-medium text-gray-700 truncate">
                                                                    {val.col}
                                                                </p>
                                                                <Input
                                                                    bordered
                                                                    color="success"
                                                                    value={String(
                                                                        filtered_column[
                                                                            val
                                                                                .__idx
                                                                        ]
                                                                            ?.value ??
                                                                            "",
                                                                    )}
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleChangeValue(
                                                                            val.__idx,
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    fullWidth
                                                                    step={
                                                                        featureStep
                                                                    }
                                                                    type={
                                                                        featureIsNumeric
                                                                            ? "number"
                                                                            : "text"
                                                                    }
                                                                    size="sm"
                                                                    sx={{
                                                                        "& .MuiOutlinedInput-root":
                                                                            {
                                                                                minHeight:
                                                                                    "34px",
                                                                                borderRadius:
                                                                                    "10px",
                                                                            },
                                                                        "& .MuiInputBase-input":
                                                                            {
                                                                                fontSize:
                                                                                    "0.9rem",
                                                                                padding:
                                                                                    "7px 10px",
                                                                            },
                                                                    }}
                                                                />
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        )}

                                        {singleTotalPages > 1 && (
                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                                                <p className="text-sm text-gray-600">
                                                    Showing {singleStart + 1} -{" "}
                                                    {Math.min(
                                                        singleStart +
                                                            singlePageSize,
                                                        filteredWithIndex.length,
                                                    )}{" "}
                                                    of{" "}
                                                    {filteredWithIndex.length}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        className={`px-3.5 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                                                            safeSinglePage === 1
                                                                ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                : "border-primary-btn bg-primary-btn text-white hover:bg-opacity-90"
                                                        }`}
                                                        disabled={
                                                            safeSinglePage === 1
                                                        }
                                                        onClick={() =>
                                                            setSinglePage(
                                                                (prev) =>
                                                                    Math.max(
                                                                        1,
                                                                        prev -
                                                                            1,
                                                                    ),
                                                            )
                                                        }
                                                    >
                                                        Prev
                                                    </button>
                                                    <span className="text-sm text-gray-700">
                                                        {safeSinglePage} /{" "}
                                                        {singleTotalPages}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className={`px-3.5 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                                                            safeSinglePage ===
                                                            singleTotalPages
                                                                ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                : "border-primary-btn bg-primary-btn text-white hover:bg-opacity-90"
                                                        }`}
                                                        disabled={
                                                            safeSinglePage ===
                                                            singleTotalPages
                                                        }
                                                        onClick={() =>
                                                            setSinglePage(
                                                                (prev) =>
                                                                    Math.min(
                                                                        singleTotalPages,
                                                                        prev +
                                                                            1,
                                                                    ),
                                                            )
                                                        }
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="lg:sticky lg:top-4 h-fit w-full lg:min-w-[240px] lg:max-w-[420px] rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                                        <div className="bg-primary-btn px-4 py-2">
                                            <h1 className="text-base font-semibold tracking-normal text-white">
                                                Prediction
                                            </h1>
                                        </div>

                                        <div className="p-3">
                                            <p className="text-xs text-gray-600 mb-1">
                                                {target_val}
                                            </p>
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 min-h-[42px]">
                                                <span
                                                    className={`block max-w-full whitespace-pre-wrap break-all font-semibold text-gray-900 ${
                                                        formatPredictionValue(
                                                            pred_result,
                                                        ).length > 48
                                                            ? "text-sm leading-relaxed"
                                                            : "text-xl leading-tight"
                                                    }`}
                                                >
                                                    {formatPredictionValue(
                                                        pred_result,
                                                    )}
                                                </span>
                                            </div>

                                            <button
                                                className={`w-full border-2 border-primary-btn bg-primary-btn text-white text-sm font-medium rounded-md py-1.5 mt-3 transition-colors ${
                                                    singleLoading
                                                        ? "opacity-80 cursor-not-allowed"
                                                        : "hover:bg-opacity-90"
                                                }`}
                                                onClick={handleSave}
                                                disabled={singleLoading}
                                            >
                                                {singleLoading ? (
                                                    <span className="inline-flex items-center justify-center gap-2">
                                                        <span className="inline-block h-4 w-4 rounded-full border-2 border-white/70 border-t-white animate-spin" />
                                                        Predicting...
                                                    </span>
                                                ) : (
                                                    "Submit"
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ══ BATCH mode ══ */}
                    {predMode === "batch" && (
                        <div className="mt-6">
                            {batchPreviewRows.length > 0 && (
                                <p className="mb-3 text-sm text-gray-600 text-center">
                                    {batchPreviewRows.length} row(s) loaded
                                </p>
                            )}

                            {batchLoading && (
                                <div className="mb-4 rounded-lg border border-[#BFE7E2] bg-[#F0FBFA] px-4 py-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-sm font-medium text-[#4E7F78]">
                                            Processing prediction...
                                        </p>
                                        <span className="text-xs font-semibold text-[#5F8F88]">
                                            {batchStatus === "PROGRESS"
                                                ? `${Math.round(batchProgress.percent)}%`
                                                : batchStatus === "PENDING"
                                                  ? "Queued"
                                                  : "Running"}
                                        </span>
                                    </div>
                                    <LinearProgress
                                        variant="determinate"
                                        value={
                                            batchStatus === "PROGRESS" ||
                                            batchStatus === "SUCCESS"
                                                ? Math.max(
                                                      0,
                                                      Math.min(
                                                          100,
                                                          Number(
                                                              batchProgress.percent || 0,
                                                          ),
                                                      ),
                                                  )
                                                : 0
                                        }
                                        sx={{
                                            height: 8,
                                            borderRadius: 8,
                                            backgroundColor: "#D9F1EE",
                                            "& .MuiLinearProgress-bar": {
                                                backgroundColor: "#0D9488",
                                            },
                                        }}
                                    />
                                    <p className="mt-2 text-xs text-[#6A9790]">
                                        {batchStatus === "PROGRESS" &&
                                        batchProgress.total > 0
                                            ? `${batchProgress.processed} of ${batchProgress.total} rows processed`
                                            : batchStatus === "PENDING"
                                              ? "Preparing batch task..."
                                              : "Starting..."}
                                    </p>
                                </div>
                            )}

                            {batchResult && (
                                <div className="mt-3 space-y-3">
                                    <h3 className="mb-2 text-lg font-semibold tracking-normal text-gray-900 text-center">
                                        Predicted Result
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3 items-start">
                                        <div className="flex flex-wrap items-center gap-3">
                                            {batchResult && (
                                                <>
                                                    <div className="px-4 py-2 rounded-lg bg-gray-100 text-sm font-medium">
                                                        Total rows:{" "}
                                                        <span className="font-bold">
                                                            {batchResult.total}
                                                        </span>
                                                    </div>
                                                    <div className="px-4 py-2 rounded-lg bg-green-100 text-green-800 text-sm font-medium">
                                                        Predicted:{" "}
                                                        <span className="font-bold">
                                                            {
                                                                batchResult.predicted_count
                                                            }
                                                        </span>
                                                    </div>
                                                    {batchStatus !== "IDLE" && (
                                                        <div
                                                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                                                batchStatus ===
                                                                "SUCCESS"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-amber-100 text-amber-800"
                                                            }`}
                                                        >
                                                            Status:{" "}
                                                            <span className="font-bold">
                                                                {batchStatus}
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <div className="flex md:justify-end">
                                            {batchResult?.predicted_count > 0 && (
                                                <button
                                                    onClick={() =>
                                                        downloadBatchCSV(
                                                            batchResult.predictions,
                                                            `predictions_${target_val}.csv`,
                                                        )
                                                    }
                                                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-[#0D9488] text-white rounded-md hover:bg-[#0F766E] transition-colors"
                                                >
                                                    ↓ Download Predictions CSV
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {batchResult?.predicted_count > 0 && (
                                        <div className="space-y-2">
                                            <div>
                                                <div className="rounded-lg border border-gray-200 p-2">
                                                    <AgGridComponent
                                                        rowData={
                                                            batchPredictionRows
                                                        }
                                                        columnDefs={
                                                            batchPredictionColumnDefs
                                                        }
                                                        enablePagination={true}
                                                        paginationPageSize={25}
                                                        paginationThreshold={25}
                                                        autoPageSize={false}
                                                        adaptiveHeight={true}
                                                        capAdaptiveHeight={
                                                            false
                                                        }
                                                        minHeight={260}
                                                        height={560}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {batchResult?.skipped_count > 0 && (
                                        <div className="px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-medium w-fit">
                                            Skipped:{" "}
                                            <span className="font-bold">
                                                {batchResult.skipped_count}
                                            </span>
                                        </div>
                                    )}

                                    {/* Skipped rows detail */}
                                    {batchResult?.skipped_count > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-semibold text-red-700">
                                                    Skipped Rows (
                                                    {batchResult.skipped_count})
                                                </h4>
                                                <button
                                                    onClick={() =>
                                                        downloadBatchCSV(
                                                            batchResult.skipped,
                                                            `skipped_rows_${target_val}.csv`,
                                                        )
                                                    }
                                                    className="text-xs px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                                                >
                                                    ↓ Download skipped CSV
                                                </button>
                                            </div>
                                            <div className="rounded-lg border border-red-200 p-2">
                                                <AgGridComponent
                                                    rowData={skippedRows}
                                                    columnDefs={
                                                        skippedColumnDefs
                                                    }
                                                    enablePagination={true}
                                                    paginationPageSize={10}
                                                    paginationThreshold={10}
                                                    autoPageSize={false}
                                                    adaptiveHeight={true}
                                                    capAdaptiveHeight={false}
                                                    minHeight={220}
                                                    height={420}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* DOCS */}
                    <button
                        className="fixed bottom-20 right-5 bg-primary-btn text-xl font-bold text-white rounded-full w-10 h-10 shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center"
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
                            <Docs section={"modelDeployment"} />
                        </div>
                    </Modal>
                </>
            )}
        </div>
    );
}

export default ModelDeployment;
