import { Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import { CreateFile, ReadFile } from "../../../../util/utils";
import { apiService } from "../../../../services/api/apiService";

function AppendDataset({ csvData }) {
  const { projectId } = useParams();
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [loading, setLoading] = useState(false);
  const [lessThanTwo, setLessThanTwo] = useState(true);
  const [availableDatasets, setAvailableDatasets] = useState();
  const [anotherCsvData, setAnotherCsvData] = useState();
  const [new_dataset_name, setNewDatasetName] = useState("");
  const render = useSelector((state) => state.uploadedFile.rerender);
  const dispatch = useDispatch();
  const activeFolder = useSelector((state) => state.uploadedFile.activeFolder);

  useEffect(() => {
    // Fetch the list of files from the backend when the component mounts
    const fetchFileNames = async () => {
      try {
        const data = await apiService.matflow.dataset.getAllFiles(projectId);
        const files = getAllFiles(data);
        setAvailableDatasets(files);
      } catch (err) {
        console.error(err);
        toast.error(err.message);
        // setError(err.message);
      }
    };

    fetchFileNames();
  }, []);

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

  const handleChange = async (val) => {
    if (!val) return;
    const splittedFolder = val.split("/");
    const foldername = splittedFolder
      .slice(0, splittedFolder.length - 1)
      .join("/");

    const data = await ReadFile({
      projectId,
      foldername,
      filename: splittedFolder[splittedFolder.length - 1],
    });
    setAnotherCsvData(data);
  };

  const handleSave = async () => {
    try {
      let Data = await apiService.matflow.featureEngineering.appendDataset({
        file: csvData,
        file2: anotherCsvData,
      });
      if (typeof Data === 'string') {
        Data = JSON.parse(Data);
      }
      let fileName = new_dataset_name;

      await CreateFile({
        projectId,
        data: Data,
        filename: fileName,
        foldername: activeFolder,
      });

      toast.success(`Dataset appended successfully!`, {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      dispatch(setReRender(!render));
    } catch (error) {
      toast.error("Something went wrong. Please try again", {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  return (
    <div className="w-full py-3">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Append Dataset</h2>
        
        <div className="space-y-3">
          <div className="w-full sm:w-auto sm:min-w-[400px] sm:max-w-[700px]">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Select Dataset You Wanna Append With
            </label>
            <SingleDropDown
              columnNames={availableDatasets}
              onValueChange={(val) => handleChange(val)}
            />
          </div>

          {anotherCsvData && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    New Dataset Name
                  </label>
                  <Input
                    bordered
                    color="primary"
                    fullWidth
                    value={new_dataset_name}
                    onChange={(e) => setNewDatasetName(e.target.value)}
                    size="sm"
                    placeholder="Enter dataset name"
                  />
                </div>
                <div className="flex items-center">
                  <button
                    className="px-4 py-2 bg-[#0D9488] text-white text-sm font-medium rounded-md hover:bg-[#0F766E] transition-colors flex items-center gap-1.5"
                    onClick={handleSave}
                  >
                    Append Datasets
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppendDataset;
