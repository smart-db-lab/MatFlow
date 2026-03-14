import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setData } from "../../../../../Slices/FeatureEngineeringSlice";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

function Add_MathOperation({ csvData, nodeId, rflow = undefined, type='function', onSave }) {
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
    <div className="space-y-2">
      <div>
        <p className="text-base font-semibold text-gray-900">Math Expression</p>
      </div>
      <TextField
        fullWidth
        multiline
        minRows={6}
        value={value}
        onChange={handleInputChange}
        placeholder="Example: Weight / ( Height ** 2 )"
        size="small"
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
            "&.Mui-focused fieldset": { borderColor: "#0D9488" },
          },
        }}
      />
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div className="px-1 py-1 text-sm text-gray-700 leading-6 font-semibold">
          <p>
            Use format:{" "}
            <code className="font-mono text-xs font-bold text-red-600">
              {"<math-expression> <column-name>"}
            </code>
          </p>
          <p>Use spaces between tokens (including parentheses).</p>
          <p>
            Example:{" "}
            <code className="font-mono text-xs font-bold text-red-600">
              Weight / ( Height ** 2 )
            </code>
          </p>
        </div>
        <Button
          variant="contained"
          onClick={onSave}
          sx={{
            backgroundColor: "#0D9488",
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "10px",
            px: 2.5,
            py: 1,
            "&:hover": { backgroundColor: "#0F766E" },
          }}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}

export default Add_MathOperation;
