// src/FunctionBased/Components/PiePlot/PiePlot.jsx

import CircularProgress from "@mui/material/CircularProgress";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector.jsx";
import { toast } from "react-toastify";
import { getAuthHeaders } from "../../../util/adminAuth";
import { apiService } from "../../../services/api/apiService";
import { withWorkspaceContext } from "../../../services/api/matflowApi";

function PiePlot({
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
    const [activeStringColumn, setActiveStringColumn] = useState([]);
    const [title, setTitle] = useState("");
    const [echartsData, setEchartsData] = useState([]); // Initialize as an empty array
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // State for error handling

    // Listen for chatbot-generated pie plot requests
    useEffect(() => {
        const handleChatbotPiePlot = (event) => {
            const { categorical, title: chatbotTitle } = event.detail;
            console.log(
                "🤖 Chatbot triggered pie plot generation with params:",
                event.detail,
            );

            // Validate parameters before setting state
            if (!categorical || categorical.length === 0) {
                console.warn(
                    "🤖 Invalid parameters from chatbot - missing categorical data",
                );
                setError("Please select at least one categorical variable.");
                return;
            }

            setActiveStringColumn(categorical || []);
            setTitle(chatbotTitle || "");
            generatePlotWithParams(categorical, chatbotTitle);
        };

        window.addEventListener("chatbotGeneratePiePlot", handleChatbotPiePlot);
        return () => {
            window.removeEventListener(
                "chatbotGeneratePiePlot",
                handleChatbotPiePlot,
            );
        };
    }, [csvData]);

    // Generate plot with direct parameters (for chatbot)
    const generatePlotWithParams = async (categorical, title) => {
        try {
            setLoading(true);
            setEchartsData([]);
            setError(null);

            const data = await apiService.matflow.eda.piePlot(
                withWorkspaceContext(
                    {
                        cat: categorical.length > 0 ? categorical : ["-"],
                        file: csvData,
                        title: title || "",
                    },
                    wsCtx,
                ),
            );

            console.log("Received data from backend:", data);

            // Ensure plotlyData is an array
            if (Array.isArray(data.echarts)) {
                setEchartsData(data.echarts);
            } else if (typeof data.echarts === "object") {
                setEchartsData([data.echarts]); // Wrap single plot in an array
            } else {
                setEchartsData([]); // Empty array if unexpected format
            }
        } catch (error) {
            console.error("Error fetching Plotly data:", error);
            setError(error.message || "An unexpected error occurred.");
            toast.error(error.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    // Extract string columns from CSV data
    useEffect(() => {
        if (activeCsvFile && activeCsvFile.name && csvData.length > 0) {
            const tempStringColumn = [];

            csvData.forEach((row) => {
                Object.entries(row).forEach(([key, value]) => {
                    if (typeof value === "string") tempStringColumn.push(key);
                });
            });

            // Remove duplicates
            const uniqueStringColumns = [...new Set(tempStringColumn)];
            setStringColumn(uniqueStringColumns);
        }
    }, [activeCsvFile, csvData]);

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setEchartsData([]); // Reset chart data
            setError(null); // Reset error state

            if (onLoading && splitMode) {
                onLoading(true);
            }

            const data = await apiService.matflow.eda.piePlot(
                withWorkspaceContext(
                    {
                        cat:
                            activeStringColumn.length > 0
                                ? activeStringColumn
                                : ["-"], // Ensure it's a list
                        file: csvData,
                        title: title || "",
                    },
                    wsCtx,
                ),
            );

            console.log("Received data from backend:", data);

            // Ensure plotlyData is an array
            let plotData = [];
            if (Array.isArray(data.echarts)) {
                plotData = data.echarts;
            } else if (typeof data.echarts === "object") {
                plotData = [data.echarts]; // Wrap single plot in an array
            }

            setEchartsData(plotData);
            if (onPlotGenerated && splitMode) {
                onPlotGenerated(plotData);
            }
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
            <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                    <div className="w-full">
                        <p className="text-sm font-medium tracking-wide mb-2">
                            Categorical Variable
                        </p>
                        <MultipleDropDown
                            columnNames={stringColumn}
                            setSelectedColumns={setActiveStringColumn}
                        />
                    </div>
                </div>

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
            {/* Dropdowns for selecting categorical variable */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-center gap-8 mt-8">
                <div className="w-full">
                    <p className="text-lg font-medium tracking-wide">
                        Categorical Variable
                    </p>
                    <MultipleDropDown
                        columnNames={stringColumn}
                        setSelectedColumns={setActiveStringColumn}
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

            {/* Render Plotly Figures using LayoutSelector */}
            {echartsData.length > 0 && (
                <LayoutSelector echartsData={echartsData} />
            )}
        </div>
    );
}

export default PiePlot;
