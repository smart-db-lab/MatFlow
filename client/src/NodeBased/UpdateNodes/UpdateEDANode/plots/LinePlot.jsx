import { Checkbox, Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SingleDropDown from "../../../../FunctionBased/Components/SingleDropDown/SingleDropDown";

function LinePlot({ csvData, setPlotOption }) {
  const stringColumn = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "string"
  );
  const numberColumn = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "number"
  );
  const [x_var, setX_var] = useState("");
  const [y_var, setY_var] = useState("");
  const [style, setStyle] = useState("");
  const [activeHueColumn, setActiveHueColumn] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [title, setTitle] = useState();
  const [legend, setLegend] = useState(true);
  const plotOption = useSelector((state) => state.EDA.plotOption);

  useEffect(() => {
    if (plotOption && Object.keys(plotOption).length > 0) {
      setActiveHueColumn(plotOption.hue);
      setTitle(plotOption.title);
      setX_var(plotOption.x_var);
      setY_var(plotOption.y_var);
      setStyle(plotOption.style);
      setLegend(plotOption.legend);
    } else {
      setActiveHueColumn("");
      setTitle("");
      setX_var("");
      setY_var("");
      setStyle("");
      setLegend(true);
    }
  }, [plotOption]);

  useEffect(() => {
    setPlotOption({
      x_var,
      y_var,
      hue: activeHueColumn || "-",
      style: style || "-",
      legend,
      title: title || "",
    });
  }, [x_var, y_var, activeHueColumn, title, style, legend]);

  return (
    <div className="grid gap-4 mt-4">
      <div className="w-full">
        <p className=" tracking-wide">X Variable</p>
        <SingleDropDown
          columnNames={numberColumn}
          onValueChange={setX_var}
          initValue={x_var}
        />
      </div>
      <div className="w-full">
        <p className=" tracking-wide">Y Variable</p>
        <SingleDropDown
          columnNames={numberColumn}
          onValueChange={setY_var}
          initValue={y_var}
        />
      </div>
      <div className="w-full">
        <p className=" tracking-wide">Hue</p>
        <SingleDropDown
          onValueChange={setActiveHueColumn}
          columnNames={stringColumn}
          initValue={activeHueColumn}
        />
      </div>
      <div className="w-full">
        <p className=" tracking-wide">Style</p>
        <SingleDropDown
          onValueChange={setStyle}
          columnNames={stringColumn}
          initValue={style}
        />
      </div>
      <div className="flex items-center gap-4 mt-4 tracking-wider">
        <Checkbox color="primary" onChange={(e) => setShowTitle(e.valueOf())}>
          Title
        </Checkbox>
        <Checkbox
          color="primary"
          isSelected={legend}
          onChange={(e) => setLegend(e.valueOf())}
        >
          Legend
        </Checkbox>
      </div>
      {showTitle && (
        <div className="mt-4">
          <Input
            clearable
            bordered
            size="lg"
            label="Input Title"
            placeholder="Enter your desired title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

export default LinePlot;
