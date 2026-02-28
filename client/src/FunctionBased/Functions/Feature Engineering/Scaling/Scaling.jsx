import { Checkbox, Modal, Radio } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import MultipleDropDown from "../../../Components/MultipleDropDown/MultipleDropDown";
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";

function Scaling({
  csvData,
  type = "function",
  onValueChange = undefined,
  initValue = undefined,
}) {
  const allColumns = Object.keys(csvData[0]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [option, setOption] = useState("Select Columns");
  const [defaultValue, setDefaultValue] = useState("Blank");
  const [method, setMethod] = useState("Min-Max Scaler");
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const render = useSelector((state) => state.uploadedFile.rerender);
  const dispatch = useDispatch();

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  useEffect(() => {
    if (type === "node" && initValue) {
      setOption(initValue.options || "Select Columns");
      setMethod(initValue.method || "Min-Max Scaler");
      setDefaultValue(initValue.default_value || "Blank");
      setSelectedColumns(initValue.select_column || []);
    }
  }, []);

  useEffect(() => {
    if (type === "node") {
      onValueChange((prev) => ({
        ...prev,
        options: option,
        method,
        default_value: defaultValue,
        select_column: selectedColumns,
      }));
    }
  }, [option, method, defaultValue, selectedColumns]);

  const handleDefaultValue = (e) => {
    setDefaultValue(e);
    if (e === "Blank") setSelectedColumns([]);
    if (e === "All") setSelectedColumns(Object.keys(csvData[0]));
    if (e === "Numerical")
      setSelectedColumns(
        Object.keys(csvData[0]).filter(
          (val) => typeof csvData[0][val] === "number"
        )
      );
    if (e === "Categorical")
      setSelectedColumns(
        Object.keys(csvData[0]).filter(
          (val) => typeof csvData[0][val] === "string"
        )
      );
  };

  const handleSave = async () => {
    try {
      const Data = await apiService.matflow.featureEngineering.scaling({
        options: option,
        method,
        default_value: defaultValue,
        select_column: selectedColumns,
        file: csvData,
      });

      let fileName = activeCsvFile.name;

      // const uploadedFiles = JSON.parse(localStorage.getItem("uploadedFiles"));
      // const fileExist = uploadedFiles.filter((val) => val.name === fileName);

      // if (fileExist.length === 0) {
      //   uploadedFiles.push({ name: fileName });
      // }
      // localStorage.setItem("uploadedFiles", JSON.stringify(uploadedFiles));

      const temp = await fetchDataFromIndexedDB(fileName);
      await updateDataInIndexedDB(fileName, Data);

      toast.success(`Data updated successfully!`, {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      dispatch(setReRender(!render));
    } catch (error) {
      toast.error("Something went wrong. Please try again", {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  return (
      <div className="w-full py-3">
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Scaling Settings</h2>
          
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-full sm:w-auto sm:min-w-[180px] sm:max-w-[250px]">
                <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                  Options
                </label>
                <select
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-all"
                  value={option}
                  onChange={(e) => setOption(e.target.value)}
                  name=""
                  id=""
                >
                  <option value="Select Columns">Select Columns</option>
                  <option value="Select All Except">Select All Except</option>
                </select>
              </div>
            <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
              <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                Method
              </label>
              <select
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-all"
                name=""
                id=""
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="Min-Max Scaler">Min-Max Scaler</option>
                <option value="Standard Scaler">Standard Scaler</option>
                <option value="Robust Scaler">Robust Scaler</option>
                <option value="MaxAbs Scaler">MaxAbs Scaler</option>
                <option value="Quantile Transformer">Quantile Transformer</option>
                <option value="Power Transformer">Power Transformer</option>
              </select>
            </div>
          </div>

          {type === "function" && (
            <div className="pt-2 border-t border-gray-300">
              <Checkbox color="primary" size="sm">
                <span className="text-xs font-medium text-gray-900">Add To Pipeline</span>
              </Checkbox>
            </div>
          )}

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
            <div className="flex-shrink-0">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Default Value
              </label>
              <Radio.Group
                orientation="horizontal"
                defaultValue="Blank"
                color="primary"
                value={defaultValue}
                size="sm"
                onChange={(e) => handleDefaultValue(e)}
              >
                <Radio value="Blank">Blank</Radio>
                <Radio value="All">All</Radio>
                <Radio value="Numerical">Numerical</Radio>
                <Radio value="Categorical">Categorical</Radio>
              </Radio.Group>
            </div>

            <div className="flex-1 w-full lg:w-auto lg:min-w-[400px] lg:max-w-[700px]">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                {option}
              </label>
              <MultipleDropDown
                columnNames={allColumns}
                setSelectedColumns={setSelectedColumns}
                defaultValue={selectedColumns}
              />
            </div>
          </div>

          {type === "function" && (
            <div className="pt-3 border-t border-gray-200">
              <button
                className="px-4 py-2 bg-[#0D9488] text-white text-sm font-medium rounded-md hover:bg-[#0F766E] transition-colors flex items-center gap-1.5"
                onClick={handleSave}
              >
                Submit Changes
                <span>→</span>
              </button>
            </div>
          )}
        </div>
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
          <Docs section={"scaling"} />
        </div>
      </Modal>
    </div>
  );
}

export default Scaling;
