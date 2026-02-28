import React, { useState, useRef, useEffect } from 'react';
import * as stats from 'simple-statistics';
import { FiX, FiSend, FiMinimize2, FiTrash2, FiUpload } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveFunction } from '../../Slices/SideBarSlice';
import { apiService } from '../../services/api/apiService';

// Django Backend API configuration
// Use empty string for same-origin requests via Vite proxy
const API_BASE = '';
const CHAT_API_PATH = import.meta.env.VITE_APP_API_CHAT || '/api/chat/';
const UPLOAD_API_PATH = import.meta.env.VITE_APP_API_CHAT_UPLOAD || '/api/upload/';

const toAbsoluteUrl = (base, path) => (
  path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`
);

const CHAT_API_URL = toAbsoluteUrl(API_BASE, CHAT_API_PATH);
const UPLOAD_API_URL = toAbsoluteUrl(API_BASE, UPLOAD_API_PATH);

const Chatbot = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const csvData = useSelector((state) => state.featureEngineering.file);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSize, setChatSize] = useState({ width: 384, height: 500 });
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 384, height: 500 });
  const [showPlotInterface, setShowPlotInterface] = useState(false);
  const [currentPlotType, setCurrentPlotType] = useState('');
  const [plotParams, setPlotParams] = useState({
    categorical: [],
    numerical: '',
    x_var: '',
    y_var: '',
    orientation: 'Vertical',
    annotate: false,
    title: '',
    hue: '',
    bins: 10,
    kde: false,
    legend: false,
    label: true,
    percentage: true,
    gap: 0
  });
  const [availableColumns, setAvailableColumns] = useState([]);
  const [plotResult, setPlotResult] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const uploadInputRef = useRef(null);

  // Chat icon draggable state
  const [iconPosition, setIconPosition] = useState({ bottom: 20, right: 20 });
  const isDraggingIconRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, bottom: 20, right: 20 });

  // Prototype dataset UX inside chat
  const [showDatasetOptions, setShowDatasetOptions] = useState(false);
  const [datasetPreview, setDatasetPreview] = useState({ name: '', headers: [], rows: [] });
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [modalDataset, setModalDataset] = useState({ name: '', headers: [], rows: [] });
  // Chat-local dataset independent from main page
  const [chatDataset, setChatDataset] = useState({ name: '', headers: [], rows: [], records: [] });

  // Message ID counter to ensure unique keys
  const messageIdCounter = useRef(0);
  const getNextMessageId = () => {
    messageIdCounter.current += 1;
    return messageIdCounter.current;
  };

  // Helper to extract JSON from free-form LLM text
  const tryParseJsonFromText = (text) => {
    try {
      return JSON.parse(text);
    } catch (_) {
      try {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
      } catch (_) {
        return null;
      }
      return null;
    }
  };

  // Function mapping to navigate to specific functions - using nodeIds for proper clicking
  const functionMapping = {
    // Dataset operations
    'info': { label: 'Information', nodeId: '0-1' },
    'stats': { label: 'Statistics', nodeId: '0-2' },
    'correlation': { label: 'Corelation', nodeId: '0-3' },
    'duplicate': { label: 'Duplicate', nodeId: '0-4' },
    'group': { label: 'Group', nodeId: '0-5' },
    'gen_dataset': { label: 'Generate Dataset', nodeId: 'gen_dataset' },
    'feature_eng': { label: 'Feature Engineering', nodeId: '2' },
    'model_build': { label: 'Model Building', nodeId: '5' },

    // InvML operations - using exact nodeIds from FunctionTab
    'reverse_ml': { label: 'ReverseML', nodeId: '8-1' },
    'time_series': { label: 'Time Series Analysis', nodeId: '7' },
    'pso': { label: 'PSO', nodeId: '8-2' },
    'smiles_gen': { label: 'SMILES Generation', nodeId: '8-4' },
    'smiles_iupac': { label: 'SMILES to IUPAC', nodeId: '8-5' },
    'smiles_sas': { label: 'SMILES to SAS', nodeId: '8-6' },
    'smiles_dft': { label: 'SMILES to DFT', nodeId: '8-7' },
    'molecular_structure': { label: 'SMILES Structure', nodeId: '8-8' },
    'feature_selection': { label: 'Feature Selection', nodeId: '8-3' },
    'scaler_eval': { label: 'Best Scaler', nodeId: '2-13' },

    // EDA Plot operations
    'bar_plot': { label: 'Bar Plot', nodeId: 'bar_plot', isPlot: true, plotType: 'bar' },
    'barplot': { label: 'Bar Plot', nodeId: 'bar_plot', isPlot: true, plotType: 'bar' },
    'bar chart': { label: 'Bar Plot', nodeId: 'bar_plot', isPlot: true, plotType: 'bar' },

    'scatter_plot': { label: 'Scatter Plot', nodeId: 'scatter_plot', isPlot: true, plotType: 'scatter' },
    'scatterplot': { label: 'Scatter Plot', nodeId: 'scatter_plot', isPlot: true, plotType: 'scatter' },
    'scatter chart': { label: 'Scatter Plot', nodeId: 'scatter_plot', isPlot: true, plotType: 'scatter' },

    'line_plot': { label: 'Line Plot', nodeId: 'line_plot', isPlot: true, plotType: 'line' },
    'lineplot': { label: 'Line Plot', nodeId: 'line_plot', isPlot: true, plotType: 'line' },
    'line chart': { label: 'Line Plot', nodeId: 'line_plot', isPlot: true, plotType: 'line' },

    'histogram': { label: 'Histogram', nodeId: 'histogram', isPlot: true, plotType: 'histogram' },
    'hist': { label: 'Histogram', nodeId: 'histogram', isPlot: true, plotType: 'histogram' },

    'box_plot': { label: 'Box Plot', nodeId: 'box_plot', isPlot: true, plotType: 'box' },
    'boxplot': { label: 'Box Plot', nodeId: 'box_plot', isPlot: true, plotType: 'box' },
    'box chart': { label: 'Box Plot', nodeId: 'box_plot', isPlot: true, plotType: 'box' },

    'pie_plot': { label: 'Pie Plot', nodeId: 'pie_plot', isPlot: true, plotType: 'pie' },
    'pieplot': { label: 'Pie Plot', nodeId: 'pie_plot', isPlot: true, plotType: 'pie' },
    'pie chart': { label: 'Pie Plot', nodeId: 'pie_plot', isPlot: true, plotType: 'pie' },

    'count_plot': { label: 'Count Plot', nodeId: 'count_plot', isPlot: true, plotType: 'count' },
    'countplot': { label: 'Count Plot', nodeId: 'count_plot', isPlot: true, plotType: 'count' },

    'violin_plot': { label: 'Violin Plot', nodeId: 'violin_plot', isPlot: true, plotType: 'violin' },
    'violinplot': { label: 'Violin Plot', nodeId: 'violin_plot', isPlot: true, plotType: 'violin' },

    'reg_plot': { label: 'Regression Plot', nodeId: 'reg_plot', isPlot: true, plotType: 'reg' },
    'regplot': { label: 'Regression Plot', nodeId: 'reg_plot', isPlot: true, plotType: 'reg' },
    'regression plot': { label: 'Regression Plot', nodeId: 'reg_plot', isPlot: true, plotType: 'reg' },

    'custom_plot': { label: 'Custom Plot', nodeId: 'custom_plot', isPlot: true, plotType: 'custom' },
    'customplot': { label: 'Custom Plot', nodeId: 'custom_plot', isPlot: true, plotType: 'custom' },

    'venn_diagram': { label: 'Venn Diagram', nodeId: 'venn_diagram', isPlot: true, plotType: 'venn' },
    'venn': { label: 'Venn Diagram', nodeId: 'venn_diagram', isPlot: true, plotType: 'venn' }
  };

  // AI-powered function detection using natural language
  const detectFunctionFromText = (text) => {
    const lowerText = text.toLowerCase();

    // PRIORITY: Specific dataset actions before any generic dataset/data keywords
    if (/(\binfo\b|information|overview|describe the data|data overview)/i.test(lowerText)) {
      return 'info';
    }
    if (/(\bstats\b|statistics|statistical|summary statistics|get stats|statistical analysis|data analysis)/i.test(lowerText)) {
      return 'stats';
    }
    if (/(correlation|correlate|relationship|correlation analysis|correlation matrix|find relationships|data relationships)/i.test(lowerText)) {
      return 'correlation';
    }
    if (/(duplicate|duplicates|find duplicates|remove duplicates|clean data|data cleaning)/i.test(lowerText)) {
      return 'duplicate';
    }
    if (/(^|\s)(generate|create|synthesize)\s+(\w+\s+)?dataset(s)?\b/i.test(lowerText)) {
      return 'gen_dataset';
    }
    if (/(group by|grouping|aggregate|summarize|group data)/i.test(lowerText)) {
      return 'group';
    }

    // Create a comprehensive mapping of keywords to function keys
    const keywordMapping = {
      // Dataset operations
      'display': 'upload',
      'show data': 'upload',
      'view data': 'upload',
      'upload': 'upload',
      // Move generic terms to end by not listing here; handled later if nothing else matches

      'information': 'info',
      'info': 'info',
      'overview': 'info',
      'details': 'info',
      'summary': 'info',

      'statistics': 'stats',
      'stats': 'stats',
      'statistical': 'stats',
      'describe': 'stats',
      'summary statistics': 'stats',

      'correlation': 'correlation',
      'correlate': 'correlation',
      'relationship': 'correlation',
      'correlation analysis': 'correlation',

      'duplicate': 'duplicate',
      'duplicates': 'duplicate',
      'duplicate data': 'duplicate',
      'find duplicates': 'duplicate',

      'group': 'group',
      'grouping': 'group',
      'group by': 'group',
      'aggregate': 'group',
      'group data': 'group',

      'feature engineering': 'feature_eng',
      'feature eng': 'feature_eng',
      'feature creation': 'feature_eng',
      'transform': 'feature_eng',
      'engineering': 'feature_eng',

      'model building': 'model_build',
      'model build': 'model_build',
      'model': 'model_build',
      'machine learning': 'model_build',
      'ml': 'model_build',
      'train': 'model_build',
      'training': 'model_build',

      // InvML operations
      'reverse ml': 'reverse_ml',
      'reverse machine learning': 'reverse_ml',
      'reverse_ml': 'reverse_ml',
      'inverse ml': 'reverse_ml',
      'inverse machine learning': 'reverse_ml',

      'time series': 'time_series',
      'time series analysis': 'time_series',
      'temporal': 'time_series',
      'time based': 'time_series',

      'pso': 'pso',
      'particle swarm': 'pso',
      'optimization': 'pso',
      'swarm optimization': 'pso',

      'smiles generation': 'smiles_gen',
      'smiles gen': 'smiles_gen',
      'generate smiles': 'smiles_gen',
      'molecular generation': 'smiles_gen',

      'smiles to iupac': 'smiles_iupac',
      'smiles iupac': 'smiles_iupac',
      'iupac': 'smiles_iupac',
      'convert to iupac': 'smiles_iupac',

      'smiles to sas': 'smiles_sas',
      'smiles sas': 'smiles_sas',
      'sas': 'smiles_sas',
      'convert to sas': 'smiles_sas',

      'smiles to dft': 'smiles_dft',
      'smiles dft': 'smiles_dft',
      'dft': 'smiles_dft',
      'convert to dft': 'smiles_dft',

      'smiles structure': 'molecular_structure',
      'molecular structure': 'molecular_structure',
      'structure': 'molecular_structure',
      'molecular': 'molecular_structure',

      'feature selection': 'feature_selection',
      'select features': 'feature_selection',
      'feature select': 'feature_selection',
      'variable selection': 'feature_selection',

      'scaler evaluation': 'scaler_eval',
      'scaler eval': 'scaler_eval',
      'best scaler': 'scaler_eval',
      'scaling': 'scaler_eval',
      'normalization': 'scaler_eval',

      // Additional natural language patterns
      'open': 'upload',
      'show me': 'upload',
      'let me see': 'upload',
      'i want to see': 'upload',
      'can you show': 'upload',
      'display data': 'upload',
      'view dataset': 'upload',
      'generate dataset': 'gen_dataset',
      'create dataset': 'gen_dataset',

      'tell me about': 'info',
      'what is in': 'info',
      'describe the data': 'info',
      'data overview': 'info',

      'analyze': 'stats',
      'get stats': 'stats',
      'statistical analysis': 'stats',
      'data analysis': 'stats',

      'find relationships': 'correlation',
      'correlation matrix': 'correlation',
      'data relationships': 'correlation',

      'remove duplicates': 'duplicate',
      'clean data': 'duplicate',
      'data cleaning': 'duplicate',

      'aggregate data': 'group',
      'summarize': 'group',

      'create features': 'feature_eng',
      'data transformation': 'feature_eng',

      'build model': 'model_build',
      'train model': 'model_build',
      'machine learning model': 'model_build',
      'predictive model': 'model_build',

      'inverse analysis': 'reverse_ml',
      'reverse analysis': 'reverse_ml',
      'backward analysis': 'reverse_ml',

      'temporal analysis': 'time_series',
      'time-based analysis': 'time_series',
      'sequence analysis': 'time_series',

      'optimize': 'pso',
      'find best': 'pso',
      'optimization algorithm': 'pso',

      'generate molecules': 'smiles_gen',
      'create molecules': 'smiles_gen',

      'convert molecules': 'smiles_iupac',
      'molecule conversion': 'smiles_iupac',
      'chemical names': 'smiles_iupac',

      'molecular analysis': 'molecular_structure',
      'structure analysis': 'molecular_structure',
      'analyze structure': 'molecular_structure',

      'select best features': 'feature_selection',
      'feature ranking': 'feature_selection',
      'important features': 'feature_selection',

      'data scaling': 'scaler_eval',
      'normalize data': 'scaler_eval',
      'scale data': 'scaler_eval',

      // Bar plot operations
      'bar plot': 'bar_plot',
      'barplot': 'bar_plot',
      'bar chart': 'bar_plot',
      'create bar plot': 'bar_plot',
      'generate bar plot': 'bar_plot',
      'make bar chart': 'bar_plot',
      'plot bar': 'bar_plot',
      'bar visualization': 'bar_plot',
      'categorical plot': 'bar_plot',

      // Scatter plot operations
      'scatter plot': 'scatter_plot',
      'scatterplot': 'scatter_plot',
      'scatter chart': 'scatter_plot',
      'create scatter plot': 'scatter_plot',
      'generate scatter plot': 'scatter_plot',
      'make scatter chart': 'scatter_plot',
      'plot scatter': 'scatter_plot',
      'scatter visualization': 'scatter_plot',

      // Line plot operations
      'line plot': 'line_plot',
      'lineplot': 'line_plot',
      'line chart': 'line_plot',
      'create line plot': 'line_plot',
      'generate line plot': 'line_plot',
      'make line chart': 'line_plot',
      'plot line': 'line_plot',
      'line visualization': 'line_plot',

      // Histogram operations
      'histogram': 'histogram',
      'hist': 'histogram',
      'create histogram': 'histogram',
      'generate histogram': 'histogram',
      'make histogram': 'histogram',
      'plot histogram': 'histogram',
      'histogram visualization': 'histogram',

      // Box plot operations
      'box plot': 'box_plot',
      'boxplot': 'box_plot',
      'box chart': 'box_plot',
      'create box plot': 'box_plot',
      'generate box plot': 'box_plot',
      'make box chart': 'box_plot',
      'plot box': 'box_plot',
      'box visualization': 'box_plot',

      // Pie plot operations
      'pie plot': 'pie_plot',
      'pieplot': 'pie_plot',
      'pie chart': 'pie_plot',
      'create pie plot': 'pie_plot',
      'generate pie plot': 'pie_plot',
      'make pie chart': 'pie_plot',
      'plot pie': 'pie_plot',
      'pie visualization': 'pie_plot',

      // Count plot operations
      'count plot': 'count_plot',
      'countplot': 'count_plot',
      'create count plot': 'count_plot',
      'generate count plot': 'count_plot',
      'make count plot': 'count_plot',
      'plot count': 'count_plot',
      'count visualization': 'count_plot',

      // Violin plot operations
      'violin plot': 'violin_plot',
      'violinplot': 'violin_plot',
      'create violin plot': 'violin_plot',
      'generate violin plot': 'violin_plot',
      'make violin plot': 'violin_plot',
      'plot violin': 'violin_plot',
      'violin visualization': 'violin_plot',

      // Regression plot operations
      'regression plot': 'reg_plot',
      'reg plot': 'reg_plot',
      'regplot': 'reg_plot',
      'create regression plot': 'reg_plot',
      'generate regression plot': 'reg_plot',
      'make regression plot': 'reg_plot',
      'plot regression': 'reg_plot',
      'regression visualization': 'reg_plot',

      // Custom plot operations
      'custom plot': 'custom_plot',
      'customplot': 'custom_plot',
      'create custom plot': 'custom_plot',
      'generate custom plot': 'custom_plot',
      'make custom plot': 'custom_plot',
      'plot custom': 'custom_plot',
      'custom visualization': 'custom_plot',

      // Venn diagram operations
      'venn diagram': 'venn_diagram',
      'venn': 'venn_diagram',
      'create venn diagram': 'venn_diagram',
      'generate venn diagram': 'venn_diagram',
      'make venn diagram': 'venn_diagram',
      'plot venn': 'venn_diagram',
      'venn visualization': 'venn_diagram'
    };

    // Find the best match
    for (const [keyword, functionKey] of Object.entries(keywordMapping)) {
      if (lowerText.includes(keyword)) {
        return functionKey;
      }
    }
    // If nothing matched specifically, fall back to generic dataset triggers
    if (lowerText.includes('dataset') || lowerText.includes('data')) {
      return 'upload';
    }

    return null;
  };

  // Extract available columns from CSV data
  const extractAvailableColumns = (csvData) => {
    if (!csvData || csvData.length === 0) return [];
    return Object.keys(csvData[0] || {});
  };

  // Extract plot parameters from natural language (universal for all plot types)
  const extractPlotParams = (text, plotType) => {
    const lowerText = text.toLowerCase();

    // Default parameters
    let params = {
      categorical: [],
      numerical: '',
      x_var: '',
      y_var: '',
      orientation: 'Vertical',
      annotate: false,
      title: '',
      hue: '',
      bins: 10,
      kde: false,
      legend: false,
      label: true,
      percentage: true,
      gap: 0,
      detected: false
    };

    // Extract categorical variables (common patterns)
    const categoricalPatterns = [
      /(?:categorical|category|group by|grouped by|by)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
      /(?:use|with|for)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(?:as|for)\s+(?:category|categorical)/gi,
      /(?:x-axis|x axis|x)\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)/gi
    ];

    // Extract numerical variables
    const numericalPatterns = [
      /(?:numerical|numeric|value|y-axis|y axis|y)\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)/gi,
      /(?:count|sum|mean|average)\s+(?:of|for)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi
    ];

    // Extract orientation
    if (lowerText.includes('horizontal')) {
      params.orientation = 'Horizontal';
    }

    // Extract annotate
    if (lowerText.includes('annotate') || lowerText.includes('with labels') || lowerText.includes('show values')) {
      params.annotate = true;
    }

    // Extract title
    const titleMatch = lowerText.match(/(?:title|named|call it)\s*[:=]\s*["']?([^"']+)["']?/i);
    if (titleMatch) {
      params.title = titleMatch[1].trim();
    }

    // Enhanced column extraction - look for specific patterns based on plot type
    if (plotType === 'bar' || plotType === 'count' || plotType === 'pie') {
      // For bar, count, pie plots: categorical + numerical
      const catNumMatch = lowerText.match(/(?:categorical|cat)\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*[,;]\s*(?:numerical|num)\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)/i);
      if (catNumMatch) {
        params.categorical = [catNumMatch[1]];
        params.numerical = catNumMatch[2];
        params.detected = true;
        return params;
      }

      const andMatch = lowerText.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s+and\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
      if (andMatch) {
        params.categorical = [andMatch[1]];
        params.numerical = andMatch[2];
        params.detected = true;
        return params;
      }

      const withMatch = lowerText.match(/with\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[,;]\s*([a-zA-Z_][a-zA-Z0-9_]*)/i);
      if (withMatch) {
        params.categorical = [withMatch[1]];
        params.numerical = withMatch[2];
        params.detected = true;
        return params;
      }
    } else if (plotType === 'scatter' || plotType === 'line' || plotType === 'reg') {
      // For scatter, line, regression plots: x_var + y_var
      const xyMatch = lowerText.match(/(?:x|horizontal)\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*[,;]\s*(?:y|vertical)\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)/i);
      if (xyMatch) {
        params.x_var = xyMatch[1];
        params.y_var = xyMatch[2];
        params.detected = true;
        return params;
      }

      const andMatch = lowerText.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s+and\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
      if (andMatch) {
        params.x_var = andMatch[1];
        params.y_var = andMatch[2];
        params.detected = true;
        return params;
      }
    } else if (plotType === 'histogram' || plotType === 'box' || plotType === 'violin') {
      // For histogram, box, violin plots: numerical variable
      const numMatch = lowerText.match(/(?:numerical|numeric|variable|column)\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)/i);
      if (numMatch) {
        params.numerical = numMatch[1];
        params.detected = true;
        return params;
      }
    }

    // Try to extract column names from the text
    const words = text.split(/\s+/);
    const potentialColumns = words.filter(word =>
      word.length > 2 &&
      /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(word) &&
      !['the', 'and', 'or', 'for', 'with', 'by', 'plot', 'chart', 'bar', 'create', 'generate', 'make', 'show', 'horizontal', 'vertical', 'categorical', 'numerical', 'cat', 'num'].includes(word.toLowerCase())
    );

    // If we found potential columns, use them based on plot type
    if (potentialColumns.length >= 2) {
      if (plotType === 'bar' || plotType === 'count' || plotType === 'pie') {
        params.categorical = [potentialColumns[0]];
        params.numerical = potentialColumns[1];
      } else if (plotType === 'scatter' || plotType === 'line' || plotType === 'reg') {
        params.x_var = potentialColumns[0];
        params.y_var = potentialColumns[1];
      } else if (plotType === 'histogram' || plotType === 'box' || plotType === 'violin') {
        params.numerical = potentialColumns[0];
      }
      params.detected = true;
    } else if (potentialColumns.length === 1) {
      // If only one column found, use it appropriately based on plot type
      if (plotType === 'bar' || plotType === 'count' || plotType === 'pie') {
        params.categorical = [potentialColumns[0]];
      } else if (plotType === 'scatter' || plotType === 'line' || plotType === 'reg') {
        params.x_var = potentialColumns[0];
      } else if (plotType === 'histogram' || plotType === 'box' || plotType === 'violin') {
        params.numerical = potentialColumns[0];
      }
      params.detected = false; // Don't auto-generate, need more info
    }

    return params;
  };

  // Generate bar plot using the API
  const generateBarPlot = async (params, csvData) => {
    try {
      const data = await apiService.matflow.eda.barPlot({
        cat: params.categorical.length > 0 ? params.categorical : "-",
        num: params.numerical || "-",
        hue: "-", // Not used in basic bar plot
        orient: params.orientation,
        annote: params.annotate,
        title: params.title || "",
        file: csvData,
      });
      return data;
    } catch (error) {
      console.error('Bar plot generation error:', error);
      throw error;
    }
  };

  // Call Django Backend with Ollama for AI-powered response
  const callBackendChat = async (text) => {
    try {
      console.log('Chat API URL:', CHAT_API_URL);
      const data = await apiService.matflow.chatbot.chat(text);

      if (typeof data?.reply === 'string' && data.reply.trim()) {
        // If reply itself contains JSON, try to parse and render tables
        const parsed = tryParseJsonFromText(data.reply.trim());
        if (parsed && (parsed.spec || (parsed.ok && parsed.spec))) {
          const spec = parsed.spec;
          const tables = [];
          // Summary table - use problem name as title
          const problemName = spec.problem || 'Specification';
          const rows = [];
          
          // Add domain
          if (spec.domain) {
            rows.push(['Domain', spec.domain]);
          }
          
          // Add intent
          if (spec.intent) {
            rows.push(['Intent', spec.intent]);
          }
          
          // Add target - get from targets.target array
          const targetName = spec.targets?.target?.[0]?.name || spec.targets?.target_name || '';
          if (targetName) {
            rows.push(['Target', targetName]);
          }
          
          // Add constraints only if not empty
          const constraints = spec.constraints || {};
          if (Object.keys(constraints).length > 0) {
            rows.push(['Constraints', JSON.stringify(constraints)]);
          }
          
          if (rows.length > 0) {
            tables.push({
              title: problemName,
              table: {
                headers: [], // No headers
                rows: rows
              }
            });
          }
          
          // Helper to list arrays
          const makeList = (title, items = []) => ({
            title,
            table: { headers: ['Number', 'Value'], rows: (items || []).map((v, i) => [String(i + 1), v]) }
          });
          tables.push(makeList('Data sources', spec.data_sources));
          tables.push(makeList('Features', spec.features));
          tables.push(makeList('Workflow', spec.workflow));
          tables.push(makeList('Validation metrics', spec.validation));
          tables.push(makeList('Decision gates', spec.decision_gates));
          tables.push(makeList('Artifacts', spec.artifacts));
          return { kind: 'tables', tables };
        }
        return data.reply;
      }
      if (data?.tool) {
        // Try to parse tool result JSON into a table-friendly structure
        try {
          // Accept shapes like {result: {data: "[...]"}} or {result: "[...]"} or direct array
          const raw = (data.result && (data.result.data ?? data.result)) ?? [];
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
            const table = recordsToTable(parsed.slice(0, 50));
            return { kind: 'table', title: `Tool ${data.tool} executed.`, table };
          }
        } catch (_) { /* fall back below */ }
        return `Tool ${data.tool} executed.`;
      }

      // Direct spec-style JSON response from server (no reply field)
      if (data && (data.spec || (data.ok && data.spec))) {
        const spec = data.spec;
        const tables = [];
        
        // Summary table - use problem name as title
        const problemName = spec.problem || 'Specification';
        const rows = [];
        
        // Add domain
        if (spec.domain) {
          rows.push(['Domain', spec.domain]);
        }
        
        // Add intent
        if (spec.intent) {
          rows.push(['Intent', spec.intent]);
        }
        
        // Add target - get from targets.target array
        const targetName = spec.targets?.target?.[0]?.name || spec.targets?.target_name || '';
        if (targetName) {
          rows.push(['Target', targetName]);
        }
        
        // Add constraints only if not empty
        const constraints = spec.constraints || {};
        if (Object.keys(constraints).length > 0) {
          rows.push(['Constraints', JSON.stringify(constraints)]);
        }
        
        if (rows.length > 0) {
          tables.push({
            title: problemName,
            table: {
              headers: [], // No headers
              rows: rows
            }
          });
        }
        
        const makeList = (title, items = []) => ({
          title,
          table: { headers: ['Number', 'Value'], rows: (items || []).map((v, i) => [String(i + 1), v]) }
        });
        tables.push(makeList('Data sources', spec.data_sources));
        tables.push(makeList('Features', spec.features));
        tables.push(makeList('Workflow', spec.workflow));
        tables.push(makeList('Validation metrics', spec.validation));
        tables.push(makeList('Decision gates', spec.decision_gates));
        tables.push(makeList('Artifacts', spec.artifacts));
        return { kind: 'tables', tables };
      }

      return 'I understand you want to work with data. Let me help you!';
    } catch (error) {
      console.error('Chat backend error:', error);
      return 'I understand you want to work with data. Let me help you!';
    }
  };


  // Always forward user text to backend chat API and append its reply
  const forwardToChatAPI = async (text) => {
    try {
      const aiResponse = await callBackendChat(text);
      if (typeof aiResponse === 'object' && aiResponse?.kind === 'table') {
        setMessages(prev => [...prev, {
          id: getNextMessageId(),
          type: 'table',
          table: aiResponse.table,
          text: aiResponse.title,
          sender: 'bot',
          timestamp: new Date()
        }]);
      } else if (typeof aiResponse === 'object' && aiResponse?.kind === 'tables' && Array.isArray(aiResponse.tables)) {
        // Render multiple tables sequentially
        const tableMessages = aiResponse.tables.map((t) => ({
          id: getNextMessageId(),
          type: 'table',
          table: t.table,
          text: t.title,
          sender: 'bot',
          timestamp: new Date()
        }));
        setMessages(prev => [...prev, ...tableMessages]);
      } else {
        setMessages(prev => [...prev, {
          id: getNextMessageId(),
          text: String(aiResponse),
          sender: 'bot',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Chat API forward error:', error);
    }
  };

  // Utilities to convert records to table
  const recordsToTable = (records) => {
    const headers = Array.from(
      records.reduce((set, row) => {
        Object.keys(row || {}).forEach((k) => set.add(k));
        return set;
      }, new Set())
    );
    const rows = records.map((r) => headers.map((h) => r[h]));
    return { headers, rows };
  };

  // Backend calls for dataset ops (reuse existing endpoints)
  const callGroupBy = async (groupVars = [], aggFunc = "count") => {
    const response = await apiService.matflow.dataset.groupData({
      file: chatDataset.records || [],
      group_var: groupVars,
      agg_func: aggFunc
    });
    const { data } = response;
    const parsed = typeof data === 'string' ? JSON.parse(data || '[]') : data;
    return recordsToTable(parsed);
  };

  const callCorrelation = async (method = "kendall") => {
    const response = await apiService.matflow.dataset.getCorrelation({
      file: chatDataset.records || [],
      correlation_method: method
    });
    const { data } = response;
    const parsed = typeof data === 'string' ? JSON.parse(data || '[]') : data; // array of row objects
    // Convert to full matrix table
    if (!Array.isArray(parsed) || parsed.length === 0) return { headers: [], rows: [] };
    const headers = Object.keys(parsed[0] || {});
    const rows = parsed.map((row) => headers.map((h) => row[h]));
    return { headers, rows };
  };

  // Simple CSV parser for small previews (no quotes/escapes handling)
  const parseCsvQuick = (csvText, maxRows = 20) => {
    const lines = csvText.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];
    for (let i = 1; i < Math.min(lines.length, maxRows + 1); i++) {
      const cols = lines[i].split(',');
      rows.push(cols);
    }
    return { headers, rows };
  };

  // CSV full parse to records for accurate analytics (simple CSV - no quotes/escapes)
  const parseCsvAll = (csvText) => {
    const lines = csvText.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return { headers: [], rows: [], records: [] };
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      rows.push(cols);
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = cols[idx]; });
      records.push(obj);
    }
    return { headers, rows, records };
  };

  // Removed Hugging Face dataset preview fetcher

  const showIrisOptions = () => {
    setShowDatasetOptions(true);
    const botResponse = {
      id: getNextMessageId(),
      text: "I can help with Iris flower classification. Choose a dataset option below.",
      sender: 'bot',
      timestamp: new Date()
    };
    const optionsMsg = {
      id: getNextMessageId(),
      type: 'datasetOptions',
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botResponse, optionsMsg]);
  };

  const pushDatasetPreviewMessage = (name, headers, rows) => {
    const previewMsg = {
      id: getNextMessageId(),
      type: 'datasetPreview',
      sender: 'bot',
      timestamp: new Date(),
      dataset: { name, headers, rows }
    };
    setMessages(prev => [...prev, previewMsg]);
  };

  // Generate a small sample Iris dataset locally (no network)
  const handleUseSampleIris = async () => {
    try {
      setIsTyping(true);
      const headers = ['SepalLengthCm', 'SepalWidthCm', 'PetalLengthCm', 'PetalWidthCm', 'Species'];
      const rows = [
        ['5.1', '3.5', '1.4', '0.2', 'Iris-setosa'],
        ['4.9', '3.0', '1.4', '0.2', 'Iris-setosa'],
        ['7.0', '3.2', '4.7', '1.4', 'Iris-versicolor'],
        ['6.4', '3.2', '4.5', '1.5', 'Iris-versicolor'],
        ['6.3', '3.3', '6.0', '2.5', 'Iris-virginica'],
        ['5.8', '2.7', '5.1', '1.9', 'Iris-virginica'],
      ];
      const name = 'Sample Iris (local)';
      setDatasetPreview({ name, headers, rows });
      // Build records (array of objects)
      const records = rows.map(r => headers.reduce((o, h, i) => { o[h] = r[i]; return o; }, {}));
      setChatDataset({ name, headers, rows, records });
      setShowDatasetOptions(false);
      const bot = {
        id: getNextMessageId(),
        text: 'Sample Iris dataset generated locally. Preview is below. You can now ask for information, statistics, duplicates, or correlation and I will show results here in chat.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, bot]);
      pushDatasetPreviewMessage(name, headers, rows);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  // Generate a small dataset via backend endpoint
  const handleGenerateDataset = async (desiredName = '') => {
    try {
      setIsTyping(true);
      const generateUrl = CHAT_API_URL.replace(/\/chat\/?$/, '/chat/generate-dataset/');
      console.log('🔍 Generate Dataset Debug:');
      console.log('  - Desired Name:', desiredName);
      console.log('  - CHAT_API_URL:', CHAT_API_URL);
      console.log('  - Generate URL:', generateUrl);
      console.log('  - API_BASE:', API_BASE);

      const responseData = await apiService.matflow.chatbot.generateDataset(desiredName);
      console.log('  - Response data:', responseData);

      if (responseData.error) {
        throw new Error(responseData.error);
      }

      const name = responseData.name || 'Generated Dataset';
      const headers = responseData.headers || [];
      const rows = responseData.rows || [];
      const filename = responseData.filename || '';
      const downloadUrl = filename ? `${API_BASE}/api/chat/generated/download/${encodeURIComponent(filename)}/` : '';

      // Parse the 'data' field if present (orient='records' format from backend)
      let records = [];
      if (responseData.data) {
        try {
          records = JSON.parse(responseData.data);
        } catch (e) {
          console.error('Failed to parse dataset data:', e);
          records = rows.map(r => headers.reduce((o, h, i) => { o[h] = r[i]; return o; }, {}));
        }
      } else {
        records = rows.map(r => headers.reduce((o, h, i) => { o[h] = r[i]; return o; }, {}));
      }

      setDatasetPreview({ name, headers, rows });
      setChatDataset({ name, headers, rows, records });
      setShowDatasetOptions(false);
      const bot = { id: getNextMessageId(), text: `✨ Generated dataset "${name}". ${downloadUrl ? 'Use the Download button below to save the CSV.' : ''}`, sender: 'bot', timestamp: new Date() };
      setMessages(prev => [...prev, bot]);
      pushDatasetPreviewMessage(name, headers, rows);
      if (downloadUrl) {
        setMessages(prev => [...prev, { id: getNextMessageId(), sender: 'bot', timestamp: new Date(), type: 'datasetDownload', url: downloadUrl, name }]);
      }
    } catch (e) {
      console.error('❌ Generate Dataset Error:', e);
      const bot = {
        id: getNextMessageId(),
        text: 'Failed to generate a dataset from the model. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, bot]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleUploadOwnDataset = () => {
    uploadInputRef.current?.click();
  };

  const onUploadFileChosen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isCsv = file.type === 'text/csv' || /\.csv$/i.test(file.name || '');

    if (isCsv) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '');
        const full = parseCsvAll(text);
        setDatasetPreview({ name: file.name, headers: full.headers, rows: full.rows });
        setChatDataset({ name: file.name, headers: full.headers, rows: full.rows, records: full.records });
        setShowDatasetOptions(false);
        const bot = {
          id: getNextMessageId(),
          text: 'Your dataset has been loaded into chat. Preview is below.',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, bot]);
        pushDatasetPreviewMessage(file.name, full.headers, full.rows);
        // Also send the file to backend to persist in session for tool operations
        try {
          const form = new FormData();
          form.append('file', file);

          apiService.matflow.chatbot.uploadFile(form)
            .then(resp => {
              if (resp && resp.ok) {
                console.log('Dataset uploaded successfully');
              } else {
                console.warn('Upload endpoint responded with non-ok:', resp);
              }
            })
            .catch(err => console.warn('Upload to backend failed:', err));
        } catch (err) {
          console.warn('Failed to post file to backend upload endpoint:', err);
        }

      };
      reader.readAsText(file);
      return;
    }

    // Handle images or other files
    setShowDatasetOptions(false);
    const isImage = (file.type || '').startsWith('image/');
    const objectUrl = isImage ? URL.createObjectURL(file) : '';
    const uploadMessage = isImage
      ? { id: getNextMessageId(), type: 'image', url: objectUrl, name: file.name, sender: 'user', timestamp: new Date() }
      : { id: getNextMessageId(), type: 'file', name: file.name, size: file.size, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, uploadMessage, { id: getNextMessageId(), text: 'File uploaded. (Non-CSV files are not parsed in chat.)', sender: 'bot', timestamp: new Date() }]);

    try {
      const form = new FormData();
      form.append('file', file);
      apiService.matflow.chatbot.uploadFile(form)
        .then(resp => {
          if (resp && resp.ok) {
            console.log('File uploaded successfully');
          } else {
            console.warn('Upload endpoint responded with non-ok:', resp);
          }
        })
        .catch(err => console.warn('Upload to backend failed:', err));
    } catch (err) {
      console.warn('Failed to post file to backend upload endpoint:', err);
    }
  };


  // Function to handle navigation to specific function - works exactly like mouse click
  const navigateToFunction = (functionKey) => {
    console.log('Simulating mouse click for function:', functionKey);
    const functionData = functionMapping[functionKey];
    console.log('Function Data:', functionData);

    if (functionData) {
      const { label: functionLabel, nodeId } = functionData;
      console.log('Function Label:', functionLabel, 'Node ID:', nodeId);

      console.log('Navigating to dashboard...');

      // Navigate to dashboard first
      navigate('/dashboard');

      // Wait for navigation to complete, then simulate the exact mouse click
      setTimeout(() => {
        console.log('Simulating mouse click on function tab item:', functionLabel);

        // Feature Engineering: no dropdown; select parent "Feature Engineering" (node 2) then open via tag
        const isFeatureEngineeringSub = nodeId.startsWith('2-');
        if (isFeatureEngineeringSub) {
          const feParent = document.querySelector('[data-nodeid="2"]');
          if (feParent) {
            feParent.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          }
        }
        // Expand the InvML section if we're clicking an InvML function
        if (nodeId.startsWith('8-') || nodeId === '7') {
          console.log('Expanding InvML section first...');
          const invmlParent = document.querySelector('[data-nodeid="8"]');
          if (invmlParent) {
            const expandEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            invmlParent.dispatchEvent(expandEvent);
            console.log('InvML section expanded');
          }
        }

        // Wait a bit for the expansion to complete, then find the target item
        setTimeout(() => {
          // Check if the function tree is rendered (i.e., if a file is uploaded)
          const functionTree = document.querySelector('[role="tree"]');
          if (!functionTree) {
            console.log('Function tree not rendered - no file uploaded. Using direct dispatch...');
            // If no file is uploaded, the function tree won't be rendered
            // So we'll use direct dispatch instead
            dispatch(setActiveFunction(functionLabel));
            localStorage.setItem('activeFunction', functionLabel);
            console.log('Direct dispatch completed for:', functionLabel);
            return;
          }

          // Try to directly trigger the FunctionTab's selection mechanism
          console.log('Attempting direct function selection...');

          // Method 1: Try to find and click the MUI TreeView item
          const targetItem = document.querySelector(`[data-nodeid="${nodeId}"]`);

          if (targetItem) {
            console.log('Found function tab item by nodeId, trying direct click...');
            // Try multiple click event types
            const clickEvents = [
              new MouseEvent('click', { bubbles: true, cancelable: true, view: window }),
              new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }),
              new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window })
            ];

            clickEvents.forEach(event => {
              targetItem.dispatchEvent(event);
            });

            // Also try to trigger the MUI TreeView's internal selection
            const treeView = targetItem.closest('[role="tree"]');
            if (treeView) {
              // Try to trigger MUI TreeView selection
              const selectionEvent = new CustomEvent('selection-change', {
                detail: { nodeId },
                bubbles: true
              });
              treeView.dispatchEvent(selectionEvent);
            }

            console.log('Multiple click events dispatched!');
          } else {
            console.log('Function tab item not found by nodeId, using direct Redux dispatch...');
          }

          // Method 2: Direct Redux dispatch (this should always work)
          console.log('Using direct Redux dispatch for reliable selection...');
          dispatch(setActiveFunction(functionLabel));
          localStorage.setItem('activeFunction', functionLabel);

          // Method 3: Force a re-render by updating the selected state
          setTimeout(() => {
            // Feature Engineering sub-items (2-x): tree has no children; select node 2 and show tag content
            const treeNodeId = (nodeId.startsWith('2-') && nodeId !== '2') ? '2' : nodeId;
            window.dispatchEvent(new CustomEvent('forceFunctionSelection', {
              detail: { nodeId: treeNodeId, label: functionLabel }
            }));
            console.log('Force selection event dispatched!');
          }, 50);

          console.log('Direct dispatch completed for:', functionLabel);
        }, 100); // Small delay for expansion to complete

      }, 300); // Initial delay to ensure DOM is ready

      // Don't close the chatbot - keep it open for user interaction
    } else {
      console.log('Function data not found for key:', functionKey);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enable drag-to-resize for chat window (top-left handle)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const deltaX = e.clientX - resizeStartRef.current.mouseX;
      const deltaY = e.clientY - resizeStartRef.current.mouseY;
      // Since the panel is anchored to bottom-right, a top-left handle should
      // increase size when dragging up/left (negative delta).
      const nextWidth = Math.min(Math.max(resizeStartRef.current.width - deltaX, 300), 700);
      const nextHeight = Math.min(Math.max(resizeStartRef.current.height - deltaY, 320), 900);
      setChatSize({ width: nextWidth, height: nextHeight });
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Enable drag for chat icon
  useEffect(() => {
    const handleIconMouseMove = (e) => {
      if (!isDraggingIconRef.current) return;
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;

      // Calculate new position (from bottom-right corner)
      const newRight = Math.max(0, Math.min(window.innerWidth - 60, dragStartRef.current.right - deltaX));
      const newBottom = Math.max(0, Math.min(window.innerHeight - 60, dragStartRef.current.bottom - deltaY));

      setIconPosition({ bottom: newBottom, right: newRight });
    };

    const handleIconMouseUp = () => {
      isDraggingIconRef.current = false;
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleIconMouseMove);
    window.addEventListener('mouseup', handleIconMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleIconMouseMove);
      window.removeEventListener('mouseup', handleIconMouseUp);
    };
  }, []);

  // Monitor data loading state
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      setIsDataLoading(false);
    } else if (activeCsvFile && activeCsvFile.name) {
      setIsDataLoading(true);
    } else {
      setIsDataLoading(false);
    }
  }, [csvData, activeCsvFile]);

  // Function to clear chat history
  const clearChat = () => {
    setMessages([]);
    // Also ask backend to clear chat history
    apiService.matflow.chatbot.resetHistory().catch(() => { });
  };


  const generateBotResponse = (userInput) => {
    const input = userInput.toLowerCase();

    // Check for dataset operations
    if (input.includes('dataset') || input.includes('data')) {
      return {
        text: "I can help you with Dataset Operations. Try typing specific commands like 'show statistics', 'correlation analysis', 'find duplicates', or 'group data'."
      };
    }

    // Check for InvML operations
    if (input.includes('invml') || input.includes('inverse') || input.includes('ml')) {
      return {
        text: "I can help you with InvML (Inverse Machine Learning) Operations. Try typing commands like 'SMILES generation', 'reverse ML', 'time series analysis', or 'feature selection'."
      };
    }

    // Check for help
    if (input.includes('help') || input.includes('options') || input.includes('show')) {
      return {
        text: "I can help you with various operations in Matflow. You can ask me to:\n\n• Show statistics or analyze data\n• Perform correlation analysis\n• Generate SMILES or do molecular analysis\n• Open specific functions by typing their names\n\nJust type what you want to do!"
      };
    }

    // Default response
    return {
      text: "I can help you with Dataset Operations and InvML tasks. Try typing specific commands like 'show statistics', 'correlation analysis', 'SMILES generation', or 'reverse ML'."
    };
  };


  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: getNextMessageId(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage; // Store the input before clearing
    setInputMessage('');
    setIsTyping(true);

    // Detect intent, but ALWAYS show LLM reply first
    const preDetectedFunction = detectFunctionFromText(currentInput);
    console.log('🔍 Function Detection Debug:');
    console.log('  - Input:', currentInput);
    console.log('  - Detected Function:', preDetectedFunction);

    // Forward to backend chat API first so the reply shows before any client UI prompts
    await forwardToChatAPI(currentInput);

    // Prototype: prioritize Iris classification intent BEFORE any function detection
    const loweredEarly = currentInput.toLowerCase();
    if (
      (loweredEarly.includes('iris') && (loweredEarly.includes('classify') || loweredEarly.includes('classification') || loweredEarly.includes('flower') || loweredEarly.includes('flowers')))
    ) {
      showIrisOptions();
      setIsTyping(false);
      return;
    }

    // AI-powered function detection
    const detectedFunction = preDetectedFunction;

    if (detectedFunction) {
      // Ignore any upload intent in chat entirely
      if (detectedFunction === 'upload') {
        setIsTyping(false);
        return;
      }
      console.log('🤖 AI detected function:', detectedFunction);

      const functionData = functionMapping[detectedFunction];
      if (functionData) {
        // Handle dataset operations entirely inside chat (no main page navigation)
        if (['info', 'stats', 'correlation', 'duplicate', 'group', 'gen_dataset'].includes(detectedFunction)) {
          // Ensure we have a chat-local dataset when needed (except for upload and gen_dataset)
          if (detectedFunction !== 'gen_dataset' && (!chatDataset.records || chatDataset.records.length === 0)) {
            // No dataset available and operation requires one – do nothing; user will upload via composer
            setShowDatasetOptions(false);
            setIsTyping(false);
            return;
          }

          // Handle dataset generation intent directly (auto-run, no button)
          if (detectedFunction === 'gen_dataset') {
            console.log('🎯 Dataset Generation Triggered!');
            // Extract a desired name if present (e.g., "generate jasmine dataset")
            const m = currentInput.match(/(?:generate|create|synthesize)\s+([a-zA-Z0-9_-]+)\s+dataset/i);
            const desired = m && m[1] ? m[1] : '';
            console.log('  - Regex match:', m);
            console.log('  - Extracted name:', desired);
            await handleGenerateDataset(desired);
            setIsTyping(false);
            return;
          }

          // (upload intent removed)

          // Helpers
          const toNumber = (v) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : null;
          };
          const numericColumns = chatDataset.headers.filter(h => chatDataset.records.every(r => r[h] === '' || r[h] == null || Number.isFinite(Number(r[h]))));

          if (detectedFunction === 'info') {
            const totalRows = chatDataset.records.length;
            // Align with manual DatasetInformation.jsx (unique, nonNull, null%, dtype)
            const infoHeaders = ['Column', 'Unique', 'Non-null', 'Null %', 'Dtype'];
            const infoRows = chatDataset.headers.filter(h => h !== 'id').map(h => {
              const values = chatDataset.records.map(r => r[h]).filter(v => v !== undefined && v !== null);
              const uniqueCount = new Set(values).size;
              const nonNull = values.length;
              const nullPct = ((totalRows - nonNull) / totalRows) * 100;
              const dtype = typeof (chatDataset.records[0] || {})[h];
              return [h, String(uniqueCount), String(nonNull), nullPct.toFixed(2), dtype];
            });
            const botResponse = { id: getNextMessageId(), text: `ℹ️ Dataset information for ${chatDataset.name}`, sender: 'bot', timestamp: new Date() };
            setMessages(prev => [...prev, botResponse]);
            pushDatasetPreviewMessage(`Info - ${chatDataset.name}`, infoHeaders, infoRows);
            setIsTyping(false);
            return;
          }

          if (detectedFunction === 'stats') {
            if (numericColumns.length === 0) {
              const botResponse = { id: getNextMessageId(), text: '📊 No numeric columns found for statistics.', sender: 'bot', timestamp: new Date() };
              setMessages(prev => [...prev, botResponse]);
              setIsTyping(false);
              return;
            }
            // Align with manual DatasetStatistics.jsx (count, min, max, std, mean, 25%, 50%, 75%)
            const statsHeaders = ['Column', 'count', 'min', 'max', 'std', 'mean', '25%', '50%', '75%'];
            const statsRows = numericColumns.map(col => {
              const values = chatDataset.records.map(r => toNumber(r[col])).filter(v => v != null);
              const count = values.length;
              if (!count) return [col, '0', '', '', '', '', '', '', ''];
              const min = stats.min(values).toFixed(3);
              const max = stats.max(values).toFixed(3);
              const std = stats.standardDeviation(values).toFixed(3);
              const mean = stats.mean(values).toFixed(3);
              const q25 = stats.quantile(values, 0.25).toFixed(3);
              const q50 = stats.quantile(values, 0.5).toFixed(3);
              const q75 = stats.quantile(values, 0.75).toFixed(3);
              return [col, String(count), min, max, std, mean, q25, q50, q75];
            });
            const botResponse = { id: getNextMessageId(), text: '📊 Summary statistics (numeric columns):', sender: 'bot', timestamp: new Date() };
            setMessages(prev => [...prev, botResponse]);
            pushDatasetPreviewMessage(`Statistics - ${chatDataset.name}`, statsHeaders, statsRows);
            setIsTyping(false);
            return;
          }

          if (detectedFunction === 'duplicate') {
            const seen = new Map();
            const dups = [];
            chatDataset.records.forEach(r => {
              const key = chatDataset.headers.map(h => r[h]).join('|');
              const count = (seen.get(key) || 0) + 1;
              seen.set(key, count);
              if (count === 2) {
                dups.push(r);
              }
            });
            const dupCount = Array.from(seen.values()).filter(c => c > 1).reduce((a, b) => a + (b - 1), 0);
            const botResponse = {
              id: getNextMessageId(),
              text: `🧹 Duplicate rows: ${dupCount}${dupCount ? ' (showing first duplicates below)' : ''}`,
              sender: 'bot',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, botResponse]);
            if (dups.length) {
              const rows = dups.slice(0, 20).map(r => chatDataset.headers.map(h => r[h]));
              pushDatasetPreviewMessage(`Duplicates - ${chatDataset.name}`, chatDataset.headers, rows);
            }
            setIsTyping(false);
            return;
          }

          if (detectedFunction === 'correlation') {
            try {
              const botResponse = { id: getNextMessageId(), text: '🔗 Calculating correlation matrix...', sender: 'bot', timestamp: new Date() };
              setMessages(prev => [...prev, botResponse]);
              const { headers, rows } = await callCorrelation('kendall');
              pushDatasetPreviewMessage(`Correlation - ${chatDataset.name}`, headers, rows);
            } catch (e) {
              setMessages(prev => [...prev, { id: getNextMessageId(), text: `❌ Correlation failed: ${e.message}`, sender: 'bot', timestamp: new Date() }]);
            }
            setIsTyping(false);
            return;
          }

          if (detectedFunction === 'group') {
            // Parse group by columns from input, e.g., "group by colA, colB"
            const match = currentInput.match(/group\s*by\s+([a-zA-Z0-9_ ,]+)/i);
            let cols = match ? match[1].split(/[, ]+/).filter(Boolean) : [];
            // Force group_var to id as requested; fallback to first header if id missing
            const hasId = (chatDataset.headers || []).includes('id');
            cols = hasId ? ['id'] : [(chatDataset.headers || [])[0]].filter(Boolean);
            try {
              const botResponse = { id: getNextMessageId(), text: `🧮 Grouping by: ${cols.join(', ')} (agg: count)`, sender: 'bot', timestamp: new Date() };
              setMessages(prev => [...prev, botResponse]);
              const { headers, rows } = await callGroupBy(cols, 'count');
              pushDatasetPreviewMessage(`Group - ${chatDataset.name}`, headers, rows);
            } catch (e) {
              setMessages(prev => [...prev, { id: getNextMessageId(), text: `❌ Group by failed: ${e.message}`, sender: 'bot', timestamp: new Date() }]);
            }
            setIsTyping(false);
            return;
          }
        }

        // Check if it's a plot request
        if (functionData.isPlot) {
          // Get CSV data from Redux store
          const currentCsvData = csvData || [];

          // Check if data is available
          if (!currentCsvData || currentCsvData.length === 0) {
            const botResponse = {
              id: getNextMessageId(),
              text: "📊 I'd love to create a bar plot for you! However, I need you to upload a CSV file first. Please go to the Dashboard and upload your data, then come back and ask me to create the bar plot again.\n\n💡 Tip: Make sure to select a file from the File tab on the left sidebar.",
              sender: 'bot',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
            return;
          }

          // Check if data is still loading
          if (isDataLoading) {
            const botResponse = {
              id: getNextMessageId(),
              text: "📊 I'm preparing the bar plot interface for you! Please wait a moment while your data finishes loading...",
              sender: 'bot',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
            return;
          }

          // Extract available columns and show plot interface
          const columns = extractAvailableColumns(currentCsvData);
          setAvailableColumns(columns);
          setCurrentPlotType(functionData.plotType);

          // Try to extract parameters from natural language
          const extractedParams = extractPlotParams(currentInput, functionData.plotType);
          if (extractedParams.detected) {
            setPlotParams(extractedParams);
          }

          // Navigate to plot page first
          navigateToFunction(detectedFunction);

          // Show the plot interface in chat
          setShowPlotInterface(true);

          const botResponse = {
            id: getNextMessageId(),
            text: `📊 Perfect! I've opened the ${functionData.label} page for you and prepared the interface here in chat. I found ${columns.length} columns in your data: ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}. You can now select your parameters and generate the plot - it will appear in the main page!`,
            sender: 'bot',
            timestamp: new Date()
          };

          setMessages(prev => [...prev, botResponse]);
          setIsTyping(false);
          return;
        } else {
          // Navigate to the function immediately
          navigateToFunction(detectedFunction);

          const botResponse = {
            id: getNextMessageId(),
            text: `🎯 Perfect! I detected you want to use "${functionData.label}". I've opened it for you in the Dashboard. The function should now be selected and highlighted in the sidebar.`,
            sender: 'bot',
            timestamp: new Date()
          };

          setMessages(prev => [...prev, botResponse]);
          setIsTyping(false);
          return;
        }
      }
    }

    // If no function detected, check for prototype Iris classification intent
    const lowered = currentInput.toLowerCase();
    if ((lowered.includes('iris') && (lowered.includes('classify') || lowered.includes('classification') || lowered.includes('flowers') || lowered.includes('flower'))) || lowered.includes('classify flowers from iris')) {
      showIrisOptions();
      setIsTyping(false);
      return;
    }

    // If no special intent matched above, we still already forwarded to chat API

    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle plot parameter changes
  const handlePlotParamChange = (param, value) => {
    setPlotParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  // Handle categorical column selection
  const handleCategoricalChange = (column, checked) => {
    setPlotParams(prev => ({
      ...prev,
      categorical: checked
        ? [...prev.categorical, column]
        : prev.categorical.filter(col => col !== column)
    }));
  };

  // Generate plot from interface
  const handleGeneratePlot = async () => {
    try {
      setIsTyping(true);

      // Validate parameters based on plot type
      let validationError = '';

      if (currentPlotType === 'bar' || currentPlotType === 'count' || currentPlotType === 'pie') {
        if (plotParams.categorical.length === 0) {
          validationError = 'Please select at least one categorical variable (X-axis) before generating the plot.';
        } else if (!plotParams.numerical) {
          validationError = 'Please select a numerical variable (Y-axis) before generating the plot.';
        }
      } else if (currentPlotType === 'scatter' || currentPlotType === 'line' || currentPlotType === 'reg') {
        if (!plotParams.x_var) {
          validationError = 'Please select an X-axis variable before generating the plot.';
        } else if (!plotParams.y_var) {
          validationError = 'Please select a Y-axis variable before generating the plot.';
        }
      } else if (currentPlotType === 'histogram' || currentPlotType === 'box' || currentPlotType === 'violin') {
        if (!plotParams.numerical) {
          validationError = 'Please select a numerical variable before generating the plot.';
        }
      }

      if (validationError) {
        const botResponse = {
          id: getNextMessageId(),
          text: `❌ ${validationError}`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
        return;
      }

      // Send the parameters to the main plot component via custom event
      const eventName = `chatbotGenerate${currentPlotType.charAt(0).toUpperCase() + currentPlotType.slice(1)}Plot`;

      console.log('🤖 Sending plot parameters:', plotParams);
      console.log('🤖 Plot type:', currentPlotType);
      console.log('🤖 Event name:', eventName);

      // Dispatch custom event to trigger plot generation
      window.dispatchEvent(new CustomEvent(eventName, {
        detail: plotParams
      }));

      const botResponse = {
        id: getNextMessageId(),
        text: `📊 Perfect! I've sent your parameters to the ${currentPlotType.charAt(0).toUpperCase() + currentPlotType.slice(1)} Plot page. The plot should now be generating in the main area!

The plot will appear in the main page area!`,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Plot generation error:', error);
      const botResponse = {
        id: getNextMessageId(),
        text: `❌ Sorry, I encountered an error while generating your plot: ${error.message}. Please check your parameters and try again.`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  // Close plot interface
  const closePlotInterface = () => {
    setShowPlotInterface(false);
    setPlotResult(null);
  };

  // Handle icon drag start
  const handleIconMouseDown = (e) => {
    // Don't start drag if clicking to open/close
    if (e.button !== 0) return; // Only left click

    isDraggingIconRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      bottom: iconPosition.bottom,
      right: iconPosition.right
    };
    document.body.style.cursor = 'grabbing';
    e.preventDefault(); // Prevent text selection
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        onMouseDown={handleIconMouseDown}
        className={`fixed bg-primary-btn hover:bg-primary-btn-hover text-white rounded-full w-10 h-10 shadow-lg transition-all duration-300 z-50 flex items-center justify-center ${isOpen ? 'scale-110' : 'scale-100'
          }`}
        style={{
          bottom: `${iconPosition.bottom}px`,
          right: `${iconPosition.right}px`,
          cursor: isDraggingIconRef.current ? 'grabbing' : 'grab'
        }}
        title="Chat with Matflow Assistant (Drag to move)"
      >
        {isOpen ? <FiMinimize2 size={20} /> : (
          <span style={{ fontWeight: 800, fontSize: 16, lineHeight: 1 }}>M</span>
        )}
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div
          className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col"
          style={{
            width: `${chatSize.width}px`,
            height: `${chatSize.height}px`,
            // Smart positioning: show above icon if space available, otherwise below
            ...(iconPosition.bottom + 60 + chatSize.height > window.innerHeight
              ? { top: `${window.innerHeight - iconPosition.bottom + 60}px` }  // Show below icon
              : { bottom: `${iconPosition.bottom + 60}px` }  // Show above icon
            ),
            right: `${iconPosition.right}px`
          }}
        >
          {/* Chat Header */}
          <div className="bg-primary-btn text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-extrabold">M</div>
              <div>
                <h3 className="font-semibold">Matflow Assistant</h3>
                <p className="text-xs text-white opacity-80">Powered by Matflow</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="text-white hover:opacity-80 transition-opacity p-1 rounded hover:bg-white hover:bg-opacity-20"
                title="Clear chat history"
              >
                <FiTrash2 size={16} />
              </button>
              <button
                onClick={toggleChat}
                className="text-white hover:opacity-80 transition-opacity"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>
          {/* Hidden file input for chat uploads (triggered from message bubble buttons) */}
          <input
            ref={uploadInputRef}
            type="file"
            accept=".csv,text/csv,image/*,application/pdf,text/plain"
            onChange={onUploadFileChosen}
            style={{ display: 'none' }}
          />

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.filter(message => message && message.sender).map((message) => (
              <div key={message.id}>
                <div
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'datasetOptions' ? null : message.type === 'datasetPreview' ? (
                    <div className="bg-white text-gray-800 rounded-lg rounded-bl-none border border-gray-200 px-3 py-2 w-full">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Dataset: {message.dataset?.name}</p>
                        <button
                          onClick={() => { setModalDataset(message.dataset || { name: '', headers: [], rows: [] }); setShowDatasetModal(true); }}
                          className="text-xs bg-primary-btn hover:bg-primary-btn-hover text-white px-2 py-1 rounded"
                        >View larger</button>
                      </div>
                      <div className="border border-gray-200 rounded overflow-x-auto" style={{ maxHeight: 240, maxWidth: '100%' }}>
                        <table className="min-w-full text-xs">
                          <thead>
                            <tr>
                              {(message.dataset?.headers || []).map((h, i) => (
                                <th key={i} className="px-2 py-1 text-left border-b border-gray-200 whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(message.dataset?.rows || []).map((row, r) => (
                              <tr key={r} className={r % 2 ? 'bg-white' : 'bg-gray-100'}>
                                {(message.dataset?.headers || []).map((_, c) => (
                                  <td key={c} className="px-2 py-1 border-b border-gray-200 whitespace-nowrap">{row[c]}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : message.type === 'table' ? (
                    <div className="bg-white text-gray-800 rounded-lg rounded-bl-none border border-gray-200 px-3 py-2 w-full overflow-x-auto relative">
                      <button
                        onClick={() => { setModalDataset({ name: message.text || 'Preview', headers: message.table?.headers || [], rows: message.table?.rows || [] }); setShowDatasetModal(true); }}
                        className="absolute top-2 right-2 text-xs bg-primary-btn hover:bg-primary-btn-hover text-white px-2 py-1 rounded"
                        title="View larger"
                      >View larger</button>
                      {message.text ? (
                        <p className="text-sm font-medium mb-2 pr-20 truncate" title={message.text}>{message.text}</p>
                      ) : (
                        <p className="text-sm font-medium mb-2 pr-20">Table preview</p>
                      )}
                      <table className="min-w-full text-sm">
                        {(message.table?.headers && message.table.headers.length > 0) && (
                          <thead className="sticky top-0 bg-gray-50">
                            <tr>{(message.table.headers || []).map((h) => (<th key={h} className="px-2 py-1 text-left font-semibold border-b">{h}</th>))}</tr>
                          </thead>
                        )}
                        <tbody>
                          {(message.table?.rows || []).map((r, i) => (
                            <tr key={i} className={i % 2 ? 'bg-gray-50' : ''}>
                              {(r || []).map((c, j) => (<td key={j} className="px-2 py-1 border-b whitespace-nowrap">{String(c)}</td>))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : message.type === 'datasetDownload' ? (
                    <div className="bg-white text-gray-800 rounded-lg rounded-bl-none border border-gray-200 px-3 py-2">
                      <a href={message.url} className="text-primary-btn underline" target="_blank" rel="noreferrer">Download {message.name}.csv</a>
                    </div>
                  ) : message.type === 'image' ? (
                    <div className={`max-w-xs px-3 py-2 rounded-lg ${message.sender === 'user' ? 'bg-primary-btn text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'}`}>
                      <div className="text-xs mb-2">{message.name}</div>
                      <img src={message.url} alt={message.name} className="max-w-[200px] max-h-[160px] rounded" />
                      <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-white opacity-80' : 'text-gray-500'}`}>{formatTime(message.timestamp)}</p>
                    </div>
                  ) : message.type === 'file' ? (
                    <div className={`max-w-xs px-3 py-2 rounded-lg ${message.sender === 'user' ? 'bg-primary-btn text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'}`}>
                      <p className="text-sm">{message.name}</p>
                      {typeof message.size === 'number' && <p className={`text-xs ${message.sender === 'user' ? 'text-white opacity-80' : 'text-gray-500'}`}>{(message.size / 1024).toFixed(1)} KB</p>}
                      <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-white opacity-80' : 'text-gray-500'}`}>{formatTime(message.timestamp)}</p>
                    </div>
                  ) : (
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${message.sender === 'user'
                          ? 'bg-primary-btn text-white rounded-br-none'
                          : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                        }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-white opacity-80' : 'text-gray-500'
                        }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  )}
                </div>

              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-lg rounded-bl-none border border-gray-200 px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />

            {/* Universal Plot Interface */}
            {showPlotInterface && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">📊 {currentPlotType.charAt(0).toUpperCase() + currentPlotType.slice(1)} Plot Generator</h4>
                  <button
                    onClick={closePlotInterface}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Categorical Variables - for bar, count, pie plots */}
                  {(currentPlotType === 'bar' || currentPlotType === 'count' || currentPlotType === 'pie') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categorical Variables (X-axis)
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {availableColumns.map((column) => (
                          <label key={column} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={plotParams.categorical.includes(column)}
                              onChange={(e) => handleCategoricalChange(column, e.target.checked)}
                              className="rounded border-gray-300 text-primary-btn focus:ring-primary-btn"
                            />
                            <span className="text-sm text-gray-700">{column}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* X Variable - for scatter, line, reg plots */}
                  {(currentPlotType === 'scatter' || currentPlotType === 'line' || currentPlotType === 'reg') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        X-axis Variable
                      </label>
                      <select
                        value={plotParams.x_var}
                        onChange={(e) => handlePlotParamChange('x_var', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-btn"
                      >
                        <option value="">Select X-axis column</option>
                        {availableColumns.map((column) => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Y Variable - for scatter, line, reg plots */}
                  {(currentPlotType === 'scatter' || currentPlotType === 'line' || currentPlotType === 'reg') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Y-axis Variable
                      </label>
                      <select
                        value={plotParams.y_var}
                        onChange={(e) => handlePlotParamChange('y_var', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-btn"
                      >
                        <option value="">Select Y-axis column</option>
                        {availableColumns.map((column) => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Numerical Variable - for bar, count, pie, histogram, box, violin plots */}
                  {(currentPlotType === 'bar' || currentPlotType === 'count' || currentPlotType === 'pie' ||
                    currentPlotType === 'histogram' || currentPlotType === 'box' || currentPlotType === 'violin') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentPlotType === 'bar' || currentPlotType === 'count' || currentPlotType === 'pie'
                            ? 'Numerical Variable (Y-axis)'
                            : 'Numerical Variable'}
                        </label>
                        <select
                          value={plotParams.numerical}
                          onChange={(e) => handlePlotParamChange('numerical', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-btn"
                        >
                          <option value="">Select a numerical column</option>
                          {availableColumns.map((column) => (
                            <option key={column} value={column}>{column}</option>
                          ))}
                        </select>
                      </div>
                    )}

                  {/* Orientation - for applicable plots */}
                  {(currentPlotType === 'bar' || currentPlotType === 'count' || currentPlotType === 'histogram' ||
                    currentPlotType === 'box' || currentPlotType === 'violin') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Orientation
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              value="Vertical"
                              checked={plotParams.orientation === 'Vertical'}
                              onChange={(e) => handlePlotParamChange('orientation', e.target.value)}
                              className="text-primary-btn focus:ring-primary-btn"
                            />
                            <span className="text-sm text-gray-700">Vertical</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              value="Horizontal"
                              checked={plotParams.orientation === 'Horizontal'}
                              onChange={(e) => handlePlotParamChange('orientation', e.target.value)}
                              className="text-primary-btn focus:ring-primary-btn"
                            />
                            <span className="text-sm text-gray-700">Horizontal</span>
                          </label>
                        </div>
                      </div>
                    )}

                  {/* Annotate - for bar, count plots */}
                  {(currentPlotType === 'bar' || currentPlotType === 'count') && (
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={plotParams.annotate}
                          onChange={(e) => handlePlotParamChange('annotate', e.target.checked)}
                          className="rounded border-gray-300 text-primary-btn focus:ring-primary-btn"
                        />
                        <span className="text-sm font-medium text-gray-700">Show values on bars</span>
                      </label>
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plot Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={plotParams.title}
                      onChange={(e) => handlePlotParamChange('title', e.target.value)}
                      placeholder="Enter plot title"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-btn"
                    />
                  </div>

                  {/* Generate Button */}
                  <div className="flex space-x-2">
                    <button
                      onClick={handleGeneratePlot}
                      disabled={
                        (currentPlotType === 'bar' || currentPlotType === 'count' || currentPlotType === 'pie')
                          ? (plotParams.categorical.length === 0 || !plotParams.numerical)
                          : (currentPlotType === 'scatter' || currentPlotType === 'line' || currentPlotType === 'reg')
                            ? (!plotParams.x_var || !plotParams.y_var)
                            : (currentPlotType === 'histogram' || currentPlotType === 'box' || currentPlotType === 'violin')
                              ? !plotParams.numerical
                              : false
                      }
                      className="flex-1 bg-primary-btn hover:bg-primary-btn-hover disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <FiSend className="mr-2" size={16} />
                      Generate Plot
                    </button>
                  </div>

                  {/* Plot Result */}
                  {plotResult && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-800 mb-2">Generated Plot:</h5>
                      <div className="text-sm text-gray-600">
                        <p>✅ Plot generated successfully!</p>
                        {plotParams.categorical.length > 0 && <p>• Categorical: {plotParams.categorical.join(', ')}</p>}
                        {plotParams.numerical && <p>• Numerical: {plotParams.numerical}</p>}
                        {plotParams.x_var && <p>• X-axis: {plotParams.x_var}</p>}
                        {plotParams.y_var && <p>• Y-axis: {plotParams.y_var}</p>}
                        <p>• Orientation: {plotParams.orientation}</p>
                        <p>• Annotate: {plotParams.annotate ? 'Yes' : 'No'}</p>
                        {plotParams.title && <p>• Title: {plotParams.title}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-transparent"
                rows="1"
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
              <div className="relative group">
                <button
                  onClick={handleUploadOwnDataset}
                  className="bg-primary hover:bg-primary-dark text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                  title="Upload images & files"
                  aria-label="Upload images & files"
                >
                  <FiUpload size={16} />
                </button>
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  images & files
                </span>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-primary-btn hover:bg-primary-btn-hover disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <FiSend size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
          {/* Removed secondary preview to avoid duplicate table */}
          {/* Resize handle - top-left */}
          <div
            onMouseDown={(e) => {
              isResizingRef.current = true;
              resizeStartRef.current = {
                mouseX: e.clientX,
                mouseY: e.clientY,
                width: chatSize.width,
                height: chatSize.height
              };
            }}
            title="Drag to resize"
            style={{ position: 'absolute', left: 2, top: 2, width: 16, height: 16, cursor: 'nwse-resize' }}
            className="bg-transparent"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M1 1 L15 15" stroke="#cbd5e1" strokeWidth="2" />
              <path d="M1 5 L11 15" stroke="#cbd5e1" strokeWidth="2" />
              <path d="M1 9 L7 15" stroke="#cbd5e1" strokeWidth="2" />
            </svg>
          </div>
        </div>
      )}
      {showDatasetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-5xl w-[90%] max-h-[80%] flex flex-col">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">Dataset: {modalDataset.name}</h4>
              <button onClick={() => setShowDatasetModal(false)} className="text-gray-600 hover:text-gray-800">✕</button>
            </div>
            <div className="p-3 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {(modalDataset.headers || []).map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left border-b border-gray-200 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(modalDataset.rows || []).map((row, r) => (
                    <tr key={r} className={r % 2 ? 'bg-white' : 'bg-gray-100'}>
                      {(modalDataset.headers || []).map((_, c) => (
                        <td key={c} className="px-3 py-2 border-b border-gray-200 whitespace-nowrap">{row[c]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;

