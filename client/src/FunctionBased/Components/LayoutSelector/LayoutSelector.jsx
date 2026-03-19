// src/FunctionBased/Components/LayoutSelector/LayoutSelector.jsx

import React, { useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import ReactECharts from "echarts-for-react";
import { Input } from "@nextui-org/react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { matflowApi } from "../../../services/api/matflowApi";
import { getWorkspaceRootFromPath } from "../../../util/utils";

/** Resolve a {type:"function",source:"..."} descriptor to a real JS function. */
function resolveFn(val) {
    if (
        val &&
        typeof val === "object" &&
        val.type === "function" &&
        typeof val.source === "string"
    ) {
        try {
            return new Function("return (" + val.source + ")")();
        } catch (_) {
            return undefined;
        } // eslint-disable-line no-new-func
    }
    return val;
}

function normalizeEchartsOption(rawOption) {
    const option = { ...(rawOption || {}) };

    // Resolve axis label formatters (visual truncation; full string stays in data for tooltips)
    for (const key of ["xAxis", "yAxis"]) {
        const ax = option[key];
        if (ax && !Array.isArray(ax) && ax.axisLabel?.formatter) {
            option[key] = {
                ...ax,
                axisLabel: {
                    ...ax.axisLabel,
                    formatter: resolveFn(ax.axisLabel.formatter),
                },
            };
        }
    }

    // Violin plot: numeric x-axis uses __categories__ for tick labels
    const categories = Array.isArray(option.__categories__)
        ? option.__categories__
        : null;
    if (categories && option.xAxis && !Array.isArray(option.xAxis)) {
        option.xAxis = {
            ...option.xAxis,
            axisLabel: {
                ...(option.xAxis.axisLabel || {}),
                formatter: (v) => {
                    const i = Math.round(Number(v));
                    return i >= 0 && i < categories.length ? categories[i] : "";
                },
            },
        };
    }

    delete option.__categories__;
    return option;
}

function LayoutSelector({ echartsData, projectId: projectIdProp = null }) {
    const { projectId: routeProjectId } = useParams();
    const activeProjectId = projectIdProp || routeProjectId;
    const activeFolder = useSelector(
        (state) => state.uploadedFile.activeFolder,
    );
    const activeFile = useSelector((state) => state.uploadedFile.activeFile);
    const [columns, setColumns] = useState(1);
    const [titlesByIndex, setTitlesByIndex] = useState({});
    const chartRefs = useRef([]);

    // Handler for columns input change
    const handleColumnsChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value > 0) {
            setColumns(value);
        }
    };

    // Handler for per-chart title input
    const handleTitleChange = (index, value) => {
        setTitlesByIndex((prev) => ({
            ...prev,
            [index]: value,
        }));
    };

    // Force ECharts to measure the real container width after mount
    const handleChartReady = useCallback((chart) => {
        setTimeout(() => chart.resize(), 0);
    }, []);

    const handleDownload = useCallback(
        async (index, fmt) => {
            const echartsInstance =
                chartRefs.current[index]?.getEchartsInstance?.();
            if (!echartsInstance) return;

            const getExportUrl = async () => {
                if (fmt !== "svg") {
                    return echartsInstance.getDataURL({
                        type: "png",
                        pixelRatio: 2,
                        backgroundColor: "#ffffff",
                    });
                }

                try {
                    // Canvas renderer can produce invalid .svg payloads.
                    // Build a temporary SVG-rendered chart for true SVG export.
                    const echartsModule = await import("echarts");
                    const tempEl = document.createElement("div");
                    tempEl.style.position = "fixed";
                    tempEl.style.left = "-10000px";
                    tempEl.style.top = "-10000px";
                    tempEl.style.width = `${echartsInstance.getWidth()}px`;
                    tempEl.style.height = `${echartsInstance.getHeight()}px`;
                    document.body.appendChild(tempEl);

                    let tempChart;
                    try {
                        tempChart = echartsModule.init(tempEl, null, {
                            renderer: "svg",
                        });
                        tempChart.setOption(echartsInstance.getOption(), {
                            notMerge: true,
                            lazyUpdate: false,
                        });

                        return tempChart.getDataURL({
                            type: "svg",
                            pixelRatio: 2,
                            backgroundColor: "#ffffff",
                        });
                    } finally {
                        tempChart?.dispose?.();
                        tempEl.remove();
                    }
                } catch (err) {
                    console.warn(
                        "SVG renderer export failed; using default export path.",
                        err,
                    );
                    return echartsInstance.getDataURL({
                        type: "svg",
                        pixelRatio: 2,
                        backgroundColor: "#ffffff",
                    });
                }
            };
            const url = await getExportUrl();

            const chartTitle =
                titlesByIndex[index] ||
                echartsInstance.getOption()?.title?.[0]?.text ||
                `chart-${index + 1}`;
            const safeName = chartTitle
                .replace(/[^a-z0-9_\-]/gi, "_")
                .slice(0, 60);

            const extension = fmt === "svg" ? "svg" : "png";
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const fileName = `${safeName}_${timestamp}.${extension}`;

            const saveLocally = async () => {
                const supportsSavePicker =
                    typeof window !== "undefined" &&
                    typeof window.showSaveFilePicker === "function";

                // Best effort fallback: browser controls destination dialog, no completion callback.
                if (!supportsSavePicker) {
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = fileName;
                    a.click();
                    return "started";
                }

                try {
                    const blob = await (await fetch(url)).blob();
                    const picker = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [
                            {
                                description:
                                    extension === "svg"
                                        ? "SVG Image"
                                        : "PNG Image",
                                accept: {
                                    [extension === "svg"
                                        ? "image/svg+xml"
                                        : "image/png"]: [`.${extension}`],
                                },
                            },
                        ],
                    });
                    const writable = await picker.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    return "saved";
                } catch (error) {
                    if (error?.name === "AbortError") return "cancelled";
                    throw error;
                }
            };

            const localStatus = await saveLocally();
            if (localStatus === "cancelled") {
                toast.info("Download cancelled.");
                return;
            }

            if (activeProjectId) {
                try {
                    const workspaceRoot =
                        getWorkspaceRootFromPath(activeFolder) ||
                        getWorkspaceRootFromPath(activeFile?.name || "");
                    if (!workspaceRoot) {
                        throw new Error(
                            "Workspace context missing. Select a dataset workspace before exporting charts.",
                        );
                    }
                    const blob = await (await fetch(url)).blob();
                    const formData = new FormData();
                    formData.append("project_id", activeProjectId);
                    formData.append("folder", `${workspaceRoot}/output/charts`);
                    formData.append(
                        "file",
                        new File([blob], fileName, {
                            type: blob.type || `image/${extension}`,
                        }),
                    );
                    await matflowApi.dataset.uploadFile(formData);
                } catch (error) {
                    console.warn(
                        "Failed to persist chart in project output folder:",
                        error,
                    );
                    toast.warning("Failed to save chart in project.");
                }
            }

            if (localStatus === "saved") {
                toast.success("Chart saved successfully.");
            } else {
                toast.success("Download started.");
            }
        },
        [titlesByIndex, activeProjectId, activeFolder, activeFile],
    );

    return (
        <div className="mt-2">
            {/* Grid Layout for Plots */}
            <div
                className="mt-8 grid w-full gap-6 px-2"
                style={{
                    gridTemplateColumns: `repeat(auto-fit, minmax(${columns === 1 ? "100%" : columns === 2 ? "calc(50% - 12px)" : "calc(33.333% - 12px)"}, 1fr))`,
                }}
            >
                {echartsData.map((figure, index) => (
                    <div key={index} className="w-full min-h-0">
                        {(() => {
                            const option = normalizeEchartsOption(figure || {});
                            const series = Array.isArray(option.series)
                                ? option.series
                                : [];
                            const isSinglePieFigure =
                                series.length === 1 &&
                                series[0]?.type === "pie";
                            const isHeatmap =
                                series.length > 0 &&
                                series[0]?.type === "heatmap";
                            const optionWithTitle = {
                                ...option,
                                title: {
                                    ...(option.title || {}),
                                    text:
                                        titlesByIndex[index] ||
                                        option?.title?.text ||
                                        "",
                                },
                            };

                            // Responsive height based on chart type
                            let chartHeight = "clamp(420px, 55vh, 650px)";
                            if (isSinglePieFigure) {
                                chartHeight = "clamp(450px, 55vh, 650px)";
                            } else if (isHeatmap) {
                                // Heatmaps need more space
                                chartHeight = "clamp(500px, 70vh, 800px)";
                            }

                            return (
                                <div className="relative group h-full flex flex-col">
                                    <div className="mb-2 flex items-center justify-center">
                                        <div className="w-full max-w-md mx-auto flex items-center gap-3">
                                            <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">
                                                Input Title
                                            </span>
                                            <Input
                                                clearable
                                                bordered
                                                color="success"
                                                size="sm"
                                                placeholder="Enter your desired title"
                                                value={titlesByIndex[index] || ""}
                                                onChange={(e) =>
                                                    handleTitleChange(
                                                        index,
                                                        e.target.value,
                                                    )
                                                }
                                                css={{
                                                    minWidth: "220px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {/* Download buttons — appear on hover */}
                                    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button
                                            onClick={() =>
                                                handleDownload(index, "png")
                                            }
                                            title="Download PNG"
                                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white border border-gray-200 rounded shadow-sm hover:bg-[#0D9488] hover:text-white hover:border-[#0D9488] transition-colors"
                                        >
                                            ↓ PNG
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDownload(index, "svg")
                                            }
                                            title="Download SVG"
                                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white border border-gray-200 rounded shadow-sm hover:bg-[#0D9488] hover:text-white hover:border-[#0D9488] transition-colors"
                                        >
                                            ↓ SVG
                                        </button>
                                    </div>
                                    <ReactECharts
                                        ref={(el) =>
                                            (chartRefs.current[index] = el)
                                        }
                                        option={optionWithTitle}
                                        notMerge={true}
                                        lazyUpdate={false}
                                        opts={{
                                            renderer: "canvas",
                                            useDirtyRect: true,
                                        }}
                                        onChartReady={handleChartReady}
                                        style={{
                                            width: "100%",
                                            height: chartHeight,
                                            background: "#ffffff",
                                            borderRadius: "8px",
                                            border: "1px solid #e5e7eb",
                                        }}
                                    />
                                </div>
                            );
                        })()}
                    </div>
                ))}
            </div>
        </div>
    );
}

LayoutSelector.propTypes = {
    echartsData: PropTypes.arrayOf(PropTypes.object).isRequired,
    projectId: PropTypes.string,
};

export default LayoutSelector;
