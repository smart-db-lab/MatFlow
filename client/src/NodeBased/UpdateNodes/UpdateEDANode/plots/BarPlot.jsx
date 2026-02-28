import { Checkbox, Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SingleDropDown from "../../../../FunctionBased/Components/SingleDropDown/SingleDropDown";

function BarPlot({ csvData, setPlotOption }) {
  // console.log(csvData)
  const stringColumn = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "string"
  );
  const numberColumn = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "number"
  );
  const [activeStringColumn, setActiveStringColumn] = useState("");
  const [activeNumberColumn, setActiveNumberColumn] = useState("");
  const [activeHueColumn, setActiveHueColumn] = useState("");
  const [orientation, setOrientation] = useState("Vertical");
  const [showTitle, setShowTitle] = useState(false);
  const [title, setTitle] = useState();
  const [annotate, setAnnotate] = useState(false);
  const plotOption = useSelector((state) => state.EDA.plotOption);

  useEffect(() => {
    if (plotOption && Object.keys(plotOption).length > 0) {
      setActiveHueColumn(plotOption.hue);
      setActiveNumberColumn(plotOption.num);
      setActiveStringColumn(plotOption.cat);
      setOrientation(plotOption.orient);
      setTitle(plotOption.title);
      setAnnotate(plotOption.annote);
    } else {
      setActiveHueColumn("");
      setActiveNumberColumn("");
      setActiveStringColumn("");
      setOrientation("Vertical");
      setTitle("");
      setAnnotate(false);
    }
  }, [plotOption]);

  useEffect(() => {
    setPlotOption({
      cat: activeStringColumn || "-",
      num: activeNumberColumn || "-",
      hue: activeHueColumn || "-",
      orient: orientation,
      annote: annotate,
      title: title || "",
    });
  }, [
    activeNumberColumn,
    activeHueColumn,
    activeStringColumn,
    orientation,
    title,
    annotate,
  ]);

  return (
    <div className="grid gap-4 mt-4">
      <div className="w-full">
        <p className=" tracking-wide">Categorical Variable</p>
        <SingleDropDown
          columnNames={stringColumn}
          initValue={activeStringColumn}
          onValueChange={setActiveStringColumn}
        />
      </div>
      <div className="w-full">
        <p className=" tracking-wide">Numerical Variable</p>
        <SingleDropDown
          columnNames={numberColumn}
          initValue={activeNumberColumn}
          onValueChange={setActiveNumberColumn}
        />
      </div>
      <div className="w-full">
        <p className=" tracking-wide">Hue</p>
        <SingleDropDown
          columnNames={stringColumn}
          initValue={activeHueColumn}
          onValueChange={setActiveHueColumn}
        />
      </div>
      <div className="w-full flex flex-col gap-1">
        <p>Orientation</p>
        <SingleDropDown
          columnNames={["Vertical", "Horizontal"]}
          onValueChange={setOrientation}
          initValue={orientation}
        />
      </div>
      <div className="flex items-center gap-4 mt-4 tracking-wider">
        <Checkbox color="primary" onChange={(e) => setShowTitle(e.valueOf())}>
          Title
        </Checkbox>
        <Checkbox
          color="primary"
          isSelected={annotate}
          onChange={(e) => setAnnotate(e.valueOf())}
        >
          Annotate
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

export default BarPlot;
