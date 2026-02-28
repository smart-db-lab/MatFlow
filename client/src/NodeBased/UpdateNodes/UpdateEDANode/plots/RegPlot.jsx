import { Checkbox, Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SingleDropDown from "../../../../FunctionBased/Components/SingleDropDown/SingleDropDown";

function RegPlot({ csvData, setPlotOption }) {
  const numberColumn = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "number"
  );
  const [x_var, setX_var] = useState("");
  const [y_var, setY_var] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [title, setTitle] = useState();
  const [scatter, setScatter] = useState(true);
  const plotOption = useSelector((state) => state.EDA.plotOption);

  useEffect(() => {
    if (plotOption && Object.keys(plotOption).length > 0) {
      setTitle(plotOption.title);
      setX_var(plotOption.x_var);
      setY_var(plotOption.y_var);
      setScatter(plotOption.scatter);
    } else {
      setTitle("");
      setX_var("");
      setY_var("");
      setScatter(true);
    }
  }, [plotOption]);

  useEffect(() => {
    setPlotOption({
      x_var,
      y_var,
      title: title || "",
      scatter,
    });
  }, [x_var, y_var, scatter, title]);

  return (
    <div className="grid gap-4 mt-4">
      <div className="w-full">
        <p className=" tracking-wide">X Variable</p>
        <SingleDropDown
          columnNames={numberColumn}
          initValue={x_var}
          onValueChange={setX_var}
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

      <div className="flex items-center gap-4 mt-4 tracking-wider">
        <Checkbox color="primary" onChange={(e) => setShowTitle(e.valueOf())}>
          Title
        </Checkbox>
        <Checkbox
          color="primary"
          isSelected={scatter}
          onChange={(e) => setScatter(e.valueOf())}
        >
          Scatter
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

export default RegPlot;
