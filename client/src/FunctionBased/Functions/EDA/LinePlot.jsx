// src/FunctionBased/Components/LinePlot/LinePlot.jsx

import CircularProgress from "@mui/material/CircularProgress";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector"; // Import LayoutSelector
import { getAuthHeaders } from "../../../util/adminAuth";
import { apiService } from "../../../services/api/apiService";
import { withWorkspaceContext } from "../../../services/api/matflowApi";

function LinePlot({
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

    const [echartsData, setEchartsData] = useState([]); // Initialize as an empty array
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // State for error handling

    const [stringColumn, setStringColumn] = useState([]);
    const [numberColumn, setNumberColumn] = useState([]);
    const [x_var, setX_var] = useState([]);
    const [y_var, setY_var] = useState("");
    const [activeHueColumn, setActiveHueColumn] = useState("");
    const [title, setTitle] = useState("");

    // Listen for chatbot-generated line plot requests
    useEffect(() => {
        const handleChatbotLinePlot = (event) => {
            const {
                x_var: chatbotXVar,
                y_var: chatbotYVar,
                hue,
                title: chatbotTitle,
            } = event.detail;
            console.log(
                "🤖 Chatbot triggered line plot generation with params:",
                event.detail,
            );

            // Validate parameters before setting state
            if (!chatbotXVar || !chatbotYVar) {
                console.warn(
                    "🤖 Invalid parameters from chatbot - missing x_var or y_var",
                );
                setError("Please select both X and Y variables.");
                return;
            }

            setX_var(Array.isArray(chatbotXVar) ? chatbotXVar : [chatbotXVar]);
            setY_var(chatbotYVar || "");
            setActiveHueColumn(hue || "");
            setTitle(chatbotTitle || "");

            generatePlotWithParams(
                Array.isArray(chatbotXVar) ? chatbotXVar : [chatbotXVar],
                chatbotYVar,
                hue,
                chatbotTitle,
            );
        };

        window.addEventListener(
            "chatbotGenerateLinePlot",
            handleChatbotLinePlot,
        );
        return () => {
            window.removeEventListener(
                "chatbotGenerateLinePlot",
                handleChatbotLinePlot,
            );
        };
    }, [csvData]);

    // Generate plot with direct parameters (for chatbot)
    const generatePlotWithParams = async (xVar, yVar, hue, title) => {
        try {
            setLoading(true);
            setEchartsData([]);
            setError(null);

            const data = await apiService.matflow.eda.linePlot(
                withWorkspaceContext(
                    {
                        x_var: xVar,
                        y_var: yVar,
                        hue: hue || "-",
                        title: title || "",
                        file: csvData,
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
        } finally {
            setLoading(false);
        }
    };

    // Extract string and number columns from CSV data
    useEffect(() => {
        if (activeCsvFile && activeCsvFile.name && csvData.length > 0) {
            const getData = () => {
                const tempStringColumn = [];
                const tempNumberColumn = [];

                Object.entries(csvData[0]).forEach(([key, value]) => {
                    if (typeof value === "string" || isNaN(value)) {
                        tempStringColumn.push(key);
                    } else {
                        tempNumberColumn.push(key);
                    }
                });

                setStringColumn(tempStringColumn);
                setNumberColumn(tempNumberColumn);
            };

            getData();
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

            const data = await apiService.matflow.eda.linePlot(
                withWorkspaceContext(
                    {
                        x_var: x_var.length > 0 ? x_var : ["-"],
                        y_var: y_var || "-",
                        hue: activeHueColumn || "-",
                        title: title || "",
                        file: csvData,
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
                            X Variable
                        </p>
                        <MultipleDropDown
                            columnNames={numberColumn}
                            setSelectedColumns={setX_var}
                        />
                    </div>
                    <div className="w-full">
                        <p className="text-sm font-medium tracking-wide mb-2">
                            Y Variable
                        </p>
                        <SingleDropDown
                            columnNames={numberColumn}
                            onValueChange={setY_var}
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

    return (
        <div>
            {/* Dropdowns for selecting variables */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-center gap-8 mt-8">
                <div className="w-full">
                    <p className="text-lg font-medium tracking-wide">
                        X Variable
                    </p>
                    <MultipleDropDown
                        columnNames={numberColumn}
                        setSelectedColumns={setX_var}
                    />
                </div>
                <div className="w-full">
                    <p className="text-lg font-medium tracking-wide">
                        Y Variable
                    </p>
                    <SingleDropDown
                        columnNames={numberColumn}
                        onValueChange={setY_var}
                    />
                </div>
                <div className="w-full">
                    <p className="text-lg font-medium tracking-wide">Hue</p>
                    <SingleDropDown
                        onValueChange={setActiveHueColumn}
                        columnNames={stringColumn}
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

export default LinePlot;
