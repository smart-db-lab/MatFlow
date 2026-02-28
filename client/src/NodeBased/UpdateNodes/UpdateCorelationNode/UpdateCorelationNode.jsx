import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React, { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";
import MultipleDropDown from "../../../FunctionBased/Components/MultipleDropDown/MultipleDropDown";
import SingleDropDown from "../../../FunctionBased/Components/SingleDropDown/SingleDropDown";

function UpdateCorelationNode({ visible, setVisible, csvData, nodeId }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const allColumn = Object.keys(csvData[0]);
  const [corelation, setCorelation] = useState("pearson");
  const [show_column, setShowColumn] = useState(allColumn);
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(nodeId);

  useEffect(() => {
    let data = nodeDetails.data;
    if (data && data.correlation) {
      data = data.correlation;
      setCorelation(data.method || "pearson");
      setShowColumn(data.show_column || allColumn);
    }
  }, [nodeDetails]);

  const handleSave = () => {
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        table: csvData,
        correlation: {
          method: corelation,
          show_column,
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
          Edit Dataset Correlation Options
        </h1>

        <div className="min-w-[500px] min-h-[400px] mx-auto w-full p-6 py-4 space-y-4">
          <div>
            <p>Correlation Method</p>
            <SingleDropDown
              columnNames={["pearson", "kendall", "spearman"]}
              initValue={corelation}
              onValueChange={setCorelation}
            />
          </div>
          <div>
            <p>Show Column</p>
            <MultipleDropDown
              columnNames={allColumn}
              defaultValue={show_column}
              setSelectedColumns={setShowColumn}
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

export default UpdateCorelationNode;
