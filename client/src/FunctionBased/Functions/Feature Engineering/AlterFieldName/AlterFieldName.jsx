import { Checkbox, Input, Modal } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import {
  setDatasetName,
  setFile,
  setSaveAsNew,
} from "../../../../Slices/FeatureEngineeringSlice";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import { CreateFile } from "../../../../util/utils";
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";

function AlterFieldName({ csvData }) {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [data, setData] = useState([{ column_name: "", new_field_name: "" }]);
  const [numberOfColumns, setNumberOfColumns] = useState(1);
  const [columnNames, setColumnNames] = useState();
  const [savedAsNewDataset, setSavedAsNewDataset] = useState(false);
  const activeFolder = useSelector((state) => state.uploadedFile.activeFolder);

  const featureData = useSelector((state) => state.featureEngineering);
  const render = useSelector((state) => state.uploadedFile.rerender);

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  useEffect(() => {
    if (activeCsvFile && activeCsvFile.name) {
      const getData = async () => {
        setColumnNames(Object.keys(csvData[0]));
        dispatch(setFile(csvData));
      };

      getData();
    }
  }, [activeCsvFile, dispatch, csvData]);

  const handleChange = (val, index, key) => {
    const temp = data.map((d, ind) => {
      if (ind === index) return { ...d, [key]: val };
      return d;
    });
    setData(temp);
  };

  const handleSave = async () => {
    try {
      const Data = await apiService.matflow.featureEngineering.alterFieldName({
        number_of_columns: numberOfColumns,
        data,
        file: csvData,
      });

      let fileName = activeCsvFile.name;

      if (featureData.save_as_new) {
        fileName = featureData.dataset_name;
        await CreateFile({
          projectId,
          data: Data,
          filename: fileName,
          foldername: activeFolder,
        });
      } else {
        await updateDataInIndexedDB(fileName, Data);
      }

      toast.success(`Data updated successfully!`, {
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
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-4 mb-3">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Alter Field Name</h2>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto sm:min-w-[150px]">
            <label className="block text-xs font-semibold text-gray-900 mb-1.5">
              Number of columns
            </label>
            <Input
              value={numberOfColumns}
              onChange={(e) => {
                const val = e.target.value;
                setNumberOfColumns(val);
                if (val < data.length) setData(data.slice(0, val));
                else {
                  const temp = JSON.parse(JSON.stringify(data));
                  while (val - temp.length > 0) {
                    temp.push({
                      column_name: "",
                      new_field_name: "",
                    });
                  }
                  setData(temp);
                }
              }}
              type="number"
              step={1}
              size="sm"
            />
          </div>
          <div className="flex items-center">
            <Checkbox color="primary" size="sm">
              <span className="text-xs font-medium text-gray-900">Add to pipeline</span>
            </Checkbox>
          </div>
        </div>
      </div>

      {csvData && columnNames && data.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-4 mb-3">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Column Mappings</h2>
          <div className="space-y-3">
            {data.map((val, index) => {
              return (
                <div key={index} className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                  <h3 className="text-xs font-medium text-gray-900 mb-2">Column {index + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Current Column
                      </label>
                      <SingleDropDown
                        columnNames={columnNames}
                        onValueChange={(e) => handleChange(e, index, "column_name")}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        New Field Name
                      </label>
                      <Input
                        fullWidth
                        placeholder="Enter new name"
                        value={val.new_field_name}
                        onChange={(e) =>
                          handleChange(e.target.value, index, "new_field_name")
                        }
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Checkbox
              color="primary"
              size="sm"
              onChange={(e) => {
                setSavedAsNewDataset(e.valueOf());
                dispatch(setSaveAsNew(e.valueOf()));
              }}
            >
              <span className="text-xs font-medium text-gray-900">Save as New Dataset</span>
            </Checkbox>
            {savedAsNewDataset && (
              <div className="w-48">
                <Input
                  label="New Dataset Name"
                  fullWidth
                  clearable
                  size="sm"
                  onChange={(e) => {
                    dispatch(setDatasetName(e.target.value));
                  }}
                  placeholder="Enter dataset name"
                />
              </div>
            )}
          </div>
          <button
            className="px-4 py-2 bg-[#0D9488] text-white text-sm font-medium rounded-md hover:bg-[#0F766E] transition-colors flex items-center gap-1.5"
            onClick={handleSave}
          >
            Save Changes
            <span>→</span>
          </button>
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
          <Docs section={"alterFieldName"} />
        </div>
      </Modal>
    </div>
  );
}

export default AlterFieldName;
