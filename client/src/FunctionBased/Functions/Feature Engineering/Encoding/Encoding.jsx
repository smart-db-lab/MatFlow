import { Checkbox, Modal } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import MultipleDropDown from "../../../Components/MultipleDropDown/MultipleDropDown";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";

const Method = ["Ordinal Encoding", "One-Hot Encoding", "Target Encoding"];

function Encoding({
  csvData,
  type = "function",
  onValueChange = undefined,
  initValue = undefined,
}) {
  const allStringColumn = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "string"
  );
  const allNumberColumn = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "number"
  );
  const [stringColumn, setStringColumn] = useState(allStringColumn[0]);
  const [method, setMethod] = useState(Method[0]);
  const [add_to_pipeline, setAddToPipeline] = useState(false);
  let temp = csvData.map((val) => val[stringColumn]);
  temp = new Set(temp);
  temp = [...temp];
  const [stringValues, setStringValues] = useState(temp);
  const [data, setData] = useState({});
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const render = useSelector((state) => state.uploadedFile.rerender);
  const dispatch = useDispatch();

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  useEffect(() => {
    if (type === "node" && initValue) {
      setStringColumn(initValue.select_column || allStringColumn[0]);
      setMethod(initValue.method || Method[0]);
      setData(initValue.data || {});
    }
  }, []);

  useEffect(() => {
    if (type === "node") {
      onValueChange({
        select_column: stringColumn,
        method,
        data,
      });
    }
  }, [stringColumn, method, data]);

  const handleSave = async () => {
    try {
      const Data = await apiService.matflow.featureEngineering.encoding({
        select_column: stringColumn,
        method,
        data,
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
    <>
      <div className="w-full py-3">
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Encoding Settings</h2>
          
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                  Select Column
                </label>
                <SingleDropDown
                  initValue={stringColumn}
                  columnNames={allStringColumn}
                  onValueChange={(e) => {
                    setStringColumn(e);
                    if (method === Method[0]) {
                      let temp = csvData.map((val) => val[e]);
                      temp = new Set(temp);
                      temp = [...temp];
                      setStringValues(temp);
                    }
                  }}
                />
              </div>

              <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                  Select Method
                </label>
                <SingleDropDown
                  columnNames={Method}
                  initValue={method}
                  onValueChange={(val) => {
                    setMethod(val);
                    setData({});
                    if (val === Method[0]) {
                      let temp = csvData.map((val) => val[stringColumn]);
                      temp = new Set(temp);
                      temp = [...temp];
                      setStringValues(temp);
                    }
                  }}
                />
              </div>
            </div>

            {type === "function" && (
              <div className="pt-2 border-t border-gray-300">
                <Checkbox
                  color="primary"
                  size="sm"
                  onChange={(e) => setAddToPipeline(e.valueOf())}
                >
                  <span className="text-xs font-medium text-gray-900">Add To Pipeline</span>
                </Checkbox>
              </div>
            )}

          {method === "Ordinal Encoding" && (
            <div className="pt-3 border-t border-gray-300">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
                <div className="flex-shrink-0">
                  <label className="block text-xs font-semibold text-gray-900 mb-2">
                    Options
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <Checkbox
                      key={`start-from-0-${data.start_from_0}`}
                      size="sm"
                      color="primary"
                      defaultSelected={data.start_from_0}
                      onChange={(e) => setData({ ...data, start_from_0: e.valueOf() })}
                    >
                      <span className="text-xs text-gray-700">Start from 0</span>
                    </Checkbox>
                    <Checkbox
                      key={`include-nan-${data.include_nan}`}
                      size="sm"
                      color="primary"
                      defaultSelected={data.include_nan}
                      onChange={(e) => setData({ ...data, include_nan: e.valueOf() })}
                    >
                      <span className="text-xs text-gray-700">Include NaN</span>
                    </Checkbox>
                    <Checkbox
                      key={`sort-values-${data.sort_values}`}
                      size="sm"
                      color="primary"
                      defaultSelected={data.sort_values}
                      onChange={(e) => setData({ ...data, sort_values: e.valueOf() })}
                    >
                      <span className="text-xs text-gray-700">Sort Values</span>
                    </Checkbox>
                  </div>
                </div>
                {stringValues && (
                  <div className="flex-1 w-full lg:w-auto lg:min-w-[400px] lg:max-w-[700px]">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Set Value Order
                    </label>
                    <MultipleDropDown
                      columnNames={stringValues}
                      setSelectedColumns={(val) =>
                        setData({ ...data, set_value_order: val })
                      }
                      defaultValue={data.set_value_order || []}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {method === "One-Hot Encoding" && (
            <div className="pt-3 border-t border-gray-200">
              <Checkbox
                key={`drop-first-${data.drop_first}`}
                size="sm"
                color="primary"
                defaultSelected={data.drop_first}
                onChange={(e) => setData({ ...data, drop_first: e.valueOf() })}
              >
                <span className="text-xs text-gray-700">Drop First</span>
              </Checkbox>
            </div>
          )}

          {method === "Target Encoding" && (
            <div className="pt-3 border-t border-gray-200">
              <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Select Target
                </label>
                <SingleDropDown
                  columnNames={allNumberColumn}
                  onValueChange={(val) => setData({ ...data, select_target: val })}
                  initValue={data.select_target}
                />
              </div>
            </div>
          )}

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
          <Docs section={"encoding"} />
        </div>
      </Modal>
    </>
  );
}

export default Encoding;
