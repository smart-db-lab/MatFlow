import React, { useState, useMemo, useEffect } from "react";
import { 
  Typography, 
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Box,
  Chip,
  Card,
  CardContent,
  Grid
} from "@mui/material";
import { Progress, Modal } from "@nextui-org/react";
import { toast } from "react-toastify";
import { apiService } from "../../../../services/api/apiService";
import { isLoggedIn } from "../../../../util/adminAuth";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import AgGridAutoDataComponent from "../../../Components/AgGridComponent/AgGridAutoDataComponent";
import Docs from "../../../../Docs/Docs";

function SMILESToSyntheticScore({ csvData }) {
  const [smilesColumn, setSmilesColumn] = useState("");
  const [processingMode, setProcessingMode] = useState("individual");
  const [scoreType, setScoreType] = useState("sa");

  const [singleSMILES, setSingleSMILES] = useState("");

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentProcessing, setCurrentProcessing] = useState("");
  const [results, setResults] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [visible, setVisible] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  const handleCancelOperation = () => {
    setLoading(false);
    setProgress(0);
    setCurrentProcessing("");
    setCancelled(true);
    toast.info("Operation cancelled");
  };

  const resetOperationState = () => {
    setResults(null);
    setTaskId(null);
    setCancelled(false);
    setProgress(0);
    setCurrentProcessing("");
  };

  const availableColumns = csvData ? Object.keys(csvData[0]) : [];

  // When switching between SAS/SCS, clear previous results to prevent render mismatches
  useEffect(() => {
    setResults(null);
    setProgress(0);
    setCurrentProcessing("");
  }, [scoreType]);

  const getComplexityLevel = (scoreValue) => {
    if (typeof scoreValue !== 'number') return { level: 'Unknown', color: 'default' };
    if (scoreType === 'sa') {
      if (scoreValue <= 3) return { level: 'Low Complexity', color: 'success' };
      if (scoreValue <= 6) return { level: 'Medium Complexity', color: 'warning' };
      return { level: 'High Complexity', color: 'error' };
    }
    if (scoreValue <= 2) return { level: 'Low Complexity', color: 'success' };
    if (scoreValue <= 3.5) return { level: 'Medium Complexity', color: 'warning' };
    return { level: 'High Complexity', color: 'error' };
  };

  const currentScoreKey = scoreType === 'sa' ? 'sa_score' : 'scs_score';

  const visualizationData = useMemo(() => {
    if (!results || !results.results) return null;
    const validResults = results.results.filter(r => r[currentScoreKey] !== null && r[currentScoreKey] !== undefined);
    const scoreDistribution = scoreType === 'sa'
      ? {
          '1-2': validResults.filter(r => r[currentScoreKey] >= 1 && r[currentScoreKey] < 2).length,
          '2-3': validResults.filter(r => r[currentScoreKey] >= 2 && r[currentScoreKey] < 3).length,
          '3-4': validResults.filter(r => r[currentScoreKey] >= 3 && r[currentScoreKey] < 4).length,
          '4-5': validResults.filter(r => r[currentScoreKey] >= 4 && r[currentScoreKey] < 5).length,
          '5-6': validResults.filter(r => r[currentScoreKey] >= 5 && r[currentScoreKey] < 6).length,
          '6-7': validResults.filter(r => r[currentScoreKey] >= 6 && r[currentScoreKey] < 7).length,
          '7-8': validResults.filter(r => r[currentScoreKey] >= 7 && r[currentScoreKey] < 8).length,
          '8-9': validResults.filter(r => r[currentScoreKey] >= 8 && r[currentScoreKey] < 9).length,
          '9-10': validResults.filter(r => r[currentScoreKey] >= 9 && r[currentScoreKey] <= 10).length
        }
      : {
          '1.0-1.5': validResults.filter(r => r[currentScoreKey] >= 1.0 && r[currentScoreKey] < 1.5).length,
          '1.5-2.0': validResults.filter(r => r[currentScoreKey] >= 1.5 && r[currentScoreKey] < 2.0).length,
          '2.0-2.5': validResults.filter(r => r[currentScoreKey] >= 2.0 && r[currentScoreKey] < 2.5).length,
          '2.5-3.0': validResults.filter(r => r[currentScoreKey] >= 2.5 && r[currentScoreKey] < 3.0).length,
          '3.0-3.5': validResults.filter(r => r[currentScoreKey] >= 3.0 && r[currentScoreKey] < 3.5).length,
          '3.5-4.0': validResults.filter(r => r[currentScoreKey] >= 3.5 && r[currentScoreKey] < 4.0).length,
          '4.0-4.5': validResults.filter(r => r[currentScoreKey] >= 4.0 && r[currentScoreKey] < 4.5).length,
          '4.5-5.0': validResults.filter(r => r[currentScoreKey] >= 4.5 && r[currentScoreKey] <= 5.0).length
        };
    const complexityDistribution = {
      'Low': validResults.filter(r => getComplexityLevel(r[currentScoreKey]).level === 'Low Complexity').length,
      'Medium': validResults.filter(r => getComplexityLevel(r[currentScoreKey]).level === 'Medium Complexity').length,
      'High': validResults.filter(r => getComplexityLevel(r[currentScoreKey]).level === 'High Complexity').length
    };
    const correlationData = validResults.map(r => ({
      smilesLength: r.smiles ? r.smiles.length : 0,
      sasScore: r[currentScoreKey]
    }));
    const lowCount = validResults.filter(r => r[currentScoreKey] >= 1.0 && r[currentScoreKey] < 2.5).length;
    const medCount = validResults.filter(r => r[currentScoreKey] >= 2.5 && r[currentScoreKey] < 3.5).length;
    const highCount = validResults.filter(r => r[currentScoreKey] >= 3.5 && r[currentScoreKey] <= 5.0).length;
    const total = validResults.length || 1;
    const complexityPercentages = {
      lowPct: Math.round((lowCount / total) * 100),
      medPct: Math.round((medCount / total) * 100),
      highPct: Math.round((highCount / total) * 100)
    };

    return {
      scoreDistribution,
      complexityDistribution,
      correlationData,
      totalValid: validResults.length,
      complexityPercentages
    };
  }, [results, currentScoreKey, scoreType]);

  const handleSingleCalculation = async () => {
    if (!singleSMILES.trim()) {
      toast.error("Please enter a SMILES string");
      return;
    }
    resetOperationState();
    setLoading(true);
    setCurrentProcessing(`Calculating ${scoreType === 'sa' ? 'SAS' : 'SCS'} for: ${singleSMILES}`);
    const requestData = {
      dataset: [{ id: 1, smiles: singleSMILES.trim() }],
      smiles_column: "smiles",
      score_key: currentScoreKey,
      round_to: 3,
      drop_invalid: false
    };
    if (!isLoggedIn()) {
      toast.error('Please log in to calculate scores.');
      setLoading(false);
      return;
    }

    try {
      const data = await apiService.matflow.chemistry.smilesToSAScore(requestData);
      
      if (data.error) {
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error(data.error || "Failed to calculate score");
        return;
      }
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        if (result[currentScoreKey] !== null && result[currentScoreKey] !== undefined) {
            const transformedResults = {
              mode: "individual",
              smiles: singleSMILES,
              [currentScoreKey]: result[currentScoreKey],
              summary: {
                total_smiles: 1,
                successful_calculations: 1,
                failed_calculations: 0,
                success_rate: 100,
                average_sas: result[currentScoreKey]
              }
            };
            setResults(transformedResults);
            setLoading(false);
            setProgress(100);
            setCurrentProcessing("");
            toast.success(`${scoreType === 'sa' ? 'SAS' : 'SCS'} calculation completed successfully!`);
          } else {
            setLoading(false);
            setProgress(100);
            setCurrentProcessing("");
            toast.error(result.error || `Failed to calculate ${scoreType === 'sa' ? 'SAS' : 'SCS'} score`);
          }
      } else {
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error("No results returned from API");
      }
    } catch (error) {
      setLoading(false);
      setProgress(100);
      setCurrentProcessing("");
      toast.error(`Error calculating ${scoreType === 'sa' ? 'SAS' : 'SCS'}: ` + error.message);
    }
  };

  const handleBatchCalculation = async () => {
    if (!smilesColumn) {
      toast.error("Please select a SMILES column");
      return;
    }
    if (!csvData || csvData.length === 0) {
      toast.error("Please upload a CSV file first");
      return;
    }
    setLoading(true);
    setProgress(0);
    setCurrentProcessing("Processing batch data...");
    const requestData = {
      dataset: csvData.map((row, index) => ({
        id: index + 1,
        ...row
      })),
      smiles_column: smilesColumn,
      score_key: currentScoreKey,
      round_to: 3,
      drop_invalid: false
    };
    if (!isLoggedIn()) {
      toast.error('Please log in to calculate scores.');
      setLoading(false);
      return;
    }

    try {
      const data = await apiService.matflow.chemistry.smilesToSAScore(requestData);
      
      if (data.error) {
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error(data.error || "Failed to calculate scores");
        return;
      }
      
      if (data.results && data.results.length > 0) {
        const validResults = data.results.filter(r => r[currentScoreKey] !== null && r[currentScoreKey] !== undefined);
          const invalidResults = data.results.filter(r => r[currentScoreKey] === null || r[currentScoreKey] === undefined);
          const transformedResults = {
            mode: "batch",
            summary: {
              total_smiles: csvData && csvData.length ? csvData.length : (data.summary.total || 0),
              processed: data.summary.processed,
              invalid: data.summary.invalid,
              successful_calculations: validResults.length,
              failed_calculations: invalidResults.length,
              success_rate: csvData && csvData.length > 0 ? Math.round((validResults.length / csvData.length) * 100) : 0,
              average_sas: validResults.length > 0 ? 
                parseFloat((validResults.reduce((sum, r) => sum + r[currentScoreKey], 0) / validResults.length).toFixed(5)) : 0
            },
            results: data.results
          };
          setResults(transformedResults);
          setLoading(false);
          setProgress(100);
          setCurrentProcessing("");
          toast.success(`Batch ${scoreType === 'sa' ? 'SAS' : 'SCS'} calculation completed successfully!`);
      } else {
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error("No results returned from API");
      }
    } catch (error) {
      setLoading(false);
      setProgress(100);
      setCurrentProcessing("");
      toast.error(`Error calculating batch ${scoreType === 'sa' ? 'SAS' : 'SCS'}: ` + error.message);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4">
      <Typography
        variant="h5"
        className="!font-semibold !mb-3 text-gray-900"
        gutterBottom
      >
        SMILES to Synthetic Score (SAS/SCS) Calculator
      </Typography>

      {/* Score type + processing mode side-by-side */}
      <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormControl component="fieldset">
            <FormLabel
              component="legend"
              className="!text-sm !font-semibold !text-gray-900 mb-1"
            >
              Score Type
            </FormLabel>
            <RadioGroup
              value={scoreType}
              onChange={(e) => setScoreType(e.target.value)}
              className="mt-1"
              row
            >
              <FormControlLabel
                value="sa"
                control={<Radio size="small" />}
                label={
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-medium">SAS</span>
                    <span className="text-xs text-gray-500">
                      Synthetic Accessibility
                    </span>
                  </div>
                }
              />
              <FormControlLabel
                value="scs"
                control={<Radio size="small" />}
                label={
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-medium">SCS</span>
                    <span className="text-xs text-gray-500">
                      Synthetic Complexity
                    </span>
                  </div>
                }
              />
            </RadioGroup>
          </FormControl>

          <FormControl component="fieldset">
            <FormLabel
              component="legend"
              className="!text-sm !font-semibold !text-gray-900 mb-1"
            >
              Processing Mode
            </FormLabel>
            <RadioGroup
              value={processingMode}
              onChange={(e) => setProcessingMode(e.target.value)}
              className="mt-1"
            >
              <FormControlLabel
                value="individual"
                control={<Radio size="small" />}
                label="Individual SMILES"
                className="!text-sm"
              />
              <FormControlLabel
                value="batch"
                control={<Radio size="small" />}
                label="Batch Processing (from dataset)"
                className="!text-sm"
              />
            </RadioGroup>
          </FormControl>
        </div>
      </div>
      {processingMode === "batch" && (
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <Typography
              variant="body2"
              className="!text-gray-900 !font-semibold mb-2 text-sm"
            >
              Select SMILES Column:
            </Typography>
            <SingleDropDown
              columnNames={availableColumns}
              onValueChange={setSmilesColumn}
              initValue={smilesColumn}
            />
          </div>
        </div>
      )}
      {processingMode === "individual" && (
        <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <TextField
            label="Enter SMILES String"
            fullWidth
            size="small"
            value={singleSMILES}
            onChange={(e) => setSingleSMILES(e.target.value)}
            placeholder="e.g., CCO (ethanol)"
            helperText={`Enter a single SMILES string to calculate ${scoreType === 'sa' ? 'SAS' : 'SCS'} score`}
            className="!mb-3"
          />
          {/* Sample SMILES for testing */}
          <div className="mt-2">
            <Typography variant="body2" className="!text-gray-600 mb-2 !text-sm">
              Sample SMILES for testing:
            </Typography>
            <div className="flex flex-wrap gap-2">
              {['CCO', 'CC(C)O', 'c1ccccc1', 'CC(=O)O', 'CCN(CC)CC'].map((sample) => (
                <button
                  key={sample}
                  onClick={() => setSingleSMILES(sample)}
                  className="px-2 py-1 text-xs bg-primary/10 text-primary-dark rounded-md hover:bg-primary/20 transition-colors border border-primary/20"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-end mb-4">
        <Button
          variant="contained"
          size="medium"
          onClick={processingMode === "batch" ? handleBatchCalculation : handleSingleCalculation}
          disabled={loading || (processingMode === "batch" && !smilesColumn) || (processingMode === "individual" && !singleSMILES.trim())}
          className="!bg-primary-btn !text-white !font-medium !px-6 !py-2 !text-xs md:!text-sm"
        >
          {loading ? "Calculating..." : "CALCULATE SYNTHETIC SCORE"}
        </Button>
      </div>
      {loading && (
        <div className="mb-4">
          <Progress
            value={progress}
            shadow
            color="success"
            status="secondary"
            striped
          />
          {currentProcessing && (
            <p className="text-center mt-2 text-gray-600 text-sm">
              {currentProcessing}
            </p>
          )}
        </div>
      )}
      {results && (
        <div className="mt-5">
          <Typography
            variant="h6"
            className="!font-semibold !mb-4 !text-gray-900 text-center"
            gutterBottom
          >
            {scoreType === 'sa' ? 'SAS' : 'SCS'} Calculation Results
          </Typography>
          {processingMode === "batch" && results.summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <div className="bg-primary/5 p-3 rounded-md border border-primary/20">
                <Typography
                  variant="body2"
                  className="!font-medium !text-gray-700 !mb-1 text-xs md:text-sm"
                >
                  Total SMILES
                </Typography>
                <Typography
                  variant="h6"
                  className="!text-primary !font-bold !text-base md:!text-lg"
                >
                  {results.summary.total_smiles || 0}
                </Typography>
              </div>
              <div className="bg-green-50 p-3 rounded-md border border-green-200">
                <Typography
                  variant="body2"
                  className="!font-medium !text-gray-700 !mb-1 text-xs md:text-sm"
                >
                  Successfully Calculated
                </Typography>
                <Typography
                  variant="h6"
                  className="!text-green-600 !font-bold !text-base md:!text-lg"
                >
                  {results.summary.successful_calculations || 0}
                </Typography>
              </div>
              <div className="bg-red-50 p-3 rounded-md border border-red-200">
                <Typography
                  variant="body2"
                  className="!font-medium !text-gray-700 !mb-1 text-xs md:text-sm"
                >
                  Failed Calculations
                </Typography>
                <Typography
                  variant="h6"
                  className="!text-red-600 !font-bold !text-base md:!text-lg"
                >
                  {results.summary.failed_calculations || 0}
                </Typography>
              </div>
              <div className="bg-purple-50 p-3 rounded-md border border-purple-200">
                <Typography
                  variant="body2"
                  className="!font-medium !text-gray-700 !mb-1 text-xs md:text-sm"
                >
                  Success Rate
                </Typography>
                <Typography
                  variant="h6"
                  className="!text-purple-600 !font-bold !text-base md:!text-lg"
                >
                  {results.summary.success_rate || 0}%
                </Typography>
              </div>
              <div className="bg-orange-50 p-3 rounded-md border border-orange-200">
                <Typography
                  variant="body2"
                  className="!font-medium !text-gray-700 !mb-1 text-xs md:text-sm"
                >
                  Avg {scoreType === 'sa' ? 'SAS' : 'SCS'} Score
                </Typography>
                <Typography
                  variant="h6"
                  className="!text-orange-600 !font-bold !text-base md:!text-lg"
                >
                  {results.summary.average_sas || 0}
                </Typography>
              </div>
            </div>
          )}
          {processingMode === "individual" && (
            <div className="mb-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <Typography
                  variant="subtitle1"
                  className="!font-semibold !text-gray-900"
                >
                  Individual {scoreType === "sa" ? "SAS" : "SCS"} Result
                </Typography>
                {typeof results?.[currentScoreKey] === "number" && (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      getComplexityLevel(results[currentScoreKey]).color === "success"
                        ? "bg-emerald-100 text-emerald-700"
                        : getComplexityLevel(results[currentScoreKey]).color === "warning"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {getComplexityLevel(results[currentScoreKey]).level}
                  </span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <div className="md:col-span-8 flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 shrink-0">
                    SMILES
                  </span>
                  <span className="text-sm text-primary font-semibold font-mono truncate bg-transparent">
                    {results.smiles || "Not available"}
                  </span>
                </div>
                <div className="md:col-span-4 flex items-center md:justify-end gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {scoreType === "sa" ? "SAS" : "SCS"} Score
                  </span>
                  <span className="text-3xl font-bold text-emerald-700 leading-none">
                    {results[currentScoreKey]}
                  </span>
                </div>
              </div>

              {results.iupac_name && (
                <div className="mt-2 flex items-start gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 shrink-0">
                    IUPAC
                  </span>
                  <span className="text-sm font-medium text-purple-700 break-words">
                    {results.iupac_name}
                  </span>
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-700">
                {scoreType === "sa" ? (
                  <>
                    <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span><strong>Low (1-3)</strong></span>
                    <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span><strong>Medium (4-6)</strong></span>
                    <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><strong>High (7-10)</strong></span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span><strong>Low (1.0-2.5)</strong></span>
                    <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span><strong>Medium (2.5-3.5)</strong></span>
                    <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><strong>High (3.5-5.0)</strong></span>
                  </>
                )}
              </div>
            </div>
          )}
          {processingMode === "batch" && results.results && results.results.length > 0 && (
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <Typography
                variant="h6"
                className="!font-semibold !mb-4 !text-gray-900 text-center"
                gutterBottom
              >
                Batch {scoreType === 'sa' ? 'SAS' : 'SCS'} Results
              </Typography>
              {(() => {
                return null;
              })()}
              <AgGridAutoDataComponent
                rowData={results.results}
                download={true}
                height="400px"
                rowHeight={40}
                headerHeight={50}
                paginationPageSize={10}
                customColumnOrder={[
                  'id',
                  (results && results.results && results.results.length > 0
                    ? Object.keys(results.results[0]).find(k => k && k.toLowerCase && k.toLowerCase() === 'smiles') || 'smiles'
                    : 'smiles'),
                  currentScoreKey
                ]}
                downloadOptions={{
                  minimalColumns: [
                    'id',
                    (results && results.results && results.results.length > 0
                      ? Object.keys(results.results[0]).find(k => k && k.toLowerCase && k.toLowerCase() === 'smiles') || 'smiles'
                      : 'smiles'),
                    currentScoreKey
                  ]
                }}
              />
            </div>
          )}
          {processingMode === "batch" &&
            visualizationData &&
            results.results &&
            results.results.length > 0 && (
              <div className="mb-6 text-center">
                <Typography
                  variant="h6"
                  className="!font-medium !mb-4 !text-gray-900"
                  gutterBottom
                >
                Data Visualizations
              </Typography>
                <Grid container spacing={4} justifyContent="center">
                <Grid item xs={12} lg={4}>
                  <Card className="shadow-sm min-h-fit">
                    <CardContent className="p-4 md:p-5">
                      <Typography
                        variant="h6"
                        className="!font-semibold !mb-4 text-gray-900"
                        gutterBottom
                      >
                        {scoreType === 'sa' ? 'SAS' : 'SCS'} Score Distribution
                      </Typography>
                      <div className="space-y-3">
                        {Object.entries(visualizationData.scoreDistribution).map(([range, count]) => {
                          const percentage = visualizationData.totalValid > 0 ? Math.round((count / visualizationData.totalValid) * 100) : 0;
                          const maxCount = Math.max(...Object.values(visualizationData.scoreDistribution));
                          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                          return (
                            <div key={range} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-800">
                                  {range}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-bold text-primary">
                                    {count}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ease-out ${scoreType === 'sa' ? 'bg-gradient-to-r from-primary-light to-primary' : ''}`}
                                  style={{ width: `${barWidth}%`, background: scoreType === 'scs' ? 'linear-gradient(90deg, #22c55e, #eab308, #ef4444)' : undefined }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} lg={4}>
                  <Card className="shadow-sm min-h-fit">
                    <CardContent className="p-4 md:p-5">
                      <Typography
                        variant="h6"
                        className="!font-semibold !mb-4 text-gray-900"
                        gutterBottom
                      >
                        Complexity Level Distribution
                      </Typography>
                      {scoreType === 'scs' ? (
                        <div className="flex flex-col items-center">
                          {(() => {
                            const { lowPct, medPct, highPct } = visualizationData.complexityPercentages;
                            const totalPct = Math.max(lowPct + medPct + highPct, 1);
                            const lowSweep = (lowPct / totalPct) * 360;
                            const medSweep = (medPct / totalPct) * 360;
                            const gradient = `conic-gradient(#22c55e 0 ${lowSweep}deg, #eab308 ${lowSweep}deg ${lowSweep + medSweep}deg, #ef4444 ${lowSweep + medSweep}deg 360deg)`;
                            return (
                              <div className="flex flex-col items-center">
                              <div
                                className="relative w-40 h-40 rounded-full"
                                style={{ background: gradient }}
                              >
                                  <div className="absolute inset-3 bg-white rounded-full"></div>
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                    <span>Low {lowPct}%</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                    <span>Medium {medPct}%</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                    <span>High {highPct}%</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(visualizationData.complexityDistribution).map(([level, count]) => {
                            const color = level === 'Low' ? 'bg-green-500' : level === 'Medium' ? 'bg-yellow-500' : 'bg-red-500';
                            const percentage = visualizationData.totalValid > 0 ? Math.round((count / visualizationData.totalValid) * 100) : 0;
                            return (
                              <div
                                key={level}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center">
                                  <div className={`w-5 h-5 rounded-full ${color} mr-4 shadow-sm`}></div>
                                  <span className="text-sm font-medium text-gray-700">{level} Complexity</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-gray-800">
                                    {count}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {percentage}%
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} lg={4}>
                  <Card className="shadow-sm min-h-fit">
                    <CardContent className="p-4 md:p-5">
                      <Typography
                        variant="h6"
                        className="!font-semibold !mb-4 text-gray-900"
                        gutterBottom
                      >
                        {scoreType === 'sa' ? 'SAS' : 'SCS'} Score Range Analysis
                      </Typography>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-xs text-green-600 font-medium mb-1">Min Score</div>
                            <div className="text-xl font-bold text-green-700">
                              {Math.min(...visualizationData.correlationData.map(d => d.sasScore))}
                            </div>
                          </div>
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-xs text-red-600 font-medium mb-1">Max Score</div>
                            <div className="text-xl font-bold text-red-700">
                              {Math.max(...visualizationData.correlationData.map(d => d.sasScore))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <Typography
                            variant="body2"
                            className="!text-gray-700 !text-sm leading-relaxed"
                          >
                            <strong className="text-gray-800">Score Interpretation:</strong><br/>
                            {scoreType === 'sa' ? (
                              <>
                                <span className="text-green-600">• 1-3:</span> Low Complexity<br/>
                                <span className="text-yellow-600">• 4-6:</span> Medium Complexity<br/>
                                <span className="text-red-600">• 7-10:</span> High Complexity
                              </>
                            ) : (
                              <>
                                <span className="text-green-600">• 1.0–2.5:</span> Low Complexity<br/>
                                <span className="text-yellow-600">• 2.5–3.5:</span> Medium Complexity<br/>
                                <span className="text-red-600">• 3.5–5.0:</span> High Complexity
                              </>
                            )}
                          </Typography>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </div>
          )}
        </div>
      )}
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
          <Docs section={"smilesSAS"} />
        </div>
      </Modal>
    </div>
  );
}

export default SMILESToSyntheticScore;


