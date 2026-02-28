import { Checkbox, Input, Modal } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setFile } from "../../../../Slices/FeatureEngineeringSlice";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";

function ChangeDType({ csvData }) {
  const dispatch = useDispatch();
  const featureData = useSelector((state) => state.featureEngineering);
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);

  const [numberOfColumns, setNumberOfColumns] = useState(1);
  const [columnNames, setColumnNames] = useState();
  const [data, setdata] = useState([
    {
      column_name: "",
      desired_dtype: "int",
      desired_bit_length: "8",
    },
  ]);
  const render = useSelector((state) => state.uploadedFile.rerender);

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  useEffect(() => {
    if (activeCsvFile && activeCsvFile.name) {
      const getData = async () => {
        setColumnNames(Object.keys(csvData[0]));
        dispatch(setFile(csvData));
      };

      getData();
    }
  }, [activeCsvFile, dispatch, csvData]);

  const handleChange = (val, index, key) => {
    const temp = data.map((d, ind) => {
      if (ind === index) return { ...d, [key]: val };
      return d;
    });
    setdata(temp);
  };

  const handleSave = async () => {
    try {
      const Data = await apiService.matflow.featureEngineering.changeDtype({
        number_of_columns: numberOfColumns,
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
    <div className="w-full py-3">
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-4 mb-3">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Change Data Type</h2>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto sm:min-w-[150px]">
            <label className="block text-xs font-semibold text-gray-900 mb-1.5">
              Number of columns
            </label>
            <Input
              value={numberOfColumns}
              onChange={(e) => {
                const val = e.target.value;
                setNumberOfColumns(val);
                if (val < data.length) setdata(data.slice(0, val));
                else {
                  const temp = JSON.parse(JSON.stringify(data));
                  while (val - temp.length > 0) {
                    temp.push({
                      column_name: "",
                      desired_dtype: "int",
                      desired_bit_length: "8",
                    });
                  }
                  setdata(temp);
                }
              }}
              type="number"
              step={1}
              size="sm"
            />
          </div>
          <div className="flex items-center">
            <Checkbox color="primary" size="sm">
              <span className="text-xs font-medium text-gray-900">Add to pipeline</span>
            </Checkbox>
          </div>
        </div>
      </div>

      {csvData && columnNames && data.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-4 mb-3">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Column Settings</h2>
          <div className="space-y-3">
            {data.map((val, index) => {
              return (
                <div key={index} className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                  <h3 className="text-xs font-semibold text-gray-900 mb-2">Column {index + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                        Column Name
                      </label>
                      <SingleDropDown
                        columnNames={columnNames}
                        onValueChange={(e) => handleChange(e, index, "column_name")}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                        Desired Dtype
                      </label>
                      <select
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-all"
                        value={val.desired_dtype}
                        onChange={(e) =>
                          handleChange(e.target.value, index, "desired_dtype")
                        }
                      >
                        <option value="int">int</option>
                        <option value="float">float</option>
                        <option value="complex">complex</option>
                        <option value="str">str</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                        Desired Bit Length
                      </label>
                      <select
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-all"
                        value={val.desired_bit_length}
                        onChange={(e) =>
                          handleChange(e.target.value, index, "desired_bit_length")
                        }
                      >
                        <option value="8">8</option>
                        <option value="16">16</option>
                        <option value="32">32</option>
                        <option value="64">64</option>
                        <option value="128">128</option>
                        <option value="256">256</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-4">
        <button
          className="px-4 py-2 bg-[#0D9488] text-white text-sm font-medium rounded-md hover:bg-[#0F766E] transition-colors flex items-center gap-1.5"
          onClick={handleSave}
        >
          Submit Changes
          <span>→</span>
        </button>
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
          <Docs section={"changeDtype"} />
        </div>
      </Modal>
    </div>
  );
}

export default ChangeDType;
