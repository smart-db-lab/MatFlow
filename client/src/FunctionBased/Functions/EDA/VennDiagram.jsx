import { Loading } from '@nextui-org/react';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import LayoutSelector from '../../Components/LayoutSelector/LayoutSelector';
import { isLoggedIn } from '../../../util/adminAuth';
import { apiService } from '../../../services/api/apiService';

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
  const [plotlyData, setPlotlyData] = useState([]);
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
    setPlotlyData([]);
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
      
      let plotData = data.plotly || [];
      // Ensure it's an array
      plotData = Array.isArray(plotData) ? plotData : (typeof plotData === "object" ? [plotData] : []);
      
      setPlotlyData(plotData);
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4 tracking-wide">
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
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Column Pattern
                  </label>
                  <input
                    type="text"
                    value={group.pattern}
                    onChange={(e) =>
                      updateFeatureGroup(index, 'pattern', e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-colors"
                    placeholder="e.g., Bond Chain"
                  />
                </div>

                {/* Method */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Matching Method
                  </label>
                  <select
                    value={group.method}
                    onChange={(e) =>
                      updateFeatureGroup(index, 'method', e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-colors bg-white"
                  >
                    <option value="starts_with">Starts with</option>
                    <option value="ends_with">Ends with</option>
                    <option value="contains">Contains</option>
                    <option value="exact_match">Exact match</option>
                  </select>
                </div>

                {/* Short Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Short Name (for diagram)
                  </label>
                  <input
                    type="text"
                    value={group.shortName}
                    onChange={(e) =>
                      updateFeatureGroup(index, 'shortName', e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-colors"
                    placeholder="e.g., C"
                    maxLength={3}
                  />
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Display Name (for legend)
                  </label>
                  <input
                    type="text"
                    value={group.displayName}
                    onChange={(e) =>
                      updateFeatureGroup(index, 'displayName', e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-colors"
                    placeholder="e.g., Bond Chain Related Features"
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
          <h3 className="text-base font-semibold text-gray-800 mb-3">
            Feature Analysis Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Total Features: <span className="text-[#0D9488]">{statistics.total_features}</span>
              </h4>
              <ul className="space-y-1.5">
                {Object.entries(statistics.feature_counts).map(
                  ([key, value]) => (
                    <li key={key} className="text-xs text-gray-600 flex justify-between">
                      <span>{key}:</span>
                      <span className="font-medium">{value} features</span>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="bg-white p-3 rounded border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Overlaps:</h4>
              <ul className="space-y-1.5">
                {Object.entries(statistics.overlaps).map(([key, value]) => (
                  <li key={key} className="text-xs text-gray-600 flex justify-between">
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
          <Loading color="primary" size="xl">
            Generating Venn Diagram...
          </Loading>
        </div>
      )}

      {/* Output */}
      {!loading && plotlyData.length > 0 && (
        <div className="w-full">
          <LayoutSelector plotlyData={plotlyData} />
        </div>
      )}
    </div>
  );
}

export default VennDiagram;
