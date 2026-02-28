// src/FunctionBased/Components/ViolinPlot/ViolinPlot.jsx

import { Checkbox, Input, Loading } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector.jsx"; // Import LayoutSelector
import { toast } from "react-toastify"; // Import react-toastify for notifications
import { getAuthHeaders } from "../../../util/adminAuth";
import { apiService } from "../../../services/api/apiService";

function ViolinPlot({ csvData, splitMode = false, onPlotGenerated, onError, onLoading }) {
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);

  const [stringColumn, setStringColumn] = useState([]);
  const [numberColumn, setNumberColumn] = useState([]);
  const [activeStringColumns, setActiveStringColumns] = useState([]);
  const [activeNumberColumn, setActiveNumberColumn] = useState("");
  const [activeHueColumn, setActiveHueColumn] = useState("");
  const [orientation, setOrientation] = useState("Vertical");
  const [showTitle, setShowTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [title, setTitle] = useState("");
  const [dodge, setDodge] = useState(false);
  const [split, setSplit] = useState(false);

  const [plotlyData, setPlotlyData] = useState([]); // Initialize as an empty array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // State for error handling

  // Listen for chatbot-generated violin plot requests
  useEffect(() => {
    const handleChatbotViolinPlot = (event) => {
      const { categorical, numerical, hue, orientation, dodge, split, title } = event.detail;
      console.log('🤖 Chatbot triggered violin plot generation with params:', event.detail);

      // Validate parameters before setting state
      if (!categorical || categorical.length === 0 || !numerical) {
        console.warn('🤖 Invalid parameters from chatbot - missing categorical or numerical data');
        setError("Please select at least one categorical variable and one numerical variable.");
        return;
      }

      setActiveStringColumns(categorical || []);
      setActiveNumberColumn(numerical || "");
      setActiveHueColumn(hue || "");
      setOrientation(orientation || "Vertical");
      setDodge(dodge || false);
      setSplit(split || false);
      setTitle(title || "");

      generatePlotWithParams(categorical, numerical, hue, orientation, dodge, split, title);
    };

    window.addEventListener('chatbotGenerateViolinPlot', handleChatbotViolinPlot);
    return () => {
      window.removeEventListener('chatbotGenerateViolinPlot', handleChatbotViolinPlot);
    };
  }, [csvData]);

  // Generate plot with direct parameters (for chatbot)
  const generatePlotWithParams = async (categorical, numerical, hue, orientation, dodge, split, title) => {
    try {
      setLoading(true);
      setPlotlyData([]);
      setError(null);

      const data = await apiService.matflow.eda.violinPlot({
        cat: categorical.length > 0 ? categorical : ["-"],
        num: numerical || "-",
        hue: hue || "-",
        orient: orientation || "Vertical",
        dodge: dodge || false,
        split: split || false,
        title: title || "",
        file: csvData,
      });
      console.log("Received data from backend:", data);

      // Ensure plotlyData is an array
      if (Array.isArray(data.plotly)) {
        setPlotlyData(data.plotly);
      } else if (typeof data.plotly === "object") {
        setPlotlyData([data.plotly]);
      } else {
        setPlotlyData([]);
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
      setPlotlyData([]); // Reset plotlyData
      setError(null); // Reset error state
      
      if (onLoading && splitMode) {
        onLoading(true);
      }

      const data = await apiService.matflow.eda.violinPlot({
        cat: activeStringColumns.length > 0 ? activeStringColumns : "-", // Ensure it's a list
        num: activeNumberColumn || "-",
        hue: activeHueColumn || "-",
        orient: orientation,
        dodge: dodge,
        split: split,
        title: title || "",
        file: csvData,
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
            <p className="text-sm font-medium tracking-wide mb-2">Hue</p>
            <SingleDropDown
              onValueChange={setActiveHueColumn}
              columnNames={stringColumn}
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

        {/* Checkboxes */}
        <div className="flex items-center gap-4 pt-2">
          <Checkbox
            color="primary"
            isSelected={dodge}
            onChange={(e) => setDodge(e.valueOf())}
            size="sm"
          >
            <span className="text-sm">Dodge</span>
          </Checkbox>
          <Checkbox
            color="primary"
            isSelected={split}
            onChange={(e) => setSplit(e.valueOf())}
            size="sm"
          >
            <span className="text-sm">Split</span>
          </Checkbox>
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

      {/* Checkboxes for additional options */}
      <div className="flex items-center gap-4 mt-4 tracking-wider">
        <Checkbox
          color="success"
          isSelected={dodge}
          onChange={(e) => setDodge(e.valueOf())}
        >
          Dodge
        </Checkbox>
        <Checkbox
          color="success"
          isSelected={split}
          onChange={(e) => setSplit(e.valueOf())}
        >
          Split
        </Checkbox>
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
          <Loading color={"success"} size="xl">
            Fetching Data...
          </Loading>
        </div>
      )}

      {/* Error Message */}
      {error && <div className="mt-4 text-red-500 text-center">{error}</div>}

      {/* Render Plotly Figures using LayoutSelector */}
      {plotlyData.length > 0 && <LayoutSelector plotlyData={plotlyData} />}
    </div>
  );
}

export default ViolinPlot;
