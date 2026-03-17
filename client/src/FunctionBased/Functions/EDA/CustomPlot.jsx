import { Loading } from "@nextui-org/react";
import React, { useEffect, useRef, useState } from "react";
import Plot from "react-plotly.js";
import { useSelector } from "react-redux";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import Plotly from "plotly.js-dist";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector";
import { getAuthHeaders } from "../../../util/adminAuth";

function CustomPlot({ csvData, splitMode = false, onPlotGenerated, onError, onLoading }) {
  // const [csvData, setCsvData] = useState();
  const plotRef = useRef(null);
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [numberColumn, setNumberColumn] = useState([]);
  const [stringColumn, setStringColumn] = useState([]);
  const [x_var, setX_var] = useState([]);
  const [y_bar, setY_var] = useState("");
  const [activeHue, setActiveHue] = useState("");
  const [loading, setLoading] = useState(false);
  const [plotlyData, setPlotlyData] = useState([]);
  const [error, setError] = useState(null); // State for error handling

  useEffect(() => {
    if (csvData && csvData.length > 0) {
      const getData = async () => {
        const tempStringColumn = [];
        const tempNumberColumn = [];

        Object.entries(csvData[0]).forEach(([key, value]) => {
          if (typeof csvData[0][key] === "string") tempStringColumn.push(key);
          else tempNumberColumn.push(key);
        });

        setStringColumn(tempStringColumn);
        setNumberColumn(tempNumberColumn);
      };

      getData();
    }
  }, [csvData]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setPlotlyData([]);
      setError(null);
      
      if (onLoading && splitMode) {
        onLoading(true);
      }
      
      const response = await apiService.matflow.eda.customPlot({
        file: csvData,
        x_var,
        y_var: y_bar,
        hue: activeHue || "None",
      });
      let data = response.plotly;
      console.log(data);
      
      // Ensure it's an array
      let plotData = Array.isArray(data) ? data : (typeof data === "object" ? [data] : []);
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
            <p className="text-sm font-medium tracking-wide mb-2">X Variable</p>
            <MultipleDropDown
              columnNames={numberColumn}
              setSelectedColumns={setX_var}
            />
          </div>
          <div className="w-full">
            <p className="text-sm font-medium tracking-wide mb-2">Y Variable</p>
            <SingleDropDown
              columnNames={numberColumn}
              initValue={y_bar}
              onValueChange={setY_var}
            />
          </div>
          <div className="w-full">
            <p className="text-sm font-medium tracking-wide mb-2">Hue Variable</p>
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
          <p className="text-lg font-medium tracking-wide">X Variable</p>
          <MultipleDropDown
            columnNames={numberColumn}
            setSelectedColumns={setX_var}
          />
        </div>
        <div className="w-full">
          <p className="text-lg font-medium tracking-wide">Y Variable</p>
          <SingleDropDown
            columnNames={numberColumn}
            initValue={y_bar}
            onValueChange={setY_var}
          />
        </div>
        <div className="w-full flex flex-col tracking-wider">
          <p className="text-lg font-medium tracking-wide">Hue Variable</p>
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
          <Loading color={"success"} size="xl">
            Fetching Data...
          </Loading>
        </div>
      )}

      {/* Error Message */}
      {error && <div className="mt-4 text-red-500 text-center">{error}</div>}

      {/* Render LayoutSelector with Plotly Data */}
      {plotlyData.length > 0 && <LayoutSelector plotlyData={plotlyData} />}
    </div>
  );
}

export default CustomPlot;
