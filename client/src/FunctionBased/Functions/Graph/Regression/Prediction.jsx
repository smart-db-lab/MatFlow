import React, { useEffect, useState } from "react";
import { predict } from "./Services/api";
import {
  Button,
  Typography,
  Grid,
  Box,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { fetchDataFromIndexedDB } from "../../../../util/indexDB";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import AgGridAutoDataComponent from "../../../Components/AgGridComponent/AgGridAutoDataComponent";
import { Modal } from "@nextui-org/react";
import Docs from "../../../../Docs/Docs";

const Prediction = () => {
  const [nodesFile, setNodesFile] = useState(null);
  const [edgesFile, setEdgesFile] = useState(null);
  const [targetsFile, setTargetsFile] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [graphNames, setGraphNames] = useState([]);
  const [selectedGraph, setSelectedGraph] = useState(null);
  const [graphData, setGraphData] = useState(null);

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const fetchGraphs = async () => {
      try {
        const graphs = await fetchDataFromIndexedDB("graph");
        const namesWithModelData = graphs
          .filter((graph) => {
            const graphName = Object.keys(graph)[0];
            return graph[graphName]?.model_data;
          })
          .map((graph) => Object.keys(graph)[0]);

        setGraphNames(namesWithModelData);
      } catch (error) {
        console.error("Error fetching graph names:", error);
        setSnackbar({
          open: true,
          message: "Failed to fetch graph data.",
          severity: "error",
        });
      }
    };

    fetchGraphs();
  }, []);

  const handleGraphSelection = async (graphName) => {
    setSelectedGraph(graphName);
    try {
      const graphs = await fetchDataFromIndexedDB("graph");
      const selectedGraphData = graphs.find((graph) => graph[graphName]);
      if (selectedGraphData) {
        setGraphData(selectedGraphData[graphName].model_data);
        setSnackbar({
          open: true,
          message: `Graph data for ${graphName} loaded successfully.`,
          severity: "success",
        });
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

  const handlePredict = async () => {
    if (!nodesFile || !edgesFile) {
      setSnackbar({
        open: true,
        message: "Please upload the nodes file, and edges file.",
        severity: "warning",
      });
      return;
    }

    setLoading(true);
    setPredictions([]);
    try {
      const response = await predict(
        graphData,
        nodesFile,
        edgesFile,
        targetsFile
      );
      setPredictions(response.data.predictions);
      setSnackbar({
        open: true,
        message: "Prediction successful!",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error during prediction: ${
          error.response?.data?.error || error.message
        }`,
        severity: "error",
      });
    }
    setLoading(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <div className="mb-4">
        <Typography className="!text-lg">Select Graph</Typography>
        <SingleDropDown
          columnNames={graphNames}
          onValueChange={handleGraphSelection}
          initValue={selectedGraph}
        />
      </div>

      {selectedGraph && (
        <div>
          <Grid container spacing={2} className="mb-8">
            {/* File Upload Section Container */}
            <Grid item xs={12}>
              <Paper elevation={3} className="p-6 pb-8">
                <Typography variant="h6" gutterBottom>
                  Upload Files
                </Typography>
                <Grid container spacing={2}>
                  {/* Upload Nodes File */}
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      component="label"
                      className="!border-dashed"
                      fullWidth
                      startIcon={<CloudUploadIcon />}
                    >
                      Upload Nodes File
                      <input
                        type="file"
                        hidden
                        onChange={(e) => setNodesFile(e.target.files[0])}
                      />
                    </Button>
                    {nodesFile && (
                      <Typography
                        variant="body2"
                        className="mt-2 text-gray-700"
                      >
                        Selected File: {nodesFile.name}
                      </Typography>
                    )}
                  </Grid>

                  {/* Upload Edges File */}
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      component="label"
                      className="!border-dashed"
                      fullWidth
                      startIcon={<CloudUploadIcon />}
                    >
                      Upload Edges File
                      <input
                        type="file"
                        hidden
                        onChange={(e) => setEdgesFile(e.target.files[0])}
                      />
                    </Button>
                    {edgesFile && (
                      <Typography
                        variant="body2"
                        className="mt-2 text-gray-700"
                      >
                        Selected File: {edgesFile.name}
                      </Typography>
                    )}
                  </Grid>

                  {/* Upload Targets File (Optional) */}
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      component="label"
                      className="!border-dashed"
                      fullWidth
                      startIcon={<CloudUploadIcon />}
                    >
                      Upload Targets File (Optional)
                      <input
                        type="file"
                        hidden
                        onChange={(e) => setTargetsFile(e.target.files[0])}
                      />
                    </Button>
                    {targetsFile && (
                      <Typography
                        variant="body2"
                        className="mt-2 text-gray-700"
                      >
                        Selected File: {targetsFile.name}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          <Button
            variant="contained"
            color="primary"
            onClick={handlePredict}
            disabled={loading}
            startIcon={<CloudUploadIcon />}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : "Predict"}
          </Button>

          {predictions.length > 0 && (
            <div className="mt-8">
              <Typography variant="h6" gutterBottom>
                Predictions
              </Typography>
              <div>
                <AgGridAutoDataComponent rowData={predictions} />
              </div>
            </div>
          )}
        </div>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <button
        className="fixed bottom-20 right-5 bg-primary-btn text-xl font-bold text-white rounded-full w-10 h-10 shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center"
        onClick={openModal}
      >
        ?
      </button>
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
          <Docs section={"predictDocs"} />
        </div>
      </Modal>
    </div>
  );
};

export default Prediction;
