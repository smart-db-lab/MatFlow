import axios from "axios";
import { API_BASE_URL } from "../../../../../services/api/apiHelpers";

const GRAPH_BASE =
    `${API_BASE_URL}${import.meta.env.VITE_APP_API_GRAPH || "/api/graph_analysis/"}`;

// export const uploadAndProcessData = (nodesFile, edgesFile, targetsFile) => {
//     const formData = new FormData();
//     formData.append("nodes", nodesFile);
//     formData.append("edges", edgesFile);
//     formData.append("targets", targetsFile);
//
//     return axios.post(`${GRAPH_BASE}process-data/`, formData);
// };

export const predict = (
  modelFile,
  nodesFile,
  edgesFile,
  targetsFile = null
) => {
  const formData = new FormData();
  formData.append("model_data", modelFile);
  formData.append("nodes", nodesFile);
  formData.append("edges", edgesFile);
  if (targetsFile) {
    formData.append("targets", targetsFile);
  }
  return axios.post(
    `${GRAPH_BASE}model-deploy/`,
    formData
  );
};

export const trainModel = (config) => {
  return axios.post(
    `${GRAPH_BASE}train-model/`,
    config
  );
};

export const uploadAndProcessData = (graph_name, nodesFile, edgesFile, targetsFile) => {
  const formData = new FormData();
  formData.append("graph_name", graph_name);
  formData.append("nodes", nodesFile);
  formData.append("edges", edgesFile);
  formData.append("targets", targetsFile);

  return axios.post(
    `${GRAPH_BASE}process-data/`,
    formData
  );
};
export const downloadFile = (fileType) => {
  return axios
    .get(`${GRAPH_BASE}download/${fileType}/`, {
      responseType: "blob",
    })
    .then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        fileType === "graph" ? "processed_data.pt" : "trained_model.pth"
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
};
