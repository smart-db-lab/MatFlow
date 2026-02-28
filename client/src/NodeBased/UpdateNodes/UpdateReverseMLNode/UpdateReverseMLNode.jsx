import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";
import MultipleDropDown from "../../../FunctionBased/Components/MultipleDropDown/MultipleDropDown";

function UpdateReverseMLNode({ visible, setVisible, csvData, nodeId }) {
  const allColumnName = Object.keys(csvData[0]);
  const [allTargetColumn, setAllTargetColumn] = useState(
    Object.keys(csvData[0])
  );
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [selectFeature, setSelectFeature] = useState();
  const [targetVariable, setTargetVariable] = useState();
  const [enterValues, setEnterValues] = useState("");
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(nodeId);

  useEffect(() => {
    const data = nodeDetails.data;
    if (data && data.reverseml) {
      setSelectFeature(data.reverseml["Select Feature"]);
      setTargetVariable(data.reverseml["Select Target Variable"]);
      setEnterValues(data.reverseml["Enter Values"]);
    }
  }, [nodeDetails]);

  const handleSelectFeature = (e) => {
    setSelectFeature(e);
    const ache = new Set(e);
    const temp = [];
    allColumnName.forEach((val) => {
      if (!ache.has(val)) temp.push(val);
    });
    setAllTargetColumn(temp);
  };

  const handleSave = () => {
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        reverseml: {
          "Select Feature": selectFeature,
          "Select Target Variable": targetVariable,
          "Enter Values": enterValues,
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
        <h1 className="text-center font-medium tracking-wider text-3xl mb-6">
          Edit ReverseML Options
        </h1>
        <div className="min-w-[500px] max-w-4xl mx-auto w-full p-6 py-4">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select Features
            </label>
            <MultipleDropDown
              columnNames={allColumnName}
              setSelectedColumns={(e) => handleSelectFeature(e)}
              defaultValue={selectFeature}
            />
          </div>
          <div className="mt-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select Target Variables
            </label>
            <MultipleDropDown
              columnNames={allTargetColumn}
              setSelectedColumns={setTargetVariable}
              defaultValue={targetVariable}
            />
          </div>
          <div className="mt-8">
            <h1 className="font-medium text-xl mb-4 tracking-wide">
              Prediction for All Target Variables
            </h1>
            <p className="mb-2 text-sm text-gray-600">{`Enter values for ${
              targetVariable && targetVariable.length > 0
                ? JSON.stringify(targetVariable)
                : ""
            }`}</p>
            <Input
              bordered
              fullWidth
              size="lg"
              value={enterValues}
              onChange={(e) => setEnterValues(e.target.value)}
            />
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t-2 shadow-md border-gray-200 flex items-center gap-4 w-full justify-end px-6 py-3 pt-6 mt-4">
          <button
            className="font-medium border-2 p-2 px-4 text-sm tracking-wider border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            onClick={() => {
              setVisible(false);
            }}
          >
            Close
          </button>
          <button
            className="font-medium border-2 p-2 px-4 text-sm tracking-wider bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-md transition-colors"
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

export default UpdateReverseMLNode;
