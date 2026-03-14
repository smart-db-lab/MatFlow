import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setData } from "../../../../../Slices/FeatureEngineeringSlice";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

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
      <div className="flex items-center gap-4 flex-nowrap overflow-x-auto">
        <div className="flex-shrink-0">
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-900">
              <input
                type="radio"
                name="new-column-method"
                value="Input String"
                checked={select_methods === "Input String"}
                onChange={(e) => setMethod(e.target.value)}
                className="h-4 w-4 text-[#0D9488] focus:ring-[#0D9488]"
              />
              Input String
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-900">
              <input
                type="radio"
                name="new-column-method"
                value="Copy Another Field"
                checked={select_methods === "Copy Another Field"}
                onChange={(e) => setMethod(e.target.value)}
                className="h-4 w-4 text-[#0D9488] focus:ring-[#0D9488]"
              />
              Copy Another Field
            </label>
          </div>
        </div>
        <div className="flex-shrink-0">
          {select_methods === "Input String" ? (
            <div className="w-[280px]">
              <input
                type="text"
                value={input_string}
                onChange={(e) => setInputString(e.target.value)}
                className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-all"
                placeholder="Input String"
              />
            </div>
          ) : (
            <div className="w-[260px]">
              <FormControl fullWidth size="small">
                <Select
                  value={select_field}
                  onChange={(e) => setSelectField(e.target.value)}
                  MenuProps={{
                    PaperProps: {
                      sx: { maxHeight: 260 },
                    },
                    anchorOrigin: { vertical: "bottom", horizontal: "left" },
                    transformOrigin: { vertical: "top", horizontal: "left" },
                  }}
                  sx={{
                    "& .MuiSelect-select": {
                      py: "9px",
                      fontSize: "0.875rem",
                    },
                  }}
                >
                  {columnNames.map((column) => (
                    <MenuItem key={column} value={column}>
                      {column}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Add_NewColumn;
