import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setData } from "../../../../../Slices/FeatureEngineeringSlice";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

function Modify_ProgressApply({
  csvData,
  nodeId,
  type = "function",
  rflow = undefined,
}) {
  const [func, setFunction] = useState("Compute All Features using RDKit");
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
        data.addModify.method === "Progress Apply"
      ) {
        data = data.addModify.data;
        setFunction(data.select_function || "Compute All Features using RDKit");
      }
    }
  }, [nodeDetails]);

  useEffect(() => {
    dispatch(
      setData({
        select_function: func,
      })
    );
  }, [func, dispatch]);

  return (
    <div className="mt-2">
      <div className="flex flex-col gap-1">
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Select Function</label>
        <FormControl size="small" className="w-full md:max-w-[420px]">
          <Select value={func} onChange={(e) => setFunction(e.target.value)}>
            <MenuItem value="Compute All Features using RDKit">
              Compute All Features using RDKit
            </MenuItem>
            <MenuItem value="Chem.inchi.MolTolInchiKey">
              Chem.inchi.MolTolInchiKey
            </MenuItem>
          </Select>
        </FormControl>
      </div>
    </div>
  );
}

export default Modify_ProgressApply;
