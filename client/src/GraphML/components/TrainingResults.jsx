import React from 'react';
import Plot from 'react-plotly.js';
import { BarChart2, TrendingUp, ArrowDown, Target } from 'lucide-react';

const TrainingResultsView = ({ results }) => {
  if (!results || !results.trainingTime) return null;

  const { lossGraph, r2Graph, maeGraph, rmseGraph, finalTestMetrics } = results;

  // Define color theme for consistency
  const colors = {
    loss: '#ef4444',      // Default Red for Loss
    r2: '#0D9488',        // Teal for R²
    mae: '#f59e0b',       // Default Amber for MAE
    rmse: '#8b5cf6',      // Default Purple for RMSE
    base: '#0D9488',      // Base teal
    light: '#CCFBF1',     // Light teal background
    text: '#1e293b',      // Text color
  };

  // Helper function to assign different colors based on "train", "test", or "val/validation" in the trace name
  const getTraceColor = (traceName, defaultColor) => {
    if (!traceName) return defaultColor;
    const lowerName = traceName.toLowerCase();

    if (lowerName.includes('val') || lowerName.includes('validation')) return '#f97316'; // Orange
    if (lowerName.includes('test')) return '#10b981'; // Green
    if (lowerName.includes('train')) return '#0D9488'; // Blue

    return defaultColor; // Fallback to the default for that metric
  };

  const getMetricIcon = (key) => {
    switch(key) {
      case 'r2': return <TrendingUp className="w-4 h-4 text-primary" />;
      case 'rmse':
      case 'mae': return <ArrowDown className="w-4 h-4 text-amber-600" />;
      case 'accuracy': return <Target className="w-4 h-4 text-green-600" />;
      default: return <BarChart2 className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="mt-8 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all hover:shadow-lg">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-white">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <BarChart2 className="w-5 h-5 mr-3 text-primary" />
          Training Results
        </h3>
      </div>

      {finalTestMetrics && Object.keys(finalTestMetrics).length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center">
            <Target className="w-4 h-4 mr-2 text-primary" />
            Performance Metrics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(finalTestMetrics).map(([key, val]) => (
              <div key={key} className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center mb-2">
                  {getMetricIcon(key)}
                  <p className="text-xs font-medium text-primary-dark uppercase tracking-wider ml-1">{key}</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {typeof val === 'number' ? val.toFixed(4) : val}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lossGraph && (
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                <ArrowDown className="w-4 h-4 mr-2 text-red-500" />
                Training Loss
              </h4>
              <Plot
                data={lossGraph.data.map(trace => {
                  const color = getTraceColor(trace.name, colors.loss);
                  return {
                    ...trace,
                    line: { ...trace.line, color, width: 3 },
                    marker: { ...trace.marker, color },
                  };
                })}
                layout={{
                  ...lossGraph.layout,
                  autosize: true,
                  height: 320,
                  margin: { l: 50, r: 20, t: 20, b: 50 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { family: 'Inter, sans-serif', size: 12, color: colors.text },
                  xaxis: {
                    gridcolor: '#f1f5f9',
                    title: { text: 'Epoch', standoff: 15, font: { size: 13 } },
                    zeroline: false,
                  },
                  yaxis: {
                    gridcolor: '#f1f5f9',
                    title: { text: 'Loss', standoff: 15, font: { size: 13 } },
                    zeroline: false,
                  },
                  showlegend: true,
                  legend: {
                    orientation: 'v',       // Changed from 'h' to vertical for better visibility
                    x: 1.02,                // Positioned to the right of the plot
                    y: 1,                   // Aligned to the top
                    xanchor: 'left',        // Anchor to left side
                    yanchor: 'auto',        // Automatic vertical anchoring
                    
                    // Visual styling
                    bgcolor: 'rgba(255,255,255,0.8)',  // Semi-transparent white background
                    bordercolor: 'rgba(0,0,0,0.1)',    // Subtle border
                    borderwidth: 1,
                    
                    // Text styling
                    font: {
                      family: 'Inter, sans-serif',
                      size: 14,                        // Larger font size
                      color: colors.text               // Using your existing text color
                    },
                    
                    // Interactive features
                    itemclick: 'toggle',               // Toggle visibility when clicking items
                    itemdoubleclick: 'toggleothers',   // Double-click to isolate a single trace
                    
                    // Item styling
                    itemsizing: 'constant',            // Consistent icon sizes
                    itemwidth: 40,                     // Wider items for better visibility
                    
                    // Add hover effect with drop shadow
                    hoverlabel: {
                      bgcolor: '#FFF',
                      font: { size: 14 },
                      bordercolor: '#DDD'
                    }
                  }
                }}
                config={{
                  responsive: true,
                  displayModeBar: false
                }}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {r2Graph && (
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-primary" />
                R² Score
              </h4>
              <Plot
                data={r2Graph.data.map(trace => {
                  const color = getTraceColor(trace.name, colors.r2);
                  return {
                    ...trace,
                    line: { ...trace.line, color, width: 3 },
                    marker: { ...trace.marker, color },
                  };
                })}
                layout={{
                  ...r2Graph.layout,
                  autosize: true,
                  height: 320,
                  margin: { l: 50, r: 20, t: 20, b: 50 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { family: 'Inter, sans-serif', size: 12, color: colors.text },
                  xaxis: {
                    gridcolor: '#f1f5f9',
                    title: { text: 'Epoch', standoff: 15, font: { size: 13 } },
                    zeroline: false,
                  },
                  yaxis: {
                    gridcolor: '#f1f5f9',
                    title: { text: 'R² Score', standoff: 15, font: { size: 13 } },
                    zeroline: false,
                  },
                  showlegend: true,
                  legend: {
                    orientation: 'v',       // Changed from 'h' to vertical for better visibility
                    x: 1.02,                // Positioned to the right of the plot
                    y: 1,                   // Aligned to the top
                    xanchor: 'left',        // Anchor to left side
                    yanchor: 'auto',        // Automatic vertical anchoring
                    
                    // Visual styling
                    bgcolor: 'rgba(255,255,255,0.8)',  // Semi-transparent white background
                    bordercolor: 'rgba(0,0,0,0.1)',    // Subtle border
                    borderwidth: 1,
                    
                    // Text styling
                    font: {
                      family: 'Inter, sans-serif',
                      size: 14,                        // Larger font size
                      color: colors.text               // Using your existing text color
                    },
                    
                    // Interactive features
                    itemclick: 'toggle',               // Toggle visibility when clicking items
                    itemdoubleclick: 'toggleothers',   // Double-click to isolate a single trace
                    
                    // Item styling
                    itemsizing: 'constant',            // Consistent icon sizes
                    itemwidth: 40,                     // Wider items for better visibility
                    
                    // Add hover effect with drop shadow
                    hoverlabel: {
                      bgcolor: '#FFF',
                      font: { size: 14 },
                      bordercolor: '#DDD'
                    }
                  }
                }}
                config={{
                  responsive: true,
                  displayModeBar: false
                }}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {maeGraph && (
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                <ArrowDown className="w-4 h-4 mr-2 text-amber-500" />
                Mean Absolute Error
              </h4>
              <Plot
                data={maeGraph.data.map(trace => {
                  const color = getTraceColor(trace.name, colors.mae);
                  return {
                    ...trace,
                    line: { ...trace.line, color, width: 3 },
                    marker: { ...trace.marker, color },
                  };
                })}
                layout={{
                  ...maeGraph.layout,
                  autosize: true,
                  height: 320,
                  margin: { l: 50, r: 20, t: 20, b: 50 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { family: 'Inter, sans-serif', size: 12, color: colors.text },
                  xaxis: {
                    gridcolor: '#f1f5f9',
                    title: { text: 'Epoch', standoff: 15, font: { size: 13 } },
                    zeroline: false,
                  },
                  yaxis: {
                    gridcolor: '#f1f5f9',
                    title: { text: 'MAE', standoff: 15, font: { size: 13 } },
                    zeroline: false,
                  },
                  showlegend: true,
                  legend: {
                    orientation: 'v',       // Changed from 'h' to vertical for better visibility
                    x: 1.02,                // Positioned to the right of the plot
                    y: 1,                   // Aligned to the top
                    xanchor: 'left',        // Anchor to left side
                    yanchor: 'auto',        // Automatic vertical anchoring
                    
                    // Visual styling
                    bgcolor: 'rgba(255,255,255,0.8)',  // Semi-transparent white background
                    bordercolor: 'rgba(0,0,0,0.1)',    // Subtle border
                    borderwidth: 1,
                    
                    // Text styling
                    font: {
                      family: 'Inter, sans-serif',
                      size: 14,                        // Larger font size
                      color: colors.text               // Using your existing text color
                    },
                    
                    // Interactive features
                    itemclick: 'toggle',               // Toggle visibility when clicking items
                    itemdoubleclick: 'toggleothers',   // Double-click to isolate a single trace
                    
                    // Item styling
                    itemsizing: 'constant',            // Consistent icon sizes
                    itemwidth: 40,                     // Wider items for better visibility
                    
                    // Add hover effect with drop shadow
                    hoverlabel: {
                      bgcolor: '#FFF',
                      font: { size: 14 },
                      bordercolor: '#DDD'
                    }
                  }
                }}
                config={{
                  responsive: true,
                  displayModeBar: false
                }}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {rmseGraph && (
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                <ArrowDown className="w-4 h-4 mr-2 text-purple-500" />
                Root Mean Square Error
              </h4>
              <Plot
                data={rmseGraph.data.map(trace => {
                  const color = getTraceColor(trace.name, colors.rmse);
                  return {
                    ...trace,
                    line: { ...trace.line, color, width: 3 },
                    marker: { ...trace.marker, color },
                  };
                })}
                layout={{
                  ...rmseGraph.layout,
                  autosize: true,
                  height: 320,
                  margin: { l: 50, r: 20, t: 20, b: 50 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { family: 'Inter, sans-serif', size: 12, color: colors.text },
                  xaxis: {
                    gridcolor: '#f1f5f9',
                    title: { text: 'Epoch', standoff: 15, font: { size: 13 } },
                    zeroline: false,
                  },
                  yaxis: {
                    gridcolor: '#f1f5f9',
                    title: { text: 'RMSE', standoff: 15, font: { size: 13 } },
                    zeroline: false,
                  },
                  showlegend: true,
                  legend: {
                    orientation: 'v',       // Changed from 'h' to vertical for better visibility
                    x: 1.02,                // Positioned to the right of the plot
                    y: 1,                   // Aligned to the top
                    xanchor: 'left',        // Anchor to left side
                    yanchor: 'auto',        // Automatic vertical anchoring
                    
                    // Visual styling
                    bgcolor: 'rgba(255,255,255,0.8)',  // Semi-transparent white background
                    bordercolor: 'rgba(0,0,0,0.1)',    // Subtle border
                    borderwidth: 1,
                    
                    // Text styling
                    font: {
                      family: 'Inter, sans-serif',
                      size: 14,                        // Larger font size
                      color: colors.text               // Using your existing text color
                    },
                    
                    // Interactive features
                    itemclick: 'toggle',               // Toggle visibility when clicking items
                    itemdoubleclick: 'toggleothers',   // Double-click to isolate a single trace
                    
                    // Item styling
                    itemsizing: 'constant',            // Consistent icon sizes
                    itemwidth: 40,                     // Wider items for better visibility
                    
                    // Add hover effect with drop shadow
                    hoverlabel: {
                      bgcolor: '#FFF',
                      font: { size: 14 },
                      bordercolor: '#DDD'
                    }
                  }
                }}
                config={{
                  responsive: true,
                  displayModeBar: false
                }}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingResultsView;
