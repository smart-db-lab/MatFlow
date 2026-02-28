import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React, { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";
import MultipleDropDown from "../../../FunctionBased/Components/MultipleDropDown/MultipleDropDown";
import SingleDropDown from "../../../FunctionBased/Components/SingleDropDown/SingleDropDown";

function UpdateGroupNode({ visible, setVisible, csvData, nodeId }) {
  const theme = useTheme();
  const allColumnName = Object.keys(csvData[0]);
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(nodeId);
  const [agg_func, setAggFunc] = useState("count");
  const [selectedColumn, setSelectedColumns] = useState([allColumnName[0]]);

  useEffect(() => {
    const data = nodeDetails.data;
    if (data && data.group) {
      setAggFunc(data.group["agg_func"] || "count");
      setSelectedColumns(data.group["selectedColumn"] || [allColumnName[0]]);
    }
  }, [nodeDetails]);

  const handleSave = () => {
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        group: {
          agg_func,
          selectedColumn,
          file: csvData,
        },
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
        <h1 className="text-center font-medium tracking-wider text-2xl">
          Edit Dataset Group Options
        </h1>

        <div className="min-w-[500px] mx-auto w-full p-6 py-4 space-y-4">
          <div>
            <p>Aggregate Function</p>
            <SingleDropDown
              columnNames={[
                "count",
                "sum",
                "min",
                "max",
                "mean",
                "median",
                "std",
                "var",
              ]}
              initValue={agg_func}
              onValueChange={setAggFunc}
            />
          </div>
          <div>
            <p>Column Name</p>
            <MultipleDropDown
              columnNames={allColumnName}
              defaultValue={selectedColumn}
              setSelectedColumns={setSelectedColumns}
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
    </div>
  );
}

export default UpdateGroupNode;
