import { Input, Radio } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setData } from "../../../../../Slices/FeatureEngineeringSlice";
import SingleDropDown from "../../../../Components/SingleDropDown/SingleDropDown";

function Add_NewColumn({
  csvData,
  nodeId,
  type = "function",
  rflow = undefined,
}) {
  const [select_methods, setMethod] = useState("Input String");
  const columnNames = Object.keys(csvData[0]);
  const [input_string, setInputString] = useState("");
  const [select_field, setSelectField] = useState(columnNames[0]);
  const dispatch = useDispatch();
  let nodeDetails = {};
  if (rflow) {
    nodeDetails = rflow.getNode(nodeId);
  }

  useEffect(() => {
    if (nodeDetails && type === "node") {
      let data = nodeDetails.data;
      if (data && data.addModify && data.addModify.method === "New Column") {
        data = data.addModify.data;
        setInputString(data.input_string || "");
        setSelectField(data.select_field || columnNames[0]);
        setMethod(data.select_methods || "Input String");
      }
    }
  }, [nodeDetails]);

  useEffect(() => {
    dispatch(
      setData({
        select_methods,
        input_string,
        select_field,
      })
    );
  }, [select_field, select_methods, input_string, dispatch]);

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
        <div className="flex-shrink-0">
          <Radio.Group
            orientation="horizontal"
            label="Select Methods"
            value={select_methods}
            onChange={(e) => setMethod(e)}
          >
            <Radio value="Input String" color="success">
              Input String
            </Radio>
            <Radio value="Copy Another Field" color="success">
              Copy Another Field
            </Radio>
          </Radio.Group>
        </div>
        <div className="flex-1 w-full lg:w-auto">
          {select_methods === "Input String" ? (
            <div className="w-full max-w-md">
              <Input
                label="Input String"
                fullWidth
                clearable
                value={input_string}
                onChange={(e) => setInputString(e.target.value)}
                size="sm"
              />
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1.5">Select Field</p>
              <SingleDropDown
                columnNames={columnNames}
                onValueChange={setSelectField}
                initValue={select_field}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Add_NewColumn;
