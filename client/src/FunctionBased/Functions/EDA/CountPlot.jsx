import { Checkbox, Input, Loading } from "@nextui-org/react";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector"; // Import the LayoutSelector component
import { getAuthHeaders } from "../../../util/adminAuth";
import { apiService } from "../../../services/api/apiService";

function CountPlot({ csvData }) {
  const plotRef = useRef(null); // Reference to the plot (if needed)
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);

  const [plotlyData, setPlotlyData] = useState([]); // Initialize as an array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // State for error handling

  const [stringColumn, setStringColumn] = useState([]);
  const [activeStringColumn, setActiveStringColumn] = useState([]); // Categorical variables
  const [activeHueColumn, setActiveHueColumn] = useState("");
  const [orientation, setOrientation] = useState("Vertical");
  const [annotate, setAnnotate] = useState(false);

  // Listen for chatbot-generated count plot requests
  useEffect(() => {
    const handleChatbotCountPlot = (event) => {
      const { categorical, hue, orientation, annotate: chatbotAnnotate, title } = event.detail;
      console.log('🤖 Chatbot triggered count plot generation with params:', event.detail);

      // Validate parameters before setting state
      if (!categorical || categorical.length === 0) {
        console.warn('🤖 Invalid parameters from chatbot - missing categorical data');
        setError("Please select at least one categorical variable.");
        return;
      }

      setActiveStringColumn(categorical || []);
      setActiveHueColumn(hue || "");
      setOrientation(orientation || "Vertical");
      setAnnotate(chatbotAnnotate || false);

      generatePlotWithParams(categorical, hue, orientation, chatbotAnnotate, title);
    };

    window.addEventListener('chatbotGenerateCountPlot', handleChatbotCountPlot);
    return () => {
      window.removeEventListener('chatbotGenerateCountPlot', handleChatbotCountPlot);
    };
  }, [csvData]);

  // Generate plot with direct parameters (for chatbot)
  const generatePlotWithParams = async (categorical, hue, orientation, annotate, title) => {
    try {
      setLoading(true);
      setPlotlyData([]);
      setError(null);

      const data = await apiService.matflow.eda.countPlot({
        cat: categorical.length > 0 ? categorical : ["-"],
        hue: hue || "-",
        orient: orientation || "Vertical",
        annote: annotate || false,
        title: title || "",
        file: csvData,
      });
      console.log(data);
      const plotlyData = data.plotly || [];
      setPlotlyData(Array.isArray(plotlyData) ? plotlyData : [plotlyData]);
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

        // Iterate over the first row to determine column types
        Object.entries(csvData[0]).forEach(([key, value]) => {
          if (typeof value === "string" || isNaN(value)) {
            tempStringColumn.push(key);
          }
        });

        setStringColumn(tempStringColumn);
      };

      getData();
    }
  }, [activeCsvFile, csvData]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setPlotlyData([]);
      setError(null); // Reset error state

      const data = await apiService.matflow.eda.countPlot({
        cat: activeStringColumn.length > 0 ? activeStringColumn : ["-"], // Handle multiple categorical variables
        hue: activeHueColumn || "-",
        orient: orientation,
        annotate: annotate, // Corrected parameter name
        title: "", // Remove local title; handled by LayoutSelector
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

  return (
    <div>
      {/* Dropdowns for selecting variables */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-center gap-8 mt-8">
        <div className="w-full">
          <p className="text-lg font-medium tracking-wide">
            Categorical Variable(s)
          </p>
          <MultipleDropDown
            columnNames={stringColumn}
            setSelectedColumns={setActiveStringColumn}
          />
        </div>
        <div className="w-full">
          <p className="text-lg font-medium tracking-wide">Hue</p>
          <SingleDropDown
            onValueChange={setActiveHueColumn}
            columnNames={stringColumn}
          />
        </div>
        <div className="w-full">
          <p className="text-lg font-medium tracking-wide">Orientation</p>
          <select
            value={orientation}
            className="bg-transparent p-2 focus:border-[#06603b] border-2 rounded-lg w-full"
            onChange={(e) => setOrientation(e.target.value)}
          >
            <option value="Vertical">Vertical</option>
            <option value="Horizontal">Horizontal</option>
          </select>
        </div>
      </div>

      {/* Checkbox for Annotate */}
      <div className="flex items-center gap-4 mt-4 tracking-wider">
        <Checkbox
          color="success"
          isSelected={annotate}
          onChange={(e) => setAnnotate(e.valueOf())}
        >
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

export default CountPlot;
