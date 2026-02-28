import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Button,
  Box,
  Input,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Paper,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress
} from "@mui/material";
import {
  UploadFile as UploadFileIcon,
  CloudUpload as CloudUploadIcon,
  HelpOutline as HelpOutlineIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import Papa from "papaparse";

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(4),
  boxShadow: "0 16px 40px -12px rgba(0, 0, 0, 0.3)",
  borderRadius: "20px",
  background: "linear-gradient(145deg, #ffffff, #f5f5f5)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  backdropFilter: "blur(10px)",
  overflow: "visible",
  position: "relative",
  "&:before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "8px",
    background: "linear-gradient(90deg, #3f51b5, #2196f3)",
    borderTopLeftRadius: "20px",
    borderTopRightRadius: "20px"
  }
}));

const UploadArea = styled(Paper)(({ theme, isdragged }) => ({
  padding: theme.spacing(4),
  textAlign: "center",
  border: `2px dashed ${isdragged ? theme.palette.primary.main : theme.palette.divider}`,
  backgroundColor: isdragged ? "rgba(63, 81, 181, 0.05)" : theme.palette.background.paper,
  borderRadius: "12px",
  cursor: "pointer",
  transition: "all 0.3s ease",
  marginBottom: theme.spacing(3),
  "&:hover": {
    borderColor: theme.palette.primary.main,
    backgroundColor: "rgba(63, 81, 181, 0.03)"
  }
}));

const FeatureChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: theme.palette.grey[100],
  borderRadius: "8px"
}));

const StyledTable = styled(Table)(({ theme }) => ({
  '& .MuiTableCell-root': {
    padding: '8px 16px',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  '& .MuiTableHead-root': {
    backgroundColor: theme.palette.grey[50],
  },
  '& .MuiTableRow-root:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const Reformat = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleFileChange = (event) => {
    if (event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setError("");
      setSuccess(false);
      loadCsvPreview(selectedFile);
    }
  };

  const loadCsvPreview = (file) => {
    setPreviewLoading(true);
    Papa.parse(file, {
      header: true,
      preview: 100, // Only load first 100 rows for preview
      complete: (results) => {
        setHeaders(results.meta.fields || []);
        setCsvData(results.data);
        setPreviewLoading(false);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setError("Error parsing CSV file. Please check the format.");
        setPreviewLoading(false);
      }
    });
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDraggedOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggedOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDraggedOver(false);
    if (event.dataTransfer.files[0].type === "text/csv" ||
        event.dataTransfer.files[0].name.endsWith('.csv')) {
      const droppedFile = event.dataTransfer.files[0];
      setFile(droppedFile);
      setError("");
      setSuccess(false);
      loadCsvPreview(droppedFile);
    } else {
      setError("Please upload a CSV file only.");
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setSuccess(false);
    setCsvData([]);
    setHeaders([]);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please select a CSV file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_GRAPH}/reformat/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "reformatted_data.zip");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(true);
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(
        error.response?.data?.message ||
        "Error processing the file. Please check the file format and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const features = [
    "CSV to standard graph format",
    "Auto-detect node/edge columns",
    "Preserve metadata",
    "Batch processing",
    "Multi-graph support"
  ];

  return (
    <Container maxWidth="lg" style={{ marginTop: "40px", marginBottom: "40px" }}>
      <StyledCard>
        <CardContent>
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h3"
              gutterBottom
              style={{
                fontWeight: 700,
                color: "#3f51b5",
                marginBottom: "16px"
              }}
            >
              Graph Dataset Reformatting Tool
            </Typography>
            <Typography
              variant="subtitle1"
              color="textSecondary"
              style={{ marginBottom: "8px" }}
            >
              Transform your raw CSV data into standardized graph formats
            </Typography>

            <Box mt={2} mb={3}>
              {features.map((feature, index) => (
                <FeatureChip
                  key={index}
                  label={feature}
                  size="small"
                  icon={<CheckCircleIcon color="primary" fontSize="small" />}
                />
              ))}
            </Box>
          </Box>

          <Divider style={{ margin: "24px 0" }} />

          <form onSubmit={handleSubmit}>
            <UploadArea
              elevation={0}
              isdragged={isDraggedOver ? "true" : undefined}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: "none" }}
                id="upload-button"
              />
              <label htmlFor="upload-button">
                <Box>
                  <CloudUploadIcon
                    style={{
                      fontSize: "48px",
                      color: isDraggedOver ? "#3f51b5" : "#757575",
                      marginBottom: "16px"
                    }}
                  />
                  <Typography variant="h6" gutterBottom>
                    {isDraggedOver ? "Drop your CSV file here" : "Drag & drop your CSV file or click to browse"}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Supported format: .csv (Max file size: 50MB)
                  </Typography>
                </Box>
              </label>
            </UploadArea>

            {file && (
              <Fade in={!!file}>
                <Paper
                  elevation={0}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "#f5f5f5",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <Box display="flex" alignItems="center">
                    <UploadFileIcon color="primary" style={{ marginRight: "8px" }} />
                    <Typography variant="body1">{file.name}</Typography>
                    <Typography variant="caption" color="textSecondary" style={{ marginLeft: "8px" }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                  <IconButton onClick={handleRemoveFile} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Paper>
              </Fade>
            )}

            {error && (
              <Zoom in={!!error}>
                <Alert
                  severity="error"
                  icon={<ErrorIcon />}
                  style={{ marginBottom: "16px" }}
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              </Zoom>
            )}

            {success && (
              <Zoom in={success}>
                <Alert
                  severity="success"
                  icon={<CheckCircleIcon />}
                  style={{ marginBottom: "16px" }}
                >
                  File processed successfully! Your download should start automatically.
                </Alert>
              </Zoom>
            )}

            {/* CSV Preview Section */}
            {file && headers.length > 0 && (
              <Box mt={4} mb={4}>
                <Typography variant="h6" gutterBottom style={{ display: 'flex', alignItems: 'center' }}>
                  CSV Preview
                  <Tooltip title="This shows the first 100 rows of your CSV file">
                    <InfoIcon color="action" style={{ marginLeft: '8px', fontSize: '18px' }} />
                  </Tooltip>
                </Typography>

                {previewLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <TableContainer component={Paper} elevation={0} style={{ border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                      <StyledTable size="small" aria-label="csv preview table">
                        <TableHead>
                          <TableRow>
                            {headers.map((header, index) => (
                              <TableCell key={index} style={{ fontWeight: 600 }}>
                                {header}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {csvData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {headers.map((header, cellIndex) => (
                                <TableCell key={cellIndex} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                                  {row[header] || '-'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </StyledTable>
                    </TableContainer>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25]}
                      component="div"
                      count={csvData.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      style={{ borderBottom: 'none' }}
                    />
                  </>
                )}
              </Box>
            )}

            <Box display="flex" justifyContent="center" mt={3}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || !file}
                size="large"
                startIcon={<CloudUploadIcon />}
                style={{
                  minWidth: "200px",
                  padding: "10px 24px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(63, 81, 181, 0.2)",
                  textTransform: "none"
                }}
              >
                {loading ? "Processing..." : "Reformat Dataset"}
              </Button>
            </Box>

            {loading && (
              <Box mt={2}>
                <LinearProgress
                  color="primary"
                  style={{ height: "6px", borderRadius: "3px" }}
                />
                <Typography variant="caption" color="textSecondary" style={{ display: "block", textAlign: "center", marginTop: "8px" }}>
                  Processing your file. This may take a few moments...
                </Typography>
              </Box>
            )}
          </form>

          <Divider style={{ margin: "24px 0" }} />

          <Box display="flex" justifyContent="center" alignItems="center">
            <Tooltip title="Learn more about graph data formatting">
              <IconButton>
                <HelpOutlineIcon color="primary" />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" color="textSecondary">
              Need help? Check our documentation for supported formats and examples.
            </Typography>
          </Box>
        </CardContent>
      </StyledCard>
    </Container>
  );
};

export default Reformat;