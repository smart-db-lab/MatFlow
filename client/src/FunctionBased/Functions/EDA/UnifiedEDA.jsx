import React, { useRef, useState } from "react";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist-min";
import EDAPlotSelector from "../../Components/EDAPlotSelector/EDAPlotSelector";
import BarPlot from "./BarPlot";
import PiePlot from "./PiePlot";
import Histogram from "./Histogram";
import BoxPlot from "./BoxPlot";
import ViolinPlot from "./ViolinPlot";
import ScatterPlot from "./ScatterPlot";
import RegPlot from "./RegPlot";
import LinePlot from "./LinePlot";
import CustomPlot from "./CustomPlot";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { matflowApi } from "../../../services/api/matflowApi";
import { getWorkspaceRootFromPath } from "../../../util/utils";
import plotGuideByType from "./plotGuideConfig.json";

function UnifiedEDA({ csvData }) {
    const { projectId } = useParams();
    const activeFolder = useSelector((state) => state.uploadedFile.activeFolder);
    const activeFile = useSelector((state) => state.uploadedFile.activeFile);
    const [selectedPlotType, setSelectedPlotType] = useState("Bar Plot");
    const [echartsData, setEchartsData] = useState([]);
    const [plotlyData, setPlotlyData] = useState([]);
    const [plotlyTitlesByIndex, setPlotlyTitlesByIndex] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const plotlyChartRefs = useRef({});

    const buildPlotlyFilename = (title, index, format) => {
        const safeBase = (title || `chart-${index + 1}`)
            .replace(/[^a-z0-9_\-]/gi, "_")
            .slice(0, 60);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        return `${safeBase || `chart-${index + 1}`}_${timestamp}.${format}`;
    };

    const persistPlotlyDownloadToProject = async (graphDiv, fileName, format) => {
        if (!projectId || !graphDiv) return;
        const workspaceRoot =
            getWorkspaceRootFromPath(activeFolder) ||
            getWorkspaceRootFromPath(activeFile?.name || "");
        if (!workspaceRoot) {
            throw new Error(
                "Workspace context missing. Select a dataset workspace before exporting charts.",
            );
        }

        const dataUrl = await Plotly.toImage(graphDiv, {
            format,
            scale: 2,
        });
        const blob = await (await fetch(dataUrl)).blob();
        const formData = new FormData();
        formData.append("project_id", projectId);
        formData.append("folder", `${workspaceRoot}/output/charts`);
        formData.append(
            "file",
            new File([blob], fileName, {
                type:
                    blob.type ||
                    (format === "svg" ? "image/svg+xml" : "image/png"),
            }),
        );
        await matflowApi.dataset.uploadFile(formData);
    };

    const handlePlotlyDownload = async (index, format, title) => {
        const graphDiv = plotlyChartRefs.current[index];
        if (!graphDiv) return;
        const fileName = buildPlotlyFilename(title, index, format);
        try {
            const filenameWithoutExt = fileName.replace(
                new RegExp(`\\.${format}$`, "i"),
                "",
            );
            await Plotly.downloadImage(graphDiv, {
                format,
                filename: filenameWithoutExt,
                scale: 2,
            });
            await persistPlotlyDownloadToProject(graphDiv, fileName, format);
            if (projectId) {
                toast.success("Chart saved successfully.");
            } else {
                toast.success("Download started.");
            }
        } catch (downloadError) {
            console.error("Failed to download plot image:", downloadError);
            toast.error("Failed to download chart.");
        }
    };

    const handlePlotGenerated = (data) => {
        if (data && typeof data === "object" && data.engine === "plotly") {
            const nextPlotlyData = Array.isArray(data.data) ? data.data : [];
            setPlotlyData(nextPlotlyData);
            setPlotlyTitlesByIndex({});
            setEchartsData([]);
            return;
        }

        if (Array.isArray(data)) {
            setEchartsData(data);
            setPlotlyData([]);
            setPlotlyTitlesByIndex({});
        } else if (typeof data === "object") {
            setEchartsData([data]);
            setPlotlyData([]);
            setPlotlyTitlesByIndex({});
        } else {
            setEchartsData([]);
            setPlotlyData([]);
            setPlotlyTitlesByIndex({});
        }
    };

    const handleError = (errorMessage) => {
        setError(errorMessage);
    };

    const handleLoading = (isLoading) => {
        setLoading(isLoading);
    };

    // Reset plot data when plot type changes
    const handlePlotTypeChange = (plotType) => {
        setSelectedPlotType(plotType);
        setEchartsData([]);
        setPlotlyData([]);
        setPlotlyTitlesByIndex({});
        setError(null);
    };
    const activeGuide = plotGuideByType[selectedPlotType] || {
        summary: "Configure plot fields and click Generate.",
        fields: [],
        steps: ["Select required fields and generate the plot."],
    };

    // Render plot component based on selected type
    const renderPlotComponent = () => {
        const commonProps = {
            csvData,
            splitMode: true,
            onPlotGenerated: handlePlotGenerated,
            onError: handleError,
            onLoading: handleLoading,
        };

        switch (selectedPlotType) {
            case "Bar Plot":
                return <BarPlot {...commonProps} />;
            case "Pie Plot":
                return <PiePlot {...commonProps} />;
            case "Histogram":
                return <Histogram {...commonProps} />;
            case "Box Plot":
                return <BoxPlot {...commonProps} />;
            case "Violin Plot":
                return <ViolinPlot {...commonProps} />;
            case "Scatter Plot":
                return <ScatterPlot {...commonProps} />;
            case "Reg Plot":
                return <RegPlot {...commonProps} />;
            case "Line Plot":
                return <LinePlot {...commonProps} />;
            case "Custom Plot":
                return <CustomPlot {...commonProps} />;
            default:
                return <BarPlot {...commonProps} />;
        }
    };

    // Other plots use side-by-side split layout
    return (
        <div className="w-full h-full flex flex-col matflow-unified-input-height">
            <EDAPlotSelector
                selectedPlotType={selectedPlotType}
                onPlotTypeChange={handlePlotTypeChange}
            />

            <div className="flex-1 flex gap-3 overflow-hidden">
                {/* Left Panel: Input Controls */}
                <div className="w-[44%] min-w-[280px] max-w-[460px] overflow-y-auto pr-3 border-r border-gray-200">
                    <div className="py-1 bg-white p-3 rounded-md">{renderPlotComponent()}</div>
                </div>

                {/* Right Panel: Output/Plot */}
                <div className="flex-1 overflow-y-auto">
                    <div className="py-1 flex flex-col">
                        {loading && (
                            <div className="grid place-content-center min-h-[320px] w-full">
                                <div className="flex flex-col items-center gap-2">
                                    <CircularProgress size={36} sx={{ color: "#0D9488" }} />
                                    <p className="text-sm text-gray-600">Generating Plot...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <Alert severity="error">{error}</Alert>
                        )}

                        {!loading && !error && plotlyData.length > 0 && (
                            <div className="w-full">
                                <div className="grid grid-cols-1 gap-6">
                                    {plotlyData.map((figure, index) => {
                                        const fallbackTitle =
                                            typeof figure?.layout?.title ===
                                            "string"
                                                ? figure.layout.title
                                                : figure?.layout?.title?.text ||
                                                  "";
                                        const currentTitle =
                                            plotlyTitlesByIndex[index] ??
                                            fallbackTitle;

                                        return (
                                            <div
                                                key={`unified-violin-plotly-${index}`}
                                                className="w-full relative group"
                                            >
                                                {selectedPlotType ===
                                                    "Violin Plot" && (
                                                    <div className="mb-2 flex items-center justify-center">
                                                        <div className="w-full max-w-md mx-auto flex items-center gap-3">
                                                            <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">
                                                                Input Title
                                                            </span>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                placeholder="Enter your desired title"
                                                                value={
                                                                    currentTitle
                                                                }
                                                                onChange={(e) =>
                                                                    setPlotlyTitlesByIndex(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [index]:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="absolute top-10 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handlePlotlyDownload(
                                                                index,
                                                                "png",
                                                                currentTitle,
                                                            )
                                                        }
                                                        title="Download PNG"
                                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white border border-gray-200 rounded shadow-sm hover:bg-[#0D9488] hover:text-white hover:border-[#0D9488] transition-colors"
                                                    >
                                                        ↓ PNG
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handlePlotlyDownload(
                                                                index,
                                                                "svg",
                                                                currentTitle,
                                                            )
                                                        }
                                                        title="Download SVG"
                                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white border border-gray-200 rounded shadow-sm hover:bg-[#0D9488] hover:text-white hover:border-[#0D9488] transition-colors"
                                                    >
                                                        ↓ SVG
                                                    </button>
                                                </div>
                                                <Plot
                                                    data={figure?.data || []}
                                                    layout={{
                                                        ...(figure?.layout ||
                                                            {}),
                                                        title:
                                                            selectedPlotType ===
                                                            "Violin Plot"
                                                                ? {
                                                                      ...(typeof figure
                                                                          ?.layout
                                                                          ?.title ===
                                                                      "object"
                                                                          ? figure
                                                                                .layout
                                                                                .title
                                                                          : {}),
                                                                      text: currentTitle,
                                                                      x: 0.5,
                                                                      xanchor:
                                                                          "center",
                                                                  }
                                                                : currentTitle,
                                                        autosize: true,
                                                    }}
                                                    config={{
                                                        responsive: true,
                                                        displaylogo: false,
                                                        displayModeBar: false,
                                                    }}
                                                    onInitialized={(_, graphDiv) => {
                                                        plotlyChartRefs.current[
                                                            index
                                                        ] = graphDiv;
                                                    }}
                                                    onUpdate={(_, graphDiv) => {
                                                        plotlyChartRefs.current[
                                                            index
                                                        ] = graphDiv;
                                                    }}
                                                    useResizeHandler
                                                    style={{
                                                        width: "100%",
                                                        minHeight: "420px",
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {!loading &&
                            !error &&
                            plotlyData.length === 0 &&
                            echartsData.length > 0 && (
                                <div className="w-full">
                                    <LayoutSelector echartsData={echartsData} />
                                </div>
                            )}

                        {!loading &&
                            !error &&
                            echartsData.length === 0 &&
                            plotlyData.length === 0 && (
                                <div className="flex items-center justify-center min-h-[280px] w-full px-4">
                                    <div className="w-full max-w-2xl rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white shadow-sm">
                                        <div className="border-b border-teal-100 px-5 py-4">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                How to configure this plot
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-600">
                                                You are configuring{" "}
                                                <span className="font-medium text-[#0D9488]">
                                                    {selectedPlotType}
                                                </span>
                                                . {activeGuide.summary} Select fields on the left, then click{" "}
                                                <span className="font-medium">
                                                    Generate
                                                </span>{" "}
                                                to render it here.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-5 py-4">
                                            {activeGuide.fields.map((field) => (
                                                <div
                                                    key={field.name}
                                                    className="rounded-lg border border-gray-100 bg-white p-4"
                                                >
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {field.name}
                                                    </p>
                                                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                                                        {field.detail}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="px-5 pb-5">
                                            <div className="rounded-lg border border-dashed border-teal-200 bg-teal-50/50 p-4">
                                                <p className="text-sm font-semibold text-gray-800">
                                                    Quick steps
                                                </p>
                                                {activeGuide.steps.map((step, idx) => (
                                                    <p
                                                        key={`${selectedPlotType}-step-${idx}`}
                                                        className="mt-1 text-sm text-gray-600"
                                                    >
                                                        {idx + 1}) {step}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UnifiedEDA;
