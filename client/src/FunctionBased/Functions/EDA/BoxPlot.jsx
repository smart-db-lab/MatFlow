// src/FunctionBased/Components/BoxPlot/BoxPlot.jsx

import { Checkbox, Input, Loading } from "@nextui-org/react";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector"; // Import the LayoutSelector component
import { getAuthHeaders } from "../../../util/adminAuth";
import { apiService } from "../../../services/api/apiService";

function BoxPlot({ csvData, splitMode = false, onPlotGenerated, onError, onLoading }) {
  const plotRef = useRef(null); // Reference to the plot (if needed)
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);

  const [plotlyData, setPlotlyData] = useState([]); // Initialize as an array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // State for error handling

  const [stringColumn, setStringColumn] = useState([]);
  const [numberColumn, setNumberColumn] = useState([]);
  const [activeStringColumn, setActiveStringColumn] = useState([]); // Categorical variables
  const [activeNumberColumn, setActiveNumberColumn] = useState(""); // Numerical variable
  const [activeHueColumn, setActiveHueColumn] = useState("");
  const [orientation, setOrientation] = useState("Vertical");
  const [dodge, setDodge] = useState(false);

  // Listen for chatbot-generated box plot requests
  useEffect(() => {
    const handleChatbotBoxPlot = (event) => {
      const { categorical, numerical, hue, orientation, dodge: chatbotDodge, title } = event.detail;
      console.log('🤖 Chatbot triggered box plot generation with params:', event.detail);

      // Validate parameters before setting state
      if (!categorical || categorical.length === 0 || !numerical) {
        console.warn('🤖 Invalid parameters from chatbot - missing categorical or numerical data');
        setError("Please select at least one categorical variable and one numerical variable.");
        return;
      }

      setActiveStringColumn(categorical || []);
      setActiveNumberColumn(numerical || "");
      setActiveHueColumn(hue || "");
      setOrientation(orientation || "Vertical");
      setDodge(chatbotDodge || false);

      generatePlotWithParams(categorical, numerical, hue, orientation, chatbotDodge, title);
    };

    window.addEventListener('chatbotGenerateBoxPlot', handleChatbotBoxPlot);
    return () => {
      window.removeEventListener('chatbotGenerateBoxPlot', handleChatbotBoxPlot);
    };
  }, [csvData]);

  // Generate plot with direct parameters (for chatbot)
  const generatePlotWithParams = async (categorical, numerical, hue, orientation, dodge, title) => {
    try {
      setLoading(true);
      setPlotlyData([]);
      setError(null);

      const data = await apiService.matflow.eda.boxPlot({
        cat: categorical.length > 0 ? categorical : ["-"],
        num: numerical || "-",
        hue: hue || "-",
        orient: orientation || "Vertical",
        dodge: dodge || false,
        title: title || "",
        file: csvData,
      });
      console.log(data);

      // Ensure plotlyData is an array
      if (Array.isArray(data.plotly)) {
        setPlotlyData(data.plotly);
      } else if (typeof data.plotly === "object") {
        setPlotlyData([data.plotly]); // Wrap in array if single plot
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

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setPlotlyData([]);
      setError(null); // Reset error state
      
      if (onLoading && splitMode) {
        onLoading(true);
      }

      const data = await apiService.matflow.eda.boxPlot({
        cat: activeStringColumn.length > 0 ? activeStringColumn : ["-"], // Handle multiple categorical variables
        num: activeNumberColumn || "-",
        hue: activeHueColumn || "-",
        orient: orientation,
        dodge: dodge,
        title: "", // Remove local title; handled by LayoutSelector
        file: csvData,
      });
      console.log(data);

      // Ensure plotlyData is an array
      let plotData = [];
      if (Array.isArray(data.plotly)) {
        plotData = data.plotly;
      } else if (typeof data.plotly === "object") {
        plotData = [data.plotly]; // Wrap in array if single plot
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

        <div className="flex items-center gap-4">
          <Checkbox
            color="primary"
            isSelected={dodge}
            onChange={(e) => setDodge(e.valueOf())}
            size="sm"
          >
            <span className="text-sm">Dodge</span>
          </Checkbox>
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
        <div className="w-full ">
          <p className="text-lg font-medium tracking-wide">
            Categorical Variable(s)
          </p>
          <MultipleDropDown
            columnNames={stringColumn}
            setSelectedColumns={setActiveStringColumn}
          />
        </div>
        <div className="w-full ">
          <p className="text-lg font-medium tracking-wide">
            Numerical Variable
          </p>
          <SingleDropDown
            columnNames={numberColumn}
            onValueChange={setActiveNumberColumn}
          />
        </div>
        <div className="w-full ">
          <p className="text-lg font-medium tracking-wide">Hue</p>
          <SingleDropDown
            onValueChange={setActiveHueColumn}
            columnNames={stringColumn}
          />
        </div>
        <div className="w-full ">
          <p className="text-lg font-medium tracking-wide">Orientation</p>
          <SingleDropDown
            columnNames={["Vertical", "Horizontal"]}
            initValue={orientation}
            onValueChange={setOrientation}
          />
        </div>
      </div>

      {/* Checkbox for Annotate */}
      <div className="flex items-center gap-4 mt-4 tracking-wider">
        <Checkbox
          color="success"
          isSelected={dodge}
          onChange={(e) => setDodge(e.valueOf())}
        >
          Dodge
        </Checkbox>
        <Checkbox color="success" onChange={(e) => setDodge(e.valueOf())}>
          Annotate
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

      {/* Render LayoutSelector with Plotly Data */}
      {plotlyData.length > 0 && <LayoutSelector plotlyData={plotlyData} />}
    </div>
  );
}

export default BoxPlot;
