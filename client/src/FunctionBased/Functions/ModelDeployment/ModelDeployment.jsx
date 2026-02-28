import { Input, Modal, Radio } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getAuthHeaders } from "../../../util/adminAuth";
import { fetchDataFromIndexedDB } from "../../../util/indexDB";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import { ReadFile } from "../../../util/utils";
import Docs from "../../../Docs/Docs";
import { apiService } from "../../../services/api/apiService";
import { syncSplitAndModelCache } from "../../../util/modelDatasetSync";

function ModelDeployment({ csvData }) {
  const [allColumnNames, setAllColumnNames] = useState([]);
  const [allColumnValues, setAllColumnValues] = useState([]);
  const [splitted_datasets, setSplittedDatasets] = useState();
  const [datasetsName, setDatasetNames] = useState();
  const [allModels, setAllModels] = useState();
  const [modelNames, setModelsNames] = useState();
  const [current_dataset, setCurrentDataset] = useState();
  const [select_columns, setSelectColumns] = useState("all");
  const [filtered_column, setFilteredColumn] = useState(allColumnValues);
  const [train_data, setTrainData] = useState();
  const [target_val, setTargetVal] = useState();
  const [current_model, setCurrentModel] = useState();
  const [model_deploy, setModelDeploy] = useState();
  const [pred_result, setPredResult] = useState();
  const [dataframe, setDataframe] = useState();
  const [rowDef, setRowDef] = useState();
  const [columnDefs, setColumnDefs] = useState();
  const { projectId } = useParams();

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  useEffect(() => {
    const fetchData = async () => {
      const synced = await syncSplitAndModelCache(projectId);
      const res = synced.modelEntries || [];
      const sp_data = synced.splitEntries || [];
      const tempDatasets = synced.splitNames || [];

      setDatasetNames(tempDatasets);
      setAllModels(res);
      setSplittedDatasets(sp_data);
    };
    fetchData();
  }, [projectId]);

  useEffect(() => {
    if (allModels) {
      const datasetModelEntry = allModels.find((val) => current_dataset in val);
      const selectedModel = datasetModelEntry?.[current_dataset]?.[current_model];
      setModelDeploy(selectedModel?.["model_deploy"] || "");
    }
  }, [allModels, current_dataset, current_model]);

  useEffect(() => {
    if (dataframe) {
      const temp =
        dataframe && dataframe.length > 0
          ? Object.keys(dataframe[0]).map((key) => ({
              headerName: key,
              field: key,
              valueGetter: (params) => {
                return params.data[key];
              },
            }))
          : [];
      setColumnDefs(temp);
      let tempFilteredCol = filtered_column.map((val) => val.col);
      tempFilteredCol = new Set(tempFilteredCol);

      const tempRow = dataframe.filter((val) =>
        tempFilteredCol.has(val["Name of Features"])
      );

      setRowDef(tempRow);
    }
  }, [dataframe, filtered_column]);

  const handleDatasetChange = async (name) => {
    setPredResult("");
    setCurrentDataset(name);
    const sp_ind = splitted_datasets.findIndex((obj) => name in obj);
    const res = allModels.map((val) => val[name]);
    const ind = allModels.findIndex((obj) => name in obj);
    if (ind !== -1) {
      const tempModel = Object.keys(allModels[ind][name]);
      setCurrentModel(tempModel[0]);
      setModelsNames(tempModel);
    }
      if (sp_ind !== -1) {
      setTargetVal(splitted_datasets[sp_ind][name][3]);

      const train = await ReadFile({
        projectId,
        foldername: splitted_datasets[sp_ind][name][5],
        filename: splitted_datasets[sp_ind][name][1] + ".csv",
      });

      setTrainData(train);
      const data = await apiService.matflow.deployment.deployData({
        train,
        target_var: splitted_datasets[sp_ind][name][3],
      });

      if (data?.error) {
        const friendlyMessage = data.error.includes("Error processing column")
          ? "Some columns in this dataset are text-based. Please review input columns or continue with suggested defaults."
          : data.error;
        toast.error(friendlyMessage || "Could not prepare model deployment inputs.");
        setDataframe([]);
        setAllColumnValues([]);
        setAllColumnNames([]);
        setFilteredColumn([]);
        return;
      }

      const deploymentInputs = Array.isArray(data?.result) ? data.result : [];
      setDataframe(data?.correlations || []);
      setAllColumnValues(deploymentInputs);
      setAllColumnNames(deploymentInputs.map((val) => val.col));
      setFilteredColumn(deploymentInputs);
    }
  };

  const handleChangeValue = (ind, value) => {
    setFilteredColumn(
      filtered_column.map((val, i) => {
        if (i === ind) {
          let parsedValue = value;
          if (val.data_type === "float") {
            parsedValue = value === "" ? "" : parseFloat(value);
          } else if (val.data_type === "int") {
            parsedValue = value === "" ? "" : parseInt(value, 10);
          }
          return {
            ...val,
            value: parsedValue,
          };
        }
        return val;
      })
    );
  };

  const handleSave = async () => {
    try {
      if (!model_deploy || typeof model_deploy !== "string") {
        toast.error("Model is not ready. Please re-select dataset/model and try again.");
        return;
      }

      if (!Array.isArray(train_data) || train_data.length === 0) {
        toast.error("Training data is missing. Please re-select the dataset.");
        return;
      }

      if (!target_val) {
        toast.error("Target variable is missing. Please re-select the dataset.");
        return;
      }

      let result = {};
      for (const val of filtered_column || []) {
        const rawValue = val?.value;
        if (rawValue === "" || rawValue === null || rawValue === undefined) {
          toast.error(`Invalid value for ${val?.col || "input field"}.`);
          return;
        }
        if ((val?.data_type === "float" || val?.data_type === "int") && Number.isNaN(rawValue)) {
          toast.error(`Please enter a valid numeric value for ${val?.col || "input field"}.`);
          return;
        }
        result = { ...result, [val.col]: rawValue };
      }

      const dat = await apiService.matflow.deployment.deployResult({
        model_deploy,
        result,
        train: train_data,
        target_var: target_val,
      });

      if (dat?.error) {
        toast.error(dat.error);
        return;
      }

      setPredResult(dat.pred ?? "");
    } catch (error) {
      toast.error(error?.message || "Prediction failed. Please check inputs and try again.");
    }
  };

  if (!datasetsName || datasetsName.length === 0)
    return (
      <div className="mt-8 font-semibold tracking-wide text-2xl">
        Split a dataset first...
      </div>
    );

  return (
    <div className="my-8">
      <div>
        <p>Select Test Train Dataset</p>
        <SingleDropDown
          columnNames={datasetsName}
          onValueChange={(e) => handleDatasetChange(e)}
        />
      </div>
      {modelNames && modelNames.length > 0 && (
        <>
          <div className="mt-4">
            <p>Select Model</p>
            <SingleDropDown
              columnNames={modelNames}
              onValueChange={(e) => {
                setCurrentModel(e);
                setPredResult("");
              }}
              initValue={current_model}
            />
          </div>
          <div className="mt-4">
            <Radio.Group
              label="Select Columns"
              orientation="horizontal"
              color="success"
              defaultValue={select_columns}
              onChange={(e) => {
                if (e === "all") {
                  setFilteredColumn(allColumnValues);
                } else {
                  setFilteredColumn([]);
                }
                setSelectColumns(e);
              }}
            >
              <Radio value="all">All Columns</Radio>
              <Radio value="custom">Custom Columns</Radio>
            </Radio.Group>
          </div>
          {select_columns === "custom" && (
            <div className="mt-4">
              <p>Custom Columns</p>
              <MultipleDropDown
                columnNames={allColumnNames}
                setSelectedColumns={(e) => {
                  const tempSet = new Set(e);
                  const temp = allColumnValues.filter((val) =>
                    tempSet.has(val.col)
                  );
                  setFilteredColumn(temp);
                }}
              />
            </div>
          )}
          {filtered_column && filtered_column.length > 0 && (
            <div className="grid grid-cols-2 gap-8 mt-4 relative">
              <div className="mt-4">
                <h3 className="font-medium text-3xl tracking-wide mb-4">
                  Input Values
                </h3>
                <div className="flex flex-col gap-4">
                  {filtered_column.map((val, ind) => (
                    <div key={ind}>
                      <p className="mb-1">{filtered_column[ind].col}</p>
                      <Input
                        bordered
                        color="success"
                        value={String(filtered_column[ind].value ?? "")}
                        onChange={(e) => handleChangeValue(ind, e.target.value)}
                        fullWidth
                        step={
                          filtered_column[ind].data_type === "float" ? 0.01 : 1
                        }
                        type={filtered_column[ind].data_type === "string" ? "text" : "number"}
                        size="lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="">
                <div className="mt-4">
                  <h1 className="font-medium text-3xl tracking-wide">
                    Prediction
                  </h1>
                  <p className="mt-4 text-2xl">
                    {target_val}:{" "}
                    <span className="font-semibold ml-2">{pred_result}</span>
                  </p>
                  <button
                    className="self-start border-2 px-6 tracking-wider bg-primary-btn text-white font-medium rounded-md py-2 mt-6"
                    onClick={handleSave}
                  >
                    Submit
                  </button>
                </div>
                {/* <div className="mt-8 w-full max-w-xl h-[610px] ag-theme-alpine">
                  <AgGridComponent rowData={rowDef} columnDefs={columnDefs} />
                </div> */}
              </div>
            </div>
          )}

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
              <Docs section={"modelDeployment"} />
            </div>
          </Modal>
        </>
      )}
      {current_dataset && (!modelNames || modelNames.length === 0) && (
        <h1 className="mt-4 font-medium text-xl tracking-wide">
          Build a model first
        </h1>
      )}
    </div>
  );
}

export default ModelDeployment;
