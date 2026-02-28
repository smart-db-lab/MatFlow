import React from 'react';
import { motion } from 'framer-motion';
import { Layers, TrendingUp } from 'lucide-react';

const StepNavigation = ({ activeStep, setActiveStep }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: activeStep === 'training' ? 1 : 0.7,
          scale: activeStep === 'training' ? 1 : 0.98
        }}
        whileHover={{ scale: activeStep === 'training' ? 1 : 1.02 }}
        onClick={() => setActiveStep('training')}
        className={`
          cursor-pointer rounded-xl p-5 shadow-xs transition-all 
          ${
            activeStep === 'training'
              ? 'bg-white border-2 border-primary shadow-sm'
              : 'bg-white hover:bg-gray-50 border border-gray-200'
          }`}
      >
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${
            activeStep === 'training' 
              ? 'bg-primary/10 text-primary' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Model Training
            </h3>
            <p className="text-sm text-gray-500">
              Train your graph neural network
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: activeStep === 'prediction' ? 1 : 0.7,
          scale: activeStep === 'prediction' ? 1 : 0.98
        }}
        whileHover={{ scale: activeStep === 'prediction' ? 1 : 1.02 }}
        onClick={() => setActiveStep('prediction')}
        className={`
          cursor-pointer rounded-xl p-5 shadow-xs transition-all 
          ${
            activeStep === 'prediction'
              ? 'bg-white border-2 border-primary shadow-sm'
              : 'bg-white hover:bg-gray-50 border border-gray-200'
          }`}
      >
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${
            activeStep === 'prediction' 
              ? 'bg-primary/10 text-primary' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Predictions</h3>
            <p className="text-sm text-gray-500">
              Generate predictions with trained model
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StepNavigation;