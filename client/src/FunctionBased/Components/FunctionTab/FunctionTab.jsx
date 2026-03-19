import React, { useEffect, useState } from 'react';
import { AiOutlineLineChart } from 'react-icons/ai';
import { HiOutlineDocumentReport, HiOutlinePuzzle } from 'react-icons/hi';
import { MdOutlineDataset } from 'react-icons/md';
import { RxGear, RxRocket } from 'react-icons/rx';
import { SlMagnifier } from 'react-icons/sl';
import { TbBrain } from 'react-icons/tb';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveFunction } from '../../../Slices/SideBarSlice';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import { styled } from '@mui/material';
import { PiGraph } from 'react-icons/pi';
import { useParams } from 'react-router-dom';
import { getProjectSessionKey, sessionGetJson, sessionGetString, sessionSetJson, sessionSetString } from '../../../util/sessionProjectStorage';
import { toast } from 'react-toastify';

const StyledTreeItem = styled(TreeItem)(({ theme }) => ({
  color: '#374151',
  '& .MuiTreeItem-content': {
    color: '#374151 !important',
    backgroundColor: 'transparent !important',
    padding: '8px 4px',
    borderRadius: '4px',
    transition: 'background-color 160ms ease, color 160ms ease',
    '&.Mui-expanded': {
      borderLeft: '1px solid #e5e7eb',
      backgroundColor: 'transparent !important',
      color: '#374151 !important',
      '&:hover': {
        backgroundColor: 'rgba(59, 130, 246, 0.1) !important',
        color: '#0D9488 !important',
      },
    },
    '&.Mui-selected': {
      backgroundColor: '#0D9488 !important',
      color: '#FFFFFF !important',
      '&:hover': {
        backgroundColor: '#0F766E !important',
        color: '#FFFFFF !important',
      },
    },
    '&.Mui-focused:not(.Mui-selected)': {
      backgroundColor: 'transparent !important',
      outline: 'none',
      color: '#374151 !important',
    },
    '&:hover:not(.Mui-selected)': {
      backgroundColor: 'rgba(59, 130, 246, 0.1) !important',
      color: '#0D9488 !important',
    },
  },
  '& .MuiTreeItem-group': {
    marginLeft: '16px',
    borderLeft: '1px solid #e5e7eb',
    paddingLeft: '12px',
    transition: 'padding 180ms ease, border-color 180ms ease',
  },
  '& .MuiTreeItem-groupTransition': {
    transition: 'opacity 180ms ease, transform 180ms ease',
    transformOrigin: 'top left',
  },
  '& .MuiTreeItem-groupTransition.MuiCollapse-entered': {
    opacity: 1,
    transform: 'translateY(0)',
  },
  '& .MuiTreeItem-groupTransition.MuiCollapse-hidden': {
    opacity: 0,
    transform: 'translateY(-2px)',
  },
  '& .MuiTreeItem-label': {
    color: 'inherit !important',
    fontSize: '0.875rem',
    fontWeight: 'inherit',
  },
  '& .MuiTreeItem-iconContainer': {
    color: '#6b7280',
    '& svg': {
      fontSize: '1rem',
    },
  },
  '& .MuiTreeItem-content.Mui-selected .MuiTreeItem-iconContainer': {
    color: '#FFFFFF !important',
  },
  '& .MuiTreeItem-content:hover .MuiTreeItem-iconContainer': {
    color: '#0D9488 !important',
  },
  '& .MuiTreeItem-content.Mui-selected:hover .MuiTreeItem-iconContainer': {
    color: '#FFFFFF !important',
  },
}));

const iconColorForLabel = (label = '') => {
  const key = label.toLowerCase();
  if (key.includes('forwardml') || key.includes('computational ml model')) return '#2563eb';
  if (key.includes('reverseml')) return '#ea580c';
  if (key.includes('dataset')) return '#0D9488';
  if (key.includes('explore dataset')) return '#0D9488';
  if (key.includes('model')) return '#2563eb';
  if (key.includes('feature')) return '#7c3aed';
  if (key.includes('materials descriptor generation')) return '#7c3aed';
  if (key.includes('time')) return '#0284c7';
  if (key.includes('reverse') || key.includes('smiles')) return '#ea580c';
  if (key.includes('evaluation')) return '#0ea5e9';
  if (key.includes('prediction')) return '#16a34a';
  if (key.includes('split')) return '#a16207';
  if (key.includes('statistics') || key.includes('correlation')) return '#0891b2';
  if (key.includes('group')) return '#9333ea';
  if (key.includes('information')) return '#4f46e5';
  if (key.includes('duplicate')) return '#dc2626';
  if (key.includes('display')) return '#0d9488';
  if (key.includes('eda')) return '#14b8a6';
  if (key.includes('exploratory data analysis') || key.includes('visual data analysis')) return '#14b8a6';
  return '#6b7280';
};

const iconBadgeForLabel = (label = '') => {
  const key = label.toLowerCase();
  if (key.includes('forwardml') || key.includes('computational ml model') || key.includes('model')) {
    return { bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb' };
  }
  if (key.includes('feature')) {
    return { bg: '#f5f3ff', border: '#ddd6fe', color: '#7c3aed' };
  }
  if (key.includes('materials descriptor generation')) {
    return { bg: '#f5f3ff', border: '#ddd6fe', color: '#7c3aed' };
  }
  if (key.includes('reverseml') || key.includes('smiles') || key.includes('pso')) {
    return { bg: '#fff7ed', border: '#fed7aa', color: '#ea580c' };
  }
  if (key.includes('eda') || key.includes('statistics') || key.includes('correlation')) {
    return { bg: '#ecfeff', border: '#a5f3fc', color: '#0891b2' };
  }
  if (key.includes('exploratory data analysis') || key.includes('visual data analysis')) {
    return { bg: '#ecfeff', border: '#a5f3fc', color: '#0891b2' };
  }
  if (key.includes('final')) {
    return { bg: '#ecfdf5', border: '#a7f3d0', color: '#0f766e' };
  }
  if (key.includes('dataset') || key.includes('display') || key.includes('information') || key.includes('group')) {
    return { bg: '#f0fdfa', border: '#99f6e4', color: '#0D9488' };
  }
  return { bg: '#f8fafc', border: '#e2e8f0', color: '#64748b' };
};

const getNodeIcon = (label = '', hasChildren = false) => {
  const key = label.toLowerCase();

  if (key.includes('pso')) return <HubOutlinedIcon fontSize="small" />;
  if (key.includes('smiles generation')) return <AutoAwesomeOutlinedIcon fontSize="small" />;
  if (key.includes('smiles to iupac')) return <TranslateOutlinedIcon fontSize="small" />;
  if (key.includes('smiles to synthetic score')) return <QueryStatsOutlinedIcon fontSize="small" />;
  if (key.includes('smiles to dft')) return <ScienceOutlinedIcon fontSize="small" />;
  if (key.includes('smiles structure')) return <BiotechOutlinedIcon fontSize="small" />;
  if (key.includes('dataset')) return <MdOutlineDataset size={18} />;
  if (key.includes('eda')) return <SlMagnifier size={17} />;
  if (key.includes('exploratory data analysis') || key.includes('visual data analysis')) return <SlMagnifier size={17} />;
  if (key.includes('feature')) return <RxGear size={17} />;
  if (key.includes('materials descriptor generation')) return <RxGear size={17} />;
  if (key.includes('forwardml') || key.includes('computational ml model') || key.includes('model building') || key.includes('generate predictive model')) return <TbBrain size={18} />;
  if (key.includes('reverseml')) return <HiOutlinePuzzle size={18} />;
  if (key.includes('final')) return <HiOutlineDocumentReport size={17} />;
  if (key.includes('split')) return <PiGraph size={16} />;
  if (key.includes('build')) return <RxRocket size={16} />;
  if (key.includes('evaluation')) return <AiOutlineLineChart size={16} />;
  if (key.includes('prediction')) return <PiGraph size={16} />;
  if (key.includes('deployment')) return <RxRocket size={16} />;
  if (key.includes('time')) return <AiOutlineLineChart size={16} />;
  if (key.includes('information')) return <HiOutlineDocumentReport size={16} />;
  if (key.includes('statistics')) return <AiOutlineLineChart size={16} />;
  if (key.includes('correlation')) return <PiGraph size={16} />;
  if (key.includes('duplicate')) return <HiOutlineDocumentReport size={16} />;
  if (key.includes('group')) return <HiOutlinePuzzle size={16} />;
  if (key.includes('display')) return <HiOutlineDocumentReport size={16} />;
  if (key.includes('smiles') || key.includes('pso')) return <HiOutlinePuzzle size={16} />;
  if (hasChildren) return <PiGraph size={16} />;
  return <AiOutlineLineChart size={16} />;
};

// Updated tree data structure with 'id' instead of 'key' for MUI X Tree View
const functionTreeData = [
  {
    id: '0',
    label: 'Explore Dataset',
    icon: <MdOutlineDataset size={18} />,
    children: [], // Dataset tools shown as tag buttons
  },
  {
    id: '1',
    label: 'Visual Data Analysis',
    icon: <SlMagnifier size={17} />,
    children: [],
  },
  {
    id: '2',
    label: 'Manage Material Properties',
    icon: <RxGear size={17} />,
    children: [], // No dropdown: access via tag buttons in the right panel
  },
  {
    id: '3',
    label: 'Model-Ready Dataset',
    icon: <HiOutlineDocumentReport size={17} />,
    children: [],
  },
  {
    id: '5',
    label: 'Generate Predictive Model',
    displayLabel: 'Generate Predictive Model',
    icon: <TbBrain size={18} />,
    children: [
      {
        id: '5-0',
        label: 'Split Dataset',
        displayLabel: 'Split Dataset Test-Train',
      },
      {
        id: '5-1',
        label: 'Build Model',
      },
      {
        id: '5-2',
        label: 'Model Prediction',
        displayLabel: 'Evaluate Model Performance',
      },
      {
        id: '5-3',
        label: 'Models',
        displayLabel: 'Saved Models',
      },
      {
        id: '5-4',
        label: 'Model Evaluation',
        displayLabel: 'Compare Models',
      },
    ],
  },
  {
    id: '6',
    label: 'Materials Property Prediction',
    icon: <RxRocket size={16} />,
    children: [
    ],
  },
  {
    id: '8',
    label: 'ReverseML',
    displayLabel: 'Generate New Materials',
    icon: <HiOutlinePuzzle size={18} />,
    children: [
      {
        id: '8-2',
        label: 'PSO',
      },
      // {
      //   id: '8-3',
      //   label: 'Feature Selection',
      // },
      {
        id: '8-4',
        label: 'SMILES Generation',
      },
      {
        id: '8-5',
        label: 'SMILES to IUPAC',
      },
      {
        id: '8-6',
        label: 'SMILES to Synthetic Score',
      },
      {
        id: '8-7',
        label: 'SMILES to DFT',
      },
      {
        id: '8-8',
        label: 'SMILES Structure',
      },
    ],
  },
];

function FunctionTab() {
  const { projectId } = useParams();
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const activeFunctionFromRedux = useSelector((state) => state.sideBar.activeFunction);
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState([]);
  const [selected, setSelected] = useState('');
  const scopedActiveFunctionKey = getProjectSessionKey('activeFunction', projectId);
  const scopedExpandedNodesKey = getProjectSessionKey('expandedNodes', projectId);
  const selectedDatasetName = (() => {
    const rawName = activeCsvFile?.name || '';
    if (!rawName) return '';
    const segments = rawName.split(/[\\/]/);
    return segments[segments.length - 1] || rawName;
  })();
  const activeFilePath = String(activeCsvFile?.name || '')
    .replace(/\\/g, '/')
    .toLowerCase();
  const chartExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.json'];
  const isChartSelected =
    activeFilePath.includes('/output/charts/') &&
    chartExtensions.some((ext) => activeFilePath.endsWith(ext));
  const isChartPreviewActive =
    String(activeFunctionFromRedux || '').trim().toLowerCase() === 'chart preview';
  const isFunctionTabBlocked = isChartSelected || isChartPreviewActive;
  const functionTabToastId = 'function-tab-select-dataset';

  const showSelectDatasetToast = () => {
    toast.info('To use functions, select a dataset first.', {
      toastId: functionTabToastId,
    });
  };

  const getAncestorPath = (nodeId) =>
    nodeId
      .split('-')
      .slice(0, -1)
      .reduce((acc, _, i, arr) => {
        acc.push(arr.slice(0, i + 1).join('-'));
        return acc;
      }, []);

  const sanitizeExpandedNodes = (nodeIds) => {
    const safeNodeIds = Array.isArray(nodeIds) ? nodeIds.filter(Boolean) : [];
    return [...new Set(safeNodeIds)];
  };

  const toSingleBranchExpandedNodes = (nodeIds) => {
    const safeNodeIds = sanitizeExpandedNodes(nodeIds);
    if (safeNodeIds.length === 0) return [];

    // Pick deepest node to avoid relying on array order from TreeView events.
    const pivotNodeId = safeNodeIds.reduce((deepest, current) => {
      const deepestDepth = deepest.split('-').length;
      const currentDepth = current.split('-').length;
      return currentDepth >= deepestDepth ? current : deepest;
    });
    return [...new Set([...getAncestorPath(pivotNodeId), pivotNodeId])];
  };

  // Find nodeId from label
  const findNodeIdByLabel = (nodes, label) => {
    for (const node of nodes) {
      if (node.label === label) return node.id;
      if (node.children) {
        const found = findNodeIdByLabel(node.children, label);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    const storedActiveLeaf = sessionGetString('activeFunction', projectId);
    const storedExpanded = toSingleBranchExpandedNodes(sessionGetJson('expandedNodes', projectId, []));
    let nextExpanded = storedExpanded;

    if (storedActiveLeaf) {
      const nodeId = findNodeIdByLabel(functionTreeData, storedActiveLeaf);
      if (nodeId) {
        setSelected(nodeId);
        const parentIds = getAncestorPath(nodeId);
        nextExpanded = [...new Set([...parentIds])];
      }
      dispatch(setActiveFunction(storedActiveLeaf));
    }

    setExpanded(nextExpanded);
    sessionSetJson('expandedNodes', projectId, nextExpanded);
  }, [dispatch, scopedActiveFunctionKey, scopedExpandedNodesKey]);

  // Sync selected state with Redux activeFunction
  useEffect(() => {
    if (activeFunctionFromRedux) {
      const nodeId = findNodeIdByLabel(functionTreeData, activeFunctionFromRedux);
      if (nodeId && nodeId !== selected) {
        setSelected(nodeId);
        const parentIds = getAncestorPath(nodeId);
        setExpanded(parentIds);
        sessionSetJson('expandedNodes', projectId, parentIds);
      }
    }
  }, [activeFunctionFromRedux, selected, scopedExpandedNodesKey]);

  // Listen for custom events from chatbot
  useEffect(() => {
    const handleFunctionSelected = (event) => {
      const { functionId, expandedNodes } = event.detail;
      console.log('FunctionTab received function selection:', functionId);
      setSelected(functionId);
      dispatch(setActiveFunction(functionId));
      const nextExpanded = toSingleBranchExpandedNodes(expandedNodes);
      setExpanded(nextExpanded);
      sessionSetJson('expandedNodes', projectId, nextExpanded);
    };

    const handleForceFunctionSelection = (event) => {
      const { nodeId, label } = event.detail;
      console.log('FunctionTab received force selection:', nodeId, label);
      setSelected(nodeId);
      dispatch(setActiveFunction(label));
      sessionSetString('activeFunction', projectId, label);
    };

    window.addEventListener('functionSelected', handleFunctionSelected);
    window.addEventListener('forceFunctionSelection', handleForceFunctionSelection);
    return () => {
      window.removeEventListener('functionSelected', handleFunctionSelected);
      window.removeEventListener('forceFunctionSelection', handleForceFunctionSelection);
    };
  }, [dispatch, scopedActiveFunctionKey]);

  // Function to get the label from nodeId for dispatching
  const getLabelFromNodeId = (nodeId) => {
    const findNode = (nodes, id) => {
      for (const node of nodes) {
        if (node.id === id) return node.label;
        if (node.children) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    const label = findNode(functionTreeData, nodeId);
    // If label found, return it; otherwise return the nodeId as fallback
    return label || nodeId;
  };

  // Check if a node has children
  const hasChildren = (nodeId) => {
    const findNode = (nodes, id) => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    const node = findNode(functionTreeData, nodeId);
    return node && Array.isArray(node.children) && node.children.length > 0;
  };

  const handleItemClick = (event, nodeId) => {
    if (isFunctionTabBlocked) {
      event.preventDefault();
      event.stopPropagation();
      showSelectDatasetToast();
      return;
    }

    const label = getLabelFromNodeId(nodeId);
    
    if (!label) return;

    // Check if this node has children
    const isParentNode = hasChildren(nodeId);
    
    if (isParentNode) {
      // For parent nodes, don't stop propagation - let TreeView handle expansion
      // Don't select parent nodes, just expand them
      return;
    } else {
      // For leaf nodes, stop propagation and select them
      event.stopPropagation();
      setSelected(nodeId);
      dispatch(setActiveFunction(label));
      sessionSetString('activeFunction', projectId, label);
      
      const parentIds = getAncestorPath(nodeId);
      setExpanded(parentIds);
      sessionSetJson('expandedNodes', projectId, parentIds);
    }
  };

  const renderTree = (nodes) => {
    // Ensure nodes.id exists and is valid
    if (!nodes || !nodes.id) {
      return null;
    }
    const hasChildrenNode = Array.isArray(nodes.children) && nodes.children.length > 0;
    const nodeIcon = nodes.icon || getNodeIcon(nodes.label, hasChildrenNode);
    const iconBadge = iconBadgeForLabel(nodes.label);
    return (
      <StyledTreeItem
        key={nodes.id}
        nodeId={nodes.id}
        label={
          <div className="flex items-center">
            {nodeIcon && (
              <span
                className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-md border"
                style={{ backgroundColor: iconBadge.bg, borderColor: iconBadge.border, color: iconBadge.color }}
              >
                {nodeIcon}
              </span>
            )}
            <span className="tracking-wider capitalize">{nodes.displayLabel || nodes.label}</span>
          </div>
        }
        onClick={(event) => handleItemClick(event, nodes.id)}
      >
        {Array.isArray(nodes.children) && nodes.children.length > 0
          ? nodes.children.map((node) => renderTree(node))
          : null}
      </StyledTreeItem>
    );
  };

  return (
    <div className="h-full mt-4">
      {activeCsvFile ? (
        <div className="h-full flex flex-col">
          <div
            className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${isFunctionTabBlocked ? 'opacity-45' : ''}`}
            onClickCapture={(event) => {
              if (!isFunctionTabBlocked) return;
              event.preventDefault();
              event.stopPropagation();
              showSelectDatasetToast();
            }}
          >
            <SimpleTreeView
              className="text-gray-700"
              expandedNodes={expanded}
              selectedNodes={selected || ''}
              onExpandedNodesChange={(_, nodeIds) => {
                const nextExpandedRaw = sanitizeExpandedNodes(nodeIds);
                setExpanded((prevExpanded) => {
                  const prevSafe = sanitizeExpandedNodes(prevExpanded);
                  const prevSet = new Set(prevSafe);
                  const nextSet = new Set(nextExpandedRaw);

                  const expandedCandidates = nextExpandedRaw.filter((id) => !prevSet.has(id));
                  const hasExpansion = expandedCandidates.length > 0;

                  // Keep one active branch: use the newly expanded node when available.
                  if (hasExpansion) {
                    const pivotNodeId = expandedCandidates.reduce((deepest, current) => {
                      const deepestDepth = deepest.split('-').length;
                      const currentDepth = current.split('-').length;
                      return currentDepth >= deepestDepth ? current : deepest;
                    }, expandedCandidates[0]);

                    const nextSingleBranch = [...new Set([...getAncestorPath(pivotNodeId), pivotNodeId])];
                    sessionSetJson('expandedNodes', projectId, nextSingleBranch);
                    return nextSingleBranch;
                  }

                  // Collapse or external sync: respect TreeView's next ids.
                  const nextCollapsedState = nextExpandedRaw.filter((id) => nextSet.has(id));
                  sessionSetJson('expandedNodes', projectId, nextCollapsedState);
                  return nextCollapsedState;
                });
              }}
              slots={{
                collapseIcon: ExpandMoreIcon,
                expandIcon: ChevronRightIcon,
              }}
              sx={{
                '& .MuiTreeItem-content': {
                  transition: 'background-color 160ms ease, color 160ms ease',
                },
                '& .MuiTreeItem-group': {
                  transition: 'padding 180ms ease, border-color 180ms ease',
                },
                '& .MuiTreeItem-groupTransition': {
                  transition: 'opacity 180ms ease, transform 180ms ease',
                },
              }}
            >
              {functionTreeData.map((node) => renderTree(node))}
            </SimpleTreeView>
          </div>
          <div className="mt-3 mx-2 rounded-md border border-[#D9ECE9] bg-[#F0FDFA] px-2.5 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0D9488]">Selected dataset</p>
            <p className="mt-0.5 truncate text-sm font-medium text-gray-800" title={selectedDatasetName}>
              {selectedDatasetName}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 p-2 text-center text-gray-600 tracking-wide font-bold text-lg">
          Please select a file to <br /> view the functions.
        </p>
      )}
    </div>
  );
}

export default FunctionTab;
