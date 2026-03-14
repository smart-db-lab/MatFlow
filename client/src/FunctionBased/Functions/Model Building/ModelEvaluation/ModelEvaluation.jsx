import { Checkbox, Modal, Radio } from "../../Feature Engineering/muiCompat";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { setActiveFunction } from "../../../../Slices/SideBarSlice";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist-min";
import LayoutSelector from "../../../Components/LayoutSelector/LayoutSelector";
import { toast } from "react-toastify";
import { getAuthHeaders } from "../../../../util/adminAuth";
import { fetchDataFromIndexedDB } from "../../../../util/indexDB";
import AgGridComponent from "../../../Components/AgGridComponent/AgGridComponent";
import MultipleDropDown from "../../../Components/MultipleDropDown/MultipleDropDown";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";
import { applyPlotlyTheme } from "../../../../shared/plotlyTheme";
import { syncSplitAndModelCache } from "../../../../util/modelDatasetSync";
import { getWorkspaceRootFromPath } from "../../../../util/utils";
import {
    FE_SECTION_TITLE_CLASS,
    FE_SUB_LABEL_CLASS,
} from "../../Feature Engineering/feUi";

function ModelEvaluation() {
    const dispatch = useDispatch();
    const { projectId } = useParams();
    const modelsDbName = projectId ? `models:${projectId}` : "models";
    const splitDbName = projectId
        ? `splitted_dataset:${projectId}`
        : "splitted_dataset";
    const [display_type, setDisplayType] = useState("Table");
    const [orientation, setOrientation] = useState("Vertical");
    const [test_dataset, setTestDataset] = useState();
    const [include_data, setIncludeData] = useState(false);
    const [display_result, setDisplayResult] = useState("Test");
    const [allDatasetName, setAllDatasetName] = useState();
    const [columnName, setColumnName] = useState();
    const [file, setFile] = useState();
    const [selectedColumn, setSelectedColumn] = useState();
    const [columnDefs, setColumnDefs] = useState();
    const [graphData, setGraphData] = useState();
    const [notFound, setNotFound] = useState(false);
    const [allModelName, setAllModelName] = useState();
    const [selectedSplitFolder, setSelectedSplitFolder] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const modelEvalPlotRef = useRef(null);

    const [visible, setVisible] = useState(false);

    const openModal = () => setVisible(true);
    const closeModal = () => setVisible(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const synced = await syncSplitAndModelCache(projectId);
                const tempDatasetName = synced.splitNames || [];
                const tempModels = synced.modelEntries || [];
                setAllDatasetName(tempDatasetName);

                // Check if ANY models exist for ANY dataset
                const hasModels = tempModels.some((model) => {
                    const datasetName = Object.keys(model)[0];
                    return (
                        model[datasetName] &&
                        Object.keys(model[datasetName]).length > 0
                    );
                });

                setNotFound(!hasModels);

                // If datasets exist, set initial model data for first dataset
                if (tempDatasetName.length > 0) {
                    const firstDatasetName = tempDatasetName[0];
                    handleChangeDataset(firstDatasetName);
                }
            } catch (error) {
                console.error("Error loading models:", error);
                setNotFound(true);
            }
        };

        fetchData();
    }, [projectId]);

    const handleChangeDataset = async (e) => {
        setColumnDefs();
        setTestDataset(e);
        let tempDatasets = await fetchDataFromIndexedDB(splitDbName).catch(
            () => [],
        );
        tempDatasets = (tempDatasets || []).map((val) => {
            if (Object.keys(val || {})[0] === e) {
                return val[e];
            }
            return undefined;
        });
        tempDatasets = tempDatasets.filter(
            (val) => val !== undefined && val !== null,
        )[0];
        setSelectedSplitFolder(
            Array.isArray(tempDatasets) ? tempDatasets[5] || "" : "",
        );

        let tempModels = await fetchDataFromIndexedDB(modelsDbName).catch(
            () => [],
        );
        tempModels = (tempModels || []).map((val) => {
            if (Object.keys(val || {})[0] === e) {
                return val[e];
            }
            return undefined;
        });
        tempModels = tempModels.filter(
            (val) => val !== undefined && val !== null,
        )[0];

        if (!tempModels || Object.keys(tempModels).length === 0) {
            setAllModelName([]);
            setColumnName([]);
            setFile([]);
            return;
        }

        const keys = Object.keys(tempModels);

        let temp = keys.map((val) => {
            return { ...tempModels[val].metrics_table, name: val };
        });
        console.log(temp);
        setAllModelName(temp.map((val) => val.name));

        setColumnName(temp[0] ? Object.keys(temp[0]) : []);
        setFile(temp);
    };

    const handleSave = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (display_type === "Graph") {
                console.log({
                    file,
                    "Display Type": display_type,
                    "Display Result": display_result,
                    "Select Orientation": orientation,
                    Columns: selectedColumn,
                });
                const response = await apiService.matflow.ml.evaluateModel({
                    file,
                    "Display Type": display_type,
                    "Display Result": display_result,
                    "Select Orientation": orientation,
                    Columns: selectedColumn,
                });

                const data =
                    typeof response === "string"
                        ? JSON.parse(response)
                        : response;
                setGraphData(data);
                console.log(data);
            } else {
                const columnSet = new Set(selectedColumn);
                let tempDef = [];
                let temp =
                    Array.isArray(columnName) && columnName.length > 0
                        ? columnName.map((key) => {
                              const tempCol = key.toLowerCase();
                              if (
                                  display_result === "Test" ||
                                  display_result === "Train"
                              ) {
                                  if (
                                      tempCol.includes(
                                          display_result.toLowerCase(),
                                      ) ||
                                      key === "name"
                                  )
                                      tempDef.push({
                                          headerName: key,
                                          field: key,
                                          valueGetter: (params) => {
                                              return params.data[key];
                                          },
                                      });
                              }
                              if (display_result === "All")
                                  tempDef.push({
                                      headerName: key,
                                      field: key,
                                      valueGetter: (params) => {
                                          return params.data[key];
                                      },
                                  });
                              if (display_result === "Custom") {
                                  if (columnSet.has(key) || key === "name") {
                                      tempDef.push({
                                          headerName: key,
                                          field: key,
                                          valueGetter: (params) => {
                                              return params.data[key];
                                          },
                                      });
                                  }
                              }
                          })
                        : [];

                tempDef = [
                    tempDef[tempDef.length - 1],
                    ...tempDef.slice(0, tempDef.length - 1),
                ];
                setColumnDefs(tempDef);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!allDatasetName)
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
    if (!allDatasetName || allDatasetName.length === 0 || notFound)
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
                    Build a model first to see evaluation results.
                </p>
            </div>
        );
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
                            {/* Dataset selector */}
                            <div>
                                <label className={FE_SUB_LABEL_CLASS}>
                                    Dataset
                                </label>
                                <SingleDropDown
                                    columnNames={allDatasetName}
                                    onValueChange={(e) =>
                                        handleChangeDataset(e)
                                    }
                                />
                            </div>

                            {/* Display Type */}
                            <div>
                                <label className={FE_SUB_LABEL_CLASS}>
                                    Display Type
                                </label>
                                <SingleDropDown
                                    columnNames={["Graph", "Table"]}
                                    initValue={"Table"}
                                    onValueChange={(e) => {
                                        setDisplayType(e);
                                        setColumnDefs();
                                        setGraphData();
                                    }}
                                />
                            </div>

                            {/* Orientation / Include Data */}
                            {display_type === "Graph" ? (
                                <div>
                                    <label className={FE_SUB_LABEL_CLASS}>
                                        Orientation
                                    </label>
                                    <SingleDropDown
                                        columnNames={[
                                            "Vertical",
                                            "Horizontal",
                                            "Radar",
                                        ]}
                                        initValue={"Vertical"}
                                        onValueChange={setOrientation}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2.5 py-1">
                                    <Checkbox
                                        onChange={(e) =>
                                            setIncludeData(e.valueOf())
                                        }
                                    >
                                        <span className="text-sm text-gray-700">
                                            Include Data
                                        </span>
                                    </Checkbox>
                                </div>
                            )}

                            {/* Display Result radio pills */}
                            <div>
                                <label className={FE_SUB_LABEL_CLASS}>
                                    Result Filter
                                </label>
                                <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-50 rounded-lg border border-gray-100">
                                    {["All", "Train", "Test", "Custom"].map(
                                        (val) => (
                                            <button
                                                key={val}
                                                onClick={() => {
                                                    setDisplayResult(val);
                                                    setColumnDefs();
                                                    setGraphData();
                                                }}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                                                    display_result === val
                                                        ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                                                        : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
                                                }`}
                                            >
                                                {val}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>

                            {/* Custom columns */}
                            {display_result === "Custom" && (
                                <div>
                                    <label className={FE_SUB_LABEL_CLASS}>
                                        Columns
                                    </label>
                                    <MultipleDropDown
                                        columnNames={columnName}
                                        setSelectedColumns={setSelectedColumn}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Actions footer */}
                        <div className="px-5 py-4 border-t border-gray-100 space-y-2.5">
                            {test_dataset && (
                                <button
                                    className={`w-full px-4 py-2 text-sm font-medium rounded-md text-white shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25 transition-all duration-150 ${
                                        isSubmitting
                                            ? "bg-primary/70 cursor-not-allowed"
                                            : "bg-primary hover:bg-primary-dark active:bg-primary-dark"
                                    }`}
                                    onClick={handleSave}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <span className="inline-flex items-center justify-center gap-2">
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
                                            Generating...
                                        </span>
                                    ) : (
                                        "Generate Results"
                                    )}
                                </button>
                            )}
                            {(columnDefs || graphData) && (
                                <button
                                    className="w-full px-4 py-2 text-sm font-medium rounded-md bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 hover:shadow-md hover:shadow-emerald-500/25 transition-all duration-150 flex items-center justify-center gap-2"
                                    onClick={() =>
                                        dispatch(
                                            setActiveFunction(
                                                "Model Prediction",
                                            ),
                                        )
                                    }
                                >
                                    Model Prediction
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
                    {/* Table output */}
                    {columnDefs && columnDefs.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
                            {/* Header bar */}
                            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-4">
                                <h3
                                    className={`${FE_SECTION_TITLE_CLASS} !mb-0 flex items-center gap-2`}
                                >
                                    <svg
                                        className="w-4 h-4 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                    Performance Metrics
                                </h3>
                                <div className="w-56">
                                    <MultipleDropDown
                                        columnNames={allModelName}
                                        setSelectedColumns={setSelectedColumn}
                                    />
                                </div>
                            </div>

                            {/* Custom styled table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/80">
                                            {columnDefs.map((col, i) => (
                                                <th
                                                    key={col?.field || i}
                                                    className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-left border-b border-gray-100 ${
                                                        col?.field === "name"
                                                            ? "sticky left-0 bg-gray-50/80 z-10"
                                                            : ""
                                                    }`}
                                                >
                                                    {col?.headerName || ""}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {file &&
                                            file.map((row, rowIdx) => (
                                                <tr
                                                    key={rowIdx}
                                                    className="group hover:bg-primary/5 transition-colors duration-100"
                                                >
                                                    {columnDefs.map(
                                                        (col, colIdx) => {
                                                            const value =
                                                                row[col?.field];
                                                            const isName =
                                                                col?.field ===
                                                                "name";
                                                            const isNumber =
                                                                typeof value ===
                                                                "number";
                                                            // Color-code metrics: green for high (>=0.9), amber for mid (>=0.7), red for low
                                                            let badgeClass = "";
                                                            if (
                                                                isNumber &&
                                                                !isName
                                                            ) {
                                                                if (
                                                                    value >= 0.9
                                                                )
                                                                    badgeClass =
                                                                        "text-emerald-700 bg-emerald-50 border-emerald-100";
                                                                else if (
                                                                    value >= 0.7
                                                                )
                                                                    badgeClass =
                                                                        "text-amber-700 bg-amber-50 border-amber-100";
                                                                else
                                                                    badgeClass =
                                                                        "text-red-700 bg-red-50 border-red-100";
                                                            }
                                                            return (
                                                                <td
                                                                    key={
                                                                        col?.field ||
                                                                        colIdx
                                                                    }
                                                                    className={`px-5 py-3.5 text-sm whitespace-nowrap ${
                                                                        isName
                                                                            ? "sticky left-0 bg-white group-hover:bg-primary/5 z-10 font-semibold text-gray-900"
                                                                            : "text-gray-700"
                                                                    }`}
                                                                >
                                                                    {isName ? (
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div
                                                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                                                style={{
                                                                                    backgroundColor:
                                                                                        [
                                                                                            "#ff6384",
                                                                                            "#36a2eb",
                                                                                            "#ffce56",
                                                                                            "#4bc0c0",
                                                                                            "#9966ff",
                                                                                            "#ff9f40",
                                                                                        ][
                                                                                            rowIdx %
                                                                                                6
                                                                                        ],
                                                                                }}
                                                                            />
                                                                            <span
                                                                                className="truncate max-w-[180px]"
                                                                                title={
                                                                                    value
                                                                                }
                                                                            >
                                                                                {
                                                                                    value
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    ) : isNumber ? (
                                                                        <span
                                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}
                                                                            style={{
                                                                                fontFeatureSettings:
                                                                                    "'tnum'",
                                                                            }}
                                                                        >
                                                                            {value.toFixed(
                                                                                4,
                                                                            )}
                                                                        </span>
                                                                    ) : (
                                                                        <span>
                                                                            {value ??
                                                                                "—"}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            );
                                                        },
                                                    )}
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer with count */}
                            <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/50">
                                <p className="text-[11px] text-gray-400 font-medium">
                                    {file ? file.length : 0} model
                                    {file && file.length !== 1 ? "s" : ""}{" "}
                                    &middot; {columnDefs.length} metric
                                    {columnDefs.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Graph output */}
                    {graphData && (
                        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-gray-100">
                                <h3 className={FE_SECTION_TITLE_CLASS}>
                                    Visualization
                                </h3>
                            </div>
                            <div className="p-4">
                                {graphData?.graph ? (
                                    // ECharts format
                                    <LayoutSelector
                                        echartsData={graphData.graph}
                                    />
                                ) : graphData?.data ? (
                                    // Plotly format (legacy)
                                    <Plot
                                        ref={modelEvalPlotRef}
                                        data={(graphData?.data || []).map(
                                            (trace) =>
                                                trace?.type === "bar"
                                                    ? {
                                                          ...trace,
                                                          width: 0.45,
                                                      }
                                                    : trace,
                                        )}
                                        layout={applyPlotlyTheme({
                                            ...(graphData?.layout || {}),
                                            bargap: 0.45,
                                            bargroupgap: 0.2,
                                        })}
                                        config={{
                                            editable: true,
                                            responsive: true,
                                            displaylogo: false,
                                            displayModeBar: false,
                                        }}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                        }}
                                    />
                                ) : null}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!columnDefs && !graphData && (
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
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-500">
                                No results yet
                            </p>
                            <p className="text-xs text-gray-400">
                                Configure settings and click{" "}
                                <span className="font-semibold text-primary">
                                    "Generate Results"
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
                    <Docs section={"modelEvaluation"} />
                </div>
            </Modal>
        </div>
    );
}

export default ModelEvaluation;
