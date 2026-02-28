import { Input, Modal } from "@nextui-org/react";
import React, { useState } from "react";
import { getAuthHeaders } from "../../../util/adminAuth";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import Docs from "../../../Docs/Docs";
import { apiService } from "../../../services/api/apiService";

function ReverseML({ csvData }) {
  const allColumnName = Object.keys(csvData[0]);
  const [allTargetColumn, setAllTargetColumn] = useState(
    Object.keys(csvData[0])
  );
  const [selectFeature, setSelectFeature] = useState();
  const [targetVariable, setTargetVariable] = useState();
  const [enterValues, setEnterValues] = useState("");
  const [mlData, setMlData] = useState();
  const [columnDef, setColumnDef] = useState();

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  const handleSelectFeature = (e) => {
    setSelectFeature(e);
    const ache = new Set(e);
    const temp = [];
    allColumnName.forEach((val) => {
      if (!ache.has(val)) temp.push(val);
    });
    setAllTargetColumn(temp);
  };

  const handleSave = async () => {
    try {
      const data = await apiService.matflow.reverseML.reverseML({
        file: csvData,
        "Select Feature": selectFeature,
        "Select Target Variable": targetVariable,
        "Enter Values": enterValues,
      });
      setMlData(data);
      const temp = Object.keys(data[0]).map((val) => ({
        headerName: val,
        key: val,
        valueGetter: (params) => {
          return params.data[val];
        },
      }));
      setColumnDef(temp);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="my-8 max-w-5xl">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Select Features
        </label>
        <MultipleDropDown
          columnNames={allColumnName}
          setSelectedColumns={(e) => handleSelectFeature(e)}
        />
      </div>
      <div className="mt-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Select Target Variables
        </label>
        <MultipleDropDown
          columnNames={allTargetColumn}
          setSelectedColumns={setTargetVariable}
        />
      </div>

      <div className="mt-8">
        <h1 className="font-medium text-3xl mb-4 tracking-wide">
          Prediction for All Target Variables
        </h1>
        <div className="mb-4">
          <Input
            label={`Enter values for ${
              targetVariable && targetVariable.length > 0
                ? JSON.stringify(targetVariable)
                : ""
            }`}
            fullWidth
            size="lg"
            value={enterValues}
            onChange={(e) => setEnterValues(e.target.value)}
          />
        </div>
        <button
          className="px-6 py-2 text-sm font-medium rounded-md bg-[#0D9488] hover:bg-[#0F766E] text-white transition-colors"
          onClick={handleSave}
        >
          Predict
        </button>

        {columnDef && (
          <div className="mt-6">
            <div
              className="ag-theme-alpine"
              style={{ height: "200px", width: "100%" }}
            >
              <AgGridComponent
                rowData={mlData}
                columnDefs={columnDef}
                rowHeight={30}
                headerHeight={30}
                paginationPageSize={4}
              />
            </div>
          </div>
        )}
      </div>

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
          <Docs section={"reverseML"} />
        </div>
      </Modal>
    </div>
  );
}

export default ReverseML;
