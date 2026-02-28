import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { 
  Typography, 
  TextField,
  Button
} from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import { Progress, Modal } from "@nextui-org/react";
import { toast } from "react-toastify";
import { apiService } from "../../../../services/api/apiService";
import { isLoggedIn } from "../../../../util/adminAuth";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import AgGridAutoDataComponent from "../../../Components/AgGridComponent/AgGridAutoDataComponent";
import Plot from "react-plotly.js";
import Docs from "../../../../Docs/Docs";
import { ReadFile } from "../../../../util/utils";

// Custom Slider Component
const CustomSlider = ({ label, value, onChange, min, max, step }) => (
  <div className="mb-4">
    <Typography variant="body2" className="!text-gray-700 !font-medium mb-2">
      {label}: {value}
    </Typography>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(e, parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
    />
    <div className="flex justify-between text-xs text-gray-500 mt-1">
      <span>{min}</span>
      <span>{max}</span>
    </div>
  </div>
);

function SMILESGeneration({ csvData }) {
  const { projectId } = useParams();
  // Dataset selection state
  const [availableDatasets, setAvailableDatasets] = useState([]);
  const [trainDataset, setTrainDataset] = useState("");
  const [testDataset, setTestDataset] = useState("");
  const [trainData, setTrainData] = useState(null);
  const [testData, setTestData] = useState(null);
  
  // Configuration state
  const [smilesColumn, setSmilesColumn] = useState("");
  const [epsilonColumn, setEpsilonColumn] = useState("");
  
  // VAE Hyperparameters
  const [latentDim, setLatentDim] = useState(64);
  const [epochs, setEpochs] = useState(50);
  const [batchSize, setBatchSize] = useState(64);
  const [learningRate, setLearningRate] = useState(0.001);
  const [embeddingDim, setEmbeddingDim] = useState(128);
  const [lstmUnits, setLstmUnits] = useState(128);
  
  // Training parameters
  const [testSize, setTestSize] = useState(0.2);
  const [randomState, setRandomState] = useState(42);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [visible, setVisible] = useState(false);
  
  // For polling
  const pollIntervalRef = useRef(null);
  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  // Fetch available datasets
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const data = await apiService.matflow.dataset.getAllFiles();
        const files = getAllFiles(data);
        setAvailableDatasets(files);
      } catch (err) {
        console.error(err);
        toast.error(err.message);
      }
    };

    fetchDatasets();
  }, []);

  const getAllFiles = (structure, parentPath = "") => {
    let files = [];
    for (const key in structure) {
      if (key === "files") {
        files = files.concat(
          structure[key].map((file) =>
            parentPath ? `${parentPath}/${file}` : file
          )
        );
      } else {
        const subFiles = getAllFiles(
          structure[key],
          parentPath ? `${parentPath}/${key}` : key
        );
        files = files.concat(subFiles);
      }
    }
    return files;
  };

  // Load train dataset
  const handleTrainDatasetChange = async (val) => {
    if (!val) {
      setTrainData(null);
      setTrainDataset("");
      setSmilesColumn("");
      setEpsilonColumn("");
      return;
    }
    
    try {
      const splittedFolder = val.split("/");
      const foldername = splittedFolder
        .slice(0, splittedFolder.length - 1)
        .join("/");

      const data = await ReadFile({
        projectId,
        foldername,
        filename: splittedFolder[splittedFolder.length - 1],
      });
      setTrainData(data);
      setTrainDataset(val);
      setSmilesColumn("");
      setEpsilonColumn("");
    } catch (error) {
      console.error("Error loading train dataset:", error);
      toast.error("Error loading train dataset");
    }
  };

  // Load test dataset
  const handleTestDatasetChange = async (val) => {
    if (!val || val === "None") {
      setTestData(null);
      setTestDataset("None");
      return;
    }
    
    try {
      const splittedFolder = val.split("/");
      const foldername = splittedFolder
        .slice(0, splittedFolder.length - 1)
        .join("/");

      const data = await ReadFile({
        foldername,
        filename: splittedFolder[splittedFolder.length - 1],
      });
      setTestData(data);
      setTestDataset(val);
    } catch (error) {
      console.error("Error loading test dataset:", error);
      toast.error("Error loading test dataset");
    }
  };

  // Get available columns from train dataset
  const availableColumns = trainData ? Object.keys(trainData[0]) : [];

  // Progress simulation
  useEffect(() => {
    if (loading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev + 2 < 95) return prev + 2;
          return 95;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Start polling for task status
  const startPolling = (taskId) => {
    pollIntervalRef.current = setInterval(() => {
      checkTaskStatus(taskId);
    }, 3000);
  };
  // Check task status
  const checkTaskStatus = async (taskId) => {
    try {
      const data = await apiService.matflow.chemistry.smilesGenerationStatus(taskId);
      
      if (data.error) {
        // If we get a server error, stop polling and show error
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setLoading(false);
        setProgress(100);
        toast.error(data.error || `Server error. Task may have failed.`);
        return;
      }

      if (data.status === "SUCCESS") {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setLoading(false);
        setProgress(100);
        setResults(data.results);
        toast.success("SMILES generation completed successfully!");
      } else if (data.status === "FAILURE") {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setLoading(false);
        setProgress(100);
        toast.error(data.error || "Task failed");
      }
      // Continue polling for PENDING/STARTED states
    } catch (error) {
      console.error("Error checking task status:", error);
      // Stop polling on repeated errors to prevent infinite loops
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      setLoading(false);
      setProgress(100);
      toast.error("Failed to check task status. Please try again.");
    }
  };

  // Handle SMILES generation
  const handleGenerateSMILES = async () => {
    if (!trainData) {
      toast.error("Please select a train dataset");
      return;
    }

    if (!smilesColumn) {
      toast.error("Please select a SMILES column");
      return;
    }

    setLoading(true);
    setResults(null);
    setTaskId(null);

    const requestData = {
      train_dataset: trainData,
      test_dataset: testData || null,
      smiles_column: smilesColumn,
      epsilon_column: epsilonColumn || null,
      training_mode: "inference", // Required by backend
      vae_config: {
        latent_dim: latentDim,
        epochs: epochs,
        batch_size: batchSize,
        learning_rate: learningRate,
        embedding_dim: embeddingDim,
        lstm_units: lstmUnits
      },
      training_config: {
        test_size: testSize,
        random_state: randomState
      }
    };

    if (!isLoggedIn()) {
      toast.error('Please log in to generate SMILES.');
      setLoading(false);
      return;
    }

    try {
      const data = await apiService.matflow.chemistry.smilesGeneration(requestData, true);
      
      console.log("API Response:", data); // Debug log
      
      if (data.error) {
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error(data.error || "Failed to start SMILES generation");
        return;
      }
      
      if (data) {
        if (data.results) {
          // Sync mode response - direct results
          console.log("Sync mode - Results:", data.results); // Debug log
          setLoading(false);
          setProgress(100);
          
          // Check if results array is empty
          if (Array.isArray(data.results) && data.results.length === 0) {
            toast.warning("No SMILES generated. This may be due to invalid input data or filtering.");
            setResults([]);
          } else {
            setResults(data.results);
            toast.success("SMILES generation completed successfully!");
          }
        } else if (data.task_id) {
          // Async mode response - start polling
          console.log("Async mode - Task ID:", data.task_id); // Debug log
          setTaskId(data.task_id);
          startPolling(data.task_id);
          toast.info("SMILES generation started. This may take several minutes...");
        } else {
          // Unknown response format
          console.log("Unknown response format:", data); // Debug log
          setLoading(false);
          setProgress(100);
          toast.error("Unexpected server response format");
        }
      } else {
        console.log("API Error:", data); // Debug log
        setLoading(false);
        setProgress(100);
        toast.error(data.error || "Failed to start SMILES generation");
      }
    } catch (error) {
      setLoading(false);
      setProgress(100);
      toast.error("Error starting SMILES generation: " + error.message);
    }
  };

  // Download function for results
  const handleDownloadResults = () => {
    if (!results) {
      toast.error("No results to download");
      return;
    }

    try {
      // Convert results to CSV format
      let csvContent = "";
      
      // Handle different result formats
      let dataToExport = [];
      
      if (Array.isArray(results)) {
        // Direct array of results
        dataToExport = results;
      } else if (results.generated_smiles && Array.isArray(results.generated_smiles)) {
        // Results with generated_smiles property
        dataToExport = results.generated_smiles;
      } else {
        // Fallback to results object
        dataToExport = [results];
      }

      if (dataToExport.length === 0) {
        toast.error("No data to download");
        return;
      }

      // Get headers from first object
      const headers = Object.keys(dataToExport[0]);
      
      // Add headers to CSV
      csvContent += headers.join(',') + '\n';
      
      // Add data rows
      dataToExport.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // Handle special characters and wrap in quotes if needed
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        });
        csvContent += values.join(',') + '\n';
      });

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'smiles_generation_results.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Results downloaded successfully!");
    } catch (error) {
      console.error('Error downloading results:', error);
      toast.error("Error downloading results");
    }
  };

  return (
         <div className="my-6 w-full max-w-7xl mx-auto">
       <Typography variant="h5" className="!font-semibold !mb-4 text-gray-800" gutterBottom>
         SMILES Generation using AutoVAE
       </Typography>

      {/* Dataset Configuration */}
      <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
        <Typography variant="subtitle1" className="!font-medium !mb-3 !text-gray-800">
          Dataset Configuration
        </Typography>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Typography variant="body2" className="!text-gray-700 !font-medium mb-2">
              Select Train Dataset:
            </Typography>
            <SingleDropDown
              columnNames={availableDatasets}
              onValueChange={handleTrainDatasetChange}
              initValue={trainDataset}
            />
          </div>
          <div>
            <Typography variant="body2" className="!text-gray-700 !font-medium mb-2">
              Select Test Dataset:
            </Typography>
            <SingleDropDown
              columnNames={["None", ...availableDatasets]}
              onValueChange={handleTestDatasetChange}
              initValue={testDataset || "None"}
            />
          </div>
        </div>
      </div>

      {/* SMILES and Epsilon Columns */}
      <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
        <Typography variant="subtitle1" className="!font-medium !mb-3 !text-gray-800">
          Column Configuration
        </Typography>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Typography variant="body2" className="!text-gray-700 !font-medium mb-2">
              Select SMILES Column:
            </Typography>
            <SingleDropDown
              columnNames={availableColumns}
              onValueChange={setSmilesColumn}
              initValue={smilesColumn}
            />
          </div>
          <div>
            <Typography variant="body2" className="!text-gray-700 !font-medium mb-2">
              Select Epsilon Column (Optional):
            </Typography>
            <SingleDropDown
              columnNames={["None", ...availableColumns]}
              onValueChange={(value) => setEpsilonColumn(value === "None" ? "" : value)}
              initValue={epsilonColumn || "None"}
            />
          </div>
        </div>
      </div>

      {/* VAE Hyperparameters */}
      <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
        <Typography variant="subtitle1" className="!font-medium !mb-3 !text-gray-800">
          VAE Configuration
        </Typography>
        <div className="grid grid-cols-2 gap-4">
          <CustomSlider
            label="Latent Dimension"
            value={latentDim}
            onChange={(e, v) => setLatentDim(v)}
            min={32}
            max={256}
            step={16}
          />
          <CustomSlider
            label="Epochs"
            value={epochs}
            onChange={(e, v) => setEpochs(v)}
            min={10}
            max={200}
            step={10}
          />
          <CustomSlider
            label="Batch Size"
            value={batchSize}
            onChange={(e, v) => setBatchSize(v)}
            min={16}
            max={256}
            step={16}
          />
          <TextField
            label="Learning Rate"
            type="number"
            size="small"
            value={learningRate}
            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
            InputProps={{ inputProps: { step: 0.0001, min: 0.0001, max: 0.01 } }}
            helperText="Learning rate for training"
          />
          <CustomSlider
            label="Embedding Dimension"
            value={embeddingDim}
            onChange={(e, v) => setEmbeddingDim(v)}
            min={64}
            max={512}
            step={32}
          />
          <CustomSlider
            label="LSTM Units"
            value={lstmUnits}
            onChange={(e, v) => setLstmUnits(v)}
            min={64}
            max={512}
            step={32}
          />
        </div>
      </div>

      {/* Training Parameters */}
      <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
        <Typography variant="subtitle1" className="!font-medium !mb-3 !text-gray-800">
          Training Parameters
        </Typography>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Test Size"
            type="number"
            size="small"
            value={testSize}
            onChange={(e) => setTestSize(parseFloat(e.target.value))}
            InputProps={{ inputProps: { step: 0.05, min: 0.1, max: 0.5 } }}
            helperText="Fraction of data for testing"
          />
          <TextField
            label="Random State"
            type="number"
            size="small"
            value={randomState}
            onChange={(e) => setRandomState(parseInt(e.target.value))}
            InputProps={{ inputProps: { step: 1, min: 0, max: 1000 } }}
            helperText="Random seed for reproducibility"
          />
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="contained"
          size="medium"
          onClick={handleGenerateSMILES}
          disabled={loading || !trainData || !smilesColumn}
          className="!bg-primary-btn !text-white !font-medium !px-6 !py-2 !text-sm"
        >
          {loading ? "Generating..." : "GENERATE SMILES"}
        </Button>
      </div>

      {/* Progress Bar */}
      {loading && (
        <div className="mb-4">
          <Progress
            value={progress}
            shadow
            color="success"
            status="secondary"
            striped
          />
          <p className="text-center mt-2 text-gray-600 text-sm">
            {progress < 100 ? "Training VAE and generating SMILES..." : "Generation complete!"}
          </p>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="mt-6">
          <Typography variant="h6" className="!font-semibold !mb-4 !text-gray-800" gutterBottom>
            SMILES Generation Results
          </Typography>

          {/* Summary Statistics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-primary/5 p-3 rounded-md border border-primary/20">
              <Typography variant="body2" className="!font-medium !text-gray-700 !mb-1">
                Total Generated
              </Typography>
              <Typography variant="h6" className="!text-primary !font-bold">
                {Array.isArray(results) ? results.length : (results.generated_smiles ? results.generated_smiles.length : 0)}
              </Typography>
            </div>
            <div className="bg-green-50 p-3 rounded-md border border-green-200">
              <Typography variant="body2" className="!font-medium !text-gray-700 !mb-1">
                Valid SMILES
              </Typography>
              <Typography variant="h6" className="!text-green-600 !font-bold">
                {Array.isArray(results) ? results.filter(r => r.smiles && r.smiles.trim()).length : 0}
              </Typography>
            </div>
            <div className="bg-purple-50 p-3 rounded-md border border-purple-200">
              <Typography variant="body2" className="!font-medium !text-gray-700 !mb-1">
                Generation Rate
              </Typography>
              <Typography variant="h6" className="!text-purple-600 !font-bold">
                {Array.isArray(results) && results.length > 0 ? 
                  `${((results.filter(r => r.smiles && r.smiles.trim()).length / results.length) * 100).toFixed(1)}%` : '0%'}
              </Typography>
            </div>
          </div>

          {/* Download Button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="outlined"
              size="medium"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadResults}
              className="!border-primary-btn !text-primary-btn !font-medium"
            >
              Download Results
            </Button>
          </div>

          {/* Generated SMILES Table */}
          {results.generated_smiles && (
            <div className="mb-8">
              <Typography variant="h5" className="!font-medium !mb-4" gutterBottom>
                Generated SMILES
              </Typography>
              <AgGridAutoDataComponent
                rowData={results.generated_smiles}
                download={true}
                height="400px"
                rowHeight={40}
                headerHeight={50}
                paginationPageSize={10}
              />
            </div>
          )}

          {/* Training Metrics */}
          {results.training_metrics && (
            <div className="mb-8">
              <Typography variant="h5" className="!font-medium !mb-4" gutterBottom>
                Training Metrics
              </Typography>
              <div className="flex justify-center">
                <Plot
                  data={results.training_metrics.data}
                  layout={{
                    ...results.training_metrics.layout,
                    showlegend: true,
                    width: 800,
                    height: 400,
                    font: { size: 14 },
                    legend: {
                      font: { size: 16 },
                      bgcolor: 'rgba(255,255,255,0.9)',
                      bordercolor: 'rgba(0,0,0,0.2)',
                      borderwidth: 1
                    }
                  }}
                  config={{
                    editable: true,
                    responsive: true
                  }}
                />
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {results.analysis && (
            <div className="mb-8">
              <Typography variant="h5" className="!font-medium !mb-4" gutterBottom>
                Analysis Results
              </Typography>
              
              {results.analysis.common_smiles && (
                <div className="mb-6">
                  <Typography variant="h6" className="!font-medium !mb-2">
                    Common SMILES Analysis
                  </Typography>
                  <AgGridAutoDataComponent
                    rowData={results.analysis.common_smiles}
                    download={true}
                    height="200px"
                    rowHeight={30}
                    headerHeight={40}
                    paginationPageSize={5}
                  />
                </div>
              )}

              {results.analysis.duplicate_analysis && (
                <div className="mb-6">
                  <Typography variant="h6" className="!font-medium !mb-2">
                    Duplicate Analysis
                  </Typography>
                  <AgGridAutoDataComponent
                    rowData={results.analysis.duplicate_analysis}
                    download={true}
                    height="200px"
                    rowHeight={30}
                    headerHeight={40}
                    paginationPageSize={5}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Help Button */}
      <button
        className="fixed bottom-20 right-5 bg-primary-btn text-xl font-bold text-white rounded-full w-10 h-10 shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center"
        onClick={openModal}
      >
        ?
      </button>

      {/* Help Modal */}
      <Modal
        open={visible}
        onClose={closeModal}
        aria-labelledby="help-modal"
        aria-describedby="help-modal-description"
        width="800px"
        scroll
        closeButton
      >
        <div className="bg-white text-left rounded-lg shadow-lg px-6 overflow-auto">
          <Docs section={"smilesGeneration"} />
        </div>
      </Modal>
    </div>
  );
}

export default SMILESGeneration;
