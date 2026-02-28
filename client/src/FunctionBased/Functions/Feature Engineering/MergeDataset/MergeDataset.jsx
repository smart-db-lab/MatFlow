import { Input, Modal } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import { CreateFile, ReadFile } from "../../../../util/utils";
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";

const HOW = ["left", "right", "outer", "inner", "cross"];

function MergeDataset({ csvData }) {
  const { projectId } = useParams();
  const leftDataframe = Object.keys(csvData[0]);
  const [rightDataframe, setRightDataframe] = useState([]);
  const [anotherCsvData, setAnotherCsvData] = useState();
  const [new_dataset_name, setNewDatasetName] = useState("");
  const [how, setHow] = useState();
  const [leftDataframeValue, setLeftDataframeValue] = useState();
  const [rightDataframeValue, setRightDataframeValue] = useState();
  const [secondDatasetName, setSecondDatasetName] = useState("");
  const dispatch = useDispatch();
  const render = useSelector((state) => state.uploadedFile.rerender);
  const [fileNames, setFileNames] = useState([]);
  const activeFolder = useSelector((state) => state.uploadedFile.activeFolder);

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  useEffect(() => {
    // Fetch the list of files from the backend when the component mounts
    const fetchFileNames = async () => {
      try {
        const data = await apiService.matflow.dataset.getAllFiles(projectId);
        const files = getAllFiles(data);
        setFileNames(files);
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

  const handleSave = async () => {
    try {
      const response = await apiService.matflow.featureEngineering.mergeDataset({
        how,
        left_dataframe: leftDataframeValue,
        right_dataframe: rightDataframeValue,
        file: csvData,
        file2: anotherCsvData,
      });
      let Data = typeof response === 'string' ? JSON.parse(response) : response;

      let fileName = new_dataset_name;

      await CreateFile({
        projectId,
        data: Data,
        filename: fileName,
        foldername: activeFolder,
      });

      toast.success(`Dataset merged successfully!`, {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      dispatch(setReRender(!render));

      setAnotherCsvData();
      setRightDataframe([]);
      setRightDataframeValue();
      setSecondDatasetName("");
    } catch (error) {
      toast.error(error.message, {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const handleDatasetMerge = async (val) => {
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

    setRightDataframe(Object.keys(data[0]));
    setAnotherCsvData(data);
    setSecondDatasetName(val);
  };

  return (
    <div className="w-full py-3">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Merge Dataset</h2>
        
        <div className="space-y-3">
          <div className="w-full sm:w-auto sm:min-w-[400px] sm:max-w-[700px]">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Select Dataset You Wanna Merge With
            </label>
            <SingleDropDown
              columnNames={fileNames}
              onValueChange={(e) => handleDatasetMerge(e)}
            />
          </div>

          {secondDatasetName && (
            <div className="pt-3 border-t border-gray-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-full sm:w-auto sm:min-w-[150px] sm:max-w-[200px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    How
                  </label>
                  <SingleDropDown columnNames={HOW} onValueChange={setHow} />
                </div>

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
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Select column name for left dataframe
                  </label>
                  <SingleDropDown
                    columnNames={leftDataframe}
                    onValueChange={setLeftDataframeValue}
                  />
                </div>
                <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Select column name for right dataframe
                  </label>
                  <SingleDropDown
                    columnNames={rightDataframe}
                    onValueChange={setRightDataframeValue}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <button
                  className="px-4 py-2 bg-[#0D9488] text-white text-sm font-medium rounded-md hover:bg-[#0F766E] transition-colors flex items-center gap-1.5"
                  onClick={handleSave}
                >
                  Merge Datasets
                  <span>→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DOCS */}
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
          <Docs section={"mergeDataset"} />
        </div>
      </Modal>
    </div>
  );
}

export default MergeDataset;
