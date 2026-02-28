import axios from "axios";

// export const uploadAndProcessData = (nodesFile, edgesFile, targetsFile) => {
//     const formData = new FormData();
//     formData.append("nodes", nodesFile);
//     formData.append("edges", edgesFile);
//     formData.append("targets", targetsFile);
//
//     return axios.post(`${import.meta.env.VITE_APP_API_GRAPH}/process-data/`, formData);
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
    `${import.meta.env.VITE_APP_API_GRAPH}/model-deploy/`,
    formData
  );
};

export const trainModel = (config) => {
  return axios.post(
    `${import.meta.env.VITE_APP_API_GRAPH}/train-model/`,
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
    `${import.meta.env.VITE_APP_API_GRAPH}/process-data/`,
    formData
  );
};
export const downloadFile = (fileType) => {
  return axios
    .get(`${import.meta.env.VITE_APP_API_GRAPH}/download/${fileType}/`, {
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
