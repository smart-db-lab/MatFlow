import { Slider, Stack } from "@mui/material";
import { Checkbox, Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import SingleDropDown from "../../../../FunctionBased/Components/SingleDropDown/SingleDropDown";

const AGGREGATE = ["probability", "count", "frequency", "percent", "density"];

function Histogram({ csvData, setPlotOption }) {
  const stringColumn = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "string"
  );
  const numberColumn = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "number"
  );
  const [activeNumberColumn, setActiveNumberColumn] = useState("");
  const [activeHueColumn, setActiveHueColumn] = useState("");
  const [orientation, setOrientation] = useState("Vertical");
  const [showTitle, setShowTitle] = useState(false);
  const [title, setTitle] = useState();
  const [aggregate, setAggregate] = useState("count");
  const [KDE, setKDE] = useState(false);
  const [legend, setLegend] = useState(false);
  const [showAutoBin, setShowAutoBin] = useState(true);
  const [autoBinValue, setAutoBinValue] = useState(10);
  const plotOption = useSelector((state) => state.EDA.plotOption);

  useEffect(() => {
    if (plotOption && Object.keys(plotOption).length > 0) {
      setActiveHueColumn(plotOption.hue);
      setActiveNumberColumn(plotOption.var);
      setOrientation(plotOption.orient);
      setTitle(plotOption.title);
      setAggregate(plotOption.agg);
      setAutoBinValue(plotOption.autoBin);
      setKDE(plotOption.kde);
      setLegend(plotOption.legend);
      setShowAutoBin(!(plotOption.autoBin > 0));
    } else {
      setActiveHueColumn("");
      setActiveNumberColumn("");
      setOrientation("Vertical");
      setTitle("");
      setAggregate(AGGREGATE[0]);
      setAutoBinValue(10);
      setKDE(false);
      setLegend(false);
      setShowAutoBin(true);
    }
  }, [plotOption]);

  useEffect(() => {
    setPlotOption({
      var: activeNumberColumn || "-",
      hue: activeHueColumn || "-",
      orient: orientation,
      title: title || "",
      agg: aggregate,
      autoBin: !showAutoBin ? autoBinValue : 0,
      kde: KDE,
      legend: legend,
    });
  }, [
    activeNumberColumn,
    activeHueColumn,
    orientation,
    title,
    autoBinValue,
    showAutoBin,
    KDE,
    legend,
    aggregate,
  ]);

  return (
    <div className="grid gap-4 mt-4">
      <div className="w-full">
        <p className=" tracking-wide">Variable</p>
        <SingleDropDown
          columnNames={numberColumn}
          onValueChange={setActiveNumberColumn}
          initValue={activeNumberColumn}
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
        <p className=" tracking-wide">Aggregate Statistics</p>
        <SingleDropDown
          onValueChange={setAggregate}
          columnNames={AGGREGATE}
          initValue={aggregate}
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
          isSelected={showAutoBin}
          onChange={(e) => setShowAutoBin(e.valueOf())}
        >
          Auto Bin
        </Checkbox>
        <Checkbox
          color="primary"
          isSelected={KDE}
          onChange={(e) => setKDE(e.valueOf())}
        >
          KDE
        </Checkbox>
        <Checkbox
          color="primary"
          isSelected={legend}
          onChange={(e) => setLegend(e.valueOf())}
        >
          Legend
        </Checkbox>
      </div>
      {!showAutoBin && (
        <div className="mt-12">
          <Stack spacing={1} direction="row" sx={{ mb: 1 }} alignItems="center">
            <span>1</span>
            <PrettoSlider
              aria-label="Auto Bin Slider"
              min={1}
              max={35}
              step={1}
              defaultValue={autoBinValue}
              value={autoBinValue}
              onChange={(e) => setAutoBinValue(e.target.value)}
              valueLabelDisplay="on"
              color="primary"
            />
            <span>35</span>
          </Stack>
        </div>
      )}
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

const PrettoSlider = styled(Slider)({
  color: "#0072F5",
  height: 8,
  "& .MuiSlider-track": {
    border: "none",
  },
  "& .MuiSlider-thumb": {
    height: 24,
    width: 24,
    backgroundColor: "#fff",
    border: "2px solid currentColor",
    "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
      boxShadow: "inherit",
    },
    "&:before": {
      display: "none",
    },
  },
  "& .MuiSlider-valueLabel": {
    lineHeight: 1.2,
    fontSize: 12,
    background: "unset",
    padding: 0,
    width: 32,
    height: 32,
    borderRadius: "50% 50% 50% 0",
    backgroundColor: "#0072F5",
    transformOrigin: "bottom left",
    transform: "translate(50%, -100%) rotate(-45deg) scale(0)",
    "&:before": { display: "none" },
    "&.MuiSlider-valueLabelOpen": {
      transform: "translate(50%, -100%) rotate(-45deg) scale(1)",
    },
    "& > *": {
      transform: "rotate(45deg)",
    },
  },
});

export default Histogram;
