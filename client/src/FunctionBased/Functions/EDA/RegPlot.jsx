// src/FunctionBased/Components/RegPlot/RegPlot.jsx

import { Checkbox, Input, Loading } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector.jsx"; // Import LayoutSelector
import { toast } from "react-toastify"; // Import react-toastify for notifications
import { getAuthHeaders } from "../../../util/adminAuth";
import { apiService } from "../../../services/api/apiService";

function RegPlot({ csvData, splitMode = false, onPlotGenerated, onError, onLoading }) {
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);

  const [numberColumn, setNumberColumn] = useState([]);
  const [activeNumberColumns, setActiveNumberColumns] = useState([]);
  const [y_var, setY_var] = useState("");
  const [title, setTitle] = useState("");
  const [scatter, setScatter] = useState(true);

  const [plotlyData, setPlotlyData] = useState([]); // Initialize as an empty array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // State for error handling

  // Listen for chatbot-generated regression plot requests
  useEffect(() => {
    const handleChatbotRegPlot = (event) => {
      const { x_var, y_var, scatter, title } = event.detail;
      console.log('🤖 Chatbot triggered regression plot generation with params:', event.detail);

      // Validate parameters before setting state
      if (!x_var || !y_var) {
        console.warn('🤖 Invalid parameters from chatbot - missing x_var or y_var');
        setError("Please select both X and Y variables.");
        return;
      }

      setActiveNumberColumns(Array.isArray(x_var) ? x_var : [x_var]);
      setY_var(y_var || "");
      setScatter(scatter !== undefined ? scatter : true);
      setTitle(title || "");

      generatePlotWithParams(Array.isArray(x_var) ? x_var : [x_var], y_var, scatter, title);
    };

    window.addEventListener('chatbotGenerateRegPlot', handleChatbotRegPlot);
    return () => {
      window.removeEventListener('chatbotGenerateRegPlot', handleChatbotRegPlot);
    };
  }, [csvData]);

  // Generate plot with direct parameters (for chatbot)
  const generatePlotWithParams = async (xVar, yVar, scatter, title) => {
    try {
      setLoading(true);
      setPlotlyData([]);
      setError(null);

      const data = await apiService.matflow.eda.regPlot({
        x_var: xVar.length > 0 ? xVar : ["-"],
        y_var: yVar || "-",
        scatter: scatter !== undefined ? scatter : true,
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

  // Extract numeric columns from CSV data
  useEffect(() => {
    if (activeCsvFile && activeCsvFile.name && csvData.length > 0) {
      const tempNumberColumn = [];

      csvData.forEach((row) => {
        Object.entries(row).forEach(([key, value]) => {
          if (typeof value !== "string" && !isNaN(value)) {
            tempNumberColumn.push(key);
          }
        });
      });

      // Remove duplicates
      const uniqueNumberColumns = [...new Set(tempNumberColumn)];
      setNumberColumn(uniqueNumberColumns);
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

      const data = await apiService.matflow.eda.regPlot({
        x_var: activeNumberColumns,
        y_var,
        title: title || "",
        scatter,
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
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <div className="w-full">
            <p className="text-sm font-medium tracking-wide mb-2">X Variable</p>
            <MultipleDropDown
              columnNames={numberColumn}
              setSelectedColumns={setActiveNumberColumns}
            />
          </div>
          <div className="w-full">
            <p className="text-sm font-medium tracking-wide mb-2">Y Variable</p>
            <SingleDropDown columnNames={numberColumn} onValueChange={setY_var} />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Checkbox
            color="primary"
            isSelected={scatter}
            onChange={(e) => setScatter(e.valueOf())}
            size="sm"
          >
            <span className="text-sm">Scatter</span>
          </Checkbox>
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
      <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8 mt-8">
        <div className="w-full">
          <p className="text-lg font-medium tracking-wide">X Variable</p>
          <MultipleDropDown
            columnNames={numberColumn}
            setSelectedColumns={setActiveNumberColumns}
          />
        </div>
        <div className="w-full">
          <p className="text-lg font-medium tracking-wide">Y Variable</p>
          <SingleDropDown columnNames={numberColumn} onValueChange={setY_var} />
        </div>
        <div className="w-full">
          <Checkbox
            color="success"
            isSelected={scatter}
            onChange={(e) => setScatter(e.valueOf())}
          >
            Scatter
          </Checkbox>
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

export default RegPlot;
