import { Dialog } from "@mui/material";
import React from "react";
import MultipleDropDown from "./FunctionBased/Components/MultipleDropDown/MultipleDropDown";
import { fetchDataFromIndexedDB, updateDataInIndexedDB } from "./util/indexDB";

const FilterableList = () => {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  return (
    <div>
      <button onClick={handleClickOpen}>click</button>
      <Dialog open={open} onClose={handleClose} >
        
        <div className="w-[400px] h-[700px]">
          <p>Select Column</p>
          <MultipleDropDown
            columnNames={["a", "v", "s", "s"]}
            setSelectedColumns={(e) => console.log(e)}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default FilterableList;
