/**
 * Matflow Service API
 * All Matflow-specific API endpoints
 */

import { apiFetch } from "../../util/apiClient";
import {
    API_BASE_URL,
    parseResponse,
    extractData,
    createApiError,
} from "./apiHelpers";

// Normalize API root so that it works whether API_BASE_URL includes `/api` or not.
// - If API_BASE_URL ends with `/api`, we use it as-is.
// - Otherwise, we append `/api`.
const API_ROOT = (API_BASE_URL || "").replace(/\/+$/, "");
const MATFLOW_API_ROOT = API_ROOT.endsWith("/api")
    ? API_ROOT
    : `${API_ROOT}/api`;

// ──────────────────────────────────────────────────────────────────────────────
// Workspace context helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Merge workspace context into a request payload and strip raw ``file`` rows.
 *
 * New pattern (preferred):
 *   const payload = withWorkspaceContext({ select_column: "Age" }, wsCtx);
 *   // → { workspace_id: "...", filename: "iris.csv", select_column: "Age" }
 *
 * If ``wsCtx`` is null/undefined the payload is returned unchanged (legacy mode).
 *
 * @param {Object}       params   – operation-specific parameters
 * @param {{ workspace_id: string, filename: string } | null} wsCtx
 * @returns {Object}
 */
export function withWorkspaceContext(params = {}, wsCtx) {
    if (!wsCtx?.workspace_id) {
        // Legacy mode: caller must have already embedded `file` rows
        return params;
    }
    // Remove the raw file rows – the backend will load them from disk
    const { file: _dropped, ...rest } = params;

    // Ensure filename has an extension if provided
    let filename = wsCtx.filename ?? null;
    if (filename && !filename.match(/\.(csv|xlsx?|json|parquet)$/i)) {
        filename = `${filename}.csv`; // Default to .csv if no extension
    }

    return {
        ...rest,
        workspace_id: wsCtx.workspace_id,
        filename: filename,
    };
}

function normalizeReadRequestArgs(args) {
    //  readFile({ projectId, workspaceId, folder, filename, ... })
    if (args.length === 1 && typeof args[0] === "object" && args[0] !== null) {
        const payload = args[0];
        return {
            projectId: payload.projectId,
            workspaceId: payload.workspaceId,
            foldername: payload.folder || payload.foldername || "",
            filename: payload.filename,
            page: payload.page,
            pageSize: payload.pageSize,
            metaOnly: payload.metaOnly,
        };
    }

    // readFile(projectId, foldername, filename)
    // readFilePaginated(projectId, foldername, filename, page, pageSize, metaOnly)
    return {
        projectId: args[0],
        workspaceId: undefined,
        foldername: args[1] || "",
        filename: args[2],
        page: args[3],
        pageSize: args[4],
        metaOnly: args[5],
    };
}

/**
 * Convenience selector result shape – use together with
 * ``selectWorkspaceContext`` from workspaceSlice.
 *
 * Example (inside a component):
 *   const wsCtx = useSelector(selectWorkspaceContext);
 *   const payload = withWorkspaceContext({ select_column: "Species" }, wsCtx);
 *   const result  = await matflowApi.featureEngineering.dropColumn(payload);
 */

export const matflowApi = {
    // ========== Dataset Operations ==========
    dataset: {
        // Get all files/folders structure for a project
        getAllFiles: async (projectId) => {
            const endpoint =
                import.meta.env.VITE_APP_API_DATASET || "/api/dataset/";
            const params = new URLSearchParams();
            if (projectId) params.append("project_id", projectId);
            const response = await apiFetch(
                `${API_BASE_URL}${endpoint}?${params.toString()}`,
            );
            const data = await parseResponse(response);
            return extractData(data);
        },

        // Read a specific file
        readFile: async (...args) => {
            const {
                projectId,
                workspaceId,
                foldername = "",
                filename,
            } = normalizeReadRequestArgs(args);
            const path =
                (import.meta.env.VITE_APP_API_DATASET_READ_FILE || "read_file/")
                    .replace(/^\/*api\/+/, "")
                    .replace(/^\//, "") || "read_file/";
            const params = new URLSearchParams();
            if (projectId) params.append("project_id", projectId);
            if (workspaceId) params.append("workspace_id", workspaceId);
            if (foldername) params.append("folder", foldername);
            if (filename) params.append("file", filename);
            const response = await apiFetch(
                `${MATFLOW_API_ROOT}/${path}?${params.toString()}`,
            );
            return await parseResponse(response);
        },

        // Paginated read — returns { data, total_rows, columns, page, page_size }
        // Metadata-only mode — returns { total_rows, columns, dtypes, page, page_size }
        readFilePaginated: async (...args) => {
            const {
                projectId,
                workspaceId,
                foldername = "",
                filename,
                page = 1,
                pageSize = 200,
                metaOnly = false,
            } = normalizeReadRequestArgs(args);
            const path = "read_file/";
            const params = new URLSearchParams();
            if (projectId) params.append("project_id", projectId);
            if (workspaceId) params.append("workspace_id", workspaceId);
            if (foldername) params.append("folder", foldername);
            if (filename) params.append("file", filename);
            if (metaOnly) {
                params.append("meta_only", "1");
            } else {
                params.append("page", String(page));
                params.append("page_size", String(pageSize));
            }
            const response = await apiFetch(
                `${MATFLOW_API_ROOT}/${path}?${params.toString()}`,
            );
            return await parseResponse(response);
        },

        listWorkspaceFiles: async ({ projectId, workspaceId }) => {
            const params = new URLSearchParams();
            if (projectId) params.append("project_id", projectId);
            if (workspaceId) params.append("workspace_id", workspaceId);
            const response = await apiFetch(
                `${MATFLOW_API_ROOT}/workspace-files/?${params.toString()}`,
            );
            return await parseResponse(response);
        },

        // Create a new file
        createFile: async (
            projectId,
            data,
            filename,
            foldername = "",
            workspaceId = undefined,
        ) => {
            const path =
                (
                    import.meta.env.VITE_APP_API_DATASET_CREATE_FILE ||
                    "create-file/"
                )
                    .replace(/^\/*api\/+/, "")
                    .replace(/^\//, "") || "create-file/";
            const response = await apiFetch(`${MATFLOW_API_ROOT}/${path}`, {
                method: "POST",
                body: JSON.stringify({
                    project_id: projectId,
                    workspace_id: workspaceId,
                    data,
                    filename: filename.endsWith(".csv")
                        ? filename
                        : `${filename}.csv`,
                    foldername: foldername || "",
                }),
            });
            const result = await parseResponse(response);
            if (!response.ok) {
                const err = new Error(
                    result?.error || result?.detail || "Failed to create file",
                );
                err.data = result;
                throw err;
            }
            return result;
        },

        // Overwrite an existing file with new data (after feature engineering)
        updateFile: async (projectId, data, filename, foldername = "") => {
            const response = await apiFetch(
                `${MATFLOW_API_ROOT}/update-file/`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        project_id: projectId,
                        data,
                        filename: filename.endsWith(".csv")
                            ? filename
                            : `${filename}.csv`,
                        foldername: foldername || "",
                    }),
                },
            );
            const result = await parseResponse(response);
            if (!response.ok) {
                const err = new Error(
                    result?.error || result?.detail || "Failed to update file",
                );
                err.data = result;
                throw err;
            }
            return result;
        },

        // Convert file to CSV
        convertToCsv: async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const response = await apiFetch(
                `${API_BASE_URL}/api/convert-to-csv/`,
                {
                    method: "POST",
                    headers: {}, // Let browser set Content-Type for FormData
                    body: formData,
                },
            );
            return await parseResponse(response);
        },

        // Display dataset information
        getInformation: async (data) => {
            const response = await apiFetch(`${API_BASE_URL}/api/dataset/`, {
                method: "POST",
                body: JSON.stringify({ data }),
            });
            return await parseResponse(response);
        },

        // Get dataset statistics
        getStatistics: async (data) => {
            const response = await apiFetch(`${API_BASE_URL}/api/dataset/`, {
                method: "POST",
                body: JSON.stringify({ data }),
            });
            return await parseResponse(response);
        },

        // Get correlation
        getCorrelation: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/display_correlation/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Get correlation heatmap
        getCorrelationHeatmap: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/display_correlation_heatmap/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Get correlation feature pair
        getCorrelationFeaturePair: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/display_correlation_featurePair/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Check duplicates
        checkDuplicates: async (data) => {
            const response = await apiFetch(`${API_BASE_URL}/api/dataset/`, {
                method: "POST",
                body: JSON.stringify({ data }),
            });
            return await parseResponse(response);
        },

        // Group data
        groupData: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/display_group/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Fetch file as blob (for downloads)
        fetchFile: async (filePath) => {
            const endpoint =
                import.meta.env.VITE_APP_API_FETCH_FILE || "/api/fetch-file/";
            const response = await apiFetch(
                `${API_BASE_URL}${endpoint}?file_path=${filePath}`,
            );
            return response; // Return response for blob handling
        },

        // Workspace-aware file fetch (downloads/previews from project tree)
        fetchProjectFile: async (projectId, folder, file) => {
            const endpoint =
                import.meta.env.VITE_APP_API_FETCH_FILE || "/api/fetch-file/";
            const params = new URLSearchParams();
            if (projectId) params.append("project_id", projectId);
            if (folder) params.append("folder", folder);
            if (file) params.append("file", file);
            const response = await apiFetch(
                `${API_BASE_URL}${endpoint}?${params.toString()}`,
            );
            return response;
        },

        // Delete file or folder
        delete: async (projectId, folder, file = null) => {
            const endpoint =
                import.meta.env.VITE_APP_API_DATASET_DELETE || "/api/delete/";
            const params = new URLSearchParams();
            if (projectId) params.append("project_id", projectId);
            params.append("folder", folder);
            if (file) params.append("file", file);
            const response = await apiFetch(
                `${API_BASE_URL}${endpoint}?${params.toString()}`,
                {
                    method: "DELETE",
                },
            );
            return response.ok || response.status === 204;
        },

        // Upload file (FormData must already include project_id)
        uploadFile: async (formData) => {
            const endpoint =
                import.meta.env.VITE_APP_API_UPLOAD || "/api/upload/";
            const response = await apiFetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",
                headers: {}, // Let browser set Content-Type for FormData
                body: formData,
            });
            return await parseResponse(response);
        },

        // Create folder
        createFolder: async (projectId, folderName, parent = "") => {
            const rawPath =
                import.meta.env.VITE_APP_API_DATASET_CREATE_FOLDER ||
                "create-folder/";
            const path =
                rawPath.replace(/^\/*api\/+/, "").replace(/^\//, "") ||
                "create-folder/";
            const response = await apiFetch(`${MATFLOW_API_ROOT}/${path}`, {
                method: "POST",
                body: JSON.stringify({
                    project_id: projectId,
                    folderName,
                    parent,
                }),
            });
            const data = await parseResponse(response);
            if (!response.ok) {
                const err = new Error(
                    data?.error || data?.detail || "Failed to create folder",
                );
                err.data = data;
                throw err;
            }
            return data;
        },

        // Rename file or folder
        rename: async (projectId, currentName, newName, parentFolder = "") => {
            const endpoint =
                import.meta.env.VITE_APP_API_RENAME || "/api/rename/";
            const response = await apiFetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",
                body: JSON.stringify({
                    project_id: projectId,
                    currentName,
                    newName,
                    parentFolder,
                }),
            });
            const data = await parseResponse(response);
            if (!response.ok) {
                const err = new Error(
                    data?.error || data?.detail || "Failed to rename item",
                );
                err.data = data;
                throw err;
            }
            return data;
        },
        move: async (projectId, sourcePath, destinationFolder) => {
            const endpoint = import.meta.env.VITE_APP_API_MOVE || "/api/move/";
            const response = await apiFetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",
                body: JSON.stringify({
                    project_id: projectId,
                    sourcePath,
                    destinationFolder,
                }),
            });
            return await parseResponse(response);
        },
    },

    // ========== Feature Engineering Operations ==========
    featureEngineering: {
        // Change data type
        changeDtype: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/change_dtype/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Alter field name
        alterFieldName: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/alter_field_name/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Merge datasets
        mergeDataset: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/merge_dataset/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Encoding
        encoding: async (data) => {
            const response = await apiFetch(`${API_BASE_URL}/api/encoding/`, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return await parseResponse(response);
        },

        // Scaling
        scaling: async (data) => {
            const response = await apiFetch(`${API_BASE_URL}/api/scaling/`, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return await parseResponse(response);
        },

        // Drop column
        dropColumn: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/drop_column/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Drop rows
        dropRows: async (data) => {
            const response = await apiFetch(`${API_BASE_URL}/api/drop_rows/`, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return await parseResponse(response);
        },

        // Append dataset
        appendDataset: async (data) => {
            const response = await apiFetch(`${API_BASE_URL}/api/append/`, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return await parseResponse(response);
        },

        // Imputation step 1
        imputationData1: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/imputation_data1`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Imputation step 2
        imputationData2: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/imputation_data2`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Imputation result
        imputationResult: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/imputation_result`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Feature selection
        featureSelection: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/feature_selection/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Progressive feature selection (PFS)
        progressiveFeatureSelection: async (data) => {
            const response = await apiFetch(`${API_BASE_URL}/api/pfs/`, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return await parseResponse(response);
        },

        // Cluster
        cluster: async (data) => {
            const response = await apiFetch(`${API_BASE_URL}/api/cluster/`, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return await parseResponse(response);
        },

        // Feature creation
        featureCreation: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/feature_creation/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },
    },

    // ========== Scaler Evaluation ==========
    scaler: {
        evaluate: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/scale-evaluate/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },
    },

    // ========== EDA Operations ==========
    eda: {
        // Venn diagram
        vennDiagram: async (data) => {
            const endpoint =
                import.meta.env.VITE_APP_API_EDA_VENNDIAGRAM ||
                "/api/eda/venn-diagram/";
            const response = await apiFetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return await parseResponse(response);
        },

        // Bar plot
        barPlot: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/eda/barplot/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Pie plot
        piePlot: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/eda/pieplot/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Histogram
        histogram: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/eda/histogram/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Box plot
        boxPlot: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/eda/boxplot/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Violin plot
        violinPlot: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/eda/violinplot/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Scatter plot
        scatterPlot: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/eda/scatterplot/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Regression plot
        regPlot: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/eda/regplot/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Line plot
        linePlot: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/eda/lineplot/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Count plot
        countPlot: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/eda/countplot/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Custom plot
        customPlot: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/eda/customplot/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },
    },

    // ========== ML Model Operations ==========
    ml: {
        // Split dataset
        splitDataset: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/split_dataset/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Build model
        buildModel: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/build_model/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            const result = await parseResponse(response);
            if (!response.ok || result?.error) {
                throw createApiError(
                    response,
                    result,
                    "Failed to build model.",
                );
            }
            return result;
        },

        // Model evaluation
        evaluateModel: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/model_evaluation/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Model prediction
        predictModel: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/model_prediction/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Download model
        downloadModel: async (modelId) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/download_model/`,
                {
                    method: "POST",
                    body: JSON.stringify({ model_id: modelId }),
                },
            );
            return await parseResponse(response);
        },

        // Server model registry (project-scoped)
        listModelsRegistry: async (projectId) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/models_registry/?project_id=${encodeURIComponent(projectId || "")}`,
            );
            return await parseResponse(response);
        },

        // Server split registry (project/workspace-scoped)
        listSplitsRegistry: async (
            projectId,
            workspaceId,
            activeOnly = true,
        ) => {
            const params = new URLSearchParams();
            if (projectId) params.append("project_id", projectId);
            if (workspaceId) params.append("workspace_id", workspaceId);
            params.append("active_only", activeOnly ? "1" : "0");
            const response = await apiFetch(
                `${API_BASE_URL}/api/splits_registry/?${params.toString()}`,
            );
            return await parseResponse(response);
        },

        deleteModelRegistry: async (modelId, projectId) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/models_registry/${modelId}/delete/`,
                {
                    method: "POST",
                    body: JSON.stringify({ project_id: projectId }),
                },
            );
            return await parseResponse(response);
        },

        downloadModelRegistry: async (modelId, projectId) => {
            return await apiFetch(
                `${API_BASE_URL}/api/models_registry/${modelId}/download/?project_id=${encodeURIComponent(projectId || "")}`,
            );
        },

        // Hyperparameter optimization
        hyperparameterOptimization: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/hyperparameter_optimization/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            const result = await parseResponse(response);
            if (!response.ok || result?.error) {
                throw createApiError(
                    response,
                    result,
                    "Failed to run hyperparameter optimization.",
                );
            }
            return result;
        },
    },

    // ========== Time Series Operations ==========
    timeSeries: {
        // Time series
        timeSeries: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/time_series/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Time series analysis
        timeSeriesAnalysis: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/time_series_analysis/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },
    },

    // ========== Model Deployment ==========
    deployment: {
        // Deploy data
        deployData: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/deploy_data/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Deploy result
        deployResult: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/deploy_result/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // Batch prediction
        deployBatch: async (data) => {
            const endpoint =
                import.meta.env.VITE_APP_API_DEPLOY_BATCH ||
                "/api/deploy_batch/";
            const response = await apiFetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return await parseResponse(response);
        },

        // Batch prediction status
        deployBatchStatus: async (taskId) => {
            const endpoint =
                import.meta.env.VITE_APP_API_DEPLOY_BATCH_STATUS ||
                "/api/deploy_batch_status/";
            const response = await apiFetch(
                `${API_BASE_URL}${endpoint}${taskId}/`,
            );
            return await parseResponse(response);
        },

        // Cancel batch prediction
        deployBatchCancel: async (taskId) => {
            const endpoint =
                import.meta.env.VITE_APP_API_DEPLOY_BATCH_CANCEL ||
                "/api/deploy_batch_cancel/";
            const response = await apiFetch(
                `${API_BASE_URL}${endpoint}${taskId}/`,
                {
                    method: "POST",
                },
            );
            return await parseResponse(response);
        },
    },

    // ========== Reverse ML ==========
    reverseML: {
        reverseML: async (data) => {
            const response = await apiFetch(`${API_BASE_URL}/api/reverseml/`, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return await parseResponse(response);
        },
    },

    // ========== Chemistry/Molecules Operations ==========
    chemistry: {
        // SMILES to DFT
        smilesToDFT: async (data) => {
            const response = await apiFetch(`${API_BASE_URL}/api/smiles-dft/`, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return await parseResponse(response);
        },

        // SMILES to SA Score
        smilesToSAScore: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/smiles-sa-score/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        // SMILES to IUPAC - Convert
        smilesToIUPACConvert: async (data, async = false) => {
            const url = async
                ? `${API_BASE_URL}/api/smiles-iupac/convert/?async=true`
                : `${API_BASE_URL}/api/smiles-iupac/convert/`;
            const response = await apiFetch(url, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return await parseResponse(response);
        },

        // SMILES to IUPAC - Status
        smilesToIUPACStatus: async (taskId) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/smiles-iupac/status/${taskId}/`,
            );
            return await parseResponse(response);
        },

        // SMILES Molecular Structure - Generate
        smilesStructureGenerate: async (data, returnBlob = false) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/smiles-structure/generate/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            if (returnBlob) {
                return response; // Return raw response for blob handling
            }
            return await parseResponse(response);
        },

        // SMILES Molecular Structure - Status
        smilesStructureStatus: async (taskId) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/smiles-structure/status/${taskId}/`,
            );
            return await parseResponse(response);
        },

        // SMILES Molecular Structure - Download ZIP
        smilesStructureDownloadZip: async (taskId) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/smiles-structure/download-zip/${taskId}/`,
            );
            return response; // Return response for blob download
        },

        // SMILES Generation
        smilesGeneration: async (data, async = false) => {
            const url = async
                ? `${API_BASE_URL}/api/smiles-generation/?async=true`
                : `${API_BASE_URL}/api/smiles-generation/`;
            const response = await apiFetch(url, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return await parseResponse(response);
        },

        // SMILES Generation Status
        smilesGenerationStatus: async (taskId) => {
            const endpoint =
                import.meta.env.VITE_APP_API_SMILES_STATUS ||
                "/api/smiles-generation/status/";
            const response = await apiFetch(
                `${API_BASE_URL}${endpoint}${taskId}/`,
            );
            return await parseResponse(response);
        },

        // Organic Check
        organicCheck: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/organic-check/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },
    },

    // ========== PSO (Particle Swarm Optimization) ==========
    pso: {
        optimize: async (data) => {
            const optimizeUrl =
                import.meta.env.VITE_APP_API_OPTIMIZE ||
                `${API_BASE_URL}/api/optimize/`;
            const response = await apiFetch(optimizeUrl, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return await parseResponse(response);
        },

        getStatus: async (taskId) => {
            const statusUrl =
                import.meta.env.VITE_APP_API_STATUS ||
                `${API_BASE_URL}/api/status/`;
            const response = await apiFetch(`${statusUrl}${taskId}`);
            return await parseResponse(response);
        },
    },

    // ========== Chatbot ==========
    chatbot: {
        chat: async (message, conversationId = null) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/chatbot/chat/`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        message,
                        conversation_id: conversationId,
                    }),
                },
            );
            return await parseResponse(response);
        },

        getConversations: async () => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/chatbot/conversations/`,
            );
            return await parseResponse(response);
        },

        getConversation: async (conversationId) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/chatbot/conversations/${conversationId}/`,
            );
            return await parseResponse(response);
        },

        deleteConversation: async (conversationId) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/chatbot/conversations/${conversationId}/`,
                {
                    method: "DELETE",
                },
            );
            return response.ok || response.status === 204;
        },

        // Chat endpoint (different from chatbot/chat - used by Chatbot component)
        chat: async (message) => {
            const chatPath = import.meta.env.VITE_APP_API_CHAT || "/api/chat/";
            const response = await apiFetch(`${API_BASE_URL}${chatPath}`, {
                method: "POST",
                body: JSON.stringify({ message }),
            });
            return await parseResponse(response);
        },

        // Upload file for chat
        uploadFile: async (formData) => {
            const uploadPath =
                import.meta.env.VITE_APP_API_CHAT_UPLOAD || "/api/upload/";
            const response = await apiFetch(`${API_BASE_URL}${uploadPath}`, {
                method: "POST",
                body: formData,
            });
            return await parseResponse(response);
        },

        // Generate dataset
        generateDataset: async (name) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/chat/generate-dataset/`,
                {
                    method: "POST",
                    body: JSON.stringify({ name }),
                },
            );
            return await parseResponse(response);
        },

        // Reset chat history
        resetHistory: async () => {
            const chatPath = import.meta.env.VITE_APP_API_CHAT || "/api/chat/";
            const response = await apiFetch(`${API_BASE_URL}${chatPath}`, {
                method: "POST",
                body: JSON.stringify({
                    query: "__RESET_HISTORY__",
                    reset: true,
                }),
            });
            return await parseResponse(response);
        },
    },

    // ========== Graph ML Operations ==========
    graphML: {
        // Reformat graph data
        reformat: async (formData) => {
            const graphPath =
                import.meta.env.VITE_APP_API_GRAPH || "/api/graph/";
            const response = await apiFetch(
                `${API_BASE_URL}${graphPath}reformat/`,
                {
                    method: "POST",
                    body: formData,
                },
            );
            return await parseResponse(response);
        },

        // Process graph data
        processData: async (formData) => {
            const graphPath =
                import.meta.env.VITE_APP_API_GRAPH || "/api/graph/";
            const response = await apiFetch(
                `${API_BASE_URL}${graphPath}process-data/`,
                {
                    method: "POST",
                    body: formData,
                },
            );
            return await parseResponse(response);
        },

        // Train model
        trainModel: async (formData) => {
            const graphPath =
                import.meta.env.VITE_APP_API_GRAPH || "/api/graph/";
            const response = await apiFetch(
                `${API_BASE_URL}${graphPath}train-model/`,
                {
                    method: "POST",
                    body: formData,
                },
            );
            return await parseResponse(response);
        },

        // Deploy model
        deployModel: async (formData) => {
            const graphPath =
                import.meta.env.VITE_APP_API_GRAPH || "/api/graph/";
            const response = await apiFetch(
                `${API_BASE_URL}${graphPath}model-deploy/`,
                {
                    method: "POST",
                    body: formData,
                },
            );
            return await parseResponse(response);
        },
    },

    // ========== Projects ==========
    projects: {
        list: async () => {
            const response = await apiFetch(`${MATFLOW_API_ROOT}/projects/`);
            return await parseResponse(response);
        },
        get: async (id) => {
            const response = await apiFetch(
                `${MATFLOW_API_ROOT}/projects/${id}/`,
            );
            return await parseResponse(response);
        },
        create: async (payload) => {
            const response = await apiFetch(`${MATFLOW_API_ROOT}/projects/`, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            return await parseResponse(response);
        },
        update: async (id, payload) => {
            const response = await apiFetch(
                `${MATFLOW_API_ROOT}/projects/${id}/`,
                {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                },
            );
            return await parseResponse(response);
        },
        remove: async (id) => {
            const response = await apiFetch(
                `${MATFLOW_API_ROOT}/projects/${id}/`,
                {
                    method: "DELETE",
                },
            );
            return response.ok || response.status === 204;
        },
        createSample: async (sampleType) => {
            const response = await apiFetch(
                `${MATFLOW_API_ROOT}/projects/create-sample/`,
                {
                    method: "POST",
                    body: JSON.stringify({ sample_type: sampleType }),
                },
            );
            return await parseResponse(response);
        },

        /**
         * Seed a guest sample project.
         * Copies sample files on the server without creating a DB record.
         * @param {string} projectId - Client-generated UUID
         * @param {string} sampleType - 'classification' | 'regression' | 'graph'
         */
        seedGuestSample: async (projectId, sampleType) => {
            const response = await apiFetch(
                `${MATFLOW_API_ROOT}/projects/seed-guest-sample/`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        project_id: projectId,
                        sample_type: sampleType,
                    }),
                },
            );
            return await parseResponse(response);
        },
    },
};
