import { Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setData } from "../../../../../Slices/FeatureEngineeringSlice";
import SingleDropDown from "../../../../Components/SingleDropDown/SingleDropDown";

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
        <label htmlFor="">Sub Methods</label>
        <select
          name=""
          id=""
          value={subMethod}
          className="px-2 py-3 rounded-lg"
          onChange={(e) => handleSubMethod(e.target.value)}
        >
          <option value="Text Input">Text Input</option>
          <option value="Numpy Operations">Numpy Operations</option>
          <option value="Fill Null">Fill Null</option>
          <option value="String Operations">String Operations</option>
        </select>
      </div>
      <div className="my-4">
        {subMethod === "Text Input" && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
              <Input
                fullWidth
                label="Old Value"
                value={data.old_value || ""}
                onChange={(e) => setdata({ ...data, old_value: e.target.value })}
                size="sm"
              />
            </div>
            <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
              <Input
                label="New Value"
                fullWidth
                value={data.new_value || ""}
                onChange={(e) => setdata({ ...data, new_value: e.target.value })}
                size="sm"
              />
            </div>
          </div>
        )}
        {subMethod === "Numpy Operations" && (
          <div className="flex flex-col gap-1">
            <label htmlFor="">Select an operation</label>
            <select
              value={data.select_an_operation || "np.log10"}
              className="px-2 py-3 rounded-lg"
              onChange={(e) =>
                setdata({ ...data, select_an_operation: e.target.value })
              }
            >
              <option value="np.log10">np.log10</option>
              <option value="np.sin">np.sin</option>
              <option value="np.cos">np.cos</option>
              <option value="np.tan">np.tan</option>
              <option value="np.exp">np.exp</option>
            </select>
          </div>
        )}
        {subMethod === "Fill Null" && (
          <>
            <div className="flex flex-col gap-1">
              <label htmlFor="">Select method to fill null values</label>
              <select
                className="px-2 py-3 rounded-lg"
                value={fillNullMethod}
                onChange={(e) => {
                  setFillNullMethod(e.target.value);
                  setdata({ ...data, fill_null_values: e.target.value });
                }}
              >
                <option value="Custom Value">Custom Value</option>
                <option value="Mean">Mean</option>
                <option value="Median">Median</option>
                <option value="Mode">Mode</option>
                <option value="From Another Column">From Another Column</option>
              </select>
            </div>
            <div className="mt-4">
              {fillNullMethod === "Custom Value" && (
                <div className="w-full max-w-md">
                  <Input
                    fullWidth
                    label="Enter Custom Value"
                    value={data.enter_custom_value || ""}
                    onChange={(e) =>
                      setdata({ ...data, enter_custom_value: e.target.value })
                    }
                    size="sm"
                  />
                </div>
              )}
              {fillNullMethod === "From Another Column" && (
                <div>
                  <p>Select column</p>
                  <SingleDropDown
                    columnNames={columnNames}
                    onValueChange={setFromAnotherColumn}
                    initValue={from_another_column}
                  />
                </div>
              )}
            </div>
          </>
        )}
        {subMethod === "String Operations" && (
          <>
            <div className="flex flex-col gap-1 mb-4">
              <label htmlFor="">Select an operation</label>
              <select
                name=""
                id=""
                className="px-2 py-3 rounded-lg"
                value={stringOperationMethod}
                onChange={(e) => {
                  setStringOperationMethod(e.target.value);
                  setdata({ ...data, select_an_operation: e.target.value });
                }}
              >
                <option value="Uppercase">Uppercase</option>
                <option value="Lowercase">Lowercase</option>
                <option value="Title case">Title case</option>
                <option value="Strip leading/trailing whitespace">
                  Strip leading/trailing whitespace
                </option>
                <option value="Remove leading whitespace">
                  Remove leading whitespace
                </option>
                <option value="Remove trailing whitespace">
                  Remove trailing whitespace
                </option>
                <option value="Remove Characters">Remove Characters</option>
              </select>
            </div>
            {stringOperationMethod === "Remove Characters" && (
              <div className="w-full max-w-md">
                <Input
                  fullWidth
                  label="Enter character to remove"
                  value={data.enter_character_to_remove || ""}
                  onChange={(e) =>
                    setdata({
                      ...data,
                      enter_character_to_remove: e.target.value,
                    })
                  }
                  size="sm"
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
