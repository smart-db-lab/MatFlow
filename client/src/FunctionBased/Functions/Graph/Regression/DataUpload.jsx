import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
  Typography,
  Box,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  Fade,
  Grid,
  Avatar,
  Chip,
  styled
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  GetApp as GetAppIcon,
  Info as InfoIcon,
  HelpOutline as HelpOutlineIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon, // Added missing import
  Warning as WarningIcon // Added for warning messages
} from "@mui/icons-material";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import { FetchFileNames } from "../../../../util/utils";
import {
  fetchDataFromIndexedDB,
  storeDataInIndexedDB,
  updateDataInIndexedDB
} from "../../../../util/indexDB";
import { apiService } from "../../../../services/api/apiService";

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
  overflow: "visible",
  position: "relative",
  "&:before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "6px",
    background: "linear-gradient(90deg, #3f51b5, #2196f3)",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px"
  }
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(45deg, #3f51b5 30%, #2196f3 90%)",
  color: "white",
  fontWeight: 600,
  padding: "8px 24px",
  boxShadow: "0 3px 5px 2px rgba(33, 150, 243, .2)",
  "&:hover": {
    boxShadow: "0 3px 10px 2px rgba(33, 150, 243, .3)"
  }
}));

const OutlineButton = styled(Button)(({ theme }) => ({
  border: "2px solid",
  borderColor: theme.palette.grey[400],
  color: theme.palette.grey[700],
  fontWeight: 600,
  padding: "8px 24px",
  "&:hover": {
    borderColor: theme.palette.grey[600],
    backgroundColor: "rgba(0, 0, 0, 0.02)"
  }
}));

const DataUpload = () => {
  const { projectId } = useParams();
  const [nodesFile, setNodesFile] = useState("");
  const [edgesFile, setEdgesFile] = useState("");
  const [targetsFile, setTargetsFile] = useState("");
  const [loading, setLoading] = useState(false);
  const [graph_name, setGraphName] = useState("");
  const [downloadData, setDownloadData] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const file = await FetchFileNames({ projectId });
        setFiles(file);
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error: ${error.message}`,
          severity: "error"
        });
      }
    };
    fetchFiles();
  }, []);

  const handleUpload = async () => {
    if (!graph_name) {
      setSnackbar({
        open: true,
        message: "Graph model name is required",
        severity: "warning"
      });
      return;
    }
    if (!nodesFile || !edgesFile || !targetsFile) {
      setSnackbar({
        open: true,
        message: "Please select all files before uploading.",
        severity: "warning"
      });
      return;
    }

    setLoading(true);
    setDownloadData(null);
    try {
      const fetchFile = async (filePath) => {
        const response = await apiService.matflow.dataset.fetchFile(filePath);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch file.");
        }

        const fileBlob = await response.blob();
        return new File([fileBlob], filePath.split("/").pop(), {
          type: fileBlob.type
        });
      };

      const nodes = await fetchFile(nodesFile);
      const edges = await fetchFile(edgesFile);
      const targets = await fetchFile(targetsFile);

      const response = await uploadAndProcessData(graph_name, nodes, edges, targets);

      if (response.data?.graph_data) {
        setDownloadData(response.data.graph_data);

        let allGraphs = await fetchDataFromIndexedDB("graph");
        const existingIndex = allGraphs.findIndex((obj) => graph_name in obj);

        if (existingIndex !== -1) {
          allGraphs[existingIndex][graph_name] = {
            nodes,
            edges,
            targets,
            graph_data: response.data.graph_data
          };
        } else {
          allGraphs.push({
            [graph_name]: {
              nodes,
              edges,
              targets,
              graph_data: response.data?.graph_data
            }
          });
        }

        await updateDataInIndexedDB("graph", allGraphs);
      }

      setSnackbar({
        open: true,
        message: "Data processed successfully!",
        severity: "success"
      });
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: `Error: ${
          error.response?.data?.error || "An unexpected error occurred"
        }`,
        severity: "error"
      });
    }
    setLoading(false);
  };

  const handleDownloadGraph = () => {
    if (downloadData) {
      const link = document.createElement("a");
      link.href = `data:application/octet-stream;base64,${downloadData}`;
      link.download = `${graph_name}.pt`;
      link.click();
    } else {
      setSnackbar({
        open: true,
        message: "No graph data available to download.",
        severity: "warning"
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        py: 4,
        background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)"
      }}
    >
      <StyledCard sx={{ maxWidth: 800, width: "100%", mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 60,
                height: 60,
                mx: "auto",
                mb: 2
              }}
            >
              <CloudUploadIcon fontSize="large" />
            </Avatar>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 700, color: "text.primary" }}
            >
              Graph Data Processor
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ color: "text.secondary", mt: 1 }}
            >
              Upload and process your node, edge, and target files
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Graph Model Name"
                variant="outlined"
                size="medium"
                value={graph_name}
                onChange={(e) => setGraphName(e.target.value)}
                helperText="Should be unique"
                InputProps={{
                  endAdornment: (
                    <Tooltip title="This name will be used to identify your graph model">
                      <InfoIcon color="action" sx={{ ml: 1 }} />
                    </Tooltip>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <SingleDropDown
                label="Node File"
                columnNames={files}
                onValueChange={setNodesFile}
                initValue={nodesFile}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <SingleDropDown
                label="Edge File"
                columnNames={files}
                onValueChange={setEdgesFile}
                initValue={edgesFile}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <SingleDropDown
                label="Target File"
                columnNames={files}
                onValueChange={setTargetsFile}
                initValue={targetsFile}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <GradientButton
              onClick={handleUpload}
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CloudUploadIcon />
                )
              }
            >
              {loading ? "Processing..." : "Process Data"}
            </GradientButton>

            {downloadData && (
              <OutlineButton
                onClick={handleDownloadGraph}
                startIcon={<GetAppIcon />}
              >
                Download Graph
              </OutlineButton>
            )}
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              <CheckCircleIcon
                color="success"
                fontSize="small"
                sx={{ verticalAlign: "middle", mr: 1 }}
              />
              Files will be processed and stored in your browser's IndexedDB
            </Typography>
          </Box>
        </CardContent>
      </StyledCard>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%", boxShadow: 3 }}
          iconMapping={{
            success: <CheckCircleIcon fontSize="inherit" />,
            error: <ErrorIcon fontSize="inherit" />,
            warning: <ErrorIcon fontSize="inherit" />
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DataUpload;