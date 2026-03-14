import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  setFeatureSelection,
  setMethodFeatureSelection,
} from "../../../../Slices/FeatureSelectionSlice";
import BestOverallFeature from "./components/BestOverallFeature";
import MutualInformation from "./components/MutualInformation";
import ProgressiveFeature from "./components/ProgressiveFeature";
import SelectKBest from "./components/SelectKBest";
import { Modal } from "../muiCompat";
import Docs from "../../../../Docs/Docs";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import {
  FE_CARD_CLASS,
  FE_LABEL_CLASS,
  FE_SECTION_TITLE_CLASS,
} from "../feUi";

const SELECTION_METHOD = [
  "Best Overall Features",
  "SelectKBest",
  "Mutual Information",
  "Progressive Feature Selection with Cross-Validation",
];

function FeatureSelection({ csvData }) {
  const allColumnNames = Object.keys(csvData[0]);
  const [target_variable, setTargetVariable] = useState("");
  const [selection_method, setSelectionMethod] = useState("");
  const [bestOverallKFold, setBestOverallKFold] = useState(2);
  const [bestOverallMode, setBestOverallMode] = useState("All");
  const dispatch = useDispatch();

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  return (
    <div className="w-full max-w-7xl mx-auto pt-1 pb-3">
      <div className={FE_CARD_CLASS}>
        <h2 className={FE_SECTION_TITLE_CLASS}>Feature Selection</h2>
        
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto sm:min-w-[220px] sm:max-w-[320px]">
              <label className={FE_LABEL_CLASS}>
                Target Variable
              </label>
              <Autocomplete
                size="small"
                options={allColumnNames}
                value={target_variable || null}
                onChange={(_, e) => {
                  if (!e) return;
                  setTargetVariable(e);
                  setSelectionMethod(SELECTION_METHOD[0]);
                  dispatch(setMethodFeatureSelection(SELECTION_METHOD[0]));
                  dispatch(
                    setFeatureSelection({
                      target_variable: e,
                      data_type: typeof csvData[0][e],
                    })
                  );
                }}
                renderInput={(params) => <TextField {...params} placeholder="Select target variable" />}
              />
            </div>

            {target_variable && (
              <div className="w-full sm:w-auto sm:min-w-[220px] sm:max-w-[320px]">
                <label className={FE_LABEL_CLASS}>
                  Selection Method
                </label>
                <Autocomplete
                  size="small"
                  options={SELECTION_METHOD}
                  value={selection_method || null}
                  onChange={(_, e) => {
                    if (!e) return;
                    setSelectionMethod(e);
                    dispatch(setMethodFeatureSelection(e));
                  }}
                  renderInput={(params) => <TextField {...params} placeholder="Select method" />}
                />
              </div>
            )}
            {target_variable && selection_method === SELECTION_METHOD[0] && (
              <div className="w-full sm:flex-1 sm:min-w-[340px]">
                <label className={FE_LABEL_CLASS}>Best Overall Options</label>
                <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                  <div className="w-full sm:w-auto sm:min-w-[180px] sm:max-w-[240px]">
                    <TextField
                      label="Enter the value for k-fold"
                      fullWidth
                      type="number"
                      size="small"
                      inputProps={{ step: 1 }}
                      value={bestOverallKFold}
                      onChange={(e) => setBestOverallKFold(e.target.value)}
                    />
                  </div>
                  <RadioGroup
                    row
                    value={bestOverallMode}
                    onChange={(e) => setBestOverallMode(e.target.value)}
                  >
                    <FormControlLabel value="All" control={<Radio size="small" />} label="All" />
                    <FormControlLabel value="Custom" control={<Radio size="small" />} label="Custom" />
                    <FormControlLabel value="None" control={<Radio size="small" />} label="None" />
                  </RadioGroup>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {target_variable && selection_method === SELECTION_METHOD[0] && (
        <BestOverallFeature
          csvData={csvData}
          externalKFold={bestOverallKFold}
          externalMethod={bestOverallMode}
          hideControls
        />
      )}
      {target_variable && selection_method === SELECTION_METHOD[1] && (
        <SelectKBest csvData={csvData} />
      )}
      {target_variable && selection_method === SELECTION_METHOD[2] && (
        <MutualInformation csvData={csvData} />
      )}
      {target_variable && selection_method === SELECTION_METHOD[3] && (
        <ProgressiveFeature csvData={csvData} />
      )}

      {/* DOCS */}
      <button
        className="fixed bottom-20 right-5 bg-primary-btn text-xl font-bold text-white rounded-full w-10 h-10 shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center"
        onClick={openModal}
      >
        ?
      </button>
      <Modal
        open={visible}
        onClose={closeModal}
        aria-labelledby="help-modal"
        aria-describedby="help-modal-description"
        width="800px"
        scroll
        closeButton
      >
        <div className="bg-white text-left rounded-lg shadow-lg px-6 overflow-auto">
          <Docs section={"featureSelection"} />
        </div>
      </Modal>
    </div>
  );
}

export default FeatureSelection;
