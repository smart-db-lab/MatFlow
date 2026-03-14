import React, { useState } from 'react';
import { TrendingUp, CheckCircle, AlertCircle, Loader, Edit2, Maximize2, Minimize2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import FileUpload from '../components/FileUpload';
import PredictionResults from '../components/PredictionResults';
import * as Papa from "papaparse";

const PredictionView = ({
  trainedModelBase64,
  modelConfig,
  predictionData,
  predictionFile,
  predictionFileInputRef,
  setPredictionFile,
  setPredictionData,
  handleRunPrediction,
  isLoadingPredictions,
  predictionResults
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handlePredictionFileChange = (e) => {
    if (!e.target.files[0]) return;
    setPredictionFile(e.target.files[0]);
    Papa.parse(e.target.files[0], {
      header: true,
      complete: (results) => {
        setPredictionData(results.data);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Model Prediction</h2>
        <p className="text-gray-500">Upload data to generate predictions with your trained model</p>
      </div>

      <div className={`grid ${isFullScreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
        <div className="space-y-6">
          <div className={`rounded-xl shadow-sm border overflow-hidden ${
            trainedModelBase64 
              ? 'border-green-200 bg-green-50/30' 
              : 'border-red-200 bg-red-50/30'
          }`}>
            <div className="p-6 border-b border-inherit">
              <h3 className="text-lg font-bold flex items-center">
                {trainedModelBase64 ? (
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-3 text-red-600" />
                )}
                <span className={trainedModelBase64 ? 'text-green-800' : 'text-red-800'}>
                  Model Status
                </span>
              </h3>
            </div>

            <div className="p-6">
              {trainedModelBase64 ? (
                <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-green-100">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Model loaded and ready</p>
                    <p className="text-xs text-gray-500">Graph architecture: {modelConfig.architecture.toUpperCase()}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-red-100">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">No trained model available</p>
                    <p className="text-xs text-gray-500">Please train a model first</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <TrendingUp className="w-5 h-5 mr-3 text-primary" />
                Prediction Data
              </h3>
            </div>

            <div className="p-6">
              <FileUpload
                file={predictionFile}
                fileData={predictionData}
                inputRef={predictionFileInputRef}
                onFileChange={handlePredictionFileChange}
                type="prediction"
                disabled={!trainedModelBase64}
              />
              {!predictionFile && (
                <div className="mt-4 text-center rounded-lg border-2 border-dashed border-gray-300 p-8 bg-gray-50">
                  <p className="text-gray-500">Drag and drop your dataset here or click to browse</p>
                  <p className="text-xs text-gray-400 mt-2">Supported format: CSV</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Preview with Fullscreen Toggle */}
        {predictionData && (
          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col transition-all hover:shadow-lg ${isFullScreen ? 'mt-8' : ''}`}>
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-white flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Edit2 className="w-5 h-5 mr-3 text-primary" />
                Prediction Data Preview
              </h3>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                  {predictionData.length} rows
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
              <DataTable
                data={predictionData}
                onEdit={(rowIndex, columnName, value) => {
                  const newData = [...predictionData];
                  newData[rowIndex][columnName] = value;
                  setPredictionData(newData);
                }}
              />
            </div>

            <button
              onClick={handleRunPrediction}
              disabled={!trainedModelBase64 || isLoadingPredictions}
              className={`w-full bg-gradient-to-r from-primary to-primary-dark text-white p-3 rounded-lg
                        hover:from-primary-dark hover:to-primary-dark transition-all disabled:opacity-50
                        shadow-sm disabled:shadow-none font-medium flex items-center justify-center
                        ${isLoadingPredictions ? 'opacity-70' : ''}`}
            >
              {isLoadingPredictions ? (
                <>
                  <Loader className="animate-spin w-4 h-4 mr-2" />
                  Generating Predictions...
                </>
              ) : (
                <>
                  Run Predictions
                  <TrendingUp className="w-4 h-4 ml-2" />
                </>
              )}
            </button>

          </div>
        )}
      </div>

      {/* Prediction Results */}
      <PredictionResults
        predictionResults={predictionResults}
        isLoading={isLoadingPredictions}
      />
    </div>
  );
};

export default PredictionView;