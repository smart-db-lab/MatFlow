import { Checkbox, Input, Radio } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  setDatasetName,
  setSaveAsNew,
} from "../../../../Slices/FeatureEngineeringSlice";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import MultipleDropDown from "../../../Components/MultipleDropDown/MultipleDropDown";
import { CreateFile } from "../../../../util/utils";
import { apiService } from "../../../../services/api/apiService";

function DropRow({
  csvData,
  type = "function",
  onValueChange = undefined,
  initValue = undefined,
}) {
  const { projectId } = useParams();
  const [defaultValue, setDefaultValue] = useState("With Null");
  const allColumns = csvData && csvData.length > 0 ? Object.keys(csvData[0]) : [];
  const [selectedColumns, setSelectedColumns] = useState();
  const [savedAsNewDataset, setSavedAsNewDataset] = useState(false);
  const dispatch = useDispatch();
  const [add_to_pipeline, setAddToPipeline] = useState(false);
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const activeFolder = useSelector((state) => state.uploadedFile.activeFolder);
  const featureData = useSelector((state) => state.featureEngineering);
  const render = useSelector((state) => state.uploadedFile.rerender);

  // Early return if no data is available
  if (!csvData || csvData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Dataset Available</h3>
          <p className="text-gray-500">Please upload a dataset to use the Drop Row feature.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (initValue) {
      setDefaultValue(initValue.default_value);
      setSelectedColumns(initValue.select_columns);
    }
  }, []);

  useEffect(() => {
    if (type === "node") {
      onValueChange({
        default_value: defaultValue,
        select_columns: selectedColumns,
      });
    }
  }, [type, defaultValue, selectedColumns]);

  const handleSave = async () => {
    try {
      const Data = await apiService.matflow.featureEngineering.dropRows({
        default_value: defaultValue,
        select_columns: selectedColumns,
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
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Drop Row Settings</h2>
        
        <div className="space-y-3">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
            <div className="flex-shrink-0">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Default Value
              </label>
              <Radio.Group
                orientation="horizontal"
                defaultValue="With Null"
                color="primary"
                size="sm"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e)}
              >
                <Radio value="With Null">With Null</Radio>
              </Radio.Group>
            </div>

            <div className="flex-1 w-full lg:w-auto lg:min-w-[400px] lg:max-w-[700px]">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Select Columns
              </label>
              <MultipleDropDown
                columnNames={allColumns}
                setSelectedColumns={setSelectedColumns}
                defaultValue={selectedColumns}
              />
            </div>
          </div>

          {type === "function" && (
            <div className="pt-2 border-t border-gray-200">
              <Checkbox
                color="primary"
                size="sm"
                onChange={(e) => setAddToPipeline(e.valueOf())}
              >
                <span className="text-xs text-gray-700">Add To Pipeline</span>
              </Checkbox>
            </div>
          )}

          {type === "function" && (
            <div className="pt-3 border-t border-gray-200">
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
                    <span className="text-xs text-gray-700">Save as New Dataset</span>
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
          )}
        </div>
      </div>
    </div>
  );
}

export default DropRow;
