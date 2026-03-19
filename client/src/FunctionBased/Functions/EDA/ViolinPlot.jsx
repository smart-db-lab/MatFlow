// src/FunctionBased/Components/ViolinPlot/ViolinPlot.jsx

import CircularProgress from "@mui/material/CircularProgress";
import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useSelector } from "react-redux";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector.jsx"; // Import LayoutSelector
import { toast } from "react-toastify"; // Import react-toastify for notifications
import { apiService } from "../../../services/api/apiService";
import { withWorkspaceContext } from "../../../services/api/matflowApi";

const MAX_VIOLIN_HUE_LEVELS = 12;

const getUniqueCount = (rows, column) => {
    if (!Array.isArray(rows) || rows.length === 0 || !column) {
        return 0;
    }
    const values = new Set();
    rows.forEach((row) => {
        if (row && Object.prototype.hasOwnProperty.call(row, column)) {
            values.add(String(row[column]));
        }
    });
    return values.size;
};

const getSafeHueForViolin = (categorical, hue, rows) => {
    if (!hue || hue === "-") {
        return { value: "-", warning: "" };
    }

    const selectedCats = Array.isArray(categorical)
        ? categorical
        : [categorical];
    if (selectedCats.includes(hue)) {
        return {
            value: "-",
            warning:
                "Hue matched the selected categorical variable and was automatically cleared for a clearer violin plot.",
        };
    }

    const hueLevels = getUniqueCount(rows, hue);
    if (hueLevels > MAX_VIOLIN_HUE_LEVELS) {
        return {
            value: "-",
            warning: `Hue contains ${hueLevels} groups and was automatically cleared to keep the violin plot readable.`,
        };
    }

    return { value: hue, warning: "" };
};

function ViolinPlot({
    csvData,
    splitMode = false,
    onPlotGenerated,
    onError,
    onLoading,
}) {
    const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
    const activeWorkspaceId = useSelector(
        (state) => state.workspace?.activeWorkspaceId,
    );
    const activeWorkspaceFilename = useSelector(
        (state) => state.workspace?.activeFilename,
    );
    const wsCtx = activeWorkspaceId
        ? {
              workspace_id: activeWorkspaceId,
              filename:
                  activeWorkspaceFilename ||
                  activeCsvFile?.name?.split("/").pop(),
          }
        : null;

    const [stringColumn, setStringColumn] = useState([]);
    const [numberColumn, setNumberColumn] = useState([]);
    const [activeStringColumns, setActiveStringColumns] = useState([]);
    const [activeNumberColumn, setActiveNumberColumn] = useState("");
    const [activeHueColumn, setActiveHueColumn] = useState("");
    const [orientation, setOrientation] = useState("Vertical");
    const [title, setTitle] = useState("");

    const [echartsData, setEchartsData] = useState([]); // ECharts fallback
    const [plotlyData, setPlotlyData] = useState([]); // Native violin data
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // State for error handling

    // Listen for chatbot-generated violin plot requests
    useEffect(() => {
        const handleChatbotViolinPlot = (event) => {
            const { categorical, numerical, hue, orientation, title } =
                event.detail;
            console.log(
                "🤖 Chatbot triggered violin plot generation with params:",
                event.detail,
            );

            // Validate parameters before setting state
            if (!categorical || categorical.length === 0 || !numerical) {
                console.warn(
                    "🤖 Invalid parameters from chatbot - missing categorical or numerical data",
                );
                setError(
                    "Please select at least one categorical variable and one numerical variable.",
                );
                return;
            }

            setActiveStringColumns(categorical || []);
            setActiveNumberColumn(numerical || "");
            setActiveHueColumn(hue || "");
            setOrientation(orientation || "Vertical");
            setTitle(title || "");

            generatePlotWithParams(
                categorical,
                numerical,
                hue,
                orientation,
                title,
            );
        };

        window.addEventListener(
            "chatbotGenerateViolinPlot",
            handleChatbotViolinPlot,
        );
        return () => {
            window.removeEventListener(
                "chatbotGenerateViolinPlot",
                handleChatbotViolinPlot,
            );
        };
    }, [csvData]);

    // Generate plot with direct parameters (for chatbot)
    const generatePlotWithParams = async (
        categorical,
        numerical,
        hue,
        orientation,
        title,
    ) => {
        try {
            setLoading(true);
            setEchartsData([]);
            setPlotlyData([]);
            setError(null);

            const safeHue = getSafeHueForViolin(categorical, hue, csvData);

            const data = await apiService.matflow.eda.violinPlot(
                withWorkspaceContext(
                    {
                        cat: categorical.length > 0 ? categorical : ["-"],
                        num: numerical || "-",
                        hue: safeHue.value,
                        orient: orientation || "Vertical",
                        title: title || "",
                        file: csvData,
                    },
                    wsCtx,
                ),
            );
            console.log("Received data from backend:", data);

            const nextEchartsData = Array.isArray(data.echarts)
                ? data.echarts
                : typeof data.echarts === "object" && data.echarts !== null
                  ? [data.echarts]
                  : [];
            const nextPlotlyData = Array.isArray(data.plotly)
                ? data.plotly
                : typeof data.plotly === "object" && data.plotly !== null
                  ? [data.plotly]
                  : [];
            setEchartsData(nextEchartsData);
            setPlotlyData(nextEchartsData.length > 0 ? [] : nextPlotlyData);
            toast.success("Violin plot created successfully.");
        } catch (error) {
            console.error("Error fetching Plotly data:", error);
            setError(error.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    // Extract string and number columns from CSV data
    useEffect(() => {
        if (activeCsvFile && activeCsvFile.name && csvData.length > 0) {
            const tempStringColumn = [];
            const tempNumberColumn = [];

            csvData.forEach((row) => {
                Object.entries(row).forEach(([key, value]) => {
                    if (typeof value === "string") {
                        tempStringColumn.push(key);
                    } else if (typeof value === "number" && !isNaN(value)) {
                        tempNumberColumn.push(key);
                    }
                });
            });

            // Remove duplicates
            const uniqueStringColumns = [...new Set(tempStringColumn)];
            const uniqueNumberColumns = [...new Set(tempNumberColumn)];

            setStringColumn(uniqueStringColumns);
            setNumberColumn(uniqueNumberColumns);
        }
    }, [activeCsvFile, csvData]);

    const handleGenerate = async () => {
        if (!["Vertical", "Horizontal"].includes(orientation)) {
            const errorMsg = "Invalid orientation selected.";
            toast.error(errorMsg);
            if (onError && splitMode) {
                onError(errorMsg);
            }
            return;
        }
        try {
            setLoading(true);
            setEchartsData([]); // Reset chart data
            setPlotlyData([]);
            setError(null); // Reset error state

            if (onLoading && splitMode) {
                onLoading(true);
            }

            const safeHue = getSafeHueForViolin(
                activeStringColumns,
                activeHueColumn,
                csvData,
            );

            const data = await apiService.matflow.eda.violinPlot(
                withWorkspaceContext(
                    {
                        cat:
                            activeStringColumns.length > 0
                                ? activeStringColumns
                                : "-", // Ensure it's a list
                        num: activeNumberColumn || "-",
                        hue: safeHue.value,
                        orient: orientation,
                        title: title || "",
                        file: csvData,
                    },
                    wsCtx,
                ),
            );
            console.log("Received data from backend:", data);

            const nextEchartsData = Array.isArray(data.echarts)
                ? data.echarts
                : typeof data.echarts === "object" && data.echarts !== null
                  ? [data.echarts]
                  : [];
            const nextPlotlyData = Array.isArray(data.plotly)
                ? data.plotly
                : typeof data.plotly === "object" && data.plotly !== null
                  ? [data.plotly]
                  : [];

            setEchartsData(nextEchartsData);
            setPlotlyData(nextEchartsData.length > 0 ? [] : nextPlotlyData);

            if (onPlotGenerated && splitMode) {
                if (nextEchartsData.length > 0) {
                    onPlotGenerated(nextEchartsData);
                } else {
                    onPlotGenerated({ engine: "plotly", data: nextPlotlyData });
                }
            }
            toast.success("Violin plot created successfully.");
        } catch (error) {
            console.error("Error fetching Plotly data:", error);
            const errorMsg = error.message || "An unexpected error occurred.";
            setError(errorMsg);
            toast.error(errorMsg);
            if (onError && splitMode) {
                onError(errorMsg);
            }
        } finally {
            setLoading(false);
            if (onLoading && splitMode) {
                onLoading(false);
            }
        }
    };

    // Split mode: only show input controls
    if (splitMode) {
        return (
            <div className="space-y-4">
                {/* Input fields in a proper grid */}
                <div className="grid grid-cols-1 gap-3">
                    <div className="w-full">
                        <p className="text-sm font-medium tracking-wide mb-2">
                            Numerical Variable
                        </p>
                        <SingleDropDown
                            columnNames={numberColumn}
                            onValueChange={setActiveNumberColumn}
                        />
                    </div>
                    <div className="w-full">
                        <p className="text-sm font-medium tracking-wide mb-2">
                            Categorical Variable
                        </p>
                        <MultipleDropDown
                            columnNames={stringColumn}
                            setSelectedColumns={setActiveStringColumns}
                        />
                    </div>
                    <div className="w-full">
                        <p className="text-sm font-medium tracking-wide mb-2">
                            Hue
                        </p>
                        <SingleDropDown
                            onValueChange={setActiveHueColumn}
                            columnNames={stringColumn}
                        />
                    </div>
                    <div className="w-full">
                        <p className="text-sm font-medium tracking-wide mb-2">
                            Orientation
                        </p>
                        <SingleDropDown
                            columnNames={["Vertical", "Horizontal"]}
                            initValue={orientation}
                            onValueChange={setOrientation}
                        />
                    </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-end pt-2">
                    <button
                        className="px-4 py-2 tracking-wide bg-[#0D9488] text-white text-sm font-medium rounded-md hover:bg-[#0F766E] disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        {loading ? "Generating..." : "Generate"}
                    </button>
                </div>
            </div>
        );
    }

    // Full mode: show everything (backward compatibility)
    return (
        <div>
            {/* Dropdowns for selecting variables */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-center gap-8 mt-8">
                <div className="w-full">
                    <p className="text-lg font-medium tracking-wide">
                        Numerical Variable
                    </p>
                    <SingleDropDown
                        columnNames={numberColumn}
                        onValueChange={setActiveNumberColumn}
                    />
                </div>
                <div className="w-full">
                    <p className="text-lg font-medium tracking-wide">
                        Categorical Variable
                    </p>
                    <MultipleDropDown
                        columnNames={stringColumn}
                        setSelectedColumns={setActiveStringColumns}
                    />
                </div>
                <div className="w-full">
                    <p className="text-lg font-medium tracking-wide">Hue</p>
                    <SingleDropDown
                        onValueChange={setActiveHueColumn}
                        columnNames={stringColumn}
                    />
                </div>
                <div className="w-full flex flex-col gap-1">
                    <label className="text-lg font-medium tracking-wide">
                        Orientation
                    </label>
                    <SingleDropDown
                        columnNames={["Vertical", "Horizontal"]}
                        initValue={orientation}
                        onValueChange={setOrientation}
                    />
                </div>
            </div>

            <div className="flex justify-end mt-4 my-12">
                <button
                    className="border-2 px-6 tracking-wider bg-primary-btn text-white font-medium rounded-md py-2"
                    onClick={handleGenerate}
                    disabled={loading}
                >
                    Generate
                </button>
            </div>

            {/* Loading Indicator */}
            {loading && (
                <div className="grid place-content-center mt-12 w-full h-full">
                    <div className="flex flex-col items-center gap-2">
                        <CircularProgress size={36} sx={{ color: "#0D9488" }} />
                        <p className="text-sm text-gray-600">
                            Fetching Data...
                        </p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-4 text-red-500 text-center">{error}</div>
            )}

            {echartsData.length > 0 && (
                <LayoutSelector echartsData={echartsData} />
            )}
            {echartsData.length === 0 && plotlyData.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-6">
                    {plotlyData.map((figure, index) => {
                        const traces = Array.isArray(figure?.data)
                            ? figure.data
                            : [];
                        const hideLegend = traces.length > MAX_VIOLIN_HUE_LEVELS;
                        return (
                            <Plot
                                key={`violin-plotly-fallback-${index}`}
                                data={traces}
                                layout={{
                                    ...(figure?.layout || {}),
                                    autosize: true,
                                    showlegend: hideLegend
                                        ? false
                                        : figure?.layout?.showlegend,
                                    margin: {
                                        l:
                                            orientation === "Horizontal"
                                                ? 140
                                                : 70,
                                        r: 30,
                                        t: 70,
                                        b:
                                            orientation === "Vertical"
                                                ? 140
                                                : 70,
                                    },
                                    xaxis: {
                                        ...(figure?.layout?.xaxis || {}),
                                        automargin: true,
                                        tickangle:
                                            orientation === "Vertical"
                                                ? 35
                                                : 0,
                                        tickfont: { size: 10 },
                                    },
                                    yaxis: {
                                        ...(figure?.layout?.yaxis || {}),
                                        automargin: true,
                                        tickfont: { size: 10 },
                                    },
                                }}
                                config={{
                                    responsive: true,
                                    displaylogo: false,
                                    displayModeBar: "hover",
                                }}
                                useResizeHandler
                                style={{
                                    width: "100%",
                                    minHeight: "420px",
                                }}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ViolinPlot;
