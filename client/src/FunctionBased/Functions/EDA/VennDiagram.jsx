import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import LayoutSelector from '../../Components/LayoutSelector/LayoutSelector';
import { isLoggedIn } from '../../../util/adminAuth';
import { apiService } from '../../../services/api/apiService';
import {
  FE_LABEL_CLASS,
  FE_SECTION_TITLE_CLASS,
} from '../Feature Engineering/feUi';

function VennDiagram({ csvData, splitMode = false, onPlotGenerated, onError, onLoading }) {
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [columnOptions, setColumnOptions] = useState([]);

  // State for feature groups with editable short names and display names
  const [featureGroups, setFeatureGroups] = useState([
    {
      pattern: 'Bond Chain-',
      method: 'starts_with',
      shortName: 'C',
      displayName: 'Bond Chain Related Features',
    },
    {
      pattern: 'Rdkit Descriptor',
      method: 'starts_with',
      shortName: 'G',
      displayName: 'RDKit Global Descriptors',
    },
    {
      pattern: 'Rdkit Descriptor Fr',
      method: 'starts_with',
      shortName: 'F',
      displayName: 'RDKit Functional Group Descriptors',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [echartsData, setEchartsData] = useState([]);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    if (activeCsvFile && csvData.length > 0) {
      const firstRow = csvData[0];
      const cols = Object.keys(firstRow);
      setColumnOptions(cols);
      console.log('Columns detected:', cols);
    }
  }, [csvData, activeCsvFile]);

  const updateFeatureGroup = (index, field, value) => {
    const newGroups = [...featureGroups];
    newGroups[index][field] = value;
    setFeatureGroups(newGroups);
  };

  const handleGenerate = async () => {
    // Validate that we have proper configuration
    const hasEmptyFields = featureGroups.some(
      (group) => !group.pattern || !group.shortName || !group.displayName
    );

    if (hasEmptyFields) {
      setError(
        'Please fill in all pattern, short name, and display name fields.'
      );
      return;
    }

    // Check if user is logged in
    if (!isLoggedIn()) {
      setError('Please log in to generate plots.');
      return;
    }

    setLoading(true);
    setError('');
    setEchartsData([]);
    setStatistics(null);
    
    if (onLoading && splitMode) {
      onLoading(true);
    }

    try {
      const payload = {
        file: csvData,
        feature_groups: featureGroups.map((group) => ({
          pattern: group.pattern,
          method: group.method,
          short_name: group.shortName,
          display_name: group.displayName,
        })),
      };

      console.log('Request payload:', payload);

      const data = await apiService.matflow.eda.vennDiagram(payload);
      console.log('API Response:', data);
      
      let plotData = data.echarts || [];
      // Ensure it's an array
      plotData = Array.isArray(plotData) ? plotData : (typeof plotData === "object" ? [plotData] : []);
      
      setEchartsData(plotData);
      setStatistics(data.statistics || null);
      
      if (onPlotGenerated && splitMode) {
        onPlotGenerated(plotData);
      }
    } catch (err) {
      console.error('Request failed:', err);
      const errorMsg = err.message || 'An unexpected error occurred.';
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

  return (
    <div className="w-full">
      {/* Feature Groups Configuration */}
      <div className="mb-6">
        <h3 className={FE_SECTION_TITLE_CLASS}>
          Feature Groups Configuration
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {featureGroups.map((group, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <h4 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                Group {index + 1}
              </h4>

              <div className="space-y-3">
                {/* Pattern */}
                <div>
                  <label className={FE_LABEL_CLASS}>
                    Column Pattern
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    value={group.pattern}
                    onChange={(e) =>
                      updateFeatureGroup(index, 'pattern', e.target.value)
                    }
                    placeholder="e.g., Bond Chain"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        backgroundColor: "#fcfcfd",
                        "& fieldset": { borderColor: "#d1d5db" },
                        "&:hover fieldset": { borderColor: "#9ca3af" },
                        "&.Mui-focused fieldset": { borderColor: "#0D9488", borderWidth: "2px" },
                      },
                    }}
                  />
                </div>

                {/* Method */}
                <div>
                  <label className={FE_LABEL_CLASS}>
                    Matching Method
                  </label>
                  <FormControl fullWidth size="small">
                    <Select
                      value={group.method}
                      onChange={(e) =>
                        updateFeatureGroup(index, 'method', e.target.value)
                      }
                      sx={{
                        borderRadius: "10px",
                        backgroundColor: "#fcfcfd",
                        ".MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9ca3af" },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0D9488", borderWidth: "2px" },
                      }}
                    >
                      <MenuItem value="starts_with">Starts with</MenuItem>
                      <MenuItem value="ends_with">Ends with</MenuItem>
                      <MenuItem value="contains">Contains</MenuItem>
                      <MenuItem value="exact_match">Exact match</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                {/* Short Name */}
                <div>
                  <label className={FE_LABEL_CLASS}>
                    Short Name (for diagram)
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    value={group.shortName}
                    onChange={(e) =>
                      updateFeatureGroup(index, 'shortName', e.target.value)
                    }
                    placeholder="e.g., C"
                    inputProps={{ maxLength: 3 }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        backgroundColor: "#fcfcfd",
                        "& fieldset": { borderColor: "#d1d5db" },
                        "&:hover fieldset": { borderColor: "#9ca3af" },
                        "&.Mui-focused fieldset": { borderColor: "#0D9488", borderWidth: "2px" },
                      },
                    }}
                  />
                </div>

                {/* Display Name */}
                <div>
                  <label className={FE_LABEL_CLASS}>
                    Display Name (for legend)
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    value={group.displayName}
                    onChange={(e) =>
                      updateFeatureGroup(index, 'displayName', e.target.value)
                    }
                    placeholder="e.g., Bond Chain Related Features"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        backgroundColor: "#fcfcfd",
                        "& fieldset": { borderColor: "#d1d5db" },
                        "&:hover fieldset": { borderColor: "#9ca3af" },
                        "&.Mui-focused fieldset": { borderColor: "#0D9488", borderWidth: "2px" },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-end mb-6">
        <button
          className="px-6 py-2.5 tracking-wide bg-[#0D9488] text-white text-sm font-medium rounded-md hover:bg-[#0F766E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Feature Analysis Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Total Features: <span className="text-[#0D9488]">{statistics.total_features}</span>
              </h4>
              <ul className="space-y-1.5">
                {Object.entries(statistics.feature_counts).map(
                  ([key, value]) => (
                    <li key={key} className="text-sm text-gray-600 flex justify-between">
                      <span>{key}:</span>
                      <span className="font-medium">{value} features</span>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="bg-white p-3 rounded border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Overlaps:</h4>
              <ul className="space-y-1.5">
                {Object.entries(statistics.overlaps).map(([key, value]) => (
                  <li key={key} className="text-sm text-gray-600 flex justify-between">
                    <span>{key}:</span>
                    <span className="font-medium">{value} features</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </div>
      )}

      {/* Loader */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <CircularProgress size={36} sx={{ color: "#0D9488" }} />
            <p className="text-sm text-gray-600">Generating Venn Diagram...</p>
          </div>
        </div>
      )}

      {/* Output */}
      {!loading && echartsData.length > 0 && (
        <div className="w-full">
          <LayoutSelector echartsData={echartsData} />
        </div>
      )}
    </div>
  );
}

export default VennDiagram;
