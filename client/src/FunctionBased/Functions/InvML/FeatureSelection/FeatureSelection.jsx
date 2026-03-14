import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  setFeatureSelection,
  setMethodFeatureSelection,
} from "../../../../Slices/FeatureSelectionSlice";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import BestOverallFeature from "./components/BestOverallFeature";
import MutualInformation from "./components/MutualInformation";
import ProgressiveFeature from "./components/ProgressiveFeature";
import SelectKBest from "./components/SelectKBest";
import { Modal } from "../../Feature Engineering/muiCompat";
import Docs from "../../../../Docs/Docs";
import {
  FE_CARD_CLASS,
  FE_LABEL_CLASS,
  FE_SECTION_TITLE_CLASS,
} from "../../Feature Engineering/feUi";

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
  const dispatch = useDispatch();

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  return (
    <div className="w-full py-3">
      <div className={FE_CARD_CLASS}>
        <h2 className={FE_SECTION_TITLE_CLASS}>Feature Selection</h2>
        <label className={FE_LABEL_CLASS}>Target Variable</label>
        <SingleDropDown
          columnNames={allColumnNames}
          onValueChange={(e) => {
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
        />
        {target_variable && (
          <div className="mt-4">
            <label className={FE_LABEL_CLASS}>Selection Method</label>
            <SingleDropDown
              columnNames={SELECTION_METHOD}
              initValue={selection_method}
              onValueChange={(e) => {
                setSelectionMethod(e);
                dispatch(setMethodFeatureSelection(e));
              }}
            />
          </div>
        )}
      </div>
      {target_variable && selection_method === SELECTION_METHOD[0] && (
        <BestOverallFeature csvData={csvData} />
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
