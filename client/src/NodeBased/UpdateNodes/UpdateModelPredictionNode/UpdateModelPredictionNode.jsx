import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React, { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";
import SingleDropDown from "../../../FunctionBased/Components/SingleDropDown/SingleDropDown";

const RESULT_CLASSIFIER = [
  "Target Value",
  "Accuracy",
  "Precision",
  "Recall",
  "F1-Score",
  "Classification Report",
  "Confusion Matrix",
  "Actual vs. Predicted",
  "Precision-Recall Curve",
  "ROC Curve",
];

const RESULT_REGRESSOR = [
  "Target Value",
  "R-Squared",
  "Mean Absolute Error",
  "Mean Squared Error",
  "Root Mean Squared Error",
  "Regression Line Plot",
  "Actual vs. Predicted",
  "Residuals vs. Predicted",
  "Histogram of Residuals",
  "QQ Plot",
  "Box Plot of Residuals",
];

function UpdateModelPredictionNode({ visible, setVisible, nodeId }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(nodeId);
  const [RESULT, setResult] = useState([]);
  const [activeResult, setActiveResult] = useState("");
  const [target_var, setTargetVariable] = useState("");

  useEffect(() => {
    const data = nodeDetails.data;
    if (data && data.testTrain) {
      setResult(
        data.testTrain.whatKind === "Continuous"
          ? RESULT_REGRESSOR
          : RESULT_CLASSIFIER
      );
      setTargetVariable(data.testTrain.target_variable);
      setActiveResult(data.result || "Target Value");
    }
  }, [nodeDetails]);

  const handleSave = () => {
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        result: activeResult,
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
          Edit Model Prediction Options
        </h1>

        <div className="min-w-[500px] min-h-[300px] mx-auto w-full p-6 py-4 space-y-4">
          <div>
            <p className="text-lg mb-1">Result</p>
            <SingleDropDown
              columnNames={RESULT}
              initValue={activeResult}
              onValueChange={setActiveResult}
            />
          </div>
          <div>
            <p>Target Variable</p>
            <SingleDropDown initValue={target_var} disabled />
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

export default UpdateModelPredictionNode;
