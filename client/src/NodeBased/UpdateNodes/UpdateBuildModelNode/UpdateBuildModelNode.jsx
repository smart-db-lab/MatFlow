import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React, { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";
import BuildModel from "../../../FunctionBased/Functions/Model Building/BuildModel/BuildModel";

function UpdateBuildModelNode({ visible, setVisible, nodeData, nodeId }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(nodeId);
  const Data = nodeDetails.data;
  const [data, setData] = useState({});

  useEffect(() => {
    if (Data.model_setting) {
      setData(Data.model_setting);
    }
  }, [Data]);

  const handleSave = () => {
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        model_setting: data,
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
        maxWidth="md"
        fullWidth
      >
        <span
          className="ml-auto p-2 cursor-pointer"
          onClick={() => setVisible(false)}
        >
          <CloseIcon color="action" />
        </span>
        <h1 className="text-center font-medium tracking-wider text-xl mb-2">
          Edit Model Settings
        </h1>

        <div className="min-w-[300px] max-w-[600px] mx-auto w-full p-3 py-2">
          <BuildModel
            csvData={nodeData.table}
            nodeData={nodeData}
            initValue={data}
            onValueChange={setData}
            type="node"
          />
        </div>

        <div className="sticky bottom-0 bg-white border-t-2 shadow-md border-gray-200 flex items-center gap-3 w-full justify-end px-4 py-2 mt-2">
          <button
            className="font-medium border-2 p-1.5 px-3 text-sm tracking-wider border-gray-500 rounded"
            onClick={() => {
              setVisible(false);
            }}
          >
            Close
          </button>
          <button
            className="font-medium border-2 p-1.5 px-3 text-sm tracking-wider bg-black text-white rounded"
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

export default UpdateBuildModelNode;
