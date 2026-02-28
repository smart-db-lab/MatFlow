import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronRight } from 'lucide-react';

const AdvancedModelConfig = ({ config, onChange }) => {
  const [expanded, setExpanded] = useState(false);

  // Architecture info cards
  const getArchitectureInfo = () => {
    if (!config.architecture) return null;

    const architectureDetails = {
      gcn: {
        title: "Graph Convolutional Network",
        description: "Uses spectral convolution operations on graphs. Best for node classification and link prediction.",
        color: "bg-indigo-50 border-indigo-100 text-indigo-800"
      },
      gat: {
        title: "Graph Attention Network",
        description: "Learns to assign different weights to different neighbor nodes. Ideal for heterogeneous graphs.",
        color: "bg-purple-50 border-purple-100 text-purple-800"
      },
      graphsage: {
        title: "GraphSAGE",
        description: "Uses neighbor sampling and aggregation. Performs well on large-scale graphs and inductive learning.",
        color: "bg-primary/10 border-primary/20 text-primary-dark"
      }
    };

    const details = architectureDetails[config.architecture];
    if (!details) return null;

    return (
      <div className={`mx-6 mb-6 p-4 ${details.color} border rounded-lg shadow-sm`}>
        <h4 className="font-semibold mb-1">{details.title}</h4>
        <p className="text-sm opacity-90">{details.description}</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all hover:shadow-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center">
          <div className="bg-primary/10 p-2 rounded-lg mr-4">
            <Settings className={`w-5 h-5 text-primary ${expanded ? 'animate-pulse' : ''}`} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">
            Advanced Model Configuration
          </h3>
          {config.architecture && (
            <span className="ml-3 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary-dark">
              {config.architecture.toUpperCase()}
            </span>
          )}
        </div>
        <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-gray-100"
          >
            {getArchitectureInfo()}

            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2 group">
                <label className="block text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                  Model Architecture
                </label>
                <select
                  value={config.architecture}
                  onChange={(e) => onChange({ ...config, architecture: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm hover:border-primary-light"
                >
                  <option value="">Select Model</option>
                  <option value="gcn">Graph Convolutional Network (GCN)</option>
                  <option value="gat">Graph Attention Network (GAT)</option>
                  <option value="graphsage">GraphSAGE</option>
                </select>
              </div>

              {config.architecture === 'gat' && (
                <div className="space-y-2 group">
                  <label className="block text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                    Attention Heads
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={config.heads}
                    onChange={(e) => onChange({ ...config, heads: Number(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm hover:border-primary-light"
                  />
                </div>
              )}

              <div className="space-y-2 group">
                <label className="block text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                  Learning Rate
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={config.learningRate}
                  onChange={(e) => onChange({ ...config, learningRate: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm hover:border-primary-light"
                />
              </div>

              <div className="space-y-2 group">
                <label className="block text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                  Number of Epochs
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.epochs}
                  onChange={(e) => onChange({ ...config, epochs: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm hover:border-primary-light"
                />
              </div>

              <div className="space-y-2 group">
                <label className="block text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                  Batch Size
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.batchSize}
                  onChange={(e) => onChange({ ...config, batchSize: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm hover:border-primary-light"
                />
              </div>

              <div className="space-y-2 group">
                <label className="block text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                  Activation Function
                </label>
                <select
                  value={config.activation}
                  onChange={(e) => onChange({ ...config, activation: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm hover:border-primary-light"
                >
                  <option value="ReLU">ReLU</option>
                  <option value="LeakyReLU">LeakyReLU</option>
                  <option value="Sigmoid">Sigmoid</option>
                  <option value="Tanh">Tanh</option>
                </select>
              </div>

              <div className="space-y-2 group">
                <label className="block text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                  Dropout Rate
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    step="0.1"
                    min="0"
                    max="1"
                    value={config.dropoutRate}
                    onChange={(e) => onChange({ ...config, dropoutRate: Number(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">{config.dropoutRate}</span>
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="block text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                  Hidden Channels
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.hiddenChannels}
                  onChange={(e) => onChange({ ...config, hiddenChannels: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm hover:border-primary-light"
                />
              </div>

              <div className="space-y-2 group">
                <label className="block text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                  Number of Layers
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.numLayers}
                  onChange={(e) => onChange({ ...config, numLayers: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm hover:border-primary-light"
                />
              </div>

              <div className="space-y-2 group">
                <label className="block text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                  Test Size (0-1)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.99"
                  value={config.testSize}
                  onChange={(e) => onChange({ ...config, testSize: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm hover:border-primary-light"
                />
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end space-x-3 pt-4 mt-2">
                <button
                  onClick={() => setExpanded(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="px-4 py-2 bg-primary border border-transparent rounded-lg text-sm font-medium text-white hover:bg-primary-dark transition-colors shadow-sm"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedModelConfig;