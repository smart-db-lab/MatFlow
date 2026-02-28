import React from 'react';
import { CheckCircle, Upload, TrendingUp } from 'lucide-react';

const FileUpload = ({
  file,
  fileData,
  inputRef,
  onFileChange,
  type = 'training',
  disabled = false
}) => {
  const isTraining = type === 'training';
  const hasFile = file && fileData;

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
        hasFile 
          ? 'border-green-200 bg-green-50/50' 
          : 'border-gray-300 hover:border-primary-light hover:bg-primary/5'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={() => inputRef.current.click()}
    >
      <input
        type="file"
        accept=".csv"
        ref={inputRef}
        onChange={onFileChange}
        className="hidden"
        disabled={disabled}
      />

      {hasFile ? (
        <div className="flex flex-col items-center">
          <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
          <h4 className="text-md font-medium text-gray-800 mb-1">
            {file.name}
          </h4>
          <p className="text-sm text-gray-500 mb-3">
            {fileData.length} rows loaded
          </p>
          <button
            className="text-sm text-primary hover:text-primary-dark font-medium"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current.click();
            }}
          >
            Replace file
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isTraining ? 'bg-primary/10 text-primary' : 'bg-purple-100 text-purple-600'
          }`}>
            {isTraining ? (
              <Upload className="w-6 h-6" />
            ) : (
              <TrendingUp className="w-6 h-6" />
            )}
          </div>
          <h4 className="text-md font-medium text-gray-800 mb-1">
            {isTraining ? 'Upload your training dataset' : 'Upload prediction dataset'}
          </h4>
          <p className="text-sm text-gray-500">
            CSV format recommended
          </p>
          {disabled && !isTraining && (
            <p className="text-xs text-red-500 mt-2">
              Train a model first to enable predictions
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;