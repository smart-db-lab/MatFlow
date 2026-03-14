// src/FunctionBased/Components/Histogram/Histogram.jsx

import styled from "@emotion/styled";
import { Slider, Stack, Checkbox, FormControlLabel } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import { getAuthHeaders } from "../../../util/adminAuth";
import { apiService } from "../../../services/api/apiService";
import { withWorkspaceContext } from "../../../services/api/matflowApi";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector"; // Import LayoutSelector

// Styled component for the slider
const PrettoSlider = styled(Slider)({
    color: "#0D9488",
    height: 8,
    "& .MuiSlider-track": {
        border: "none",
    },
    "& .MuiSlider-thumb": {
        height: 24,
        width: 24,
        backgroundColor: "#fff",
        border: "2px solid currentColor",
        "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
            boxShadow: "inherit",
        },
        "&:before": {
            display: "none",
        },
    },
    "& .MuiSlider-valueLabel": {
        lineHeight: 1.2,
        fontSize: 12,
        background: "unset",
        padding: 0,
        width: 32,
        height: 32,
        borderRadius: "50% 50% 50% 0",
        backgroundColor: "#0D9488",
        transformOrigin: "bottom left",
        transform: "translate(50%, -100%) rotate(-45deg) scale(0)",
        "&:before": { display: "none" },
        "&.MuiSlider-valueLabelOpen": {
            transform: "translate(50%, -100%) rotate(-45deg) scale(1)",
        },
        "& > *": {
            transform: "rotate(45deg)",
        },
    },
});

function Histogram({
    csvData,
    splitMode = false,
    onPlotGenerated,
    onError,
    onLoading,
}) {
    const plotRef = useRef(null);
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

    const [numberColumn, setNumberColumn] = useState([]);
    const [activeNumberColumn, setActiveNumberColumn] = useState([]);
    const [orientation, setOrientation] = useState("Vertical");
    const [title, setTitle] = useState("");
    const [KDE, setKDE] = useState(false);
    const [showAutoBin, setShowAutoBin] = useState(true);
    const [autoBinValue, setAutoBinValue] = useState(10);

    // Listen for chatbot-generated histogram requests
    useEffect(() => {
        const handleChatbotHistogram = (event) => {
            const {
                numerical,
                orientation,
                title: chatbotTitle,
                bins,
                kde,
            } = event.detail;
            console.log(
                "🤖 Chatbot triggered histogram generation with params:",
                event.detail,
            );

            // Validate parameters before setting state
            if (!numerical) {
                console.warn(
                    "🤖 Invalid parameters from chatbot - missing numerical variable",
                );
                setError("Please select a numerical variable.");
                return;
            }

            setActiveNumberColumn(
                Array.isArray(numerical) ? numerical : [numerical],
            );
            setOrientation(orientation || "Vertical");
            setTitle(chatbotTitle || "");
            setAutoBinValue(bins || 10);
            setKDE(kde || false);

            generatePlotWithParams(
                Array.isArray(numerical) ? numerical : [numerical],
                orientation,
                chatbotTitle,
                bins,
                kde,
            );
        };

        window.addEventListener(
            "chatbotGenerateHistogramPlot",
            handleChatbotHistogram,
        );
        return () => {
            window.removeEventListener(
                "chatbotGenerateHistogramPlot",
                handleChatbotHistogram,
            );
        };
    }, [csvData]);

    // Generate plot with direct parameters (for chatbot)
    const generatePlotWithParams = async (
        numerical,
        orientation,
        title,
        bins,
        kde,
    ) => {
        try {
            setLoading(true);
            setEchartsData([]);
            setError(null);

            const data = await apiService.matflow.eda.histogram(
                withWorkspaceContext(
                    {
                        var: numerical.length > 0 ? numerical : ["-"],
                        orient: orientation || "Vertical",
                        title: title || "",
                        file: csvData,
                        autoBin: bins || 0,
                        kde: kde || false,
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

    useEffect(() => {
        if (activeCsvFile && activeCsvFile.name && csvData.length > 0) {
            const getData = () => {
                const tempNumberColumn = [];

                Object.entries(csvData[0]).forEach(([key, value]) => {
                    if (typeof value === "string" || isNaN(value)) {
                    } else {
                        tempNumberColumn.push(key);
                    }
                });

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

            const data = await apiService.matflow.eda.histogram(
                withWorkspaceContext(
                    {
                        var:
                            activeNumberColumn.length > 0
                                ? activeNumberColumn
                                : ["-"], // Ensure it's a list
                        orient: orientation,
                        title: title || "",
                        file: csvData,
                        autoBin: !showAutoBin ? autoBinValue : 0,
                        kde: KDE,
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
                            Variable
                        </p>
                        <MultipleDropDown
                            columnNames={numberColumn}
                            setSelectedColumns={setActiveNumberColumn}
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

                <div className="flex items-center gap-4 pt-2">
                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={showAutoBin}
                                onChange={(e) =>
                                    setShowAutoBin(e.target.checked)
                                }
                            />
                        }
                        label={<span className="text-sm">Auto Bin</span>}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={KDE}
                                onChange={(e) => setKDE(e.target.checked)}
                            />
                        }
                        label={<span className="text-sm">KDE</span>}
                    />
                </div>

                {!showAutoBin && (
                    <div className="pt-2">
                        <Stack
                            spacing={1}
                            direction="row"
                            sx={{ mb: 1 }}
                            alignItems="center"
                        >
                            <span className="text-sm">1</span>
                            <PrettoSlider
                                aria-label="Auto Bin Slider"
                                min={1}
                                max={35}
                                step={1}
                                value={autoBinValue}
                                onChange={(e) =>
                                    setAutoBinValue(
                                        parseInt(e.target.value, 10),
                                    )
                                }
                                valueLabelDisplay="on"
                                color="primary"
                            />
                            <span className="text-sm">35</span>
                        </Stack>
                    </div>
                )}

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
                        Variable
                    </p>
                    <MultipleDropDown
                        columnNames={numberColumn}
                        setSelectedColumns={setActiveNumberColumn}
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

            {/* Checkboxes for additional options */}
            <div className="flex items-center gap-4 mt-4 tracking-wider">
                <Checkbox
                    checked={showAutoBin}
                    onChange={(e) => setShowAutoBin(e.target.checked)}
                >
                    Auto Bin
                </Checkbox>
                <Checkbox
                    checked={KDE}
                    onChange={(e) => setKDE(e.target.checked)}
                >
                    KDE
                </Checkbox>
            </div>

            {/* Slider for manual bin selection */}
            {!showAutoBin && (
                <div className="mt-12">
                    <Stack
                        spacing={1}
                        direction="row"
                        sx={{ mb: 1 }}
                        alignItems="center"
                    >
                        <span>1</span>
                        <PrettoSlider
                            aria-label="Auto Bin Slider"
                            min={1}
                            max={35}
                            step={1}
                            value={autoBinValue}
                            onChange={(e) =>
                                setAutoBinValue(parseInt(e.target.value, 10))
                            }
                            valueLabelDisplay="on"
                            color="primary"
                        />
                        <span>35</span>
                    </Stack>
                </div>
            )}

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

export default Histogram;
