import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { Modal } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { BsTable } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { Handle, Position, useReactFlow } from "reactflow";
import AgGridAutoDataComponent from "../../../FunctionBased/Components/AgGridComponent/AgGridAutoDataComponent";
import AgGridComponent from "../../../FunctionBased/Components/AgGridComponent/AgGridComponent";
import { setActiveID, setNodeType, setRightSidebarData } from "../../../Slices/SideBarSlice";

function TableNode({ id, data }) {
  // console.log(data)
  const [colDefs, setColDefs] = useState(null);
  const [visible, setVisible] = useState(false);
  const handler = () => setVisible(true);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const rflow = useReactFlow();
  const type = rflow.getNode(id).type;
  const dispatch = useDispatch();
  const activeID = useSelector((state) => state.sideBar.active_id);

  useEffect(() => {
    if (activeID === id) {
      dispatch(setRightSidebarData(data));
    }
  }, [activeID, id, data]);

  useEffect(() => {
    if (data && data.table) {
      let tempColDefs =
        data.table.length > 0
          ? Object.keys(data.table[0]).map((key) => ({
              headerName: key,
              field: key,
              valueGetter: (params) => {
                return params.data[key];
              },
            }))
          : [];

      if (tempColDefs && tempColDefs.length - 1 >= 0)
        tempColDefs = tempColDefs
          .slice(tempColDefs.length - 1)
          .concat(tempColDefs.slice(0, tempColDefs.length - 1));

      setColDefs(tempColDefs);
    }
  }, [data]);

  const closeHandler = () => {
    setVisible(false);
  };

  return (
    <>
      <div
        className="relative flex bg-white border-2 border-black shadow-[6px_6px_0_1px_rgba(0,0,0,0.7)]"
        onDoubleClick={handler}
        onClick={() => {
          dispatch(setRightSidebarData(data));
          dispatch(setNodeType(type));
          dispatch(setActiveID(id));
        }}
      >
        {/* <Handle type="source" position={Position.Right}></Handle> */}
        <Handle type="target" position={Position.Left}></Handle>
        {activeID === id && (
          <div className="absolute w-2.5 h-2.5 rounded-full top-0 left-0 translate-x-1/2 translate-y-1/2 bg-green-700"></div>
        )}
        <div className="grid place-items-center p-2 py-3 min-w-[80px]">
          <BsTable size={20} />
          <span>Table</span>
        </div>
      </div>
      <Modal
        closeButton
        width="700px"
        fullScreen={isFullScreen}
        aria-labelledby="modal-title"
        open={visible}
        scroll
        onClose={closeHandler}
      >
        <Modal.Header>
          <h1 className="text-3xl tracking-wide font-semibold">Data Table</h1>
          <span
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="absolute left-0 top-0 translate-x-1/2 translate-y-1/2"
          >
            {isFullScreen ? (
              <FullscreenExitIcon color="action" />
            ) : (
              <FullscreenIcon color="action" />
            )}
          </span>
        </Modal.Header>
        <Modal.Body>
          {!data || !data.method ? (
            <>
              {!colDefs || colDefs.length === 0 || !data || !data.table ? (
                <h3 className="text-xl tracking-wide font-medium text-center">
                  No table data found.
                </h3>
              ) : (
                <div
                  className="ag-theme-alpine py-2"
                  style={{ height: "600px", width: "100%" }}
                >
                  <AgGridComponent rowData={data.table} columnDefs={colDefs} />
                </div>
              )}
            </>
          ) : (
            <div
              className={`grid ${
                data.tables && data.tables.length > 1
                  ? "grid-cols-2"
                  : "grid-cols-1"
              } gap-4`}
            >
              {data.tables &&
                data.tables.map((table, ind) => (
                  <div key={ind}>
                    <h1 className="text-xl mb-2 font-medium">
                      {table.heading}
                    </h1>
                    <AgGridAutoDataComponent
                      download={true}
                      rowData={table.table}
                      height="250px"
                      rowHeight={30}
                      headerHeight={40}
                      paginationPageSize={5}
                    />
                  </div>
                ))}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}

export default TableNode;
