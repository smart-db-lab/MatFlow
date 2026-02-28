import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, BarChart2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const PredictionResults = ({ predictionResults = [], isLoading = false }) => {
  const [sortedResults, setSortedResults] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: 'prediction',
    direction: 'desc'
  });
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    if (predictionResults.length > 0) {
      const sortableResults = [...predictionResults];
      sortableResults.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
      setSortedResults(sortableResults);
    } else {
      setSortedResults([]);
    }
  }, [predictionResults, sortConfig]);

  // Function to handle sorting when headers are clicked
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get the sorted icon for the header
  const getSortDirectionIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  // Filter results based on search input
  const filteredResults = sortedResults.filter(item =>
    item.graph_id.toLowerCase().includes(filterText.toLowerCase())
  );

  // Get highest and lowest prediction values for highlighting
  const getHighestValue = () => {
    if (sortedResults.length === 0) return 0;
    return Math.max(...sortedResults.map(item => item.prediction));
  };

  const getLowestValue = () => {
    if (sortedResults.length === 0) return 0;
    return Math.min(...sortedResults.map(item => item.prediction));
  };

  const highestValue = getHighestValue();
  const lowestValue = getLowestValue();

  if (isLoading) {
    return (
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6 text-center">
        <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700">Processing predictions...</h3>
        <p className="text-gray-500 mt-2">Please wait while we analyze your data</p>
      </div>
    );
  }

  if (sortedResults.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <BarChart2 className="w-6 h-6 text-primary mr-3" />
          <h3 className="text-2xl font-bold text-primary-dark">Prediction Results</h3>
        </div>
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Filter by graph ID..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-primary/5 rounded-lg p-4">
          <p className="text-sm font-medium text-primary">Total Predictions</p>
          <p className="text-3xl font-bold text-primary-dark">{sortedResults.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm font-medium text-green-600">Highest Value</p>
          <p className="text-3xl font-bold text-green-800">{highestValue.toFixed(2)}</p>
          <p className="text-xs text-green-600 mt-1">
            {sortedResults.find(item => item.prediction === highestValue)?.graph_id}
          </p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-600">Lowest Value</p>
          <p className="text-3xl font-bold text-amber-800">{lowestValue.toFixed(2)}</p>
          <p className="text-xs text-amber-600 mt-1">
            {sortedResults.find(item => item.prediction === lowestValue)?.graph_id}
          </p>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr>
              <th
                className="border p-3 bg-primary/5 text-primary-dark cursor-pointer hover:bg-primary/10"
                onClick={() => requestSort('graph_id')}
              >
                <div className="flex items-center justify-between">
                  <span>Graph ID</span>
                  {getSortDirectionIcon('graph_id')}
                </div>
              </th>
              <th
                className="border p-3 bg-primary/5 text-primary-dark cursor-pointer hover:bg-primary/10"
                onClick={() => requestSort('prediction')}
              >
                <div className="flex items-center justify-between">
                  <span>Prediction Value</span>
                  {getSortDirectionIcon('prediction')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((result, index) => (
              <tr
                key={index}
                className={`hover:bg-gray-50 ${
                  result.prediction === highestValue ? 'bg-green-50' : 
                  result.prediction === lowestValue ? 'bg-amber-50' : ''
                }`}
              >
                <td className="border p-3 font-medium">{result.graph_id}</td>
                <td className="border p-3 text-center font-bold">
                  {result.prediction.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No results message */}
      {filteredResults.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No results match your filter criteria
        </div>
      )}

      {/* Summary stats at bottom */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <p>Average prediction value: {(sortedResults.reduce((acc, curr) => acc + curr.prediction, 0) / sortedResults.length).toFixed(2)}</p>
          <p>Median prediction value: {sortedResults[Math.floor(sortedResults.length / 2)].prediction.toFixed(2)}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default PredictionResults;
