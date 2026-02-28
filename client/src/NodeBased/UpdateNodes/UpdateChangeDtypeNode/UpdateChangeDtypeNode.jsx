import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";
import SingleDropDown from "../../../FunctionBased/Components/SingleDropDown/SingleDropDown";

function UpdateChangeDtypeNode({ visible, setVisible, csvData, nodeId }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [numberOfColumns, setNumberOfColumns] = useState(1);
  const [data, setdata] = useState([
    {
      column_name: "",
      desired_dtype: "int",
      desired_bit_length: "8",
    },
  ]);
  const columnNames = Object.keys(csvData[0]);
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(nodeId);
  const [dataset_name, setDatasetName] = useState("");

  useEffect(() => {
    let data = nodeDetails.data;
    if (data && data.changeDtype) {
      data = data.changeDtype;
      setDatasetName(data.dataset_name || "");
      setNumberOfColumns(data.number_of_columns || 1);
      setdata(
        data.data || {
          column_name: "",
          desired_dtype: "int",
          desired_bit_length: "8",
        }
      );
    }
  }, [nodeDetails]);

  const handleChange = (val, index, key) => {
    const temp = data.map((d, ind) => {
      if (ind === index) return { ...d, [key]: val };
      return d;
    });
    setdata(temp);
  };

  const handleSave = () => {
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        changeDtype: {
          number_of_columns: numberOfColumns,
          data,
          file: csvData,
          dataset_name,
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
        <h1 className="text-center font-medium tracking-wider text-3xl">
          Edit Change DType Options
        </h1>
        <div className="min-w-[600px] mx-auto w-full p-6 py-4 space-y-4">
          <Input
            label="Number of columns"
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
            fullWidth
          />
          <div className="mt-8">
            {columnNames &&
              data.map((val, index) => {
                return (
                  <div key={index} className="flex items-end gap-4 mt-6">
                    <div className="w-full">
                      <p className="text-sm">Column {index + 1}</p>
                      <SingleDropDown
                        columnNames={columnNames}
                        onValueChange={(e) =>
                          handleChange(e, index, "column_name")
                        }
                        initValue={val.column_name}
                      />
                    </div>

                    <div className="flex w-full flex-col gap-1">
                      <label className="text-sm" htmlFor="">
                        Desired Dtype
                      </label>
                      <select
                        className="p-2 py-3 rounded-xl"
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

                    <div className="flex w-full flex-col gap-1">
                      <label className="text-sm" htmlFor="">
                        Desired Bit Length
                      </label>
                      <select
                        className="p-2 py-3 rounded-xl"
                        name=""
                        id=""
                        value={val.desired_bit_length}
                        onChange={(e) =>
                          handleChange(
                            e.target.value,
                            index,
                            "desired_bit_length"
                          )
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
                );
              })}
          </div>
          <div>
            <Input
              label="New Dataset Name"
              fullWidth
              clearable
              value={dataset_name}
              onChange={(e) => setDatasetName(e.target.value)}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t-2 shadow-md border-gray-200 flex items-center gap-4 w-full justify-end px-6 py-3 pt-6 mt-4 z-[100]">
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

export default UpdateChangeDtypeNode;
