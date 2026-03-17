import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveFunction } from '../../../Slices/SideBarSlice';
import FeatureEngineeringSelector from '../../Components/FeatureEngineeringSelector/FeatureEngineeringSelector';
import AddModify from './AddModify/AddModify';
import AlterFieldName from './AlterFieldName/AlterFieldName';
import AppendDataset from './AppendDataset/AppendDataset';
import ChangeDType from './ChangeDType/ChangeDType';
import Cluster from './Cluster/Cluster';
import DropColumn from './DropColumn/DropColumn';
import DropRow from './DropRow/DropRow';
import Encoding from './Encoding/Encoding';
import FeatureSelection from '../InvML/FeatureSelection/FeatureSelection';
import MergeDataset from './MergeDataset/MergeDataset';
import Scaling from './Scaling/Scaling';
import Imputation from './Imputation/Imputation';
import ScalerEvaluationPage from '../InvML/BestScaler/ScalerEvaluation.jsx';

const FEATURE_ENGINEERING_TYPES = [
  "Add/Modify",
  "Change Dtype",
  "Alter Field Name",
  "Imputation",
  "Encoding",
  "Scaling",
  "Drop Column",
  "Drop Rows",
  "Append Dataset",
  "Merge Dataset",
  "Feature Selection",
  "Cluster",
  "Best Scaler"
];

const displayNames = {
  "Add/Modify": "Add/Modify Column",
  "Change Dtype": "Change Data Type",
  "Alter Field Name": "Rename Column",
  "Imputation": "Fill Missing Values",
  "Encoding": "Format Categories",
  "Scaling": "Scale Features",
  "Drop Column": "Remove Column",
  "Drop Rows": "Remove Rows",
  "Append Dataset": "Append Dataset",
  "Merge Dataset": "Merge Datasets",
  "Feature Selection": "Find Key Features",
  "Cluster": "Group Data",
  "Best Scaler": "Compare Scalers",
};

const FEATURE_DESCRIPTIONS = {
  "Add/Modify": "Create new columns using mathematical formulas or modify existing ones.",
  "Change Dtype": "Convert columns between numeric, text, or categorical data types.",
  "Alter Field Name": "Rename columns in your dataset for better clarity.",
  "Imputation": "Fill in missing values using statistical methods like mean, median, or KNN.",
  "Encoding": "Convert categorical text data into numerical format for analysis.",
  "Scaling": "Normalize or standardize numerical features to a common scale.",
  "Drop Column": "Remove unwanted columns from your dataset.",
  "Drop Rows": "Remove specific rows based on conditions or indices.",
  "Append Dataset": "Add rows from another dataset to the bottom of your current data.",
  "Merge Dataset": "Join another dataset horizontally using a common key column.",
  "Feature Selection": "Identify and keep the most important predictive features.",
  "Cluster": "Algorithmically group similar data points together.",
  "Best Scaler": "Evaluate and compare different scaling methods on your data."
};

function UnifiedFeatureEngineering({ csvData }) {
  const activeFunction = useSelector((state) => state.sideBar.activeFunction);
  const dispatch = useDispatch();
  const [selectedType, setSelectedType] = useState("Add/Modify");

  // Sync selectedType with activeFunction when it's a feature engineering type
  useEffect(() => {
    if (activeFunction && FEATURE_ENGINEERING_TYPES.includes(activeFunction)) {
      setSelectedType(activeFunction);
    } else if (activeFunction === 'Feature Engineering') {
      setSelectedType("Add/Modify");
    }
  }, [activeFunction]);

  const handleTypeChange = (type) => {
    setSelectedType(type);
    dispatch(setActiveFunction(type));
    localStorage.setItem('activeFunction', type);
  };

  // Render component based on selected type
  const renderComponent = () => {
    switch (selectedType) {
      case "Add/Modify":
        return <AddModify csvData={csvData} />;
      case "Change Dtype":
        return <ChangeDType csvData={csvData} />;
      case "Alter Field Name":
        return <AlterFieldName csvData={csvData} />;
      case "Imputation":
        return <Imputation csvData={csvData} />;
      case "Encoding":
        return <Encoding csvData={csvData} />;
      case "Scaling":
        return <Scaling csvData={csvData} />;
      case "Drop Column":
        return <DropColumn csvData={csvData} />;
      case "Drop Rows":
        return <DropRow csvData={csvData} />;
      case "Append Dataset":
        return <AppendDataset csvData={csvData} />;
      case "Merge Dataset":
        return <MergeDataset csvData={csvData} />;
      case "Feature Selection":
        return <FeatureSelection csvData={csvData} />;
      case "Cluster":
        return <Cluster csvData={csvData} />;
      case "Best Scaler":
        return <ScalerEvaluationPage csvData={csvData} />;
      default:
        return <AddModify csvData={csvData} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <FeatureEngineeringSelector
        selectedType={selectedType}
        onTypeChange={handleTypeChange}
      />
      
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 bg-teal-50/50 border-b border-teal-100 mb-4 rounded-lg flex items-start gap-3">
           <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
             <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
           </div>
           <div>
             <h3 className="text-sm font-bold text-teal-800">{displayNames[selectedType] || selectedType}</h3>
             <p className="text-[13px] text-teal-600/90 mt-0.5 leading-relaxed">{FEATURE_DESCRIPTIONS[selectedType]}</p>
           </div>
        </div>
        <div className="py-2">
          {renderComponent()}
        </div>
      </div>
    </div>
  );
}

export default UnifiedFeatureEngineering;
