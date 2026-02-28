import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";

const CROSS_VALID = [
  "Linear Regression",
  "Ridge Regression",
  "Lasso Regression",
  "Decision Tree Regression",
  "Random Forest Regression",
  "Support Vector Regressor",
  "K-Nearest Neighbors",
  "Support Vector Machine",
  "Logistic Regression",
  "Decision Tree Classification",
  "Random Forest Classification",
  "Multilayer Perceptron",
];
const RANDOM_STATE = [
  "Linear Regression",
  "Ridge Regression",
  "Lasso Regression",
  "Decision Tree Regression",
  "Random Forest Regression",
  "K-Nearest Neighbors",
  "Support Vector Machine",
  "Logistic Regression",
  "Decision Tree Classification",
  "Random Forest Classification",
  "Multilayer Perceptron",
];
const ITER = [
  "Ridge Regression",
  "Lasso Regression",
  "Decision Tree Regression",
  "Random Forest Regression",
  "K-Nearest Neighbors",
  "Support Vector Machine",
  "Logistic Regression",
  "Decision Tree Classification",
  "Random Forest Classification",
  "Multilayer Perceptron",
];

function UpdateHyperparameterNode({ visible, setVisible, nodeData, nodeId }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(nodeId);
  const [hyper, setHyper] = useState({});

  useEffect(() => {
    const data = nodeDetails.data;
    if (data && data.hyper) {
      setHyper(data.hyper);
    }
  }, [nodeDetails]);

  const handleSave = () => {
    const tempNode = {
      ...nodeDetails,
      data: {
        testTrain: nodeData,
        hyper,
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
          Edit Hyperparameter Opimization Options
        </h1>

        <div className="min-w-[600px] mx-auto w-full p-6 py-4 space-y-2">
          {CROSS_VALID.includes(nodeData.regressor) && (
            <div>
              <p className="mb-2">Number of cross-validation folds</p>
              <Input
                step={1}
                fullWidth
                color="success"
                bordered
                value={hyper["Number of cross-validation folds"]}
                onChange={(e) =>
                  setHyper({
                    ...hyper,
                    "Number of cross-validation folds": e.target.value,
                  })
                }
              />
            </div>
          )}
          {RANDOM_STATE.includes(nodeData.regressor) && (
            <div>
              <p className="mb-2">Random state for hyperparameter search</p>
              <Input
                step={1}
                fullWidth
                color="success"
                bordered
                value={hyper["Random state for hyperparameter search"]}
                onChange={(e) =>
                  setHyper({
                    ...hyper,
                    "Random state for hyperparameter search": e.target.value,
                  })
                }
              />
            </div>
          )}
          {ITER.includes(nodeData.regressor) && (
            <div>
              <p className="mb-2">
                Number of iterations for hyperparameter search
              </p>
              <Input
                step={1}
                fullWidth
                color="success"
                bordered
                value={hyper["Number of iterations for hyperparameter search"]}
                onChange={(e) =>
                  setHyper({
                    ...hyper,
                    "Number of iterations for hyperparameter search":
                      e.target.value,
                  })
                }
              />
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

export default UpdateHyperparameterNode;
