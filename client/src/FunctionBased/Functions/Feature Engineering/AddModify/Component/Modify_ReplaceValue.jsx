import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setData } from "../../../../../Slices/FeatureEngineeringSlice";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Autocomplete from "@mui/material/Autocomplete";

function Modify_ReplaceValue({
  csvData,
  nodeId,
  type = "function",
  rflow = undefined,
}) {
  const columnNames = Object.keys(csvData[0]);
  const [subMethod, setSubMethod] = useState("Text Input");
  const [fillNullMethod, setFillNullMethod] = useState("Custom Value");
  const [stringOperationMethod, setStringOperationMethod] =
    useState("Uppercase");
  const [data, setdata] = useState({ old_value: "", new_value: "" });
  const [from_another_column, setFromAnotherColumn] = useState("");
  const dispatch = useDispatch();
  let nodeDetails = {};
  if (rflow) {
    nodeDetails = rflow.getNode(nodeId);
  }

  useEffect(() => {
    if (nodeDetails && type === "node") {
      let data = nodeDetails.data;
      if (
        data &&
        data.addModify &&
        data.addModify.method === "Replace Values"
      ) {
        data = data.addModify.data;
        setFromAnotherColumn(data.select_column || "");
        setSubMethod(data.sub_method || "Text Input");
        let val = data.sub_method || "Text Input";
        if (val === "Text Input")
          setdata({
            old_value: data.old_value || "",
            new_value: data.new_value || "",
          });
        if (val === "Numpy Operations")
          setdata({
            select_an_operation: data.select_an_operation || "np.log10",
          });
        if (val === "Fill Null") {
          setdata({
            fill_null_values: data.fill_null_values || "Custom Value",
            enter_custom_value: data.enter_custom_value || "",
          });
          setFillNullMethod(data.fill_null_values || "Custom Value");
        }
        if (val === "String Operations") {
          setdata({
            select_an_operation: data.select_an_operation || "Uppercase",
            enter_character_to_remove: data.enter_character_to_remove || "",
          });
          setStringOperationMethod(data.select_an_operation);
        }
      }
    }
  }, [nodeDetails]);

  useEffect(() => {
    if (from_another_column)
      setdata({ ...data, select_column: from_another_column });
  }, [from_another_column]);

  useEffect(() => {
    dispatch(
      setData({
        ...data,
        sub_method: subMethod,
      })
    );
  }, [data, dispatch, subMethod]);

  const handleSubMethod = (val) => {
    setSubMethod(val);
    if (val === "Text Input") setdata({ old_value: "", new_value: "" });
    if (val === "Numpy Operations")
      setdata({ select_an_operation: "np.log10" });
    if (val === "Fill Null")
      setdata({ fill_null_values: "Custom Value", enter_custom_value: "" });
    if (val === "String Operations")
      setdata({ select_an_operation: "Uppercase" });
  };

  return (
    <div>
      <div className="flex flex-col gap-1">
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Sub Method</label>
        <FormControl size="small" className="w-full md:max-w-[320px]">
          <Select
          value={subMethod}
          onChange={(e) => handleSubMethod(e.target.value)}
        >
          <MenuItem value="Text Input">Text Input</MenuItem>
          <MenuItem value="Numpy Operations">Numpy Operations</MenuItem>
          <MenuItem value="Fill Null">Fill Null</MenuItem>
          <MenuItem value="String Operations">String Operations</MenuItem>
          </Select>
        </FormControl>
      </div>
      <div className="my-4">
        {subMethod === "Text Input" && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
              <TextField
                fullWidth
                label="Old Value"
                value={data.old_value || ""}
                onChange={(e) => setdata({ ...data, old_value: e.target.value })}
                size="small"
              />
            </div>
            <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
              <TextField
                label="New Value"
                fullWidth
                value={data.new_value || ""}
                onChange={(e) => setdata({ ...data, new_value: e.target.value })}
                size="small"
              />
            </div>
          </div>
        )}
        {subMethod === "Numpy Operations" && (
          <div className="flex flex-col gap-1">
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Select an operation</label>
            <FormControl size="small" className="w-full md:max-w-[320px]">
              <Select
              value={data.select_an_operation || "np.log10"}
              onChange={(e) =>
                setdata({ ...data, select_an_operation: e.target.value })
              }
            >
              <MenuItem value="np.log10">np.log10</MenuItem>
              <MenuItem value="np.sin">np.sin</MenuItem>
              <MenuItem value="np.cos">np.cos</MenuItem>
              <MenuItem value="np.tan">np.tan</MenuItem>
              <MenuItem value="np.exp">np.exp</MenuItem>
              </Select>
            </FormControl>
          </div>
        )}
        {subMethod === "Fill Null" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Select method to fill null values</label>
              <FormControl size="small" className="w-full md:max-w-[320px]">
                <Select
                value={fillNullMethod}
                onChange={(e) => {
                  setFillNullMethod(e.target.value);
                  setdata({ ...data, fill_null_values: e.target.value });
                }}
              >
                <MenuItem value="Custom Value">Custom Value</MenuItem>
                <MenuItem value="Mean">Mean</MenuItem>
                <MenuItem value="Median">Median</MenuItem>
                <MenuItem value="Mode">Mode</MenuItem>
                <MenuItem value="From Another Column">From Another Column</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div className="mt-4">
              {fillNullMethod === "Custom Value" && (
                <div className="w-full max-w-md">
                  <TextField
                    fullWidth
                    label="Enter Custom Value"
                    value={data.enter_custom_value || ""}
                    onChange={(e) =>
                      setdata({ ...data, enter_custom_value: e.target.value })
                    }
                    size="small"
                  />
                </div>
              )}
              {fillNullMethod === "From Another Column" && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1.5">Select column</p>
                  <Autocomplete
                    size="small"
                    options={columnNames}
                    value={from_another_column || null}
                    onChange={(_, val) => setFromAnotherColumn(val || "")}
                    renderInput={(params) => <TextField {...params} placeholder="Select column" />}
                  />
                </div>
              )}
            </div>
          </>
        )}
        {subMethod === "String Operations" && (
          <>
            <div className="flex flex-col gap-1 mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Select an operation</label>
              <FormControl size="small" className="w-full md:max-w-[320px]">
                <Select
                value={stringOperationMethod}
                onChange={(e) => {
                  setStringOperationMethod(e.target.value);
                  setdata({ ...data, select_an_operation: e.target.value });
                }}
              >
                <MenuItem value="Uppercase">Uppercase</MenuItem>
                <MenuItem value="Lowercase">Lowercase</MenuItem>
                <MenuItem value="Title case">Title case</MenuItem>
                <MenuItem value="Strip leading/trailing whitespace">
                  Strip leading/trailing whitespace
                </MenuItem>
                <MenuItem value="Remove leading whitespace">
                  Remove leading whitespace
                </MenuItem>
                <MenuItem value="Remove trailing whitespace">
                  Remove trailing whitespace
                </MenuItem>
                <MenuItem value="Remove Characters">Remove Characters</MenuItem>
                </Select>
              </FormControl>
            </div>
            {stringOperationMethod === "Remove Characters" && (
              <div className="w-full max-w-md">
                <TextField
                  fullWidth
                  label="Enter character to remove"
                  value={data.enter_character_to_remove || ""}
                  onChange={(e) =>
                    setdata({
                      ...data,
                      enter_character_to_remove: e.target.value,
                    })
                  }
                  size="small"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Modify_ReplaceValue;
