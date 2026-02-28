import React, { useCallback } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { useDispatch, useSelector } from "react-redux";
import { setShowLeftSideBar } from "../../../Slices/SideBarSlice";

function EditorTopbar({ reactFlowInstance }) {
  const dispatch = useDispatch();
  const showLeftSidebar = useSelector((state) => state.sideBar.showLeftSideBar);
  const onSave = useCallback(() => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      localStorage.setItem("flow", JSON.stringify(flow));
    }
  }, [reactFlowInstance]);

  return (
    <div className="absolute top-0 w-screen right-0 flex items-center justify-between p-4 bg-white border-l-2 shadow border-b z-[100]">
      <div className="flex items-center gap-2">
        {!showLeftSidebar && (
          <button
            onClick={() => dispatch(setShowLeftSideBar(!showLeftSidebar))}
          >
            <GiHamburgerMenu />
          </button>
        )}
        <h1 className="text-lg font-medium tracking-wide">MatFlow</h1>
      </div>
      <button
        className="bg-white p-1 px-4 tracking-wider font-medium shadow-lg rounded border-2 border-black"
        onClick={onSave}
      >
        Save
      </button>
    </div>
  );
}

export default EditorTopbar;
