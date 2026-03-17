import React from 'react';
import {
  PlusSquare,
  Type,
  PenLine,
  ShieldCheck,
  Binary,
  Gauge,
  Columns2,
  Rows2,
  DatabaseBackup,
  GitMerge,
  Funnel,
  Network,
  SlidersHorizontal,
} from 'lucide-react';

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

const featureIcons = {
  "Add/Modify": PlusSquare,
  "Change Dtype": Type,
  "Alter Field Name": PenLine,
  "Imputation": ShieldCheck,
  "Encoding": Binary,
  "Scaling": Gauge,
  "Drop Column": Columns2,
  "Drop Rows": Rows2,
  "Append Dataset": DatabaseBackup,
  "Merge Dataset": GitMerge,
  "Feature Selection": Funnel,
  "Cluster": Network,
  "Best Scaler": SlidersHorizontal,
};

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

function FeatureEngineeringSelector({ selectedType, onTypeChange }) {
  return (
    <div className="w-full pt-4 mb-4 pb-3 border-b border-gray-300">
      <div className="flex flex-wrap gap-2">
        {FEATURE_ENGINEERING_TYPES.map((type) => {
          const Icon = featureIcons[type];
          const isActive = selectedType === type;
          return (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 inline-flex items-center gap-1.5 ${
              isActive
                ? "bg-[#0D9488] text-white shadow-md"
                : "bg-white text-[#0F766E] border border-gray-300 hover:bg-[#0D9488]/10 hover:border-[#0D9488]"
            }`}
          >
            {Icon ? (
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-md border ${
                  isActive
                    ? "border-white/90 bg-white text-[#0D9488]"
                    : "border-[#0D9488]/20 bg-[#0D9488]/10 text-[#0D9488]"
                }`}
              >
                <Icon size={13} strokeWidth={2} />
              </span>
            ) : null}
            {displayNames[type] || type}
          </button>
          );
        })}
      </div>
    </div>
  );
}

export default FeatureEngineeringSelector;
