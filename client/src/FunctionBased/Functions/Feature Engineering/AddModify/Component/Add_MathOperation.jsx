import { Textarea } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setData } from "../../../../../Slices/FeatureEngineeringSlice";

function Add_MathOperation({ csvData, nodeId, rflow = undefined, type='function' }) {
  const dispatch = useDispatch();
  const [value, setValue] = useState("");
  let nodeDetails = {};
  if (rflow) {
    nodeDetails = rflow.getNode(nodeId);
  }

  useEffect(() => {
    if (nodeDetails  && type === 'node') {
      let data = nodeDetails.data;
      if (
        data &&
        data.addModify &&
        data.addModify.method === "Math Operation"
      ) {
        data = data.addModify.data;
        setValue(data.new_value_operation || "");
      }
    }
  }, [nodeDetails]);

  const handleInputChange = (e) => {
    setValue(e.target.value);
    let tempData = {
      new_value_operation: e.target.value,
    };
    dispatch(setData(tempData));
  };
  return (
    <div>
      <p>New Value Operation</p>
      <Textarea
        fullWidth
        minRows={6}
        value={value}
        onChange={handleInputChange}
      />
      <p className="flex flex-col text-sm text-gray-500 tracking-wide mt-1">
        <span>{"<math expression> <column name>. example: 10 ** Height"}</span>
        <span>Separate all expression with space (including parenthesis).</span>
        <span>Example: Weight / ( Height ** 2 )</span>
      </p>
    </div>
  );
}

export default Add_MathOperation;
