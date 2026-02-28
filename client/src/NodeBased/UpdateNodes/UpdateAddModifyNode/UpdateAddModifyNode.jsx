import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useReactFlow } from "reactflow";
import SingleDropDown from "../../../FunctionBased/Components/SingleDropDown/SingleDropDown";
import Add_ExtractText from "../../../FunctionBased/Functions/Feature Engineering/AddModify/Component/Add_ExtractText";
import Add_GroupCategorical from "../../../FunctionBased/Functions/Feature Engineering/AddModify/Component/Add_GroupCategorical";
import Add_GroupNumerical from "../../../FunctionBased/Functions/Feature Engineering/AddModify/Component/Add_GroupNumerical";
import Add_MathOperation from "../../../FunctionBased/Functions/Feature Engineering/AddModify/Component/Add_MathOperation";
import Add_NewColumn from "../../../FunctionBased/Functions/Feature Engineering/AddModify/Component/Add_NewColumn";
import Modify_ProgressApply from "../../../FunctionBased/Functions/Feature Engineering/AddModify/Component/Modify_ProgressApply";
import Modify_ReplaceValue from "../../../FunctionBased/Functions/Feature Engineering/AddModify/Component/Modify_ReplaceValue";
import {
  setColumnName,
  setMethod,
  setOption,
  setSelectColumn,
} from "../../../Slices/FeatureEngineeringSlice";

function UpdateAddModifyNode({ visible, setVisible, csvData, nodeId }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [current_option, setCurrentOption] = useState("Add");
  const [currentMethod, setCurrentMethod] = useState("New Column");
  const [selectedColumn, setSelectedColumn] = useState("");
  const featureData = useSelector((state) => state.featureEngineering);
  const [col_name, setColName] = useState("");
  const dispatch = useDispatch();
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(nodeId);
  const [dataset_name, setDatasetName] = useState("");

  useEffect(() => {
    let data = nodeDetails.data;
    if (data && data.addModify) {
      data = data.addModify;
      setCurrentOption(data.option || "Add");
      setCurrentMethod(data.method || "");
      setColName(data.column_name || "");
      setSelectedColumn(data.select_column || "");
      setDatasetName(data.dataset_name || "");
    }
  }, [nodeDetails]);

  const handleOptionClicked = (e) => {
    setCurrentOption(e);

    let meth;
    if (e === "Add") {
      setCurrentMethod("New Column");
      meth = "New Column";
    } else {
      setCurrentMethod("Math Operation");
      meth = "Math Operation";
    }
    dispatch(setOption(e));
    dispatch(setMethod(meth));
  };

  const handleSave = () => {
    const newFeatureData = {
      ...featureData,
      file: csvData,
      option: featureData.option.trim(),
    };
    // console.log(newFeatureData);
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        addModify: { ...newFeatureData, dataset_name },
      },
    };

    const tempNodes = rflow.getNodes().map((node) => {
      if (node.id === nodeId) return tempNode;
      return node;
    });
    rflow.setNodes(tempNodes);
  };

  return (
    <div>
      <Dialog
        open={visible}
        onClose={() => setVisible(false)}
        fullScreen={fullScreen}
        scroll="paper"
      >
        <span
          className="ml-auto p-2 cursor-pointer"
          onClick={() => setVisible(false)}
        >
          <CloseIcon color="action" />
        </span>
        <h1 className="text-center font-medium tracking-wider text-3xl">
          Edit Add/Modify Options
        </h1>
        <div className="min-w-[600px] mx-auto w-full p-6 py-4 space-y-4">
          <div>
            <p>Option</p>
            <SingleDropDown
              columnNames={["Add", "Modify"]}
              initValue={current_option}
              onValueChange={(e) => {
                handleOptionClicked(e);
              }}
            />
          </div>
          <div className="w-full flex flex-col">
            <label className=" text-lg tracking-wide font-medium" htmlFor="">
              {current_option === "Add" ? "New column name" : "Select Column"}
            </label>
            {current_option === "Add" ? (
              <Input
                bordered
                color="success"
                className="mt-1"
                value={col_name}
                onChange={(e) => {
                  dispatch(setColumnName(e.target.value));
                  setColName(e.target.value);
                }}
              />
            ) : (
              <SingleDropDown
                columnNames={Object.keys(csvData[0])}
                onValueChange={(e) => {
                  setSelectedColumn(e);
                  dispatch(setSelectColumn(e));
                }}
                initValue={selectedColumn}
              />
            )}
          </div>
          <div>
            <p>Method</p>
            <select
              name=""
              id="method"
              className="py-[0.6rem] rounded-xl px-3 w-full"
              value={currentMethod}
              onChange={(e) => {
                setCurrentMethod(e.target.value);
                dispatch(setMethod(e.target.value));
              }}
            >
              {current_option === "Add" && (
                <option value="New Column">New Column</option>
              )}
              <option value="Math Operation">Math Operation</option>
              <option value="Extract Text">Extract Text</option>
              <option value="Group Categorical">Group Categorical</option>
              <option value="Group Numerical">Group Numerical</option>
              {current_option === "Modify" && (
                <>
                  <option value="Replace Values">Replace Values</option>
                  <option value="Progress Apply">Progress Apply</option>
                </>
              )}
            </select>
          </div>
          <div className="mt-12">
            {csvData && currentMethod === "New Column" && (
              <Add_NewColumn
                csvData={csvData}
                type="node"
                nodeId={nodeId}
                rflow={rflow}
              />
            )}
            {csvData && currentMethod === "Math Operation" && (
              <Add_MathOperation
                csvData={csvData}
                type="node"
                nodeId={nodeId}
                rflow={rflow}
              />
            )}
            {csvData && currentMethod === "Extract Text" && (
              <Add_ExtractText
                csvData={csvData}
                type="node"
                nodeId={nodeId}
                rflow={rflow}
              />
            )}
            {csvData && currentMethod === "Group Categorical" && (
              <Add_GroupCategorical
                csvData={csvData}
                type="node"
                nodeId={nodeId}
                rflow={rflow}
              />
            )}
            {csvData && currentMethod === "Group Numerical" && (
              <Add_GroupNumerical
                csvData={csvData}
                type="node"
                nodeId={nodeId}
                rflow={rflow}
              />
            )}
            {csvData && currentMethod === "Replace Values" && (
              <Modify_ReplaceValue
                csvData={csvData}
                type="node"
                nodeId={nodeId}
                rflow={rflow}
              />
            )}
            {csvData && currentMethod === "Progress Apply" && (
              <Modify_ProgressApply
                csvData={csvData}
                type="node"
                nodeId={nodeId}
                rflow={rflow}
              />
            )}
          </div>
          <div>
            <Input
              label="New Dataset Name"
              fullWidth
              clearable
              value={dataset_name}
              onChange={(e) => setDatasetName(e.target.value)}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t-2 shadow-md border-gray-200 flex items-center gap-4 w-full justify-end px-6 py-3 pt-6 mt-4 z-[100]">
          <button
            className="font-medium border-2 p-2 px-4 text-lg tracking-wider border-gray-500 rounded"
            onClick={() => {
              setVisible(false);
            }}
          >
            Close
          </button>
          <button
            className="font-medium border-2 p-2 px-4 text-lg tracking-wider bg-black text-white rounded"
            onClick={() => {
              handleSave();
              setVisible(false);
            }}
          >
            Save
          </button>
        </div>
      </Dialog>
    </div>
  );
}

export default UpdateAddModifyNode;
