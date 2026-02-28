import React, { useEffect, useState, useRef } from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Chip,
} from '@mui/material';
import MultipleDropDown from '../../Components/MultipleDropDown/MultipleDropDown';
import CustomSlider from '../../Components/CustomSlider/CustomSlider';
import SingleDropDown from '../../Components/SingleDropDown/SingleDropDown';
import AgGridAutoDataComponent from '../../Components/AgGridComponent/AgGridAutoDataComponent';
import { Modal, Progress } from '@nextui-org/react';
import { toast } from 'react-toastify';
import Docs from '../../../Docs/Docs';
import { parseCsv, parseExcel } from '../../../util/indexDB';
import { apiService } from '../../../services/api/apiService';

function PSO({ csvData }) {
  const [features, setFeatures] = useState([]);
  const [targetType, setTargetType] = useState('single'); // 'single' or 'multiple'
  const [target, setTarget] = useState('');
  const [targetFile, setTargetFile] = useState(null);
  const [testSize, setTestSize] = useState(0.2);
  const [targetValue, setTargetValue] = useState(null);

  // PSO Configuration state variables
  const [swarmSize, setSwarmSize] = useState(50);
  const [maxIterations, setMaxIterations] = useState(100);
  const [omega, setOmega] = useState(0.5);
  const [phiP, setPhiP] = useState(0.5);
  const [phiG, setPhiG] = useState(0.5);
  const [numSolutions, setNumSolutions] = useState(10);
  const [numProcessors, setNumProcessors] = useState(4);
  const [maxRounds, setMaxRounds] = useState(5);
  const [progress, setProgress] = useState(0);

  const [visible, setVisible] = useState(false);
  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  const [selectedGraphFormat, setSelectedGraphFormat] = useState('png');

  // State for selected features to tune bounds
  const [selectedFeaturesForBounds, setSelectedFeaturesForBounds] = useState(
    []
  );
  const [hyperparameterBounds, setHyperparameterBounds] = useState({});

  // State variables for handling API call and response
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);

  // For polling
  const [taskId, setTaskId] = useState(null);
  const pollIntervalRef = useRef(null);

  // Download options state
  const [downloadOptionsOpen, setDownloadOptionsOpen] = useState(false);
  const [downloadType, setDownloadType] = useState('all'); // 'all', 'top', 'custom'
  const [downloadRowCount, setDownloadRowCount] = useState(10);
  const [downloadStartRow, setDownloadStartRow] = useState(1);
  const [downloadEndRow, setDownloadEndRow] = useState(10);
  const [currentTableData, setCurrentTableData] = useState(null);
  const [currentTableTitle, setCurrentTableTitle] = useState('');

  const handleFeatureChange = (selectedFeatures) => {
    setFeatures(selectedFeatures);
  };

  const handleBoundChange = (feature, boundType, value) => {
    setHyperparameterBounds((prev) => ({
      ...prev,
      [feature]: {
        ...prev[feature],
        [boundType]: parseFloat(value),
      },
    }));
  };

  const handleSelectedFeaturesForBoundsChange = (selectedFeatures) => {
    const newBounds = {};
    selectedFeatures.forEach((feature) => {
      newBounds[feature] = hyperparameterBounds[feature] || {
        lower: 0,
        upper: 1,
      };
    });
    setSelectedFeaturesForBounds(selectedFeatures);
  };

  const renderHyperparameterBounds = () => {
    return selectedFeaturesForBounds.map((feature) => (
      <div key={feature} className="mt-6 w-full grid grid-cols-2 gap-8">
        <TextField
          label={`Lower bound for ${feature}`}
          type="number"
          size="small"
          value={hyperparameterBounds[feature]?.lower ?? 0}
          onChange={(e) => handleBoundChange(feature, 'lower', e.target.value)}
          InputProps={{ inputProps: { step: 0.01 } }}
        />
        <TextField
          label={`Upper bound for ${feature}`}
          type="number"
          size="small"
          value={hyperparameterBounds[feature]?.upper ?? 1}
          onChange={(e) => handleBoundChange(feature, 'upper', e.target.value)}
          InputProps={{ inputProps: { step: 0.01 } }}
        />
      </div>
    ));
  };

  // Calculate default min/max bounds for each feature
  const calculateFeatureBounds = (csvData) => {
    if (
      !csvData ||
      !Array.isArray(csvData) ||
      csvData.length === 0 ||
      !csvData[0]
    ) {
      return {};
    }

    const bounds = {};
    const featureKeys = Object.keys(csvData[0]);

    featureKeys.forEach((key) => {
      const values = csvData
        .map((row) => parseFloat(row[key]))
        .filter((v) => !isNaN(v));
      bounds[key] = {
        lower: Math.min(...values),
        upper: Math.max(...values),
      };
    });

    return bounds;
  };

  useEffect(() => {
    // Calculate default bounds when csvData is loaded
    const defaultBounds = calculateFeatureBounds(csvData);
    setHyperparameterBounds(defaultBounds);
  }, [csvData]);

  // Increment progress artificially while loading
  useEffect(() => {
    if (loading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev + 3 < 96) return prev + 3;
          return 96;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Handle file upload for multiple targets
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.split('.').pop();

      if (fileExtension === 'csv') {
        parseCsv(file)
          .then((data) => {
            if (data.length === 0) {
              toast.error('The CSV file is empty.');
              return;
            }
            const firstColumnName = Object.keys(data[0])[0];
            const firstColumnData = data.map((row) => row[firstColumnName]);
            setTargetValue(firstColumnData);
            setTargetFile(file);
          })
          .catch((error) => {
            console.error('Error parsing CSV:', error);
            toast.error('Error parsing CSV file.');
          });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        parseExcel(file)
          .then((data) => {
            if (data.length === 0) {
              toast.error('The Excel file is empty.');
              return;
            }
            const firstColumnName = Object.keys(data[0])[0];
            const firstColumnData = data.map((row) => row[firstColumnName]);
            setTargetValue(firstColumnData);
            setTargetFile(file);
          })
          .catch((error) => {
            console.error('Error parsing Excel:', error);
            toast.error('Error parsing Excel file.');
          });
      } else {
        toast.error('Unsupported file format. Please upload CSV or Excel.');
      }
    }
  };

  // Function to poll the Celery task status
  const pollTaskStatus = async (task_id) => {
    try {
      const data = await apiService.matflow.pso.getStatus(task_id);

      if (data.status === 'SUCCESS') {
        // Done. Clear polling, set final results, stop loading/progress
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setLoading(false);
        setProgress(100);
        setTaskId(null); // Clear task ID to prevent restart

        // Now 'data.results' is your final results dictionary from Celery
        console.log('Final Data:', data);

        // Reset download options when new results are loaded
        resetDownloadOptions();

        if (data.results && data.results.length > 0) {
          // Transform the comparison_table for each result
          data.results.forEach((result) => {
            const comparisonTable = result.comparison_table;

            // Ensure comparison_table is always an array
            if (comparisonTable) {
              if (Array.isArray(comparisonTable)) {
                // If it's already an array, use it directly
                result.comparison_table = comparisonTable;
              } else {
                // If it's an object with model names as keys (CatBoost, Decision Tree, etc.)
                const transformedTable = [];

                Object.keys(comparisonTable).forEach((modelName) => {
                  const modelData = comparisonTable[modelName];

                  if (Array.isArray(modelData)) {
                    // Each model has an array of solutions
                    modelData.forEach((solution, index) => {
                      const flatRow = {
                        Model: modelName,
                        SolutionIndex: index,
                        Prediction: solution.prediction,
                        Error: solution.error,
                        Runtime: solution.runtime,
                        Fopt: solution.fopt,
                        // Add solution features as separate columns
                        ...(solution.solution || {}),
                      };
                      transformedTable.push(flatRow);
                    });
                  }
                });

                result.comparison_table = transformedTable;
              }
            } else {
              // If comparison_table is null/undefined, set as empty array
              result.comparison_table = [];
            }
          });

          setResponseData(data);
        } else {
          // If there's an error or no results
          setResponseData(data);
        }
      } else if (data.status === 'FAILURE') {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setLoading(false);
        setProgress(100);
        setTaskId(null); // Clear task ID
        toast.error(data.error || 'Task failed');
      } else {
        // STILL PENDING or IN PROGRESS. Just keep polling.
        console.log(`Task status: ${data.status}`);
      }
    } catch (error) {
      console.error('Polling error:', error);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setLoading(false);
      setProgress(100);
      setTaskId(null); // Clear task ID
      toast.error(error.message);
    }
  };

  // Function to handle "Run Optimization"
  const handleRunOptimization = () => {
    // Prevent multiple runs
    if (loading || pollIntervalRef.current) {
      toast.warning('Optimization is already running');
      return;
    }

    setLoading(true);
    setResponseData(null);
    setTaskId(null);

    const requestData = {
      data: csvData,
      features: features,
      target: target,
      target_value: targetType === 'single' ? [targetValue] : targetValue,
      pso_config: {
        lb: [],
        ub: [],
        swarmsize: swarmSize,
        omega: omega,
        phip: phiP,
        phig: phiG,
        maxiter: maxIterations,
        n_solutions: numSolutions,
        nprocessors: numProcessors,
        max_rounds: maxRounds,
        debug_flag: false,
      },
    };

    // Fill in bounds for each feature
    features.forEach((feature) => {
      const bounds = hyperparameterBounds[feature];
      if (selectedFeaturesForBounds.includes(feature) && bounds) {
        // user-specified
        requestData.pso_config.lb.push(bounds.lower);
        requestData.pso_config.ub.push(bounds.upper);
      } else if (bounds) {
        // default
        requestData.pso_config.lb.push(bounds.lower);
        requestData.pso_config.ub.push(bounds.upper);
      }
    });

    // Send the POST request to the Celery endpoint that enqueues the task
    apiService.matflow.pso.optimize(requestData)
      .then((data) => {
        // data should contain { task_id: "..." }
        if (!data.task_id) {
          throw new Error('No task_id returned from Celery endpoint!');
        }

        console.log('Task ID:', data.task_id);
        setTaskId(data.task_id);

        // Start polling every 3 seconds
        pollIntervalRef.current = setInterval(
          () => pollTaskStatus(data.task_id),
          3000
        );
      })
      .catch((error) => {
        console.error('Error:', error);
        toast.error(error.message);
        setLoading(false);
        setProgress(100);
      });
  };

  // Clean up the interval when unmounting
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Clean up PSO-related localStorage on unmount
  useEffect(() => {
    return () => {
      // Clear PSO-specific cached data on component unmount
      localStorage.removeItem('pso_features');
      localStorage.removeItem('pso_target');
      localStorage.removeItem('pso_bounds');
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      // Reset download options
      resetDownloadOptions();
    };
  }, []);

  // For demonstration, a potential image download button (if needed)
  const handleDownloadImage = (encodedStr, format) => {
    if (!encodedStr) return;
    const link = document.createElement('a');
    const mimeType =
      format === 'png'
        ? 'image/png'
        : format === 'jpg'
        ? 'image/jpeg'
        : 'image/svg+xml';
    link.href = `data:${mimeType};base64,${encodedStr}`;
    link.download = `plot.${format}`;
    link.click();
  };

  // Function to download all graphs as ZIP
  const handleDownloadAllAsZip = async (graphs, sectionName) => {
    try {
      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Add each graph to the ZIP
      Object.keys(graphs).forEach((graphKey) => {
        const fileName = `${graphKey}.png`;
        const imageData = graphs[graphKey];
        zip.file(fileName, imageData, { base64: true });
      });
      
      // Generate and download the ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${sectionName}_graphs.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      toast.error('Error downloading ZIP file');
    }
  };

  // Download options functions
  const openDownloadOptions = (tableData, tableTitle) => {
    setCurrentTableData(tableData);
    setCurrentTableTitle(tableTitle);
    setDownloadOptionsOpen(true);
  };

  const handleDownloadWithOptions = () => {
    if (!currentTableData || currentTableData.length === 0) {
      toast.error('No data available for download');
      return;
    }

    let dataToDownload = [...currentTableData];

    switch (downloadType) {
      case 'top':
        dataToDownload = currentTableData.slice(0, downloadRowCount);
        break;
      case 'custom':
        const start = Math.max(0, downloadStartRow - 1);
        const end = Math.min(currentTableData.length, downloadEndRow);
        dataToDownload = currentTableData.slice(start, end);
        break;
      case 'all':
      default:
        // Use all data
        break;
    }

    // Convert to CSV and download
    const csvContent = convertToCSV(dataToDownload);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentTableTitle}_${downloadType}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadOptionsOpen(false);
    toast.success(`Downloaded ${dataToDownload.length} rows from ${currentTableTitle}`);
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const resetDownloadOptions = () => {
    setDownloadType('all');
    setDownloadRowCount(10);
    setDownloadStartRow(1);
    setDownloadEndRow(10);
  };

  // Reset component state when csvData becomes undefined/null
  useEffect(() => {
    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      setFeatures([]);
      setTarget('');
      setTargetValue(null);
      setSelectedFeaturesForBounds([]);
      setHyperparameterBounds({});
      setResponseData(null);
      setTaskId(null); // Clear task ID
      // Clear any ongoing PSO operations
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setLoading(false);
      setProgress(0);
    }
  }, [csvData]);

  // Remove target from features when target changes
  useEffect(() => {
    if (target && features.includes(target)) {
      setFeatures(prevFeatures => prevFeatures.filter(feature => feature !== target));
    }
  }, [target, features]);

  // Clear target if it's selected as a feature
  useEffect(() => {
    if (features.includes(target)) {
      setTarget('');
    }
  }, [features, target]);

  // Get available features (excluding the selected target)
  const availableFeatures = csvData && csvData[0] 
    ? Object.keys(csvData[0]).filter(col => col !== target)
    : [];

  // Get available targets (excluding selected features)
  const availableTargets = csvData && csvData[0]
    ? Object.keys(csvData[0]).filter(col => !features.includes(col))
    : [];

  return (
    <div className="my-8 w-full">
      <div className="grid grid-cols-2 gap-4 items-center">
        <div>
          <p>Select Features:</p>
          <MultipleDropDown
            columnNames={availableFeatures}
            setSelectedColumns={handleFeatureChange}
            defaultValue={features}
          />
        </div>
        <div>
          <p>Select Target:</p>
          <SingleDropDown
            columnNames={availableTargets}
            onValueChange={(e) => setTarget(e)}
            initValue={target}
          />
        </div>
      </div>

      {features.length > 0 && (
        <div>
          <div className="grid grid-cols-3 items-center gap-8 mt-4">
            <CustomSlider
              label="Test Set Size"
              value={testSize}
              onChange={(e, v) => setTestSize(v)}
              min={0.1}
              max={0.5}
              step={0.01}
            />

            <div className="flex border p-4 rounded w-full col-span-2 items-center gap-8 mt-6">
              <div className="min-w-fit">
                <FormControl component="fieldset">
                  <FormLabel component="legend">Target Value</FormLabel>
                  <RadioGroup
                    row
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                  >
                    <FormControlLabel
                      value="single"
                      control={<Radio />}
                      label="Single"
                    />
                    <FormControlLabel
                      value="multiple"
                      control={<Radio />}
                      label="Multiple"
                    />
                  </RadioGroup>
                </FormControl>
              </div>

              {targetType === 'single' && (
                <div className="space-y-2 flex-grow w-full">
                  <p>Target Value</p>
                  <TextField
                    type="number"
                    size="small"
                    fullWidth
                    value={targetValue || ''}
                    onChange={(e) => setTargetValue(parseFloat(e.target.value))}
                  />
                </div>
              )}
              {targetType === 'multiple' && (
                <div className="w-full">
                  <p>Upload Target CSV/Excel File:</p>
                  <label
                    htmlFor="file-upload"
                    className="mt-2 flex flex-col items-center justify-center w-full h-24 py-3 border-2 border-dashed rounded-lg cursor-pointer bg-gray-100 hover:bg-gray-200"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        aria-hidden="true"
                        className="w-10 h-10 mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16V12M7 12l5-5m0 0l5 5M12 7v9m9 4H3"
                        />
                      </svg>
                      {targetFile ? (
                        <p className="mb-2 text-gray-500">{targetFile.name}</p>
                      ) : (
                        <>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">
                              Click to upload
                            </span>{' '}
                            or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">
                            CSV, XLSX (Max 10MB)
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".csv, .xlsx, .xls"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* PSO Configuration */}
          <Typography variant="h5" className="!mt-4 !font-medium" gutterBottom>
            PSO Configuration
          </Typography>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8">
            <CustomSlider
              label="Swarm size"
              value={swarmSize}
              onChange={(e, v) => setSwarmSize(v)}
              min={10}
              max={100}
              step={1}
            />
            <CustomSlider
              label="Max iterations"
              value={maxIterations}
              onChange={(e, v) => setMaxIterations(v)}
              min={10}
              max={1000}
              step={10}
            />
            <CustomSlider
              label="Omega"
              value={omega}
              onChange={(e, v) => setOmega(v)}
              min={0.0}
              max={1.0}
              step={0.01}
            />
            <CustomSlider
              label="Phi P"
              value={phiP}
              onChange={(e, v) => setPhiP(v)}
              min={0.0}
              max={2.0}
              step={0.01}
            />
            <CustomSlider
              label="Phi G"
              value={phiG}
              onChange={(e, v) => setPhiG(v)}
              min={0.0}
              max={2.0}
              step={0.01}
            />
            <CustomSlider
              label="Number of solutions"
              value={numSolutions}
              onChange={(e, v) => setNumSolutions(v)}
              min={1}
              max={50}
              step={1}
            />
            <CustomSlider
              label="Number of processors"
              value={numProcessors}
              onChange={(e, v) => setNumProcessors(v)}
              min={1}
              max={10}
              step={1}
            />
            <CustomSlider
              label="Max rounds"
              value={maxRounds}
              onChange={(e, v) => setMaxRounds(v)}
              min={1}
              max={20}
              step={1}
            />
          </div>

          <Typography variant="h5" className="!mt-6 !font-medium" gutterBottom>
            Hyperparameter Bounds
          </Typography>
          <div>
            <p>Select features to tune bounds:</p>
            <MultipleDropDown
              columnNames={features}
              setSelectedColumns={handleSelectedFeaturesForBoundsChange}
              defaultValue={selectedFeaturesForBounds}
            />
          </div>
          {renderHyperparameterBounds()}

          <div className="flex justify-end gap-4">
            {loading && (
              <button
                className="mt-12 border-2 px-6 tracking-wider bg-red-500 text-white font-medium rounded-md py-2"
                onClick={() => {
                  if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                  }
                  setLoading(false);
                  setProgress(0);
                  setTaskId(null);
                  toast.info('Optimization stopped');
                }}
              >
                Stop Optimization
              </button>
            )}
            <button
              className="mt-12 border-2 px-6 tracking-wider bg-primary-btn text-white font-medium rounded-md py-2"
              onClick={handleRunOptimization}
              disabled={loading || (targetType === 'multiple' && !targetFile)}
            >
              Run Optimization
            </button>
          </div>

          {/* Progress bar */}
          {loading && (
            <div className="mt-6">
              <Progress
                value={progress}
                shadow
                color="success"
                status="secondary"
                striped
              />
            </div>
          )}

          {/* Show final results once SUCCESS */}
          {responseData &&
            responseData.results &&
            responseData.results.length > 0 && (
              <div className="mt-12">
                <Typography variant="h5" className="!font-semibold text-center text-gray-800 mb-6" gutterBottom>
                  Optimization Result
                </Typography>

                {responseData.results.map((resultItem, index) => {
                  const bestSolutionRow = {
                    ...resultItem.best_solution.features,
                    Prediction: resultItem.best_solution.prediction,
                    'Target Value': resultItem.best_solution.target_value,
                    'Error (%)': resultItem.best_solution.error,
                    'Solution Runtime': resultItem.best_solution.runtime,
                  };

                  // If comparison_table was transformed above
                  // it might look like an array of row objects
                  const comparisonTableRows = resultItem.comparison_table || [];

                  return (
                    <div key={index} className="mb-16 border-b pb-8">
                                                                    <Typography
                        variant="h6"
                        className="!font-semibold text-center text-gray-700 mb-4"
                        gutterBottom
                      >
                        Best Results for Target Value: {resultItem.target_value}
                      </Typography>

                      <div className="mb-6 text-center">
                        <Typography variant="body1" className="mb-2">
                          <strong>Model:</strong> {resultItem.best_model}
                        </Typography>
                        <Typography variant="body1" className="mb-2">
                          <strong>Runtime:</strong>{' '}
                          {resultItem.best_runtime}
                        </Typography>
                        <Typography variant="body1" className="mb-2">
                          <strong>% Error:</strong> {resultItem.best_fopt}
                        </Typography>
                      </div>

                      <div className="mb-24">
                                              <Typography
                        variant="subtitle1"
                        className="!font-semibold text-center text-gray-600 mb-3"
                        gutterBottom
                      >
                        Solution for Target Value{' '}
                        {resultItem.target_value}
                      </Typography>
                        <AgGridAutoDataComponent
                          rowData={[bestSolutionRow]}
                          rowHeight={50}
                          paginationPageSize={10}
                          headerHeight={50}
                          download={true}
                          height="200px"
                        />
                      </div>

                      <div className="mb-24">
                        <div className="flex justify-between items-center mb-3">
                          <Typography
                            variant="subtitle1"
                            className="!font-semibold text-center text-gray-600"
                            gutterBottom
                          >
                            Comparison Table
                          </Typography>
                          <button
                            onClick={() => openDownloadOptions(comparisonTableRows, 'Comparison_Table')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-btn bg-white border border-primary-btn rounded-md hover:bg-primary-btn hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-btn"
                          >
                            <span>📥</span>
                            Download Options
                          </button>
                        </div>
                        <AgGridAutoDataComponent
                          rowData={comparisonTableRows}
                          rowHeight={50}
                          paginationPageSize={10}
                          headerHeight={50}
                          download={false}
                          height="600px"
                        />
                      </div>

                      {/* Only show Associated Graphs section if graphs exist */}
                      {resultItem.graphs &&
                        Object.keys(resultItem.graphs).length > 0 && (
                          <div>
                                                                                        <Typography
                                variant="h6"
                                className="!font-semibold text-center text-gray-700 mb-4"
                                gutterBottom
                              >
                                Associated Graphs
                              </Typography>
                              <div className="grid grid-cols-2 gap-8">
                              {Object.keys(resultItem.graphs).map(
                                (graphKey) => (
                                                                      <div key={graphKey} className="mt-4">
                                      <Typography variant="h6" className="text-center font-semibold text-gray-600 mb-3" gutterBottom>
                                        {graphKey.replace(/_/g, ' ').split(' ').map(word => 
                                          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                        ).join(' ')}
                                      </Typography>
                                      <img
                                        src={`data:image/png;base64,${resultItem.graphs[graphKey]}`}
                                        alt={graphKey}
                                        className="w-full max-w-4xl h-auto border rounded-md shadow-sm"
                                      />
                                      <div className="flex justify-center gap-3 mt-3">
                                        <button
                                          onClick={() =>
                                            handleDownloadImage(
                                              resultItem.graphs[graphKey],
                                              'png'
                                            )
                                          }
                                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-btn bg-white border border-primary-btn rounded-md hover:bg-primary-btn hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-btn"
                                        >
                                          <span>📥</span>
                                          Download
                                        </button>
                                        <button
                                          onClick={() => {
                                            const modal = document.createElement('div');
                                            modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                                            modal.onclick = () => modal.remove();
                                            const img = document.createElement('img');
                                            img.src = `data:image/png;base64,${resultItem.graphs[graphKey]}`;
                                            img.className = 'max-w-4xl max-h-4xl object-contain';
                                            modal.appendChild(img);
                                            document.body.appendChild(modal);
                                          }}
                                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-btn"
                                        >
                                          <span>🔍</span>
                                          View Full Size
                                        </button>
                                      </div>
                                    </div>
                                )
                              )}
                            </div>
                            <div className="flex justify-center gap-4 mt-6">
                              <button
                                onClick={() => handleDownloadAllAsZip(resultItem.graphs, 'associated')}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-btn border border-transparent rounded-md hover:bg-opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-btn mb-2"
                              >
                                <span>📦</span>
                                Download All as ZIP
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })}

                {responseData.combined_graphs && (
                                      <div className="mt-16">
                                            <Typography
                        variant="h5"
                        className="!font-semibold text-center text-gray-800 mb-6"
                        gutterBottom
                      >
                        Visualization
                      </Typography>

                      <div className="grid grid-cols-2 gap-8">
                      {Object.entries(responseData.combined_graphs).map(
                        ([key, b64]) => (
                                                      <div key={key}>
                              <Typography variant="h6" className="text-center font-semibold text-gray-600 mb-3" gutterBottom>
                                {key.replace(/_/g, ' ').split(' ').map(word => 
                                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                ).join(' ')}
                              </Typography>
                              <img
                                src={`data:image/png;base64,${b64}`}
                                alt={key}
                                className="w-full max-w-4xl h-auto border rounded-md shadow-sm"
                              />
                              <div className="flex justify-center gap-3 mt-3">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<span>📥</span>}
                                  onClick={() => handleDownloadImage(b64, 'png')}
                                >
                                  Download
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<span>🔍</span>}
                                  onClick={() => {
                                    const modal = document.createElement('div');
                                    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                                    modal.onclick = () => modal.remove();
                                    const img = document.createElement('img');
                                    img.src = `data:image/png;base64,${b64}`;
                                    img.className = 'max-w-4xl max-h-4xl object-contain';
                                    modal.appendChild(img);
                                    document.body.appendChild(modal);
                                  }}
                                >
                                  View Full Size
                                </Button>
                              </div>
                            </div>
                        )
                      )}
                    </div>
                    <div className="flex justify-center gap-4 mt-6">
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<span>📦</span>}
                        onClick={() => handleDownloadAllAsZip(responseData.combined_graphs, 'visualization')}
                        sx={{ mb: 2 }}
                      >
                        Download All as ZIP
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

                      {responseData &&
            responseData.best_solutions &&
            responseData.best_solutions.length > 0 && (
              <div className="mt-12">
                <div className="flex justify-between items-center mb-3">
                  <Typography variant="h4" className="!font-medium" gutterBottom>
                    Consolidated Best Solutions
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<span>📥</span>}
                    onClick={() => openDownloadOptions(responseData.best_solutions, 'Consolidated_Best_Solutions')}
                    sx={{ minWidth: '120px' }}
                  >
                    Download 
                  </Button>
                </div>
                <AgGridAutoDataComponent
                  rowData={responseData.best_solutions}
                  rowHeight={50}
                  paginationPageSize={10}
                  headerHeight={50}
                  download={false}
                  height="400px"
                />
              </div>
            )}
        </div>
      )}

      {/* Download Options Dialog */}
      <Dialog
        open={downloadOptionsOpen}
        onClose={() => setDownloadOptionsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e5e7eb',
            padding: '20px 24px 16px'
          }}
        >
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Download {currentTableTitle}</span>
            <div 
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: '#00ba7c', 
                color: 'white' 
              }}
            >
              {currentTableData?.length || 0} total rows
            </div>
          </div>
        </DialogTitle>
        <DialogContent sx={{ padding: '24px' }}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Download Type
              </label>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="downloadType"
                    value="all"
                    checked={downloadType === 'all'}
                    onChange={(e) => setDownloadType(e.target.value)}
                    className="w-4 h-4 text-primary-btn border-gray-300 focus:ring-primary-btn"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Download all {currentTableData?.length || 0} rows
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="downloadType"
                    value="top"
                    checked={downloadType === 'top'}
                    onChange={(e) => setDownloadType(e.target.value)}
                    className="w-4 h-4 text-primary-btn border-gray-300 focus:ring-primary-btn"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Download top N rows
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="downloadType"
                    value="custom"
                    checked={downloadType === 'custom'}
                    onChange={(e) => setDownloadType(e.target.value)}
                    className="w-4 h-4 text-primary-btn border-gray-300 focus:ring-primary-btn"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Download custom range
                  </span>
                </label>
              </div>
            </div>

            {downloadType === 'top' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Number of rows
                </label>
                <input
                  type="number"
                  value={downloadRowCount}
                  onChange={(e) => setDownloadRowCount(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={currentTableData?.length || 1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-transparent"
                  placeholder="Enter number of rows"
                />
                <p className="text-xs text-gray-500">
                  Maximum: {currentTableData?.length || 0} rows
                </p>
              </div>
            )}

            {downloadType === 'custom' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start row
                    </label>
                    <input
                      type="number"
                      value={downloadStartRow}
                      onChange={(e) => {
                        const value = Math.max(1, parseInt(e.target.value) || 1);
                        setDownloadStartRow(value);
                        if (value > downloadEndRow) {
                          setDownloadEndRow(value);
                        }
                      }}
                      min={1}
                      max={currentTableData?.length || 1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-transparent"
                      placeholder="Start row"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End row
                    </label>
                    <input
                      type="number"
                      value={downloadEndRow}
                      onChange={(e) => {
                        const value = Math.min(
                          currentTableData?.length || 1,
                          Math.max(downloadStartRow, parseInt(e.target.value) || downloadStartRow)
                        );
                        setDownloadEndRow(value);
                      }}
                      min={downloadStartRow}
                      max={currentTableData?.length || 1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-transparent"
                      placeholder="End row"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Will download rows {downloadStartRow} to {downloadEndRow} ({downloadEndRow - downloadStartRow + 1} rows)
                </p>
              </div>
            )}
          </div>

          {/* Summary Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              <strong>Summary:</strong> {(() => {
                switch (downloadType) {
                  case 'top':
                    return `Will download top ${Math.min(downloadRowCount, currentTableData?.length || 0)} rows`;
                  case 'custom':
                    return `Will download rows ${downloadStartRow} to ${downloadEndRow} (${Math.max(0, downloadEndRow - downloadStartRow + 1)} rows)`;
                  case 'all':
                  default:
                    return `Will download all ${currentTableData?.length || 0} rows`;
                }
              })()}
            </p>
          </div>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f8fafc' }}>
          <button
            onClick={() => setDownloadOptionsOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-btn"
          >
            Cancel
          </button>
          <button
            onClick={handleDownloadWithOptions}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-btn border border-transparent rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-btn"
          >
            Download
          </button>
        </DialogActions>
      </Dialog>

      {/* DOCS */}
      <button
        className="fixed bottom-20 right-5 bg-primary-btn text-xl font-bold text-white rounded-full w-10 h-10 shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center"
        onClick={openModal}
      >
        ?
      </button>
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
          <Docs section={'invML'} />
        </div>
      </Modal>
    </div>
  );
}

export default PSO;
