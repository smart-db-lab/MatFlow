import React, { useState } from 'react';
import { Upload, Edit2, Cpu, ChevronRight, Loader, BarChart2, Settings, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import FileUpload from '../components/FileUpload';
import { motion, AnimatePresence } from 'framer-motion';
import TrainingResultsView from "../components/TrainingResults.jsx";

const TrainingView = ({
  uploadedTrainingFile,
  editableData,
  fileInputRef,
  handleFileUpload,
  handleDataEdit,
  modelConfig,
  setModelConfig,
  handleModelTrain,
  isTraining,
  trainingResults
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Architecture info cards
  const getArchitectureInfo = () => {
    if (!modelConfig.architecture) return null;

    const architectureDetails = {
      gcn: {
        title: "Graph Convolutional Network",
        // description: "Uses spectral convolution operations on graphs. Best for node classification and link prediction.",
        color: "bg-indigo-50 border-indigo-100 text-indigo-800"
      },
      gat: {
        title: "Graph Attention Network",
        // description: "Learns to assign different weights to different neighbor nodes. Ideal for heterogeneous graphs.",
        color: "bg-purple-50 border-purple-100 text-purple-800"
      },
      graphsage: {
        title: "GraphSAGE",
        // description: "Uses neighbor sampling and aggregation. Performs well on large-scale graphs and inductive learning.",
        color: "bg-primary/10 border-primary/20 text-primary-dark"
      }
    };

    const details = architectureDetails[modelConfig.architecture];
    if (!details) return null;

    return (
      <div className={`mt-4 p-4 ${details.color} border rounded-lg shadow-sm`}>
        <h4 className="font-semibold mb-1">{details.title}</h4>
        <p className="text-sm opacity-90">{details.description}</p>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Model Training</h2>
        <p className="text-gray-500">Upload your graph data, configure your model, and start training</p>
      </div>

      {/* Training Data Upload Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all hover:shadow-lg">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-white">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Upload className="w-5 h-5 mr-3 text-primary" />
            Training Data
          </h3>
        </div>
        <div className="p-6">
          <FileUpload
            file={uploadedTrainingFile}
            fileData={editableData}
            inputRef={fileInputRef}
            onFileChange={(e) => handleFileUpload(e.target.files[0])}
            type="training"
          />
          {!uploadedTrainingFile && (
            <div className="mt-4 text-center rounded-lg border-2 border-dashed border-gray-300 p-8 bg-gray-50">
              <p className="text-gray-500">Drag and drop your dataset here or click to browse</p>
              <p className="text-xs text-gray-400 mt-2">Supported format: CSV</p>
            </div>
          )}
        </div>
      </div>

      {/* Data Preview and Model Config Section (when file is uploaded) */}
      {uploadedTrainingFile && (
        <div className={`grid ${isFullScreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-8`}>
          {/* Data Preview */}
          {editableData && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 h-full flex flex-col transition-all hover:shadow-lg">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-white flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <Edit2 className="w-5 h-5 mr-3 text-primary" />
                  Data Preview
                </h3>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                    {editableData.length} rows
                  </span>
                  <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="p-1.5 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                  >
                    {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className={`flex-grow overflow-hidden p-4 ${isFullScreen ? 'h-96' : ''}`}>
                <DataTable data={editableData} onEdit={handleDataEdit} />
              </div>
            </div>
          )}

          {/* Model Configuration */}
          <div className={`bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all hover:shadow-lg ${isFullScreen ? 'mt-8' : ''}`}>
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-white">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Cpu className="w-5 h-5 mr-3 text-primary" />
                Model Configuration
                {modelConfig.architecture && (
                  <span className="ml-3 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary-dark">
                    {modelConfig.architecture.toUpperCase()}
                  </span>
                )}
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model Architecture
                  </label>
                  <select
                    value={modelConfig.architecture}
                    onChange={(e) =>
                      setModelConfig((prev) => ({
                        ...prev,
                        architecture: e.target.value
                      }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                  >
                    <option value="">Select Model Type</option>
                    <option value="gcn">Graph Convolutional Network (GCN)</option>
                    <option value="gat">Graph Attention Network (GAT)</option>
                    <option value="graphsage">GraphSAGE</option>
                  </select>

                  {getArchitectureInfo()}
                </div>

                {/* Advanced Configuration Toggle */}
                {modelConfig.architecture && (
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center">
                      <Settings className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Advanced Configuration</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {/* Advanced Config Panel */}
                <AnimatePresence>
                  {showAdvanced && modelConfig.architecture && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Learning Rate
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            value={modelConfig.learningRate}
                            onChange={(e) => setModelConfig({ ...modelConfig, learningRate: Number(e.target.value) })}
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Number of Epochs
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={modelConfig.epochs}
                            onChange={(e) => setModelConfig({ ...modelConfig, epochs: Number(e.target.value) })}
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Batch Size
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={modelConfig.batchSize}
                            onChange={(e) => setModelConfig({ ...modelConfig, batchSize: Number(e.target.value) })}
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Activation Function
                          </label>
                          <select
                            value={modelConfig.activation}
                            onChange={(e) => setModelConfig({ ...modelConfig, activation: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                          >
                            <option value="ReLU">ReLU</option>
                            <option value="LeakyReLU">LeakyReLU</option>
                            <option value="Sigmoid">Sigmoid</option>
                            <option value="Tanh">Tanh</option>
                          </select>
                        </div>

                        {modelConfig.architecture === 'gat' && (
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Attention Heads
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={modelConfig.heads}
                              onChange={(e) => setModelConfig({ ...modelConfig, heads: Number(e.target.value) })}
                              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Dropout Rate
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="range"
                              step="0.1"
                              min="0"
                              max="1"
                              value={modelConfig.dropoutRate}
                              onChange={(e) => setModelConfig({ ...modelConfig, dropoutRate: Number(e.target.value) })}
                              className="w-full"
                            />
                            <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">{modelConfig.dropoutRate}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Hidden Channels
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={modelConfig.hiddenChannels}
                            onChange={(e) => setModelConfig({ ...modelConfig, hiddenChannels: Number(e.target.value) })}
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Number of Layers
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={modelConfig.numLayers}
                            onChange={(e) => setModelConfig({ ...modelConfig, numLayers: Number(e.target.value) })}
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Test Size (0-1)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="0.99"
                            value={modelConfig.testSize}
                            onChange={(e) => setModelConfig({ ...modelConfig, testSize: Number(e.target.value) })}
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Train Button (Always visible) */}
                <button
                  onClick={handleModelTrain}
                  disabled={!uploadedTrainingFile || !modelConfig.architecture || isTraining}
                  className={`w-full bg-gradient-to-r from-primary to-primary-dark text-white p-4 rounded-lg
                          hover:from-primary-dark hover:to-primary-dark transition-all disabled:opacity-50
                          shadow-md disabled:shadow-none font-medium flex items-center justify-center
                          ${isTraining ? 'opacity-70' : ''}`}
                >
                  {isTraining ? (
                    <>
                      <Loader className="animate-spin w-5 h-5 mr-2" />
                      Training Model...
                    </>
                  ) : (
                    <>
                      Train Model
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Training Results Summary */}
      {trainingResults && (
        <TrainingResultsView
          results={trainingResults}
        />
      )}
    </div>
  );
};

export default TrainingView;