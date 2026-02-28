import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { trainModel, downloadFile } from "./Services/api";
import {
  Button,
  Typography,
  Grid,
  Box,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
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
  Error as ErrorIcon,
  Warning as WarningIcon
} from "@mui/icons-material";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import { fetchDataFromIndexedDB } from "../../../../util/indexDB";

// Styled Components
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

const ModelParamCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: "12px",
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  backgroundColor: theme.palette.background.paper,
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[4]
  }
}));

const TrainModel = () => {
  const [graphNames, setGraphNames] = useState([]);
  const [selectedGraph, setSelectedGraph] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [lossGraphData, setLossGraphData] = useState(null);
  const [r2GraphData, setR2GraphData] = useState(null);
  const [maeGraphData, setMaeGraphData] = useState(null);
  const [rmseGraphData, setRmseGraphData] = useState(null);
  const [finalTestMetrics, setFinalTestMetrics] = useState(null);
  const [dataFrame, setDataFrame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // State for model parameters
  const [modelParams, setModelParams] = useState({
    model_type: "GCN",
    num_epochs: 100,
    learning_rate: 0.01,
    batch_size: 32,
    activation: "ReLU",
    dropout_rate: 0.1,
    hidden_channels: 64,
    num_layers: 2,
    heads: 1,
    test_size: 0.2,
  });

  useEffect(() => {
    const fetchGraphNames = async () => {
      try {
        const graphs = await fetchDataFromIndexedDB("graph");
        const graphNames = graphs.map((graph) => Object.keys(graph)[0]);
        setGraphNames(graphNames);
      } catch (error) {
        console.error("Error fetching graph names:", error);
        setSnackbar({
          open: true,
          message: "Failed to load graph names.",
          severity: "error",
        });
      }
    };
    fetchGraphNames();
  }, []);

  const handleGraphSelection = async (graphName) => {
    setSelectedGraph(graphName);
    try {
      const graphs = await fetchDataFromIndexedDB("graph");
      const selectedGraphData = graphs.find((graph) => graph[graphName]);
      if (selectedGraphData) {
        setGraphData(selectedGraphData[graphName].graph_data);
      } else {
        setSnackbar({
          open: true,
          message: "Graph data not found.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching graph data:", error);
      setSnackbar({
        open: true,
        message: "Failed to fetch graph data.",
        severity: "error",
      });
    }
  };

  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setModelParams({
      ...modelParams,
      [name]: value,
    });
  };

  const handleTrain = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("graph_name", selectedGraph);
      formData.append("graph_data", graphData);

      Object.keys(modelParams).forEach((key) => {
        formData.append(key, modelParams[key]);
      });

      const response = await trainModel(formData);

      setLossGraphData(JSON.parse(response.data.loss_graph));
      setR2GraphData(JSON.parse(response.data.r2_graph));
      setMaeGraphData(JSON.parse(response.data.mae_graph));
      setRmseGraphData(JSON.parse(response.data.rmse_graph));
      setDataFrame(JSON.parse(response.data.dataframe));
      setFinalTestMetrics(response.data.final_test_metrics);

      setSnackbar({
        open: true,
        message: "Model trained successfully!",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error training model: ${
          error.response?.data?.error || error.message
        }`,
        severity: "error",
      });
    }
    setLoading(false);
  };

  const handleDownloadModel = async () => {
    try {
      await downloadFile("model");
      setSnackbar({
        open: true,
        message: "Model downloaded successfully!",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error downloading model: ${
          error.response?.data?.error || error.message
        }`,
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        p: 3,
        background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)",
        minHeight: "100vh"
      }}
    >
      <StyledCard sx={{ maxWidth: 1200, margin: "auto", p: 4 }}>
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
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Graph Neural Network Trainer
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "text.secondary", mt: 1 }}>
            Configure and train your GNN model with visualization
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          {/* Graph Selection */}
          <Grid item xs={12}>
            <ModelParamCard elevation={0}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                Graph Selection
                <Tooltip title="Select a pre-loaded graph from your storage">
                  <HelpOutlineIcon fontSize="small" sx={{ ml: 1, color: 'action.active' }} />
                </Tooltip>
              </Typography>
              <SingleDropDown
                columnNames={graphNames}
                onValueChange={handleGraphSelection}
                initValue={selectedGraph}
                label="Available Graphs"
              />
            </ModelParamCard>
          </Grid>

          {/* Model Parameters */}
          {selectedGraph && (
            <>
              <Grid item xs={12}>
                <ModelParamCard elevation={0}>
                  <Typography variant="h6" gutterBottom>
                    Model Configuration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Model Type</InputLabel>
                        <Select
                          name="model_type"
                          value={modelParams.model_type}
                          onChange={handleParamChange}
                          label="Model Type"
                        >
                          <MenuItem value="GCN">Graph Convolutional Network (GCN)</MenuItem>
                          <MenuItem value="GAT">Graph Attention Network (GAT)</MenuItem>
                          <MenuItem value="GraphSAGE">GraphSAGE</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {modelParams.model_type === "GAT" && (
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          name="heads"
                          label="Attention Heads"
                          type="number"
                          value={modelParams.heads}
                          onChange={handleParamChange}
                          fullWidth
                          inputProps={{ min: 1 }}
                        />
                      </Grid>
                    )}

                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        name="num_epochs"
                        label="Number of Epochs"
                        type="number"
                        value={modelParams.num_epochs}
                        onChange={handleParamChange}
                        fullWidth
                        inputProps={{ min: 1 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        name="learning_rate"
                        label="Learning Rate"
                        type="number"
                        value={modelParams.learning_rate}
                        onChange={handleParamChange}
                        fullWidth
                        inputProps={{ step: 0.001, min: 0.0001 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        name="batch_size"
                        label="Batch Size"
                        type="number"
                        value={modelParams.batch_size}
                        onChange={handleParamChange}
                        fullWidth
                        inputProps={{ min: 1 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Activation Function</InputLabel>
                        <Select
                          name="activation"
                          value={modelParams.activation}
                          onChange={handleParamChange}
                          label="Activation Function"
                        >
                          <MenuItem value="ReLU">ReLU</MenuItem>
                          <MenuItem value="LeakyReLU">LeakyReLU</MenuItem>
                          <MenuItem value="Sigmoid">Sigmoid</MenuItem>
                          <MenuItem value="Tanh">Tanh</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        name="dropout_rate"
                        label="Dropout Rate"
                        type="number"
                        value={modelParams.dropout_rate}
                        onChange={handleParamChange}
                        fullWidth
                        inputProps={{ step: 0.1, min: 0, max: 1 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        name="hidden_channels"
                        label="Hidden Channels"
                        type="number"
                        value={modelParams.hidden_channels}
                        onChange={handleParamChange}
                        fullWidth
                        inputProps={{ min: 1 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        name="num_layers"
                        label="Number of Layers"
                        type="number"
                        value={modelParams.num_layers}
                        onChange={handleParamChange}
                        fullWidth
                        inputProps={{ min: 1 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        name="test_size"
                        label="Test Size (0-1)"
                        type="number"
                        value={modelParams.test_size}
                        onChange={handleParamChange}
                        fullWidth
                        inputProps={{ step: 0.01, min: 0.01, max: 0.99 }}
                      />
                    </Grid>
                  </Grid>
                </ModelParamCard>
              </Grid>

              {/* Train Button */}
              <Grid item xs={12}>
                <GradientButton
                  onClick={handleTrain}
                  disabled={loading}
                  fullWidth
                  size="large"
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <CloudUploadIcon />
                    )
                  }
                >
                  {loading ? "Training Model..." : "Train Model"}
                </GradientButton>
              </Grid>
            </>
          )}

          {/* Results Section */}
          {finalTestMetrics && (
            <Grid item xs={12}>
              <ModelParamCard elevation={0}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                  Training Results
                </Typography>

                {/* Metrics Summary */}
                <Typography variant="h6" gutterBottom>
                  Final Test Metrics
                </Typography>
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  {Object.entries(finalTestMetrics).map(([key, value]) => (
                    <Grid item xs={6} sm={3} key={key}>
                      <Paper
                        sx={{
                          p: 2,
                          textAlign: "center",
                          borderRadius: "8px",
                          backgroundColor: "background.default"
                        }}
                      >
                        <Typography variant="subtitle2" color="textSecondary">
                          {key}
                        </Typography>
                        <Typography variant="h5" sx={{ mt: 1 }}>
                          {typeof value === "number" ? value.toFixed(4) : value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                {/* Charts */}
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Training Loss
                    </Typography>
                    <Plot
                      data={lossGraphData.data}
                      layout={{
                        ...lossGraphData.layout,
                        height: 400,
                        margin: { t: 30, l: 50, r: 30, b: 50 }
                      }}
                      config={{ responsive: true }}
                      style={{ width: "100%" }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      R² Score
                    </Typography>
                    <Plot
                      data={r2GraphData.data}
                      layout={{
                        ...r2GraphData.layout,
                        height: 400,
                        margin: { t: 30, l: 50, r: 30, b: 50 }
                      }}
                      config={{ responsive: true }}
                      style={{ width: "100%" }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Mean Absolute Error (MAE)
                    </Typography>
                    <Plot
                      data={maeGraphData.data}
                      layout={{
                        ...maeGraphData.layout,
                        height: 400,
                        margin: { t: 30, l: 50, r: 30, b: 50 }
                      }}
                      config={{ responsive: true }}
                      style={{ width: "100%" }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Root Mean Squared Error (RMSE)
                    </Typography>
                    <Plot
                      data={rmseGraphData.data}
                      layout={{
                        ...rmseGraphData.layout,
                        height: 400,
                        margin: { t: 30, l: 50, r: 30, b: 50 }
                      }}
                      config={{ responsive: true }}
                      style={{ width: "100%" }}
                    />
                  </Grid>
                </Grid>

                {/* Training Metrics Table */}
                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                  Detailed Training Metrics
                </Typography>
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        {dataFrame.columns.map((col) => (
                          <TableCell key={col} sx={{ fontWeight: 600 }}>
                            {col}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dataFrame.data.map((row, idx) => (
                        <TableRow key={idx}>
                          {row.map((cell, cellIdx) => (
                            <TableCell key={cellIdx}>
                              {typeof cell === "number" ? cell.toFixed(4) : cell}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>

                {/* Download Button */}
                <Box sx={{ mt: 4, textAlign: "center" }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleDownloadModel}
                    size="large"
                    startIcon={<GetAppIcon />}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    Download Trained Model
                  </Button>
                </Box>
              </ModelParamCard>
            </Grid>
          )}
        </Grid>
      </StyledCard>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          iconMapping={{
            success: <CheckCircleIcon fontSize="inherit" />,
            error: <ErrorIcon fontSize="inherit" />,
            warning: <WarningIcon fontSize="inherit" />
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrainModel;