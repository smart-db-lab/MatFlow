import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";
import SingleDropDown from "../../../FunctionBased/Components/SingleDropDown/SingleDropDown";

const REGRESSOR = [
  "Linear Regression",
  "Ridge Regression",
  "Lasso Regression",
  "Decision Tree Regression",
  "Random Forest Regression",
  "Support Vector Regressor",
];

const CLASSIFIER = [
  "K-Nearest Neighbors",
  "Support Vector Machine",
  "Logistic Regression",
  "Decision Tree Classification",
  "Random Forest Classification",
  "Multilayer Perceptron",
];

function UpdateTestTrainDatasetNode({ visible, setVisible, nodeId, whatKind }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(nodeId);
  const [regressor, setRegressor] = useState();
  const [model_name, setModelName] = useState("");
  const [allRegressor, setAllRegressor] = useState();

  useEffect(() => {
    const nodeData = nodeDetails.data;
    if (nodeData) {
      if (whatKind === "Continuous") {
        setAllRegressor(REGRESSOR);
        setRegressor(nodeData.regressor || REGRESSOR[0]);
        setModelName(nodeData.model_name || "LR_Regression");
      } else {
        setAllRegressor(CLASSIFIER);
        setRegressor(nodeData.regressor || CLASSIFIER[0]);
        setModelName(nodeData.model_name || "KNN_Classification");
      }
    }
  }, [nodeDetails.data, whatKind]);

  useEffect(() => {
    if (whatKind === "Continuous") {
      if (regressor === REGRESSOR[0]) setModelName("LR_Regression");
      if (regressor === REGRESSOR[1]) setModelName("Ridge_Regression");
      if (regressor === REGRESSOR[2]) setModelName("Lasso_Regression");
      if (regressor === REGRESSOR[3]) setModelName("DT_Regression");
      if (regressor === REGRESSOR[4]) setModelName("RF_Classification");
      if (regressor === REGRESSOR[5]) setModelName("svr_Regression");
    } else {
      if (regressor === CLASSIFIER[0]) setModelName("KNN_Classification");
      if (regressor === CLASSIFIER[1]) setModelName("SVM_Classification");
      if (regressor === CLASSIFIER[2]) setModelName("LR_Classification");
      if (regressor === CLASSIFIER[3]) setModelName("DT_Classification");
      if (regressor === CLASSIFIER[4]) setModelName("RF_Classification");
      if (regressor === CLASSIFIER[5]) setModelName("MLP_Classification");
    }
  }, [whatKind, regressor]);

  const handleSave = () => {
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        model_name,
        regressor,
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
          Edit Model Options
        </h1>

        <div className="min-w-[500px] min-h-[400px] mx-auto w-full p-6 py-4">
          {allRegressor && (
            <div className={`flex-col `}>
              <div className="w-full">
                <p>{whatKind === "Continuous" ? "Regressor" : "Classifier"}</p>
                <SingleDropDown
                  columnNames={allRegressor}
                  onValueChange={(e) => {
                    setRegressor(e);
                  }}
                  initValue={regressor}
                />
              </div>
              <div className="w-full mt-4">
                <Input
                  fullWidth
                  label="Model Name"
                  size="lg"
                  value={model_name}
                  onChange={(e) => setModelName(e.target.value)}
                />
              </div>
            </div>
          )}
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

export default UpdateTestTrainDatasetNode;
