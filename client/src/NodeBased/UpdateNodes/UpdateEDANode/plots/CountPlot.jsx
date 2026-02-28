import { Checkbox, Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SingleDropDown from "../../../../FunctionBased/Components/SingleDropDown/SingleDropDown";

function CountPlot({ csvData, setPlotOption }) {
  const stringColumn = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "string"
  );
  const [activeStringColumn, setActiveStringColumn] = useState("");
  const [activeHueColumn, setActiveHueColumn] = useState("");
  const [orientation, setOrientation] = useState("Vertical");
  const [showTitle, setShowTitle] = useState(false);
  const [title, setTitle] = useState();
  const [annotate, setAnnotate] = useState(false);
  const plotOption = useSelector((state) => state.EDA.plotOption);

  useEffect(() => {
    if (plotOption && Object.keys(plotOption).length > 0) {
      setActiveHueColumn(plotOption.hue);
      setActiveStringColumn(plotOption.cat);
      setOrientation(plotOption.orient);
      setTitle(plotOption.title);
      setAnnotate(plotOption.annote);
    } else {
      setActiveHueColumn("");
      setActiveStringColumn("");
      setOrientation("Vertical");
      setTitle("");
      setAnnotate(false);
    }
  }, [plotOption]);

  useEffect(() => {
    setPlotOption({
      cat: activeStringColumn || "-",
      hue: activeHueColumn || "-",
      orient: orientation,
      annote: annotate,
      title: title || "",
    });
  }, [activeHueColumn, activeStringColumn, orientation, title, annotate]);

  return (
    <div className="grid gap-4 mt-4">
      <div className="w-full">
        <p className=" tracking-wide">Categorical Variable</p>
        <SingleDropDown
          columnNames={stringColumn}
          onValueChange={setActiveStringColumn}
          initValue={activeStringColumn}
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
      <div className="w-full flex flex-col gap-1">
        <p>Orientation</p>
        <SingleDropDown
          columnNames={["Vertical", "Horizontal"]}
          initValue={orientation}
          onValueChange={setOrientation}
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

export default CountPlot;
