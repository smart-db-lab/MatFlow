import React from 'react';
import { useSelector } from 'react-redux';
import { HiHome } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

// Function tree structure to find parent categories
const functionTreeData = [
  {
    id: '0',
    label: 'Dataset',
    children: [
      { id: '0-0', label: 'Display' },
      { id: '0-1', label: 'Information' },
      { id: '0-2', label: 'Statistics' },
      { id: '0-3', label: 'Corelation' },
      { id: '0-4', label: 'Duplicate' },
      { id: '0-5', label: 'Group' },
    ],
  },
  {
    id: '1',
    label: 'EDA',
    children: [],
  },
  {
    id: '2',
    label: 'Feature Engineering',
    children: [
      { id: '2-0', label: 'Add/Modify' },
      { id: '2-1', label: 'Change Dtype' },
      { id: '2-2', label: 'Alter Field Name' },
      { id: '2-3', label: 'Imputation' },
      { id: '2-4', label: 'Encoding' },
      { id: '2-5', label: 'Scaling' },
      { id: '2-6', label: 'Drop Column' },
      { id: '2-7', label: 'Drop Rows' },
      { id: '2-9', label: 'Append Dataset' },
      { id: '2-10', label: 'Merge Dataset' },
      { id: '2-11', label: 'Feature Selection' },
      { id: '2-12', label: 'Cluster' },
      { id: '2-13', label: 'Best Scaler' },
    ],
  },
  {
    id: '3',
    label: 'Final Dataset',
    children: [],
  },
  {
    id: '4',
    label: 'Pipeline',
    children: [],
  },
  {
    id: '5',
    label: 'ForwardML',
    children: [
      {
        id: '5-0',
        label: 'Model Building',
        children: [
          { id: '5-0-0', label: 'Split Dataset' },
          { id: '5-0-1', label: 'Build Model' },
          { id: '5-0-2', label: 'Model Evaluation' },
          { id: '5-0-3', label: 'Model Prediction' },
          { id: '5-0-4', label: 'Models' },
        ],
      },
      { id: '5-1', label: 'Model Deployment' },
      { id: '5-2', label: 'Time Series Analysis' },
    ],
  },
  {
    id: '8',
    label: 'ReverseML',
    children: [
      { id: '8-2', label: 'PSO' },
      { id: '8-3', label: 'Feature Selection' },
      { id: '8-4', label: 'SMILES Generation' },
      { id: '8-5', label: 'SMILES to IUPAC' },
      { id: '8-6', label: 'SMILES to Synthetic Score' },
      { id: '8-7', label: 'SMILES to DFT' },
      { id: '8-8', label: 'SMILES Structure' },
    ],
  },
];

// Helper function to find all parent categories for a function (returns array from top to bottom)
const findAllParentCategories = (functionLabel) => {
  const findInTree = (nodes, targetLabel, parentPath = []) => {
    for (const node of nodes) {
      // Check if this node matches
      if (node.label === targetLabel) {
        return parentPath; // Return all parents in order
      }
      // Check children
      if (node.children) {
        const newPath = [...parentPath, node.label];
        const found = findInTree(node.children, targetLabel, newPath);
        if (found !== null) {
          return found;
        }
      }
    }
    return null;
  };

  return findInTree(functionTreeData, functionLabel);
};

function Breadcrumb({ projectName }) {
  const activeFunction = useSelector((state) => state.sideBar.activeFunction);
  const activeFile = useSelector((state) => state.uploadedFile.activeFile);
  const navigate = useNavigate();

  // Build breadcrumb items based on current state
  const breadcrumbItems = [];

  // Always start with Home
  breadcrumbItems.push({
    label: 'Home',
    isActive: false,
    onClick: () => navigate('/dashboard'),
  });

  // Add project name if available (replaces generic "File" with project context)
  if (projectName && projectName.trim()) {
    breadcrumbItems.push({
      label: projectName,
      isActive: false,
    });
  }

  // Find and add all parent categories if function exists
  if (activeFunction) {
    const parentCategories = findAllParentCategories(activeFunction);
    if (parentCategories && parentCategories.length > 0) {
      // Add all parent categories in order
      parentCategories.forEach((parentLabel) => {
        breadcrumbItems.push({
          label: parentLabel,
          isActive: false,
        });
      });
    }
    
    // Add active function as the last item (current page)
    breadcrumbItems.push({
      label: activeFunction,
      isActive: true,
    });
  }

  // If no function, mark the last item as active (Home, or project name, or file)
  if (breadcrumbItems.length >= 1 && !activeFunction) {
    breadcrumbItems[breadcrumbItems.length - 1].isActive = true;
  }

  const handleHomeClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className="mb-3 pt-2 flex items-center gap-1.5">
      {/* Home Icon Button */}
      <button
        onClick={handleHomeClick}
        className="w-6 h-6 rounded-full bg-[#0D9488] hover:bg-[#0F766E] flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Go to Home"
      >
        <HiHome className="w-3 h-3 text-white" />
      </button>

      {/* Breadcrumb Items */}
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {/* Separator Arrow */}
          {index > 0 && (
            <span className="text-gray-400 mx-0.5">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          )}

          {/* Breadcrumb Item */}
          <span
            className={`text-sm font-medium ${
              item.isActive
                ? 'text-[#0D9488] cursor-default'
                : 'text-gray-700 hover:text-[#0D9488] cursor-pointer'
            } ${item.onClick ? 'transition-colors' : ''}`}
            onClick={item.onClick}
          >
            {item.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

export default Breadcrumb;
