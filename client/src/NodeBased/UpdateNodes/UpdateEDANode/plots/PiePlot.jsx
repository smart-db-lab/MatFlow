import { Checkbox, Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SingleDropDown from "../../../../FunctionBased/Components/SingleDropDown/SingleDropDown";

function PiePlot({ csvData, setPlotOption }) {
  const stringColumn = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "string"
  );
  const [activeStringColumn, setActiveStringColumn] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [title, setTitle] = useState("");
  const [label, setLabel] = useState(true);
  const [percentage, setPercentage] = useState(true);
  const [gap, setGap] = useState(0);
  const plotOption = useSelector((state) => state.EDA.plotOption);

  useEffect(() => {
    if (plotOption && Object.keys(plotOption).length > 0) {
      setActiveStringColumn(plotOption.cat);
      setTitleValue(plotOption.title);
      setLabel(plotOption.label);
      setPercentage(plotOption.percentage);
      setGap(plotOption.gap);
    } else {
      setActiveStringColumn("");
      setTitleValue("");
      setLabel("");
      setPercentage(true);
      setGap(0);
    }
  }, [plotOption]);

  useEffect(() => {
    setPlotOption({
      cat: activeStringColumn || "-",
      title,
      label,
      percentage,
      gap,
    });
    console.log(gap);
  }, [activeStringColumn, title, gap, label, percentage]);

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
      <div className="w-full flex flex-col gap-1">
        <label htmlFor="" className="tracking-wide">
          Explode Value
        </label>
        <Input
          type="number"
          bordered
          min={0}
          max={0.1}
          color="success"
          placeholder="Expected value (0 - 0.1)."
          step={"0.01"}
          value={gap}
          onChange={(e) => setGap(parseFloat(e.target.value))}
        />
      </div>

      <div className="flex items-center gap-4 mt-4 tracking-wider">
        <Checkbox color="primary" onChange={(e) => setShowTitle(e.valueOf())}>
          Title
        </Checkbox>
        <Checkbox
          color="primary"
          isSelected={label}
          onChange={() => setLabel(!label)}
        >
          Label
        </Checkbox>
        <Checkbox
          color="primary"
          isSelected={percentage}
          onChange={() => setPercentage(!percentage)}
        >
          Percentage
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
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            helperText="Press Enter to apply"
            onKeyDown={(e) => {
              if (e.key === "Enter") setTitle(titleValue);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default PiePlot;
