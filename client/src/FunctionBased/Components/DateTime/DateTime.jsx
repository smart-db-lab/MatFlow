import { Slider } from "@mui/material";
import React, { useState } from "react";

function DateTime() {
  const minDateRange = new Date("2021-01-01"); // Replace with your minimum date range
  const maxDateRange = new Date(); // Replace with your maximum date range

  const [selectedRange, setSelectedRange] = useState([maxDateRange]);

  const handleChange = (event, newValue) => {
    setSelectedRange(newValue);
  };
  return (
    <div className="">
      <label>Select a time range:</label>
      <Slider
        min={minDateRange.getTime()}
        max={maxDateRange.getTime()}
        value={selectedRange.map((date) =>
          console.log(new Date(date).toLocaleDateString())
        )}
        onChange={handleChange}
        valueLabelDisplay="auto"
        aria-labelledby="range-slider"
      />
    </div>
  );
}

export default DateTime;
