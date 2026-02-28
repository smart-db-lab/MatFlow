import styled from "@emotion/styled";
import CloseIcon from "@mui/icons-material/Close";
import { Dialog, Slider, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";
import SingleDropDown from "../../../FunctionBased/Components/SingleDropDown/SingleDropDown";

const METHOD = ["Best Overall Features", "SelectKBest", "Mutual Information"];

function UpdateFeatureSelectionNode({ visible, setVisible, csvData, nodeId }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(nodeId);
  const columnNames = Object.keys(csvData[0]);
  const [target_var, setTargetVar] = useState("");
  const [method, setMethod] = useState(METHOD[0]);
  const [k_fold, setKFoldValue] = useState(2);
  const [best_Kfeature, setBestKFeature] = useState(1);
  const [d_type, setDtype] = useState("");
  const [score_func, setScoreFunction] = useState("");

  useEffect(() => {
    let data = nodeDetails.data;
    if (data && data.feature_selection) {
      data = data.feature_selection;
      setTargetVar(data.target_var || "");
      setMethod(data.method || METHOD[0]);
      setKFoldValue(data.k_fold === undefined ? 2 : data.k_fold);
      setBestKFeature(
        data.best_Kfeature === undefined ? 1 : data.best_Kfeature
      );
      setScoreFunction(data.score_func || "");
      if (data.target_var) {
        setDtype(typeof csvData[0][data.target_var]);
      }
    }
  }, [nodeDetails]);

  const handleSave = () => {
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        feature_selection: {
          target_var,
          method,
          k_fold,
          best_Kfeature,
          score_func,
          csvData,
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
          Edit Feature Selection Options
        </h1>

        <div className="min-w-[500px] min-h-[500px] mx-auto w-full p-6 py-4 space-y-3">
          <div>
            <p>Target Variable</p>
            <SingleDropDown
              columnNames={columnNames}
              initValue={target_var}
              onValueChange={(e) => {
                setTargetVar(e);
                setDtype(typeof csvData[0][e]);
                setScoreFunction(
                  typeof csvData[0][e] === "number"
                    ? "f_regression"
                    : "f_classif"
                );
              }}
            />
          </div>
          <div>
            <p>Select Feature Selection Method</p>
            <SingleDropDown
              columnNames={METHOD}
              initValue={method}
              onValueChange={setMethod}
            />
          </div>
          {method === METHOD[0] && (
            <div>
              <Input
                label="Enter the value for k-fold"
                fullWidth
                type="number"
                step={1}
                value={k_fold}
                onChange={(e) => setKFoldValue(e.target.value)}
              />
            </div>
          )}
          {method === METHOD[1] && (
            <div className="space-y-3">
              <div>
                <p>Select number of features to keep:</p>
                <div className="mt-12">
                  <Stack
                    spacing={2}
                    direction="row"
                    sx={{ mb: 1 }}
                    alignItems="center"
                  >
                    <span>1</span>
                    <PrettoSlider
                      aria-label="Auto Bin Slider"
                      min={1}
                      max={columnNames.length - 1}
                      step={1}
                      defaultValue={1}
                      value={best_Kfeature}
                      onChange={(e) => setBestKFeature(e.target.value)}
                      valueLabelDisplay="on"
                      color="primary"
                    />
                    <span>{columnNames.length - 1}</span>
                  </Stack>
                </div>
              </div>
              <div>
                <p>Select Score Function:</p>
                <SingleDropDown
                  columnNames={
                    d_type === "number"
                      ? ["f_regression", "mutual_info_regression"]
                      : ["f_classif", "mutual_info_classif"]
                  }
                  initValue={score_func}
                  onValueChange={setScoreFunction}
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

export default UpdateFeatureSelectionNode;

const PrettoSlider = styled(Slider)({
  color: "#52af77",
  height: 8,
  "& .MuiSlider-track": {
    border: "none",
  },
  "& .MuiSlider-thumb": {
    height: 24,
    width: 24,
    backgroundColor: "#fff",
    border: "2px solid currentColor",
    "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
      boxShadow: "inherit",
    },
    "&:before": {
      display: "none",
    },
  },
  "& .MuiSlider-valueLabel": {
    lineHeight: 1.2,
    fontSize: 12,
    background: "unset",
    padding: 0,
    width: 32,
    height: 32,
    borderRadius: "50% 50% 50% 0",
    backgroundColor: "#52af77",
    transformOrigin: "bottom left",
    transform: "translate(50%, -100%) rotate(-45deg) scale(0)",
    "&:before": { display: "none" },
    "&.MuiSlider-valueLabelOpen": {
      transform: "translate(50%, -100%) rotate(-45deg) scale(1)",
    },
    "& > *": {
      transform: "rotate(45deg)",
    },
  },
});
