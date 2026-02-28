// src/FunctionBased/Components/Histogram/Histogram.jsx

import styled from "@emotion/styled";
import {Slider, Stack} from "@mui/material";
import {Checkbox, Input, Loading} from "@nextui-org/react";
import React, {useEffect, useRef, useState} from "react";
import Plot from "react-plotly.js";
import {useSelector} from "react-redux";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import { getAuthHeaders } from "../../../util/adminAuth";
import Plotly from "plotly.js-dist";
import { apiService } from "../../../services/api/apiService";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector"; // Import LayoutSelector

// Styled component for the slider
const PrettoSlider = styled(Slider)({
    color: "#52af77",
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
        backgroundColor: "#52af77",
        transformOrigin: "bottom left",
        transform: "translate(50%, -100%) rotate(-45deg) scale(0)",
        "&:before": {display: "none"},
        "&.MuiSlider-valueLabelOpen": {
            transform: "translate(50%, -100%) rotate(-45deg) scale(1)",
        },
        "& > *": {
            transform: "rotate(45deg)",
        },
    },
});

function Histogram({csvData, splitMode = false, onPlotGenerated, onError, onLoading}) {
    const plotRef = useRef(null);
    const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);

    const [plotlyData, setPlotlyData] = useState([]); // Initialize as an empty array
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // State for error handling

    const [stringColumn, setStringColumn] = useState([]);
    const [numberColumn, setNumberColumn] = useState([]);
    const [activeNumberColumn, setActiveNumberColumn] = useState([]);
    const [activeHueColumn, setActiveHueColumn] = useState("");
    const [orientation, setOrientation] = useState("Vertical");
    const [showTitle, setShowTitle] = useState(false);
    const [titleValue, setTitleValue] = useState("");
    const [title, setTitle] = useState("");
    const [aggregate, setAggregate] = useState("count");
    const [KDE, setKDE] = useState(false);
    const [legend, setLegend] = useState(false);
    const [showAutoBin, setShowAutoBin] = useState(true);
    const [autoBinValue, setAutoBinValue] = useState(10);
    const [colorPalette, setColorPalette] = useState("husl"); // Optional: Allow user to select palette

    // Listen for chatbot-generated histogram requests
    useEffect(() => {
        const handleChatbotHistogram = (event) => {
            const { numerical, hue, orientation, title: chatbotTitle, bins, kde, legend } = event.detail;
            console.log('🤖 Chatbot triggered histogram generation with params:', event.detail);

            // Validate parameters before setting state
            if (!numerical) {
                console.warn('🤖 Invalid parameters from chatbot - missing numerical variable');
                setError("Please select a numerical variable.");
                return;
            }

            setActiveNumberColumn(Array.isArray(numerical) ? numerical : [numerical]);
            setActiveHueColumn(hue || "");
            setOrientation(orientation || "Vertical");
            setTitle(chatbotTitle || "");
            setAutoBinValue(bins || 10);
            setKDE(kde || false);
            setLegend(legend || false);

            generatePlotWithParams(Array.isArray(numerical) ? numerical : [numerical], hue, orientation, chatbotTitle, bins, kde, legend);
        };

        window.addEventListener('chatbotGenerateHistogramPlot', handleChatbotHistogram);
        return () => {
            window.removeEventListener('chatbotGenerateHistogramPlot', handleChatbotHistogram);
        };
    }, [csvData]);

    // Generate plot with direct parameters (for chatbot)
    const generatePlotWithParams = async (numerical, hue, orientation, title, bins, kde, legend) => {
        try {
            setLoading(true);
            setPlotlyData([]);
            setError(null);

            const data = await apiService.matflow.eda.histogram({
                var: numerical.length > 0 ? numerical : ["-"],
                hue: hue || "-",
                orient: orientation || "Vertical",
                title: title || "",
                file: csvData,
                agg: aggregate,
                autoBin: bins || 0,
                kde: kde || false,
                legend: legend || false,
                color_palette: colorPalette,
            });
            console.log("Received data from backend:", data);

            // Ensure plotlyData is an array
            if (Array.isArray(data.plotly)) {
                setPlotlyData(data.plotly);
            } else if (typeof data.plotly === "object") {
                setPlotlyData([data.plotly]); // Wrap single plot in an array
            } else {
                setPlotlyData([]); // Empty array if unexpected format
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
            setPlotlyData([]); // Reset plotlyData
            setError(null); // Reset error state
            
            if (onLoading && splitMode) {
                onLoading(true);
            }

            const data = await apiService.matflow.eda.histogram({
                var: activeNumberColumn.length > 0 ? activeNumberColumn : ["-"], // Ensure it's a list
                hue: activeHueColumn || "-",
                orient: orientation,
                title: title || "",
                file: csvData,
                agg: aggregate,
                autoBin: !showAutoBin ? autoBinValue : 0,
                kde: KDE,
                legend: legend,
                color_palette: colorPalette, // Optional: Allow user to select or hardcode
            });
            console.log("Received data from backend:", data);

            // Ensure plotlyData is an array
            let plotData = [];
            if (Array.isArray(data.plotly)) {
                plotData = data.plotly;
            } else if (typeof data.plotly === "object") {
                plotData = [data.plotly]; // Wrap single plot in an array
            }
            
            setPlotlyData(plotData);
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
                        <p className="text-sm font-medium tracking-wide mb-2">Variable</p>
                        <MultipleDropDown
                            columnNames={numberColumn}
                            setSelectedColumns={setActiveNumberColumn}
                        />
                    </div>
                    <div className="w-full">
                        <p className="text-sm font-medium tracking-wide mb-2">Hue</p>
                        <SingleDropDown
                            onValueChange={setActiveHueColumn}
                            columnNames={stringColumn}
                        />
                    </div>
                    <div className="w-full">
                        <p className="text-sm font-medium tracking-wide mb-2">Aggregate Statistics</p>
                        <SingleDropDown
                            columnNames={["Probability", "Count", "Percent", "Density"]}
                            initValue={aggregate.charAt(0).toUpperCase() + aggregate.slice(1)}
                            onValueChange={(value) => setAggregate(value.toLowerCase())}
                        />
                    </div>
                    <div className="w-full">
                        <p className="text-sm font-medium tracking-wide mb-2">Orientation</p>
                        <SingleDropDown
                            columnNames={["Vertical", "Horizontal"]}
                            initValue={orientation}
                            onValueChange={setOrientation}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <Checkbox
                        color="primary"
                        isSelected={showAutoBin}
                        onChange={(e) => setShowAutoBin(e.valueOf())}
                        size="sm"
                    >
                        <span className="text-sm">Auto Bin</span>
                    </Checkbox>
                    <Checkbox
                        color="primary"
                        isSelected={KDE}
                        onChange={(e) => setKDE(e.valueOf())}
                        size="sm"
                    >
                        <span className="text-sm">KDE</span>
                    </Checkbox>
                    <Checkbox
                        color="primary"
                        isSelected={legend}
                        onChange={(e) => setLegend(e.valueOf())}
                        size="sm"
                    >
                        <span className="text-sm">Legend</span>
                    </Checkbox>
                </div>

                {!showAutoBin && (
                    <div className="pt-2">
                        <Stack spacing={1} direction="row" sx={{mb: 1}} alignItems="center">
                            <span className="text-sm">1</span>
                            <PrettoSlider
                                aria-label="Auto Bin Slider"
                                min={1}
                                max={35}
                                step={1}
                                value={autoBinValue}
                                onChange={(e) => setAutoBinValue(parseInt(e.target.value, 10))}
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
                    <p className="text-lg font-medium tracking-wide">Variable</p>
                    <MultipleDropDown
                        columnNames={numberColumn}
                        setSelectedColumns={setActiveNumberColumn}
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
                        Aggregate Statistics
                    </label>
                    <SingleDropDown
                        columnNames={["Probability", "Count", "Percent", "Density"]}
                        initValue={aggregate.charAt(0).toUpperCase() + aggregate.slice(1)}
                        onValueChange={(value) => setAggregate(value.toLowerCase())}
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
                    color="success"
                    isSelected={showAutoBin}
                    onChange={(e) => setShowAutoBin(e.valueOf())}
                >
                    Auto Bin
                </Checkbox>
                <Checkbox
                    color="success"
                    isSelected={KDE}
                    onChange={(e) => setKDE(e.valueOf())}
                >
                    KDE
                </Checkbox>
                <Checkbox
                    color="success"
                    isSelected={legend}
                    onChange={(e) => setLegend(e.valueOf())}
                >
                    Legend
                </Checkbox>
            </div>

            {/* Slider for manual bin selection */}
            {!showAutoBin && (
                <div className="mt-12">
                    <Stack spacing={1} direction="row" sx={{mb: 1}} alignItems="center">
                        <span>1</span>
                        <PrettoSlider
                            aria-label="Auto Bin Slider"
                            min={1}
                            max={35}
                            step={1}
                            value={autoBinValue}
                            onChange={(e) => setAutoBinValue(parseInt(e.target.value, 10))}
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
                    <Loading color={"success"} size="xl">
                        Fetching Data...
                    </Loading>
                </div>
            )}

            {/* Error Message */}
            {error && <div className="mt-4 text-red-500 text-center">{error}</div>}

            {/* Render Plotly Figures using LayoutSelector */}
            {plotlyData.length > 0 && <LayoutSelector plotlyData={plotlyData}/>}
        </div>
    );
}

export default Histogram;
