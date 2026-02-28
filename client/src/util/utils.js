import { apiService } from '../services/api/apiService';

export const CreateFile = async ({ projectId, data, filename, foldername = "" }) => {
  try {
    await apiService.matflow.dataset.createFile(projectId, data, filename, foldername);
    console.log("File created successfully!");
  } catch (error) {
    console.error("Error creating file:", error);
    throw new Error(
      error.message || error?.data?.error || "An error occurred while creating the file"
    );
  }
};

export const ReadFile = async ({ projectId, foldername = "", filename }) => {
  if (!projectId || !filename) {
    throw new Error("projectId and filename are required to read a file.");
  }
  try {
    const fileData = await apiService.matflow.dataset.readFile(projectId, foldername, filename);
    return fileData;
  } catch (error) {
    console.error("Error reading file:", error);
    throw new Error(
      error.message || "An error occurred while reading the file"
    );
  }
};

// Recursively extract all file paths from the nested structure
const getAllFiles = (structure, parentPath = "") => {
  let files = [];
  for (const key in structure) {
    if (key === "files") {
      files = files.concat(
        structure[key].map((file) =>
          parentPath ? `${parentPath}/${file}` : file
        )
      );
    } else {
      const subFiles = getAllFiles(
        structure[key],
        parentPath ? `${parentPath}/${key}` : key
      );
      files = files.concat(subFiles);
    }
  }
  return files;
};

export const FetchFileNames = async ({ projectId }) => {
  try {
    if (!projectId) {
      throw new Error('projectId is required to fetch file names');
    }
    const data = await apiService.matflow.dataset.getAllFiles(projectId);
    const files = getAllFiles(data);
    return files;
  } catch (err) {
    console.error(err);
    throw new Error(err)
  }
};
