import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import MultipleDropDown from "../../../../FunctionBased/Components/MultipleDropDown/MultipleDropDown";
import SingleDropDown from "../../../../FunctionBased/Components/SingleDropDown/SingleDropDown";

function CustomPlot({ csvData, setPlotOption }) {
  const stringColumn = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "string"
  );
  const numberColumn = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "number"
  );
  const [x_var, setX_var] = useState([]);
  const [y_var, setY_var] = useState("");
  const [activeHue, setActiveHue] = useState("");
  const plotOption = useSelector((state) => state.EDA.plotOption);

  useEffect(() => {
    if (plotOption && Object.keys(plotOption).length > 0) {
      setX_var(plotOption.x_var);
      setY_var(plotOption.y_var);
      setActiveHue(plotOption.hue);
    } else {
      setX_var([]);
      setY_var("");
      setActiveHue("");
    }
  }, [plotOption]);

  useEffect(() => {
    setPlotOption({
      x_var,
      y_var,
      hue: activeHue || "None",
    });
  }, [x_var, y_var, activeHue]);

  return (
    <div className="grid gap-4 mt-4">
      <div className="w-full">
        <p className=" tracking-wide">X Variable</p>
        <MultipleDropDown
          columnNames={numberColumn}
          setSelectedColumns={setX_var}
          defaultValue={x_var}
        />
      </div>
      <div className="w-full">
        <p className=" tracking-wide">Y Variable</p>
        <SingleDropDown
          columnNames={numberColumn}
          initValue={y_var}
          onValueChange={setY_var}
        />
      </div>
      <div className="w-full">
        <p className=" tracking-wide">Hue</p>
        <SingleDropDown
          columnNames={stringColumn}
          onValueChange={setActiveHue}
          initValue={activeHue}
        />
      </div>
    </div>
  );
}

export default CustomPlot;
