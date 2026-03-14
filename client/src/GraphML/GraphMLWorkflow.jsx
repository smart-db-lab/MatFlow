import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import * as Papa from 'papaparse';
import StepNavigation from './components/StepNavigation';
import TrainingView from './views/TrainingView';
import PredictionView from './views/PredictionView';
import { apiService } from '../services/api/apiService';

const GraphMLWorkflow = () => {
  const [activeStep, setActiveStep] = useState('training');

  // File & data states
  const [uploadedTrainingFile, setUploadedTrainingFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [editableData, setEditableData] = useState(null);

  // Model configs
  const [modelConfig, setModelConfig] = useState({
    architecture: '',
    learningRate: 0.01,
    epochs: 50,
    heads: 4,
    batchSize: 32,
    activation: 'ReLU',
    dropoutRate: 0.2,
    hiddenChannels: 64,
    numLayers: 2,
    testSize: 0.2
  });

  const [isTraining, setIsTraining] = useState(false);

  // Training results state
  const [trainingResults, setTrainingResults] = useState({
    trainingTime: null,
    lossGraph: null,
    r2Graph: null,
    maeGraph: null,
    rmseGraph: null,
    finalTestMetrics: {},
    dataFrame: null
  });

  // Prediction states
  const [trainedModelBase64, setTrainedModelBase64] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [predictionFile, setPredictionFile] = useState(null);
  const [predictionResults, setPredictionResults] = useState([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);

  const fileInputRef = useRef(null);
  const predictionFileInputRef = useRef(null);

  // File Upload Handler
  const handleFileUpload = (file) => {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setUploadedTrainingFile(file);
        setParsedData(results.data);
        setEditableData(results.data);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        alert('Error parsing CSV file. Please check the file format.');
      }
    });
  };

  // Data Edit Handler
  const handleDataEdit = (rowIndex, columnName, value) => {
    const newData = [...editableData];
    newData[rowIndex][columnName] = value;
    setEditableData(newData);
  };

  // Train Model Handler
  const handleModelTrain = async () => {
    try {
      setIsTraining(true);
      if (!uploadedTrainingFile || !modelConfig.architecture) {
        throw new Error('Please upload a training file and select a model architecture');
      }

      const initialFormData = new FormData();
      initialFormData.append('file', uploadedTrainingFile);
      initialFormData.append('format', 'separate');

      const processedData = await apiService.matflow.graphML.reformat(initialFormData);

      const dataProcessFormData = new FormData();
      dataProcessFormData.append('graph_name', modelConfig.architecture);
      dataProcessFormData.append('nodes', processedData.nodes);
      dataProcessFormData.append('edges', processedData.edges);
      dataProcessFormData.append('targets', processedData.targets);

      const dataProcessJson = await apiService.matflow.graphML.processData(dataProcessFormData);

      const modelTrainingFormData = new FormData();
      modelTrainingFormData.append('graph_name', modelConfig.architecture);
      modelTrainingFormData.append('graph_data', dataProcessJson.graph_data);

      Object.keys(modelConfig).forEach((key) => {
        modelTrainingFormData.append(key, modelConfig[key]);
      });

      const result = await apiService.matflow.graphML.trainModel(modelTrainingFormData);

      if (result.model_data) {
        setTrainedModelBase64(result.model_data);
      }

      setTrainingResults({
        trainingTime: result.trainingTime || `${result.training_duration} seconds`,
        lossGraph: result.loss_graph ? JSON.parse(result.loss_graph) : null,
        r2Graph: result.r2_graph ? JSON.parse(result.r2_graph) : null,
        maeGraph: result.mae_graph ? JSON.parse(result.mae_graph) : null,
        rmseGraph: result.rmse_graph ? JSON.parse(result.rmse_graph) : null,
        finalTestMetrics: result.final_test_metrics || {},
        dataFrame: result.dataframe ? JSON.parse(result.dataframe) : null
      });

    } catch (error) {
      console.error('Model training error:', error);
      alert(error.message || 'An error occurred during model training');
    } finally {
      setIsTraining(false);
    }
  };

  // Run Prediction Handler
  const handleRunPrediction = async () => {
    if (!trainedModelBase64) {
      alert('No trained model in memory. Please train first!');
      return;
    }

    if (!predictionData || predictionData.length === 0) {
      alert('No prediction data uploaded!');
      return;
    }

    setIsLoadingPredictions(true);

    try {
      const csvString = Papa.unparse(predictionData);
      const csvBlob = new Blob([csvString], { type: 'text/csv' });

      const initialFormData = new FormData();
      initialFormData.append('file', csvBlob, 'prediction.csv');
      initialFormData.append('format', 'separate');

      const processedData = await apiService.matflow.graphML.reformat(initialFormData);

      const predictionFormData = new FormData();
      predictionFormData.append('graph_name', modelConfig.architecture);
      predictionFormData.append('nodes', processedData.nodes);
      predictionFormData.append('edges', processedData.edges);
      predictionFormData.append('targets', processedData.targets);
      predictionFormData.append('model_data', trainedModelBase64);

      const responseData = await apiService.matflow.graphML.deployModel(predictionFormData);
      setPredictionResults(responseData.predictions);

    } catch (error) {
      console.error('Prediction error:', error);
      alert(error.message || 'An error occurred during prediction');
    } finally {
      setIsLoadingPredictions(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Graph Machine Learning Workflow
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            An end-to-end pipeline for training and deploying graph neural networks
          </p>
        </motion.div>

        <StepNavigation activeStep={activeStep} setActiveStep={setActiveStep} />

        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6 min-h-[600px]"
        >
          {activeStep === 'training' ? (
            <TrainingView
              uploadedTrainingFile={uploadedTrainingFile}
              editableData={editableData}
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              handleDataEdit={handleDataEdit}
              modelConfig={modelConfig}
              setModelConfig={setModelConfig}
              handleModelTrain={handleModelTrain}
              isTraining={isTraining}
              trainingResults={trainingResults}
            />
          ) : (
            <PredictionView
              trainedModelBase64={trainedModelBase64}
              modelConfig={modelConfig}
              predictionData={predictionData}
              predictionFile={predictionFile}
              predictionFileInputRef={predictionFileInputRef}
              setPredictionFile={setPredictionFile}
              setPredictionData={setPredictionData}
              handleRunPrediction={handleRunPrediction}
              isLoadingPredictions={isLoadingPredictions}
              predictionResults={predictionResults}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default GraphMLWorkflow;