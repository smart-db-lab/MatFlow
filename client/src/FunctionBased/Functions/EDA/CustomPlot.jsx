import CircularProgress from "@mui/material/CircularProgress";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector";
import { getAuthHeaders } from "../../../util/adminAuth";
import { apiService } from "../../../services/api/apiService";
import { withWorkspaceContext } from "../../../services/api/matflowApi";

function CustomPlot({
    csvData,
    splitMode = false,
    onPlotGenerated,
    onError,
    onLoading,
}) {
    // const [csvData, setCsvData] = useState();
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
    const [numberColumn, setNumberColumn] = useState([]);
    const [stringColumn, setStringColumn] = useState([]);
    const [x_var, setX_var] = useState([]);
    const [y_bar, setY_var] = useState("");
    const [activeHue, setActiveHue] = useState("");
    const [loading, setLoading] = useState(false);
    const [echartsData, setEchartsData] = useState([]);
    const [error, setError] = useState(null); // State for error handling

    useEffect(() => {
        if (activeCsvFile && activeCsvFile.name) {
            const getData = async () => {
                const tempStringColumn = [];
                const tempNumberColumn = [];

                Object.entries(csvData[0]).forEach(([key, value]) => {
                    if (typeof csvData[0][key] === "string")
                        tempStringColumn.push(key);
                    else tempNumberColumn.push(key);
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
            setEchartsData([]);
            setError(null);

            if (onLoading && splitMode) {
                onLoading(true);
            }

            const response = await apiService.matflow.eda.customPlot(
                withWorkspaceContext(
                    {
                        file: csvData,
                        x_var,
                        y_var: y_bar,
                        hue: activeHue || "None",
                    },
                    wsCtx,
                ),
            );
            let data = response.echarts;
            console.log(data);

            // Ensure it's an array
            let plotData = Array.isArray(data)
                ? data
                : typeof data === "object"
                  ? [data]
                  : [];
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
                            initValue={y_bar}
                            onValueChange={setY_var}
                        />
                    </div>
                    <div className="w-full">
                        <p className="text-sm font-medium tracking-wide mb-2">
                            Hue Variable
                        </p>
                        <SingleDropDown
                            columnNames={stringColumn}
                            onValueChange={setActiveHue}
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
                        initValue={y_bar}
                        onValueChange={setY_var}
                    />
                </div>
                <div className="w-full flex flex-col tracking-wider">
                    <p className="text-lg font-medium tracking-wide">
                        Hue Variable
                    </p>
                    <SingleDropDown
                        columnNames={stringColumn}
                        onValueChange={setActiveHue}
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

export default CustomPlot;
