import { Checkbox, Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setSaveAsNew } from "../../../../Slices/FeatureEngineeringSlice";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import { CreateFile } from "../../../../util/utils";
import { apiService } from "../../../../services/api/apiService";

function Imputation({
  csvData,
  type = "function",
  initValue = undefined,
  onValueChange = undefined,
}) {
  const { projectId } = useParams();
  const [savedAsNewDataset, setSavedAsNewDataset] = useState(false);
  const [dataset_name, setDatasetName] = useState("");
  const dispatch = useDispatch();
  const [imputationNotExist, setImputationNotExist] = useState(true);
  const [nullVar, setNullVar] = useState([]);
  const [select_column, setSelectColumn] = useState();
  const [group_by, setGroupBy] = useState([]);
  const [strategy, setStrategy] = useState([]);
  const [activeStrategy, setActiveStrategy] = useState();
  const [mode, setMode] = useState("Select Mode");
  const [modeData, setModeData] = useState([]);
  const [optionValue, setOptionValue] = useState();
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const activeFolder = useSelector((state) => state.uploadedFile.activeFolder);
  const [constant, setConstant] = useState();
  const [fill_group, setFillGroup] = useState();
  const render = useSelector((state) => state.uploadedFile.rerender);

  useEffect(() => {
    if (type === "node" && initValue) {
      setGroupBy(initValue.group_by || []);
      setModeData(initValue.modeData || []);

      setConstant(initValue.constant || []);
      setFillGroup(initValue.fill_group);
      setActiveStrategy(initValue.activeStrategy);
      setSelectColumn(initValue.select_column);
      if (typeof csvData[0][initValue.select_column] === "number")
        setStrategy(["mean", "median", "constant"]);
      else setStrategy(["mode", "value"]);
    }
  }, []);

  useEffect(() => {
    if (type === "node") {
      onValueChange({
        group_by,
        modeData,
        activeStrategy,
        constant,
        fill_group,
        select_column,
        strategy,
      });
    }
  }, [
    group_by,
    modeData,
    activeStrategy,
    constant,
    fill_group,
    select_column,
    strategy,
  ]);

  useEffect(() => {
    setImputationNotExist(true);
    setNullVar([]);
    setStrategy(null);
    // setActiveStrategy();

    const fetchData = async () => {
      const data = await apiService.matflow.featureEngineering.imputationData1({
        file: csvData,
      });

      if ((!data.null_var || data.null_var.length === 0) && type === "function")
        setImputationNotExist(true);
      else setImputationNotExist(false);
      setNullVar(data.null_var);

      if (select_column) {
        if (typeof csvData[0][select_column] === "number")
          setStrategy(["mean", "median", "constant"]);
        else setStrategy(["mode", "value"]);
      }
    };
    fetchData();
  }, [csvData, select_column]);

  const handleSave = async () => {
    const response = await apiService.matflow.featureEngineering.imputationResult({
      file: csvData,
      Select_columns: select_column,
      strategy: activeStrategy === "mode" ? "constant" : activeStrategy,
      fill_group,
      constant,
    });

    let Data = response.dataset || response;

    let fileName = activeCsvFile.name;

    if (savedAsNewDataset) {
      fileName = dataset_name;
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
  };

  async function handleSelectColumn(e) {
    if (typeof csvData[0][e] === "number")
      setStrategy(["mean", "median", "constant"]);
    else setStrategy(["mode", "value"]);
    setSelectColumn(e);

    const data = await apiService.matflow.featureEngineering.imputationData2({
      file: csvData,
      Select_columns: e,
    });

    setGroupBy(data.group_by);
    if (data.mode) setModeData(Object.values(data.mode));
  }

  if (imputationNotExist)
    return (
      <div className="w-full py-3">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs font-medium text-yellow-800">Imputation doesn't exist</p>
          </div>
        </div>
      </div>
    );

  return (
      <div className="w-full py-3">
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Imputation Settings</h2>
          
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                  Select Columns
                </label>
              <SingleDropDown
                columnNames={nullVar}
                onValueChange={(e) => handleSelectColumn(e)}
                initValue={select_column}
              />
            </div>

            <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
              <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                Strategy
              </label>
              <SingleDropDown
                columnNames={strategy}
                onValueChange={(e) => {
                  setActiveStrategy(e);
                  setConstant();
                }}
                initValue={activeStrategy}
              />
            </div>
          </div>

          {type === "function" && (
            <div className="pt-2 border-t border-gray-300">
              <Checkbox color="primary" size="sm">
                <span className="text-xs font-medium text-gray-900">Add to pipeline</span>
              </Checkbox>
            </div>
          )}

          {activeStrategy && strategy && strategy[0] === "mean" && (
            <div className="pt-3 border-t border-gray-300">
              {activeStrategy === "constant" ? (
                <div className="w-full max-w-md">
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                    Value
                  </label>
                  <Input
                    fullWidth
                    type="number"
                    step={0.01}
                    value={constant || 0}
                    onChange={(e) => setConstant(e.target.value)}
                    size="sm"
                    placeholder="Enter value"
                  />
                </div>
              ) : (
                <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Group By
                  </label>
                  <SingleDropDown
                    columnNames={group_by}
                    onValueChange={setFillGroup}
                    initValue={fill_group}
                  />
                </div>
              )}
            </div>
          )}

          {activeStrategy && strategy && strategy[0] === "mode" && (
            <div className="pt-3 border-t border-gray-200">
              {activeStrategy === "value" ? (
                <div className="w-full max-w-md">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Value
                  </label>
                  <Input
                    fullWidth
                    type="number"
                    step={0.01}
                    value={constant || 0}
                    onChange={(e) => setConstant(e.target.value)}
                    size="sm"
                    placeholder="Enter value"
                  />
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-full sm:w-auto sm:min-w-[180px] sm:max-w-[250px]">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Options
                    </label>
                    <SingleDropDown
                      columnNames={["Select Mode", "Group Mode"]}
                      onValueChange={(e) => {
                        setMode(e);
                        setOptionValue("");
                        setConstant();
                        setFillGroup();
                      }}
                    />
                  </div>
                  {mode === "Group Mode" && (
                    <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Group By
                      </label>
                      <SingleDropDown
                        columnNames={group_by}
                        initValue={optionValue}
                        onValueChange={setFillGroup}
                      />
                    </div>
                  )}
                  {mode === "Select Mode" && (
                    <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Mode value
                      </label>
                      <SingleDropDown
                        columnNames={modeData}
                        initValue={optionValue}
                        onValueChange={setConstant}
                      />
                    </div>
                  )}
                </div>
              )}
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
                        value={dataset_name}
                        onChange={(e) => {
                          setDatasetName(e.target.value);
                        }}
                        size="sm"
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

export default Imputation;
