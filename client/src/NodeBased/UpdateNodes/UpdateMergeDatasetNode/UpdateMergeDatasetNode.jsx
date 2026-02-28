import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";
import SingleDropDown from "../../../FunctionBased/Components/SingleDropDown/SingleDropDown";

const HOW = ["left", "right", "outer", "inner", "cross"];

function UpdateMergeDatasetNode({
  visible,
  setVisible,
  nodeId,
  table1,
  table2,
}) {
  // console.log({table1, table2})
  const leftDataframe = table1 ? Object.keys(table1[0]) : [];
  const rightDataframe = table2 ? Object.keys(table2[0]) : [];
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(nodeId);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [how, setHow] = useState();
  const [leftDataframeValue, setLeftDataframeValue] = useState();
  const [rightDataframeValue, setRightDataframeValue] = useState();
  const [dataset_name, setDatasetName] = useState("");

  useEffect(() => {
    const data = nodeDetails.data;
    if (data && data.merge) {
      setHow(data.merge["how"]);
      setLeftDataframeValue(data.merge["left_dataframe"]);
      setRightDataframeValue(data.merge["right_dataframe"]);
      setDatasetName(data.merge["dataset_name"]);
    }
  }, [nodeDetails]);

  const handleSave = () => {
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        merge: {
          table1,
          table2,
          how,
          left_dataframe: leftDataframeValue,
          right_dataframe: rightDataframeValue,
          dataset_name
        },
      },
    };

    const tempNodes = rflow.getNodes().map((node) => {
      if (node.id === nodeId) return tempNode;
      return node;
    });
    // console.log(tempNodes)
    rflow.setNodes(tempNodes);
  };

  return (
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
        Edit Merge Dataset Options
      </h1>
      <div className="min-w-[500px] mx-auto w-full p-6 py-4 space-y-4">
        <div>
          <p>How</p>
          <SingleDropDown
            columnNames={HOW}
            onValueChange={setHow}
            initValue={how}
          />
        </div>
        <div>
          <p>Select column name for left dataframe:</p>
          <SingleDropDown
            columnNames={leftDataframe}
            onValueChange={setLeftDataframeValue}
            initValue={leftDataframeValue}
          />
        </div>
        <div>
          <p>Select column name for right dataframe:</p>
          <SingleDropDown
            columnNames={rightDataframe}
            onValueChange={setRightDataframeValue}
            initValue={rightDataframeValue}
          />
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
      <div className="sticky bottom-0 bg-white border-t-2 shadow-md border-gray-200 flex items-center gap-4 w-full justify-end px-6 py-3 pt-6 mt-4">
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
  );
}

export default UpdateMergeDatasetNode;
