import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Plot from "react-plotly.js";
import AgGridAutoDataComponent from "../../../../Components/AgGridComponent/AgGridAutoDataComponent";
import { toast } from "react-toastify";
import { apiService } from "../../../../../services/api/apiService";
import TextField from "@mui/material/TextField";
import LinearProgress from "@mui/material/LinearProgress";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Button from "@mui/material/Button";
import Autocomplete from "@mui/material/Autocomplete";

function ProgressiveFeature({ csvData }) {
  const [kFoldValue, setKFoldValue] = useState(2);
  const [option, setOption] = useState("All");
  const [response, setResponse] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const d_type = useSelector((state) => state.featureSelection.data_type);
  const target_value = useSelector(
    (state) => state.featureSelection.target_variable
  );

  const ESTIMATOR =
    d_type === "number"
      ? [
          "ExtraTreesRegressor",
          "RandomForestRegressor",
          "GradientBoostingRegressor",
          "XGBRegressor",
          "CatBRegressor"
        ]
      : [
          "ExtraTreesClassifier",
          "RandomForestClassifier",
          "GradientBoostingClassifier",
          "XGBClassifier",
        ];
  const [estimator, setEstimator] = useState(ESTIMATOR[0]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [intervalId, setIntervalId] = useState();
  const [customCol, setCustomCol] = useState([]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev + 5 < 100) return prev + 5;
          return 100;
        });
      }, 1000);
      setIntervalId(interval);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleSubmit = async () => {
    setResponse(null);
    setErrorMessage(""); // Clear any previous error messages
    setLoading(true);
    setProgress(0);

    const payload = {
      dataset: csvData,
      target_var: target_value,
      problem_type: d_type === "number" ? "regression" : "classification",
      estimator_name: estimator,
      kfold: parseInt(kFoldValue, 10),
      display_opt: option,
    };

    if (option === "Custom") {
      payload.features_to_display = customCol;
    }

    try {
      const data = await apiService.matflow.featureEngineering.progressiveFeatureSelection(payload);

      if (data.error) {
        // Extract the first line of the error message
        const firstErrorLine = data.error.split("\n").slice(0, 2).join("");
        setErrorMessage(firstErrorLine); // Set the error message
        toast.error(firstErrorLine, {
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        setResponse(data); // Save the response to render the information
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setErrorMessage("An unexpected error occurred."); // Generic error message for catch block
    } finally {
      setLoading(false);
      setProgress(100);
      clearInterval(intervalId);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex gap-8">
        <div className="w-full sm:w-auto sm:min-w-[220px] sm:max-w-[320px]">
          <TextField
            label="Enter the value for k-fold"
            fullWidth
            type="number"
            size="small"
            inputProps={{ step: 1 }}
            value={kFoldValue}
            onChange={(e) => setKFoldValue(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto sm:min-w-[220px] sm:max-w-[320px]">
          <p className="text-sm font-semibold text-gray-800 mb-1.5">Select Estimator</p>
          <Autocomplete
            size="small"
            options={ESTIMATOR}
            value={estimator || null}
            onChange={(_, val) => setEstimator(val || estimator)}
            renderInput={(params) => <TextField {...params} placeholder="Select estimator" />}
          />
        </div>
      </div>
      <div className="mt-4">
        <RadioGroup row value={option} onChange={(e) => setOption(e.target.value)}>
          <FormControlLabel value="All" control={<Radio size="small" />} label="All" />
          <FormControlLabel value="Custom" control={<Radio size="small" />} label="Custom" />
        </RadioGroup>
      </div>
      {option === "Custom" && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-800 mb-1.5">Features to select</p>
          <Autocomplete
            multiple
            size="small"
            options={Object.keys(csvData[0])}
            value={customCol || []}
            onChange={(_, val) => setCustomCol(val)}
            renderInput={(params) => <TextField {...params} placeholder="Select features" />}
          />
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          disabled={loading}
          onClick={handleSubmit}
          variant="contained"
          sx={{
            mt: 2,
            backgroundColor: "#0D9488",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { backgroundColor: "#0F766E" },
          }}
        >
          {loading ? "Processing..." : "Submit"}
        </Button>
      </div>

      {loading && (
        <div className="mt-6">
          <LinearProgress
            value={progress}
            variant="determinate"
          />
        </div>
      )}

      {/* Display response if available and no error */}
      {response && !errorMessage && (
        <div className="mt-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h2 className="text-lg font-semibold mt-6 mb-4">
                Selected Feature Scores
              </h2>
              <AgGridAutoDataComponent
                rowData={response.selected_feature_scores}
                download={true}
                height="350px"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold mt-6 mb-4">
                Dropped Feature Scores
              </h2>
              <AgGridAutoDataComponent
                rowData={response.dropped_feature_scores}
                download={true}
                height="350px"
              />
            </div>
          </div>
          <h2 className="text-lg font-semibold mt-6 mb-4">
            Feature Selection Plot
          </h2>
          <div className="flex justify-center mt-4 ">
            <Plot
              data={typeof response.plot_data === 'string' ? JSON.parse(response.plot_data).data : response.plot_data.data}
              layout={typeof response.plot_data === 'string' ? JSON.parse(response.plot_data).layout : response.plot_data.layout}
              config={{ editable: true, responsive: true }}
            />
          </div>

          <h2 className="text-lg font-semibold mt-20 mb-4">Modified Dataset</h2>
          <AgGridAutoDataComponent
            rowData={csvData} // Or you can use the base64 decoded version of modified_dataset_csv if needed
            download={true}
          />
        </div>
      )}
    </div>
  );
}

export default ProgressiveFeature;
