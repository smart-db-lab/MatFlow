import { Input, Modal, Checkbox } from "@nextui-org/react";
import SafeCheckbox from "../../../../Components/SafeCheckbox";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  setAddToPipeline,
  setColumnName,
  setDatasetName,
  setMethod,
  setOption,
  setSaveAsNew,
  setSelectColumn,
} from "../../../../Slices/FeatureEngineeringSlice";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import Add_ExtractText from "./Component/Add_ExtractText";
import Add_GroupCategorical from "./Component/Add_GroupCategorical";
import Add_GroupNumerical from "./Component/Add_GroupNumerical";
import Add_MathOperation from "./Component/Add_MathOperation";
import Add_NewColumn from "./Component/Add_NewColumn";
import Modify_ProgressApply from "./Component/Modify_ProgressApply";
import Modify_ReplaceValue from "./Component/Modify_ReplaceValue";
import { CreateFile } from "../../../../util/utils";
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";

function AddModify({ csvData }) {
  const { projectId } = useParams();
  const [currentOption, setCurrentOption] = useState("Add");
  const [currentMethod, setCurrentMethod] = useState("New Column");
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const activeFolder = useSelector((state) => state.uploadedFile.activeFolder);
  const [savedAsNewDataset, setSavedAsNewDataset] = useState(false);
  const dispatch = useDispatch();
  const featureData = useSelector((state) => state.featureEngineering);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [addToPipelineChecked, setAddToPipelineChecked] = useState(
    featureData.add_to_pipeline !== false
  );
  const render = useSelector((state) => state.uploadedFile.rerender);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setAddToPipelineChecked(featureData.add_to_pipeline !== false);
  }, [featureData.add_to_pipeline]);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  useEffect(() => {
    dispatch(setSelectColumn(selectedColumn));
  }, [selectedColumn, dispatch]);

  const handleOptionClicked = (e) => {
    setCurrentOption(e.target.value);
    let meth;
    if (e.target.value === "Add") {
      setCurrentMethod("New Column");
      meth = "New Column";
    } else {
      setCurrentMethod("Math Operation");
      meth = "Math Operation";
    }
    dispatch(setOption(e.target.value));
    dispatch(setMethod(meth));
  };

  const handleInputChange = (e) => {
    dispatch(setColumnName(e.target.value));
  };

  const handleSave = async () => {
    console.log(featureData);
    try {
      const data = await apiService.matflow.featureEngineering.featureCreation(featureData);
      let fileName = activeCsvFile.name;

      if (featureData.save_as_new) {
        fileName = featureData.dataset_name;
        await CreateFile({
          projectId,
          data,
          filename: fileName,
          foldername: activeFolder,
        });
      } else {
        await updateDataInIndexedDB(fileName, data);
      }

      toast.success(
        `Data ${currentOption === "Add" ? "added" : "modified"} successfully!`,
        {
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        }
      );
      dispatch(setReRender(!render));
    } catch (error) {
      console.log(error);
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
      {/* Main Configuration Card */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-4 mb-3">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-900 mb-1.5">
              Option
            </label>
            <select
              name=""
              id="option"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-all"
              value={currentOption}
              onChange={handleOptionClicked}
            >
              <option value="Add">Add</option>
              <option value="Modify">Modify</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-900 mb-1.5">
              {currentOption === "Add" ? "New column name" : "Select Column"}
            </label>
            {currentOption === "Add" ? (
              <Input
                bordered
                color="primary"
                className="w-full"
                onChange={handleInputChange}
                placeholder="Enter column name"
                size="sm"
              />
            ) : (
              <SingleDropDown
                columnNames={Object.keys(csvData[0])}
                onValueChange={setSelectedColumn}
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-900 mb-1.5">
              Method
            </label>
            <select
              name=""
              id="method"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-all"
              value={currentMethod}
              onChange={(e) => {
                setCurrentMethod(e.target.value);
                dispatch(setMethod(e.target.value));
              }}
            >
              {currentOption === "Add" && (
                <option value="New Column">New Column</option>
              )}
              <option value="Math Operation">Math Operation</option>
              <option value="Extract Text">Extract Text</option>
              <option value="Group Categorical">Group Categorical</option>
              <option value="Group Numerical">Group Numerical</option>
              {currentOption === "Modify" && (
                <>
                  <option value="Replace Values">Replace Values</option>
                  <option value="Progress Apply">Progress Apply</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-300">
          <SafeCheckbox
            color="primary"
            size="sm"
            defaultSelected={addToPipelineChecked}
            onChange={(e) => {
              const value = e.valueOf();
              setAddToPipelineChecked(value);
              dispatch(setAddToPipeline(value));
            }}
          >
            <span className="text-xs font-medium text-gray-900">Add To Pipeline</span>
          </SafeCheckbox>
          <button className="text-xs font-medium text-gray-800 hover:text-[#0D9488] transition-colors">
            Show Sample →
          </button>
        </div>
      </div>

      {/* Method Configuration */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-4 mb-3">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Method Settings</h2>
        <div>
          {csvData && currentMethod === "New Column" && (
            <Add_NewColumn csvData={csvData} />
          )}
          {csvData && currentMethod === "Math Operation" && (
            <Add_MathOperation csvData={csvData} />
          )}
          {csvData && currentMethod === "Extract Text" && (
            <Add_ExtractText csvData={csvData} />
          )}
          {csvData && currentMethod === "Group Categorical" && (
            <Add_GroupCategorical csvData={csvData} />
          )}
          {csvData && currentMethod === "Group Numerical" && (
            <Add_GroupNumerical csvData={csvData} />
          )}
          {csvData && currentMethod === "Replace Values" && (
            <Modify_ReplaceValue csvData={csvData} />
          )}
          {csvData && currentMethod === "Progress Apply" && (
            <Modify_ProgressApply csvData={csvData} />
          )}
        </div>
      </div>

      {/* Save Options Card */}
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
          <Docs section={"addModify"} />
        </div>
      </Modal>
    </div>
  );
}

export default AddModify;
