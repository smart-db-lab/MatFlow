import React, { useEffect, useRef, useState } from "react";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import { Download } from "lucide-react";
import { toast } from "react-toastify";
import { getWorkspaceRootFromPath } from "../../../util/utils";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";
import FeaturePair from "../../Components/FeaturePair/FeaturePair";
import { apiService } from "../../../services/api/apiService";
import { withWorkspaceContext } from "../../../services/api/matflowApi";

function DatasetCorrelation({ csvData }) {
    const { projectId } = useParams();
    const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
    const [columnDefs, setColumnDefs] = useState([]);
    const [rowData, setRowData] = useState([]);
    const [constRowData, setConstRowData] = useState([]);
    const [constColDef, setConstColDef] = useState([]);
    const [relationMethod, setRelationMethod] = useState("pearson");
    const [displayType, setDisplayType] = useState("table");
    const [colWithInd, setColWithInd] = useState({});
    const [searchValue, setSearchValue] = useState("");
    const [columnNames, setColumnNames] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [showAnnotate, setShowAnnotate] = useState(false);
    const [echartsData, setEchartsData] = useState([]);
    const [showControls, setShowControls] = useState(false);
    const [isHeatmapLoading, setIsHeatmapLoading] = useState(false);
    const [isFeaturePairLoading, setIsFeaturePairLoading] = useState(false);
    const [loadingCount, setLoadingCount] = useState(0);
    const activeWorkspaceId = useSelector(
        (state) => state.workspace?.activeWorkspaceId,
    );
    const activeWorkspaceFilename = useSelector(
        (state) => state.workspace?.activeFilename,
    );
    const isCorrelationLoading = loadingCount > 0;
    const isAnyLoading =
        isCorrelationLoading || isHeatmapLoading || isFeaturePairLoading;
    const datasetName =
        String(activeCsvFile?.name || "")
            .split("/")
            .pop() || "Selected Dataset";

    useEffect(() => {
        if (!activeCsvFile || !Array.isArray(csvData) || csvData.length === 0) {
            setRowData([]);
            setConstRowData([]);
            setColumnDefs([]);
            setConstColDef([]);
            return;
        }

        const fetchCorrelationTable = async () => {
            setLoadingCount((prev) => prev + 1);
            try {
                const selectedFilename =
                    String(activeCsvFile?.name || "")
                        .split("/")
                        .pop() || undefined;
                const wsCtx = activeWorkspaceId
                    ? {
                          workspace_id: activeWorkspaceId,
                          // Use currently selected file first (can be output/generated_datasets/new.csv)
                          // and only fall back to workspace active filename if needed.
                          filename: selectedFilename || activeWorkspaceFilename,
                      }
                    : null;

                const response =
                    await apiService.matflow.dataset.getCorrelation(
                        withWorkspaceContext(
                            {
                                file: csvData,
                                method: relationMethod,
                            },
                            wsCtx,
                        ),
                    );

                const payload = response?.data ?? response;
                const tempData =
                    typeof payload === "string" ? JSON.parse(payload) : payload;

                if (!Array.isArray(tempData) || tempData.length === 0) {
                    setRowData([]);
                    setConstRowData([]);
                    setColumnDefs([]);
                    setConstColDef([]);
                    setColumnNames([]);
                    setSelectedColumns([]);
                    return;
                }

                const numericColumns = Object.keys(tempData[0]).filter(
                    (val) => val !== "id",
                );

                const normalizedRows = numericColumns.map((colName, index) => {
                    const row = tempData[index] || {};
                    const { id, ...rest } = row;
                    return { ...rest, column_name: colName };
                });

                let derivedColumnDefs = numericColumns.map((colName) => ({
                    headerName: colName,
                    field: colName,
                    valueGetter: (params) => params.data[colName],
                }));
                derivedColumnDefs = [
                    { headerName: "", field: "column_name" },
                    ...derivedColumnDefs,
                ];

                setRowData(normalizedRows);
                setConstRowData(normalizedRows);
                setColumnDefs(derivedColumnDefs);
                setConstColDef(derivedColumnDefs);

                const allColumnName = normalizedRows[0]
                    ? Object.keys(normalizedRows[0])
                    : [];
                let tempColInd = {};
                for (let i = 0; i < allColumnName.length; i++) {
                    tempColInd = { ...tempColInd, [allColumnName[i]]: i };
                }
                setColWithInd(tempColInd);
                setColumnNames(allColumnName);
                setSelectedColumns(allColumnName);
            } catch (error) {
                console.error("Failed to load correlation table:", error);
            } finally {
                setLoadingCount((prev) => Math.max(0, prev - 1));
            }
        };

        fetchCorrelationTable();
    }, [
        activeCsvFile,
        relationMethod,
        csvData,
        activeWorkspaceId,
        activeWorkspaceFilename,
    ]);

    useEffect(() => {
        const columnSelected = new Set(selectedColumns);

        let tempData = JSON.parse(JSON.stringify(constRowData));
        let tempColDef = JSON.parse(JSON.stringify(constColDef));

        // Change Row Data
        for (let i = 0; i < columnNames.length; i++) {
            if (columnSelected.has(columnNames[i])) continue;
            const colInd = colWithInd[columnNames[i]];
            for (let j = 0; j < tempData.length; j++) {
                if (colInd === j) tempData[j] = {};
                delete tempData[j][columnNames[i]];
            }
        }
        tempData = tempData.filter((val) => Object.keys(val).length !== 0);

        // Change Column
        for (let i = 0; i < columnNames.length; i++) {
            if (columnSelected.has(columnNames[i])) continue;
            tempColDef = tempColDef.filter(
                (val) => val.field !== columnNames[i],
            );
        }

        setRowData(tempData);
        setColumnDefs(tempColDef);
    }, [selectedColumns]);

    useEffect(() => {
        if (displayType === "heatmap") {
            const fetchData = async () => {
                setIsHeatmapLoading(true);
                try {
                    const res =
                        await apiService.matflow.dataset.getCorrelationHeatmap({
                            file: rowData,
                        });
                    const data = res.data || res;
                    const parsed =
                        typeof data === "string" ? JSON.parse(data) : data;
                    setEchartsData(parsed.echarts ? parsed.echarts : []);
                } catch (error) {
                    console.error("Failed to load correlation heatmap:", error);
                    setEchartsData([]);
                } finally {
                    setIsHeatmapLoading(false);
                }
            };
            fetchData();
        } else {
            setIsHeatmapLoading(false);
        }
    }, [rowData, displayType]);

    const handleColumnToggle = (column) => {
        if (selectedColumns.includes(column)) {
            setSelectedColumns(
                selectedColumns.filter(
                    (selectedColumn) => selectedColumn !== column,
                ),
            );
        } else {
            setSelectedColumns([...selectedColumns, column]);
        }
    };

    const filteredColumns = columnNames.filter((column) =>
        column.toLowerCase().includes(searchValue.toLowerCase()),
    );

    const buildHeatmapFilename = () => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        return `correlation-heatmap_${timestamp}.png`;
    };

    const saveHeatmapToProject = async (graphDiv) => {
        if (!graphDiv || !projectId) return;
        const workspaceRoot = getWorkspaceRootFromPath(
            activeCsvFile?.name || "",
        );
        if (!workspaceRoot) {
            throw new Error(
                "Workspace context missing. Select a dataset workspace before exporting charts.",
            );
        }
        try {
            const dataUrl = await Plotly.toImage(graphDiv, {
                format: "png",
                scale: 2,
            });
            const blob = await (await fetch(dataUrl)).blob();
            const filename = buildHeatmapFilename();
            const formData = new FormData();
            formData.append("project_id", projectId);
            formData.append("folder", `${workspaceRoot}/output/charts`);
            formData.append(
                "file",
                new File([blob], filename, { type: blob.type || "image/png" }),
            );
            await apiService.matflow.dataset.uploadFile(formData);
        } catch (error) {
            console.warn(
                "Failed to persist correlation heatmap in project output:",
                error,
            );
        }
    };

    const downloadAndPersistHeatmap = async (graphDiv) => {
        if (!graphDiv) return;
        try {
            const filename = buildHeatmapFilename();
            await Plotly.downloadImage(graphDiv, {
                format: "png",
                filename: filename.replace(/\.png$/i, ""),
                scale: 2,
            });
            await saveHeatmapToProject(graphDiv);
            if (projectId) {
                toast.success("Heatmap saved successfully.");
            } else {
                toast.success("Download started.");
            }
        } catch (error) {
            console.error("Failed to download heatmap image:", error);
            toast.error("Failed to download heatmap.");
        }
    };

    return (
        <div className="w-full">
            <div className="mb-2">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-gray-900">
                        Structure-Property Analysis - {datasetName}
                    </h2>
                    <button
                        type="button"
                        onClick={() => setShowControls((prev) => !prev)}
                        className="rounded-lg border border-[#0D9488]/30 bg-white px-3 py-2 text-sm font-medium text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors"
                    >
                        {showControls ? "Hide Controls" : "Show Controls"}
                    </button>
                </div>
            </div>
            {rowData && columnDefs && (
                <>
                    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-1">
                                <label
                                    htmlFor="correlation-method"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Correlation Method
                                </label>
                                <select
                                    className={`rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] ${
                                        isAnyLoading
                                            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500"
                                            : "border-gray-300 bg-white"
                                    }`}
                                    name="correlation-method"
                                    id="correlation-method"
                                    value={relationMethod}
                                    onChange={(e) =>
                                        setRelationMethod(e.target.value)
                                    }
                                    disabled={isAnyLoading}
                                >
                                    <option value="pearson">Pearson</option>
                                    <option value="kendall">Kendall</option>
                                    <option value="spearman">Spearman</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label
                                    htmlFor="display-type"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Display Type
                                </label>
                                <select
                                    className={`rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] ${
                                        isAnyLoading
                                            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500"
                                            : "border-gray-300 bg-white"
                                    }`}
                                    name="display-type"
                                    id="display-type"
                                    value={displayType}
                                    onChange={(e) =>
                                        setDisplayType(e.target.value)
                                    }
                                    disabled={isAnyLoading}
                                >
                                    <option value="table">Table</option>
                                    <option value="heatmap">Heatmap</option>
                                    <option value="feature_pair">
                                        Feature Pair
                                    </option>
                                </select>
                            </div>
                        </div>

                        {showControls && (
                            <div className="mt-4 border-t border-gray-100 pt-4">
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Search columns
                                </label>
                                <input
                                    value={searchValue}
                                    onChange={(e) =>
                                        setSearchValue(e.target.value)
                                    }
                                    placeholder="Enter column name"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                                />
                                <div className="mt-3 max-h-44 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                                    {filteredColumns
                                        .filter(
                                            (column) =>
                                                column !== "column_name",
                                        )
                                        .map((column, index) => (
                                            <label
                                                key={index}
                                                className="flex items-center gap-2 text-sm text-gray-700"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedColumns.includes(
                                                        column,
                                                    )}
                                                    onChange={() =>
                                                        handleColumnToggle(
                                                            column,
                                                        )
                                                    }
                                                    className="h-4 w-4 rounded border-gray-300 text-[#0D9488] focus:ring-[#0D9488]"
                                                />
                                                <span>{column}</span>
                                            </label>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {displayType === "table" ? (
                        isCorrelationLoading ? (
                            <div className="mt-8 flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600">
                                <CircularProgress
                                    size={36}
                                    sx={{ color: "#0D9488" }}
                                />
                                <p className="mt-3 text-sm font-medium text-gray-600">
                                    Preparing correlation table...
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-gray-200 bg-white p-2">
                                <AgGridComponent
                                    columnDefs={columnDefs}
                                    rowData={rowData}
                                    paginationPageSize={100}
                                    paginationThreshold={100}
                                    autoPageSize={false}
                                />
                            </div>
                        )
                    ) : displayType === "heatmap" ? (
                        <div className="mt-8 w-full">
                            {isCorrelationLoading || isHeatmapLoading ? (
                                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600">
                                    <CircularProgress
                                        size={36}
                                        sx={{ color: "#0D9488" }}
                                    />
                                    <p className="mt-3 text-sm font-medium text-gray-600">
                                        Generating heatmap...
                                    </p>
                                </div>
                            ) : echartsData.length > 0 ? (
                                <div className="w-full overflow-auto rounded-lg">
                                    <LayoutSelector echartsData={echartsData} />
                                </div>
                            ) : (
                                <div className="mt-8 flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-4 text-center text-sm text-gray-500">
                                    Heatmap is not available yet. Try selecting
                                    columns or changing the correlation method.
                                </div>
                            )}
                        </div>
                    ) : (
                        <FeaturePair
                            rowData={rowData}
                            isBaseLoading={isCorrelationLoading}
                            onLoadingChange={setIsFeaturePairLoading}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default DatasetCorrelation;
