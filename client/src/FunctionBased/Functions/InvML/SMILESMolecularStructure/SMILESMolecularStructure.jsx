import React, { useState, useEffect, useRef } from "react";
import { 
  Typography, 
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  FormControlLabel as MuiFormControlLabel,
  Grid,
  Card,
  CardContent,
  Box,
  Paper
} from "@mui/material";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ImageIcon from '@mui/icons-material/Image';
import { Progress, Modal } from "@nextui-org/react";
import { toast } from "react-toastify";
import { apiService } from "../../../../services/api/apiService";
import { apiFetch } from "../../../../util/apiClient";
import { isLoggedIn } from "../../../../util/adminAuth";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import AgGridAutoDataComponent from "../../../Components/AgGridComponent/AgGridAutoDataComponent";
import Docs from "../../../../Docs/Docs";

function SMILESMolecularStructure({ csvData }) {
  // Configuration state
  const [smilesColumn, setSmilesColumn] = useState("");
  const [processingMode, setProcessingMode] = useState("batch"); // batch, individual
  const [imageSize, setImageSize] = useState(300);
  const [imageFormat, setImageFormat] = useState("png"); // png, svg
  const [maxImages, setMaxImages] = useState(100);
  
  // Individual SMILES input
  const [singleSMILES, setSingleSMILES] = useState("");
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentProcessing, setCurrentProcessing] = useState("");
  const [results, setResults] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [visible, setVisible] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  
  // For polling
  const pollIntervalRef = useRef(null);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  // Create a safe filename from a SMILES string
  const getSafeFileName = (smiles, fallback = "molecule") => {
    if (!smiles || typeof smiles !== "string") return fallback;
    const cleaned = smiles.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
    return cleaned || fallback;
  };

  // Get available columns for SMILES
  const availableColumns = csvData ? Object.keys(csvData[0]) : [];
  // Check for stored taskId on component mount
  useEffect(() => {
    const storedTaskId = sessionStorage.getItem('smiles_structure_task_id');
    if (storedTaskId && !taskId) {
      console.log("Restoring taskId from sessionStorage:", storedTaskId);
      setTaskId(storedTaskId);
    }
  }, []);

  // Progress simulation
  useEffect(() => {
    if (loading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev + 2 < 95) return prev + 2;
          return 95;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Start polling for task status
  const startPolling = (taskId) => {
    // Immediately check the task status once
    checkTaskStatus(taskId);
    
    // Then set up polling every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      checkTaskStatus(taskId);
    }, 3000);
  };

  // Process successful response data
  const processSuccessResponse = (data) => {
    // Extract results data, handling different response formats
    let results = data.results || {};
      // Get preview images from the response
    let previewImages = [];
    
    // Get task ID from the response if available
    if (data.task_id && !taskId) {
      console.log("Setting taskId from response:", data.task_id);
      setTaskId(data.task_id);
    }
    
    // Handle different response formats - Check for preview_images array first
    if (Array.isArray(data.preview_images)) {
      console.log("Found preview_images array at top level:", data.preview_images);
      previewImages = data.preview_images;
    } else if (Array.isArray(results.preview_images)) {
      console.log("Found preview_images array in results:", results.preview_images);
      previewImages = results.preview_images;
    } else if (typeof results === 'object' && results.preview_images) {
      console.log("Found preview_images object in results:", results.preview_images);
      previewImages = results.preview_images;
    } else if (Array.isArray(results)) {
      console.log("Results is an array:", results);
      previewImages = results;
    } 
    // Handle case where results is an object with SMILES strings as keys and image paths as values
    else if (typeof results === 'object' && Object.keys(results).length > 0) {
      console.log("Results appears to be a map of SMILES to image paths");
      
      // Extract task ID from image paths if possible
      const pathPattern = /\/media\/structures\/([^\/]+)\//;
      Object.values(results).forEach(value => {
        if (typeof value === 'string') {
          const match = value.match(pathPattern);
          if (match && match[1] && !taskId) {
            console.log("Extracted task ID from image path:", match[1]);
            setTaskId(match[1]);
          }
        }
      });
      
      // Extract entries that look like file paths
      const imagePaths = [];
      Object.entries(results).forEach(([smiles, value], index) => {
        if (typeof value === 'string' && (value.includes('/media/') || value.includes('.png') || value.includes('.svg'))) {
          console.log(`Found image path for SMILES ${smiles}: ${value}`);
          imagePaths.push({
            smiles: smiles,
            path: value,
            // For direct image access we'll use index-based naming (1.png, 2.png, etc.)
            index: index + 1
          });
        }
      });
      
      if (imagePaths.length > 0) {
        console.log(`Extracted ${imagePaths.length} image paths from results`);
        previewImages = imagePaths;
        
    // Also store SMILES to path mapping for later use
        results.smilesMap = imagePaths.reduce((map, item) => {
          map[item.path] = item.smiles;
          return map;
        }, {});
        
        // Also store the inverse mapping (path to SMILES) for easier lookup
        results.pathToSmilesMap = imagePaths.reduce((map, item) => {
          map[item.path] = item.smiles;
          return map;
        }, {});
      }
    }
      // Calculate statistics - use explicit values from data when available
    const totalSmiles = data.total || results?.summary?.total || previewImages.length || 0;
    const validStructures = previewImages.length || 0;
    
    console.log(`Statistics calculation: total=${totalSmiles}, valid=${validStructures}`);
    
    // Create download links if they don't exist
    const downloadLinks = results.download_links || {};
      // Create different result structures based on processing mode
    let processedResults;
    
    if (processingMode === "batch") {
      // For batch mode, include summary statistics (keys aligned with UI)
      processedResults = {
        ...results,
        preview_images: previewImages,
        download_links: downloadLinks,
        summary: {
          total_smiles: totalSmiles,
          successful_generations: validStructures,
          failed_generations: Math.max(totalSmiles - validStructures, 0),
          success_rate: totalSmiles
            ? Math.round((validStructures / totalSmiles) * 100)
            : 0
        }
      };
    } else {
      // For single mode, don't include summary statistics
      processedResults = {
        ...results,
        preview_images: previewImages,
        download_links: downloadLinks,
        single_mode: true
      };
    }
    
    console.log("Processed results:", processedResults);
    setResults(processedResults);
    setCurrentProcessing("");    // Set preview images if available
    if (processedResults.preview_images && processedResults.preview_images.length > 0) {
      console.log("Processing preview images:", processedResults.preview_images);
        // We'll create a simplified structure to reliably show the images
      let processedPreviewImages = [];
      
      console.log("Task ID when processing preview images:", taskId);
      
      // For batch processing with direct structure paths in API response
      if (Array.isArray(processedResults.preview_images)) {
        processedPreviewImages = processedResults.preview_images
          .filter(item => item) // Remove null/undefined items
          .map((item, index) => {
            const currentIndex = index + 1;
            
            // If it's an object with smiles and path properties (from our previous extraction)
            if (typeof item === 'object' && item !== null) {
              // Extract file number from path if available
              let pathIndex = null;
              if (item.path) {
                const match = item.path.match(/\/(\d+)\.(png|svg)$/);
                if (match) {
                  pathIndex = parseInt(match[1]);
                }
              }
              
              if (item.smiles && (item.path || item.image_url)) {
                return {
                  smiles: item.smiles,
                  path: item.path,
                  image_url: item.image_url,
                  // Use explicit index from path if available, otherwise use item.index or position in array
                  index: pathIndex || item.index || currentIndex,
                  valid: true
                };
              } else if (item.smiles) {
                return {
                  smiles: item.smiles,
                  index: pathIndex || item.index || currentIndex,
                  valid: true
                };
              }
            } 
            // If it's a string path
            else if (typeof item === 'string') {
              // Try to extract file number from path
              const match = item.match(/\/(\d+)\.(png|svg)$/);
              const pathIndex = match ? parseInt(match[1]) : null;
              
              // Try to extract SMILES from the path if possible
              const pathParts = item.split('/');
              const fileName = pathParts[pathParts.length - 1];
              const baseFileName = fileName.split('.')[0];
              
              // If processing single mode, use the input SMILES
              const smiles = processingMode === "single" ? 
                singleSMILES : 
                `Structure ${currentIndex}`;
                
              return {
                smiles: smiles,
                path: item,
                index: pathIndex || currentIndex,
                valid: true
              };
            }
            
            // Fallback for any other case
            return {
              smiles: `Structure ${currentIndex}`,
              index: currentIndex,
              valid: true
            };
          });
      }
      // Handle the case where we have an array of objects with path and smiles
      else if (processedResults.preview_images.length > 0 && 
               typeof processedResults.preview_images[0] === 'object') {
        processedPreviewImages = processedResults.preview_images.map((item, index) => ({
          smiles: item.smiles || `Structure ${index + 1}`,
          index: item.index || index + 1,
          valid: item.valid !== undefined ? item.valid : true
        }));
      }
      
      // For single mode, ensure we only show one image
      if (processingMode === "single") {
        processedPreviewImages = processedPreviewImages.slice(0, 1);
        
        // If we have a direct image_base64 value in the results, use it
        if (results.image_base64) {
          processedPreviewImages = [{
            smiles: singleSMILES,
            image_base64: results.image_base64,
            valid: true
          }];
        }
      } else {
        // For batch mode, limit to 12 images
        processedPreviewImages = processedPreviewImages.slice(0, 12);
      }
      
      console.log("Setting preview images:", processedPreviewImages);
      setPreviewImages(processedPreviewImages);
      
      console.log("Setting preview images:", processedPreviewImages);
      setPreviewImages(processedPreviewImages);
    }
    
    toast.success("Molecular structure generation completed successfully!");
    
    // Log the final data for debugging
    console.log("Final success data:", data);
  };

  // Check task status
  const checkTaskStatus = async (taskId) => {
    try {
      console.log(`Checking task status for: ${taskId}`);
      const data = await apiService.matflow.chemistry.smilesStructureStatus(taskId);
      console.log("Task status response:", data);
      
      if (data.status === "SUCCESS") {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setLoading(false);
        setProgress(100);
        
        console.log("Processing SUCCESS response:", data);
        processSuccessResponse(data);
      } else if (data.status === "FAILURE") {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error(data.error || "Structure generation failed");
      } else if (data.status === "PENDING" || data.status === "STARTED") {
        // Task is not ready yet, continue polling
        console.log(`Task is ${data.status}, continuing to poll...`);
        setCurrentProcessing(`Task is ${data.status}. Waiting for processing to begin...`);
      } else if (data.status === "PROGRESS") {
        // Update progress information
        if (data.current && data.total) {
          const progressPercent = (data.current / data.total) * 100;
          setProgress(progressPercent);
          setCurrentProcessing(`Generating ${data.current}/${data.total}: ${data.current_smiles || ''}`);
        }
      }
    } catch (error) {
      console.error("Polling error:", error);
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      setLoading(false);
      setProgress(100);
      setCurrentProcessing("");
      toast.error("Error checking generation status");
    }
  };

  // Handle batch structure generation
  const handleBatchGeneration = async () => {
    if (!smilesColumn) {
      toast.error("Please select a SMILES column");
      return;
    }

    setLoading(true);
    setResults(null);
    setTaskId(null);
    setPreviewImages([]);
    setCurrentProcessing("Starting molecular structure generation...");

    const requestData = {
      mode: "batch",
      dataset: csvData,
      smiles_column: smilesColumn,      config: {
        image_size: imageSize,
        image_format: imageFormat,
        generate_pdf: false, // PDF generation disabled
        max_images: maxImages
      }
    };

    if (!isLoggedIn()) {
      toast.error('Please log in to generate molecular structures.');
      setLoading(false);
      return;
    }

    try {
      const data = await apiService.matflow.chemistry.smilesStructureGenerate(requestData, false);
      
      if (data.error) {
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error(data.error || "Failed to start generation");
        return;
      }
      
      if (data.task_id) {
        console.log("Received task_id:", data.task_id);
        const receivedTaskId = data.task_id;
        setTaskId(receivedTaskId);
        // Store task ID in sessionStorage for persistence across page reloads
        sessionStorage.setItem('smiles_structure_task_id', receivedTaskId);
        startPolling(receivedTaskId);
        toast.info("Molecular structure generation started. This may take several minutes...");
      } else {
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error(data.error || "Failed to start generation");
      }
    } catch (error) {
      setLoading(false);
      setProgress(100);
      setCurrentProcessing("");
      toast.error("Error starting generation: " + error.message);
    }  };

  // Handle single SMILES structure generation
  const handleSingleGeneration = async () => {
    if (!singleSMILES.trim()) {
      toast.error("Please enter a SMILES string");
      return;
    }

    setLoading(true);
    setResults(null);
    setTaskId(null);
    setPreviewImages([]);
    setCurrentProcessing(`Generating structure for: ${singleSMILES}`);

    const requestData = {
      mode: "single",
      smiles: singleSMILES.trim(),
      config: {
        image_size: imageSize,
        image_format: imageFormat
      }
    };

    if (!isLoggedIn()) {
      toast.error('Please log in to generate molecular structures.');
      setLoading(false);
      return;
    }

    try {
      const response = await apiFetch(
        `${import.meta.env.VITE_APP_API_URL}/api/smiles-structure/generate/`,
        {
          method: "POST",
          body: JSON.stringify(requestData),
        }
      );
      
      // Check content type to handle direct image responses
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('image/')) {
        // Direct image response - handle it
        console.log("Received direct image response");
        
        // Get the blob directly
        const imageBlob = await response.blob();
        
        // Create an object URL for preview
        const imageUrl = URL.createObjectURL(imageBlob);
        
        // Create a dummy task ID for consistent handling
        const tempTaskId = `single-${Date.now()}`;
        setTaskId(tempTaskId);
        
        // Save the blob to sessionStorage for download
        sessionStorage.setItem('smiles_structure_single_image', imageUrl);
        sessionStorage.setItem('smiles_structure_task_id', tempTaskId);
        
        // Update state
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
          // Create a result object for single mode (without batch summary data)
        const resultObj = {
          single_mode: true,
          smiles: singleSMILES,
          image_url: imageUrl
        };

        setResults(resultObj);

        // Add preview image (used for any future gallery/expansion)
        setPreviewImages([
          {
            smiles: singleSMILES,
            direct_url: imageUrl,
            index: 1,
            valid: true
          }
        ]);
        
        toast.success("Molecular structure generated successfully!");
      } else {
        // Regular JSON response
        const data = await response.json();
        
        if (response.ok) {
          console.log("Single generation response:", data);
          
          // Check if this is a task ID or direct result
          if (data.task_id) {
            // It's an async task - start polling
            console.log("Single generation returned task_id:", data.task_id);
            setTaskId(data.task_id);
            sessionStorage.setItem('smiles_structure_task_id', data.task_id);
            startPolling(data.task_id);
            toast.info("Structure generation started...");          } else if (data.results) {
            // Direct result without async task
            setLoading(false);
            setProgress(100);
            setCurrentProcessing("");
            
            // For single mode, create a results object without batch statistics
            setResults({
              ...data.results,
              single_mode: true
            });
            
            // Set single image preview
            if (data.results.image_base64) {
              setPreviewImages([{
                smiles: singleSMILES,
                image_base64: data.results.image_base64,
                valid: true
              }]);
            } else if (data.results.image_url) {
              setPreviewImages([{
                smiles: singleSMILES,
                image_url: data.results.image_url,
                valid: true
              }]);
            }
            
            toast.success("Molecular structure generated successfully!");
          } else {
            setLoading(false);
            setProgress(100);
            setCurrentProcessing("");
            toast.warning("No results returned");
          }
        } else {
          setLoading(false);
          setProgress(100);
          setCurrentProcessing("");
          toast.error(data.error || "Failed to generate structure");
        }
      }
    } catch (error) {
      setLoading(false);
      setProgress(100);
      setCurrentProcessing("");
      toast.error("Error generating structure: " + error.message);
    }
  };// Download function for files (images, zip archives)
  const handleDownload = (url, filename) => {
    console.log(`Downloading from URL: ${url}, filename: ${filename}`);
    
    // Ensure URL is absolute
    let fullUrl;
    if (url && !url.startsWith('http') && !url.startsWith('data:')) {
      fullUrl = `${import.meta.env.VITE_APP_API_URL}${url.startsWith('/') ? url : `/${url}`}`;
      console.log(`Converted to absolute URL: ${fullUrl}`);
    } else {
      fullUrl = url;
    }
    
    // Show loading toast
    const toastId = toast.loading(`Preparing ${filename} for download...`);
    
    // Handle all file downloads
    apiFetch(fullUrl, { 
      method: 'GET',
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Download failed with status: ${response.status}`);
        }
        return response.blob();
      })      .then(blob => {
        // Check if the blob is valid (not too small which would indicate an error)
        if (blob.size < 100) {  // Usually an error message would be smaller than this
          throw new Error("The downloaded file appears to be empty or invalid");
        }
        
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
          document.body.removeChild(link);
        }, 100);
        
        // Update toast
        toast.update(toastId, { 
          render: `${filename} downloaded successfully!`, 
          type: "success", 
          isLoading: false,
          autoClose: 3000
        });
      })
      .catch(error => {
        console.error("Download error:", error);
        toast.update(toastId, { 
          render: `Failed to download ${filename}: ${error.message}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      });
  };
    // Function to download all images as ZIP
  const handleDownloadZip = () => {
    // Get taskId from state or sessionStorage
    const currentTaskId = taskId || sessionStorage.getItem('smiles_structure_task_id');
    
    if (!currentTaskId) {
      toast.error("No generated images available for download");
      return;
    }
    
    const apiUrl = import.meta.env.VITE_APP_API_URL || '';
    const zipUrl = `${apiUrl}/api/smiles-structure/download-zip/${currentTaskId}/`;
    console.log("Requesting ZIP download from:", zipUrl);
    
    // Show loading toast
    const toastId = toast.loading("Preparing ZIP archive of all generated images...");
    
    apiFetch(zipUrl, { 
      method: 'GET',
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`ZIP generation failed with status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        // Check if the blob is valid (not too small which would indicate an error)
        if (blob.size < 100) {  // Usually an error message would be larger than this
          throw new Error("The generated ZIP appears to be empty or invalid");
        }
        
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `molecular-structures-${currentTaskId}.zip`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
          document.body.removeChild(link);
        }, 100);
        
        // Update toast
        toast.update(toastId, { 
          render: "ZIP archive downloaded successfully!", 
          type: "success", 
          isLoading: false,
          autoClose: 3000
        });
      })
      .catch(error => {
        console.error("ZIP download error:", error);
        toast.update(toastId, { 
          render: `Failed to download ZIP archive: ${error.message}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4">
      <Typography
        variant="h5"
        className="!font-semibold !mb-3 !text-text"
        gutterBottom
      >
        SMILES to Molecular Structure Generator
      </Typography>

      {/* Processing Mode Selection */}
      <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <FormControl component="fieldset">
          <FormLabel component="legend" className="!text-sm !font-semibold !text-text">
            Processing Mode
          </FormLabel>
          <RadioGroup
            value={processingMode}
            onChange={(e) => setProcessingMode(e.target.value)}
            className="mt-2"
          >
            <FormControlLabel
              value="individual"
              control={<Radio size="small" />}
              label="Individual SMILES"
              className="!text-sm"
            />
            <FormControlLabel
              value="batch"
              control={<Radio size="small" />}
              label="Batch Processing (from dataset)"
              className="!text-sm"
            />
          </RadioGroup>
        </FormControl>
      </div>

      {/* Batch Processing Configuration */}
      {processingMode === "batch" && (
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <Typography
              variant="body2"
              className="!text-text !font-semibold mb-2 text-sm"
            >
              Select SMILES Column:
            </Typography>
            <SingleDropDown
              columnNames={availableColumns}
              onValueChange={setSmilesColumn}
              initValue={smilesColumn}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <TextField
              label="Image Size (px)"
              type="number"
              size="small"
              value={imageSize}
              onChange={(e) => setImageSize(parseInt(e.target.value))}
              InputProps={{ inputProps: { step: 50, min: 100, max: 800 } }}
              helperText="Size of generated molecular images"
            />
            <TextField
              label="Max Images"
              type="number"
              size="small"
              value={maxImages}
              onChange={(e) => setMaxImages(parseInt(e.target.value))}
              InputProps={{ inputProps: { step: 10, min: 1, max: 500 } }}
              helperText="Maximum number of images to generate"
            />
            <FormControl fullWidth size="small">
              <FormLabel component="legend" className="!text-sm !font-medium !text-gray-700">
                Image Format
              </FormLabel>
              <RadioGroup
                value={imageFormat}
                onChange={(e) => setImageFormat(e.target.value)}
                row
                className="mt-1"
              >
                <FormControlLabel
                  value="png"
                  control={<Radio size="small" />}
                  label="PNG"
                  className="!text-sm"
                />
                <FormControlLabel
                  value="svg"
                  control={<Radio size="small" />}
                  label="SVG"
                  className="!text-sm"
                />
              </RadioGroup>
            </FormControl>
          </div>
        </div>
      )}

      {/* Individual SMILES Processing */}
      {processingMode === "individual" && (
        <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] gap-4 items-start">
            {/* SMILES input + samples */}
            <div>
              <TextField
                label="Enter SMILES String"
                fullWidth
                size="small"
                value={singleSMILES}
                onChange={(e) => setSingleSMILES(e.target.value)}
                placeholder="e.g., CCO (ethanol)"
                helperText="Enter a single SMILES string to generate molecular structure"
                className="!mb-3"
              />

              {/* Sample SMILES for testing */}
              <div className="mt-2">
                <Typography
                  variant="body2"
                  className="!text-gray-600 mb-2 !text-sm"
                >
                  Sample SMILES for testing:
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {["CCO", "CC(C)O", "c1ccccc1", "CC(=O)O", "CCN(CC)CC"].map(
                    (sample) => (
                      <button
                        key={sample}
                        onClick={() => setSingleSMILES(sample)}
                        className="px-2 py-1 text-xs bg-primary/10 text-primary-dark rounded-md hover:bg-primary/20 transition-colors border border-primary/20"
                      >
                        {sample}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Image size + format beside input */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-start md:gap-2">
              <div className="md:w-1/2">
                <TextField
                  label="Image Size (px)"
                  type="number"
                  size="small"
                  value={imageSize}
                  onChange={(e) => setImageSize(parseInt(e.target.value))}
                  InputProps={{ inputProps: { step: 50, min: 100, max: 800 } }}
                  helperText="Size of generated molecular image"
                />
              </div>
              <div className="md:w-1/2 mt-4 md:mt-0">
                <FormControl size="small">
                  <FormLabel
                    component="legend"
                    className="!text-sm !font-medium !text-gray-700"
                  >
                    Image Format
                  </FormLabel>
                  <RadioGroup
                    value={imageFormat}
                    onChange={(e) => setImageFormat(e.target.value)}
                    row
                    className="mt-1"
                  >
                    <FormControlLabel
                      value="png"
                      control={<Radio size="small" />}
                      label="PNG"
                      className="!text-sm"
                    />
                    <FormControlLabel
                      value="svg"
                      control={<Radio size="small" />}
                      label="SVG"
                      className="!text-sm"
                    />
                  </RadioGroup>
                </FormControl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="contained"
          size="medium"
          onClick={processingMode === "batch" ? handleBatchGeneration : handleSingleGeneration}
          disabled={loading || (processingMode === "batch" && !smilesColumn) || (processingMode === "individual" && !singleSMILES.trim())}
          className="!bg-primary-btn !text-white !font-medium !px-6 !py-2 !text-xs md:!text-sm"
        >
          {loading ? "Generating..." : "GENERATE MOLECULAR STRUCTURE"}
        </Button>
      </div>

      {/* Progress Bar */}
      {loading && (
        <div className="mb-4 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col items-center justify-center">
            {/* Lazy Loading Animation */}
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary-btn rounded-full border-t-transparent animate-spin"></div>
            </div>
            <Typography variant="body1" className="!text-text !text-center !mb-2 !font-medium">
              Generating molecular structures...
            </Typography>
            {currentProcessing && (
              <Typography variant="body2" className="!text-gray-600 !text-center">
                {currentProcessing}
              </Typography>
            )}
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="mt-5">
          <Typography
            variant="h6"
            className="!font-semibold !mb-4 !text-text"
            gutterBottom
          >
            Molecular Structure Generation Results
          </Typography>

          {/* Summary Statistics for Batch */}
          {processingMode === "batch" && results.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <Typography
                  variant="body2"
                  className="!font-medium !text-text !mb-1 text-xs md:text-sm"
                >
                  Total SMILES
                </Typography>
                <Typography
                  variant="h6"
                  className="!text-primary-btn !font-bold !text-base md:!text-lg"
                >
                  {results.summary.total_smiles || 0}
                </Typography>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <Typography
                  variant="body2"
                  className="!font-medium !text-text !mb-1 text-xs md:text-sm"
                >
                  Successfully Generated
                </Typography>
                <Typography
                  variant="h6"
                  className="!text-primary-btn !font-bold !text-base md:!text-lg"
                >
                  {results.summary.successful_generations || 0}
                </Typography>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <Typography
                  variant="body2"
                  className="!font-medium !text-text !mb-1 text-xs md:text-sm"
                >
                  Failed Generations
                </Typography>
                <Typography
                  variant="h6"
                  className="!text-danger-btn !font-bold !text-base md:!text-lg"
                >
                  {results.summary.failed_generations || 0}
                </Typography>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <Typography
                  variant="body2"
                  className="!font-medium !text-text !mb-1 text-xs md:text-sm"
                >
                  Success Rate
                </Typography>
                <Typography
                  variant="h6"
                  className="!text-primary-btn !font-bold !text-base md:!text-lg"
                >
                  {results.summary.success_rate || 0}%
                </Typography>
              </div>
            </div>
          )}

          {/* Individual Result */}
          {processingMode === "individual" && (
            <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Typography
                variant="subtitle1"
                className="!font-medium !mb-3 !text-text"
              >
                Individual Molecular Structure Result
              </Typography>
              
              {results && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] gap-6 items-start">
                    {/* Text details */}
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="font-semibold w-32 !text-text">
                          SMILES:
                        </span>
                        <span className="!text-primary-btn font-mono break-all">
                          {results.smiles || "Not available"}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32 !text-text">
                          Image Size:
                        </span>
                        <span className="!text-primary-btn font-medium">
                          {imageSize}px
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32 !text-text">
                          Format:
                        </span>
                        <span className="!text-primary-btn font-medium">
                          {imageFormat.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Preview Image */}
                    {results.image_url && (
                      <div className="flex flex-col items-center gap-3">
                        <Typography
                          variant="body2"
                          className="!font-medium !text-gray-700 !mb-1"
                        >
                          Generated Structure:
                        </Typography>
                        <div
                          className="flex items-center justify-center bg-white rounded-md"
                          style={{ width: imageSize + 40, height: imageSize + 40 }}
                        >
                          <img
                            src={results.image_url}
                            alt="Molecular Structure"
                            style={{ width: imageSize, height: imageSize }}
                            className="rounded-md"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const fileName = `${getSafeFileName(
                              results.smiles || singleSMILES
                            )}.${imageFormat}`;
                            const link = document.createElement("a");
                            link.href = results.image_url;
                            link.download = fileName;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="px-4 py-1.5 text-xs md:text-sm rounded-md border border-primary text-primary hover:bg-primary/5 transition-colors"
                        >
                          Download Image
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Download Links - Only shown for batch mode AND when results are batch results */}
          {taskId && processingMode === "batch" && results && !results.single_mode && (
            <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <Typography
                variant="h6"
                className="!font-medium !mb-4 flex items-center !text-text"
              >
                <CloudDownloadIcon className="mr-2 !text-primary-btn" />
                Download Options
              </Typography>
              <div className="flex flex-wrap gap-4">
                {/* ZIP download button */}
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CloudDownloadIcon />}
                  endIcon={<span>📦</span>}
                  onClick={handleDownloadZip}
                  className="!bg-primary-btn !text-white !px-6 !py-2.5 !text-sm hover:!bg-opacity-90 transition-all duration-300"
                >
                  Download All Images as ZIP
                </Button>
              </div>
            </div>
          )}

          {/* Generation Log */}
          {results.generation_log && results.generation_log.length > 0 && (
            <div className="mb-6">
              <Typography
                variant="h5"
                className="!font-medium !mb-3"
                gutterBottom
              >
                Generation Log
              </Typography>
              <AgGridAutoDataComponent
                rowData={results.generation_log}
                download={true}
                height="300px"
                rowHeight={40}
                headerHeight={50}
                paginationPageSize={15}
              />
            </div>
          )}

          {/* Invalid SMILES */}
          {results.invalid_smiles && results.invalid_smiles.length > 0 && (
            <div className="mb-6">
              <Typography
                variant="h5"
                className="!font-medium !mb-3"
                gutterBottom
              >
                Invalid SMILES
              </Typography>
              <AgGridAutoDataComponent
                rowData={results.invalid_smiles}
                download={true}
                height="200px"
                rowHeight={40}
                headerHeight={50}
                paginationPageSize={10}
              />
            </div>
          )}

          {/* Processing Stats */}
          {results.processing_stats && (
            <div className="mb-6">
              <Typography
                variant="h5"
                className="!font-medium !mb-3"
                gutterBottom
              >
                Processing Statistics
              </Typography>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm">
                  {JSON.stringify(results.processing_stats, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Individual download button for single mode - only when we have single mode results */}
      {taskId && processingMode === "single" && results && results.single_mode && (
        <div className="flex justify-center my-4">
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<ImageIcon />}
            endIcon={<span>🖼️</span>}
            onClick={() => {
              const smilesName = results.smiles || singleSMILES;
              const fileName = `${getSafeFileName(smilesName)}.${imageFormat}`;

              // Check if we have a direct image URL from sessionStorage (for direct image responses)
              const directImageUrl = sessionStorage.getItem(
                "smiles_structure_single_image"
              );

              if (directImageUrl) {
                const link = document.createElement("a");
                link.href = directImageUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Image downloaded successfully!");
              } else {
                const apiUrl = import.meta.env.VITE_APP_API_URL || "";
                const currentTaskId =
                  taskId || sessionStorage.getItem("smiles_structure_task_id");
                if (!currentTaskId) {
                  toast.error("No image available for download");
                  return;
                }
                const imageUrl = `/media/structures/${currentTaskId}/1.${imageFormat}`;
                handleDownload(`${apiUrl}${imageUrl}`, fileName);
              }
            }}
            className="!bg-primary-btn !text-white !px-6 !py-2.5 !text-sm"
          >
            Download Single Image
          </Button>
        </div>
      )}

      {/* Help Button */}
      <button
        className="fixed bottom-20 right-5 bg-primary-btn text-xl font-bold text-white rounded-full w-10 h-10 shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center"
        onClick={openModal}
      >
        ?
      </button>

      {/* Help Modal */}
      <Modal
        open={visible}
        onClose={closeModal}
        aria-labelledby="help-modal"
        aria-describedby="help-modal-description"
        width="800px"
        scroll
        closeButton
      >
        <div className="bg-white text-left rounded-lg shadow-lg px-6 overflow-auto">
          <Docs section={"smilesStructure"} />
        </div>      </Modal>
    </div>
  );
}

export default SMILESMolecularStructure;