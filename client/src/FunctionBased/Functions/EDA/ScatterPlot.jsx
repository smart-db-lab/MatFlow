// src/FunctionBased/Components/ScatterPlot/ScatterPlot.jsx

import { Checkbox, Input, Loading } from "@nextui-org/react";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector"; // Import the new component
import { getAuthHeaders } from "../../../util/adminAuth";
import { apiService } from "../../../services/api/apiService";

function ScatterPlot({ csvData, splitMode = false, onPlotGenerated, onError, onLoading }) {
  const plotRef = useRef(null);
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [plotlyData, setPlotlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // State for error handling

  const [stringColumn, setStringColumn] = useState([]);
  const [numberColumn, setNumberColumn] = useState([]);
  const [x_var, setX_var] = useState([]);
  const [y_var, setY_var] = useState("");
  const [activeHueColumn, setActiveHueColumn] = useState("");
  const [title, setTitle] = useState("");

  // Listen for chatbot-generated scatter plot requests
  useEffect(() => {
    const handleChatbotScatterPlot = (event) => {
      const { x_var: chatbotXVar, y_var: chatbotYVar, hue, title: chatbotTitle } = event.detail;
      console.log('🤖 Chatbot triggered scatter plot generation with params:', event.detail);

      // Validate parameters before setting state
      if (!chatbotXVar || !chatbotYVar) {
        console.warn('🤖 Invalid parameters from chatbot - missing x_var or y_var');
        setError("Please select both X and Y variables.");
        return;
      }

      setX_var(Array.isArray(chatbotXVar) ? chatbotXVar : [chatbotXVar]);
      setY_var(chatbotYVar || "");
      setActiveHueColumn(hue || "");
      setTitle(chatbotTitle || "");

      generatePlotWithParams(Array.isArray(chatbotXVar) ? chatbotXVar : [chatbotXVar], chatbotYVar, hue, chatbotTitle);
    };

    window.addEventListener('chatbotGenerateScatterPlot', handleChatbotScatterPlot);
    return () => {
      window.removeEventListener('chatbotGenerateScatterPlot', handleChatbotScatterPlot);
    };
  }, [csvData]);

  // Generate plot with direct parameters (for chatbot)
  const generatePlotWithParams = async (xVar, yVar, hue, title) => {
    try {
      setLoading(true);
      setPlotlyData([]);
      setError(null);

      const response = await apiService.matflow.eda.scatterPlot({
        x_var: xVar,
        y_var: yVar,
        hue: hue || "-",
        title: title || "",
        file: csvData,
      });
      let data = response.plotly || [];
      setPlotlyData(data);
    } catch (error) {
      console.error("Error fetching Plotly data:", error);
      setError(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeCsvFile && activeCsvFile.name) {
      const getData = async () => {
        const tempStringColumn = [];
        const tempNumberColumn = [];

        Object.entries(csvData[0]).forEach(([key, value]) => {
          // Improved type checking
          if (typeof value === "string" || isNaN(value))
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
      setPlotlyData([]);
      setError(null); // Reset error state
      
      if (onLoading && splitMode) {
        onLoading(true);
      }
      
      const response = await apiService.matflow.eda.scatterPlot({
        x_var: x_var.length > 0 ? x_var : ["-"],
        y_var: y_var || "-",
        hue: activeHueColumn || "-",
        title: title || "",
        file: csvData,
      });
      let data = response.plotly || [];
      
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
            <p className="text-sm font-medium tracking-wide mb-2">X Variable(s)</p>
            <MultipleDropDown
              columnNames={numberColumn}
              defaultValue={x_var}
              setSelectedColumns={setX_var}
            />
          </div>
          <div className="w-full">
            <p className="text-sm font-medium tracking-wide mb-2">Y Variable</p>
            <SingleDropDown columnNames={numberColumn} onValueChange={setY_var} />
          </div>
          <div className="w-full">
            <p className="text-sm font-medium tracking-wide mb-2">Hue</p>
            <SingleDropDown
              onValueChange={setActiveHueColumn}
              columnNames={stringColumn}
            />
          </div>
        </div>

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
          <p className="text-lg font-medium tracking-wide">X Variable(s)</p>
          <MultipleDropDown
            columnNames={numberColumn}
            defaultValue={x_var}
            setSelectedColumns={setX_var}
          />
        </div>
        <div className="w-full">
          <p className="text-lg font-medium tracking-wide">Y Variable</p>
          <SingleDropDown columnNames={numberColumn} onValueChange={setY_var} />
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

export default ScatterPlot;
