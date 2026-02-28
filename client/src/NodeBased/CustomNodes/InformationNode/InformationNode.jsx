import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Handle, Position, useReactFlow } from "reactflow";
import {
  setActiveID,
  setNodeType,
  setRightSidebarData,
} from "../../../Slices/SideBarSlice";

function InformationNode({ id, data }) {
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
    <div
      className="relative flex bg-white border-2 border-black shadow-[6px_6px_0_1px_rgba(0,0,0,0.7)]"
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
        <InfoOutlinedIcon />
        <span>Information</span>
      </div>
    </div>
  );
}

export default InformationNode;
