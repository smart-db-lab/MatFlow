import React, { useState, useRef, useEffect } from "react";
import { 
  Typography, 
  Button
} from "@mui/material";
import { Modal } from "@nextui-org/react";
import { toast } from "react-toastify";
import { apiService } from "../../../../services/api/apiService";
import { isLoggedIn } from "../../../../util/adminAuth";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import AgGridAutoDataComponent from "../../../Components/AgGridComponent/AgGridAutoDataComponent";
import Docs from "../../../../Docs/Docs";

function SMILESToDFT({ csvData }) {
  // Configuration state
  const [smilesColumn, setSmilesColumn] = useState("");
  const [topK, setTopK] = useState(50);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [visible, setVisible] = useState(false);
  
  // AbortController ref for canceling requests
  const abortControllerRef = useRef(null);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  // Handle cancel operation
  const handleCancelOperation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setResults(null);
    toast.info("DFT calculation cancelled");
  };

  // Get available columns for SMILES
  const availableColumns = csvData && csvData.length > 0 && csvData[0] ? Object.keys(csvData[0]) : [];

  // Cleanup effect to abort any ongoing requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-set topK to dataset size when csvData changes (only on initial load)
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      setTopK(csvData.length);
    }
  }, [csvData]);

  // Handle DFT calculation
  const handleDFTCalculation = async () => {
    if (!smilesColumn) {
      toast.error("Please select a SMILES column");
      return;
    }

    if (!csvData || !csvData.length) {
      toast.error("No data available for processing");
      return;
    }

    if (!isLoggedIn()) {
      toast.error('Please log in to calculate DFT.');
      return;
    }

    setLoading(true);
    setResults(null);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const requestData = {
        dataset: csvData,
        smiles_column: smilesColumn,
        top_k: typeof topK === 'number' ? topK : (topK === '' ? csvData.length : parseInt(topK) || csvData.length)
      };

      const data = await apiService.matflow.chemistry.smilesToDFT(requestData);

      if (data.error) {
        throw new Error(data.error || `HTTP error!`);
      }
      
      // Transform backend response to frontend format
      const transformedResults = {
        summary: {
          total_smiles: data.processed_count || 0,
          successful_calculations: data.results?.filter(r => r.psi4_psi4_ok === 1).length || 0,
          failed_calculations: data.errors?.length || 0,
          success_rate: data.processed_count ? Math.round(((data.results?.filter(r => r.psi4_psi4_ok === 1).length || 0) / data.processed_count) * 100) : 0,
          average_energy: data.results?.filter(r => r.psi4_psi4_ok === 1 && r.psi4_E_hf).length ? 
            (data.results.filter(r => r.psi4_psi4_ok === 1 && r.psi4_E_hf).reduce((sum, item) => sum + item.psi4_E_hf, 0) / data.results.filter(r => r.psi4_psi4_ok === 1 && r.psi4_E_hf).length).toFixed(6) : 0,
          average_gap: data.results?.filter(r => r.psi4_psi4_ok === 1 && r.psi4_gap).length ? 
            (data.results.filter(r => r.psi4_psi4_ok === 1 && r.psi4_gap).reduce((sum, item) => sum + item.psi4_gap, 0) / data.results.filter(r => r.psi4_psi4_ok === 1 && r.psi4_gap).length).toFixed(6) : 0
        },
        converted_data: data.results?.map(item => {
          // Preserve all original columns from the input dataset
          const result = { ...item };
          
          // Ensure DFT calculation results are properly formatted
          result["psi4_psi4_ok"] = item["psi4_psi4_ok"] || 0;
          result["psi4_E_hf"] = item["psi4_E_hf"] || "Not calculated";
          result["psi4_homo"] = item["psi4_homo"] || "Not calculated";
          result["psi4_lumo"] = item["psi4_lumo"] || "Not calculated";
          result["psi4_gap"] = item["psi4_gap"] || "Not calculated";
          result["psi4_error"] = item["psi4_error"] || null;
          
          return result;
        }).sort((a, b) => {
          // Sort to show SMILES results first, then Psi4 results
          const aHasSmiles = a.smiles || a.Smiles || a.SMILES;
          const bHasSmiles = b.smiles || b.Smiles || b.SMILES;
          const aHasPsi4 = a.psi4_psi4_ok === 1;
          const bHasPsi4 = b.psi4_psi4_ok === 1;
          
          // SMILES results first, then Psi4 results
          if (aHasSmiles && !bHasSmiles) return -1;
          if (!aHasSmiles && bHasSmiles) return 1;
          if (aHasPsi4 && !bHasPsi4) return -1;
          if (!aHasPsi4 && bHasPsi4) return 1;
          
          // If both have same type, sort by ID or original order
          return (a.id || 0) - (b.id || 0);
        }) || [],
        errors: data.errors || []
      };

      setResults(transformedResults);
      toast.success("DFT calculation completed successfully!");
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log("DFT calculation was cancelled");
        // Don't show error toast for cancelled operations
      } else {
        console.error("DFT calculation error:", error);
        toast.error("DFT calculation failed: " + error.message);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };



  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4">
      <Typography
        variant="h5"
        className="!font-semibold !mb-3 text-gray-900"
        gutterBottom
      >
        SMILES to DFT Calculator
      </Typography>

      {/* Configuration Panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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
          <div>
            <Typography
              variant="body2"
              className="!text-gray-900 !font-semibold mb-2 text-sm"
            >
              Number of molecules to process (Top K):
            </Typography>
            <input
              type="number"
              value={topK}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setTopK('');
                } else {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue) && numValue > 0) {
                    setTopK(numValue);
                  }
                }
              }}
              min="1"
              className="w-full h-[40px] px-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Enter number of molecules to process"
            />
            <Typography variant="caption" className="!text-gray-500">
              Maximum number of molecules to process (sorted by SynthScore or sa_score if available)
            </Typography>
          </div>
        </div>
      </div>


      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mb-4">
        {loading ? (
          <Button
            variant="contained"
            size="medium"
            onClick={handleCancelOperation}
            className="!bg-red-500 !text-white !font-medium !px-4 !py-2 !text-xs md:!text-sm hover:!bg-red-600"
          >
            CANCEL
          </Button>
        ) : (
          <Button
            variant="contained"
            size="medium"
            onClick={handleDFTCalculation}
            disabled={!smilesColumn}
            className="!bg-primary-btn !text-white !font-medium !px-6 !py-2 !text-xs md:!text-sm"
          >
            RUN DFT CALCULATION
          </Button>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="mb-4 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col items-center justify-center">
            {/* Lazy Loading Animation */}
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary-btn rounded-full border-t-transparent animate-spin"></div>
            </div>
            <Typography
              variant="body1"
              className="!text-text !text-center !mb-2 !font-medium"
            >
              Processing DFT calculations...
            </Typography>
            <Typography
              variant="body2"
              className="!text-gray-600 !text-center text-xs md:text-sm"
            >
              Click{" "}
              <span className="!text-danger-btn !font-semibold">
                "CANCEL OPERATION"
              </span>{" "}
              to stop the calculation.
            </Typography>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="mt-5">
          <Typography
            variant="h6"
            className="!font-semibold !mb-3 !text-gray-900"
            gutterBottom
          >
            DFT Calculation Results
          </Typography>
            
          {/* Summary Statistics */}
          {results.summary && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
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
                  Avg Energy
                      </Typography>
                <Typography
                  variant="h6"
                  className="!text-orange-600 !font-bold !text-base md:!text-lg"
                >
                  {results.summary.average_energy || 0}
                      </Typography>
              </div>
              <div className="bg-indigo-50 p-3 rounded-md border border-indigo-200">
                <Typography
                  variant="body2"
                  className="!font-medium !text-gray-700 !mb-1 text-xs md:text-sm"
                >
                  Avg Gap
                      </Typography>
                <Typography
                  variant="h6"
                  className="!text-indigo-600 !font-bold !text-base md:!text-lg"
                >
                  {results.summary.average_gap || 0}
                      </Typography>
              </div>
            </div>
          )}

          {/* Results Table */}
          {results.converted_data && results.converted_data.length > 0 && (
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <Typography
                variant="subtitle1"
                className="!font-medium !mb-3 !text-gray-900"
                gutterBottom
              >
                Calculated DFT Results
              </Typography>

              <AgGridAutoDataComponent
                rowData={results.converted_data}
                download={true}
                height="500px"
                rowHeight={40}
                headerHeight={50}
                paginationPageSize={20}
                customColumnOrder={[
                  "id",
                  "smiles",
                  "Smiles",
                  "SMILES",
                  "sa_score",
                  "psi4_psi4_ok",
                  "psi4_E_hf",
                  "psi4_homo",
                  "psi4_lumo",
                  "psi4_gap",
                  "psi4_error",
                ]}
                downloadOptions={{
                  minimalColumns: [
                    "id",
                    "smiles",
                    "sa_score",
                    "psi4_psi4_ok",
                    "psi4_E_hf",
                    "psi4_gap",
                  ],
                }}
              />
            </div>
          )}

          {/* Failed Calculations */}
          {results.errors && results.errors.length > 0 && (
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <Typography
                variant="subtitle1"
                className="!font-medium !mb-3 !text-gray-900"
                gutterBottom
              >
                Failed Calculations
              </Typography>
              <AgGridAutoDataComponent
                rowData={results.errors}
                download={true}
                height="200px"
                rowHeight={40}
                headerHeight={50}
                paginationPageSize={10}
              />
            </div>
          )}

        </div>
      )}

      {/* Help Button */}
      <button
        className="fixed bottom-20 right-5 bg-primary-btn text-xl font-bold text-white rounded-full w-10 h-10 shadow-lg hover:bg-opacity-90 transition-all"
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
          <Docs section={"smilesDft"} />
        </div>
      </Modal>
    </div>
  );
}

export default SMILESToDFT;
