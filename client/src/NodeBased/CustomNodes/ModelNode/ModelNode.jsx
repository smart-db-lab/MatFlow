import { Download } from "@mui/icons-material";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Handle, Position, useReactFlow } from "reactflow";
import { setActiveID, setNodeType, setRightSidebarData } from "../../../Slices/SideBarSlice";

function ModelNode({ id, data }) {
  // console.log(data)
  const rflow = useReactFlow();
  const type = rflow.getNode(id).type;
  const dispatch = useDispatch();
  const activeID = useSelector((state) => state.sideBar.active_id);

  useEffect(() => {
    if (activeID === id) {
      dispatch(setRightSidebarData(data));
    }
  }, [activeID, id, data]);

  return (
    <>
      <div
        className="flex relative bg-white border-2 border-black shadow-[6px_6px_0_1px_rgba(0,0,0,0.7)]"
        onClick={() => {
          dispatch(setRightSidebarData(data));
          dispatch(setNodeType(type));
          dispatch(setActiveID(id));
        }}
      >
        <Handle type="source" position={Position.Right}></Handle>
        <Handle type="target" position={Position.Left}></Handle>
        {activeID === id && (
          <div className="absolute w-2.5 h-2.5 rounded-full top-0 left-0 translate-x-1/2 translate-y-1/2 bg-green-700"></div>
        )}
        <div className="grid place-items-center gap-1 p-2 py-3 min-w-[80px]">
          {/* <RiFileEditLine size={"25"} /> */}
          {data && data.model ? (
            <span>{data.model.name}</span>
          ) : (
            <span>Model</span>
          )}
          {data && data.model && (
            <div className="mx-auto">
              <button
                className="border-2 border-gray-600 rounded shadow px-1 hover:bg-black hover:border-black hover:text-white"
                title="Download Model"
              >
                <Download fontSize="small" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ModelNode;
