import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setData } from "../../../../../Slices/FeatureEngineeringSlice";

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
    <div className="mt-8">
      <div className="flex flex-col gap-1">
        <label htmlFor="">Select Function</label>
        <select
          className="px-2 py-3 rounded-lg"
          name=""
          id=""
          value={func}
          onChange={(e) => setFunction(e.target.value)}
        >
          <option value="Compute All Features using RDKit">
            Compute All Features using RDKit
          </option>
          <option value="Chem.inchi.MolTolInchiKey">
            Chem.inchi.MolTolInchiKey
          </option>
        </select>
      </div>
    </div>
  );
}

export default Modify_ProgressApply;
