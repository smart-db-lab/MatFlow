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
import { Modal } from "@nextui-org/react";
import Docs from "../../../../Docs/Docs";

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
    <div className="w-full max-w-7xl mx-auto py-3">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Feature Selection</h2>
        
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Target Variable
              </label>
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
            </div>

            {target_variable && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Select feature selection method
                </label>
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
        </div>
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
