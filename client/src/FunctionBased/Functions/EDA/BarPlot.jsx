// src/FunctionBased/Components/BarPlot/BarPlot.jsx

import CircularProgress from "@mui/material/CircularProgress";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector"; // Import the LayoutSelector component
import { isLoggedIn } from "../../../util/adminAuth";
import { apiService } from "../../../services/api/apiService";
import { withWorkspaceContext } from "../../../services/api/matflowApi";

function BarPlot({
    csvData,
    splitMode = false,
    onPlotGenerated,
    onError,
    onLoading,
}) {
    const REQUIRED_FIELDS_ERROR =
        "Please select at least one categorical variable and one numerical variable.";
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

    const [echartsData, setEchartsData] = useState([]); // Initialize as an array
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // State for error handling

    const [stringColumn, setStringColumn] = useState([]);
    const [numberColumn, setNumberColumn] = useState([]);
    const [activeStringColumn, setActiveStringColumn] = useState([]); // Categorical variables
    const [activeNumberColumn, setActiveNumberColumn] = useState(""); // Numerical variable
    const [activeHueColumn, setActiveHueColumn] = useState("");
    const [orientation, setOrientation] = useState("Vertical");
    const [title, setTitle] = useState("");

    // Populate column names based on CSV data
    useEffect(() => {
        if (activeCsvFile && activeCsvFile.name && csvData.length > 0) {
            const getData = () => {
                const tempStringColumn = [];
                const tempNumberColumn = [];

                // Iterate over the first row to determine column types
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

    // Listen for chatbot-generated bar plot requests
    useEffect(() => {
        const handleChatbotBarPlot = (event) => {
            const { categorical, numerical, orientation, title } = event.detail;

            console.log(
                "🤖 Chatbot triggered bar plot generation with params:",
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

            // Set the parameters from chatbot
            setActiveStringColumn(categorical || []);
            setActiveNumberColumn(numerical || "");
            setOrientation(orientation || "Vertical");
            setTitle(title || "");

            // Generate plot directly with the parameters instead of relying on state
            generatePlotWithParams(categorical, numerical, orientation, title);
        };

        // Add event listener
        window.addEventListener("chatbotGenerateBarPlot", handleChatbotBarPlot);

        // Cleanup
        return () => {
            window.removeEventListener(
                "chatbotGenerateBarPlot",
                handleChatbotBarPlot,
            );
        };
    }, [csvData]); // Include csvData in dependencies

    // Clear stale validation errors as soon as required selections become valid.
    useEffect(() => {
        const hasRequiredSelections =
            activeStringColumn.length > 0 && Boolean(activeNumberColumn);

        if (hasRequiredSelections) {
            setError((prev) => (prev === REQUIRED_FIELDS_ERROR ? null : prev));
            if (onError && splitMode) {
                onError(null);
            }
        }
    }, [activeStringColumn, activeNumberColumn, onError, splitMode]);

    // Generate plot with specific parameters (for chatbot)
    const generatePlotWithParams = async (
        categorical,
        numerical,
        orientation,
        title,
    ) => {
        if (!isLoggedIn()) {
            setError("Please log in to generate plots.");
            return;
        }

        try {
            setLoading(true);
            setEchartsData([]);
            setError(null);

            const data = await apiService.matflow.eda.barPlot(
                withWorkspaceContext(
                    {
                        cat: categorical, // Use the parameters directly
                        num: numerical, // Use the parameters directly
                        hue: activeHueColumn || "-", // Only hue can be "-" if not used
                        orient: orientation,
                        title: title || "",
                        file: csvData,
                    },
                    wsCtx,
                ),
            );
            console.log("🤖 Plot generated successfully:", data);

            // Ensure plotlyData is an array
            let plotData = [];
            if (Array.isArray(data.echarts)) {
                plotData = data.echarts;
            } else if (typeof data.echarts === "object") {
                plotData = [data.echarts]; // Wrap in array if single plot
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

    const handleGenerate = async () => {
        if (!isLoggedIn()) {
            setError("Please log in to generate plots.");
            return;
        }

        try {
            setLoading(true);
            setEchartsData([]);
            setError(null); // Reset error state

            if (onLoading && splitMode) {
                onLoading(true);
            }

            // Validate parameters before sending
            if (activeStringColumn.length === 0 || !activeNumberColumn) {
                const errorMsg = REQUIRED_FIELDS_ERROR;
                setError(errorMsg);
                if (onError && splitMode) {
                    onError(errorMsg);
                }
                if (onLoading && splitMode) {
                    onLoading(false);
                }
                setLoading(false);
                return;
            }

            const data = await apiService.matflow.eda.barPlot(
                withWorkspaceContext(
                    {
                        cat: activeStringColumn, // Send the actual array, not "-"
                        num: activeNumberColumn, // Send the actual column name, not "-"
                        hue: activeHueColumn || "-", // Only hue can be "-" if not used
                        orient: orientation,
                        title: title || "",
                        file: csvData,
                    },
                    wsCtx,
                ),
            );
            console.log(data);

            // Ensure plotlyData is an array
            let plotData = [];
            if (Array.isArray(data.echarts)) {
                plotData = data.echarts;
            } else if (typeof data.echarts === "object") {
                plotData = [data.echarts]; // Wrap in array if single plot
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
                {/* Dropdowns for selecting variables */}
                <div className="grid grid-cols-1 gap-3">
                    <div className="w-full">
                        <p className="text-sm font-medium tracking-wide mb-2">
                            Categorical Variable(s)
                        </p>
                        <MultipleDropDown
                            columnNames={stringColumn}
                            setSelectedColumns={setActiveStringColumn}
                        />
                    </div>
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
                            Orientation
                        </p>
                        <SingleDropDown
                            columnNames={["Vertical", "Horizontal"]}
                            initValue={orientation}
                            onValueChange={setOrientation}
                        />
                    </div>
                </div>

                {/* Compact Generate Button */}
                <div className="flex justify-end mt-4">
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
                        Categorical Variable(s)
                    </p>
                    <MultipleDropDown
                        columnNames={stringColumn}
                        setSelectedColumns={setActiveStringColumn}
                    />
                </div>
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
                        Orientation
                    </p>
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

            {/* Render LayoutSelector with Plotly Data */}
            {echartsData.length > 0 && (
                <LayoutSelector echartsData={echartsData} />
            )}
        </div>
    );
}

export default BarPlot;
