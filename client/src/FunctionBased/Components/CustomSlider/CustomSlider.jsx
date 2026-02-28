import React, { useState } from "react";
import { Box, Typography, Slider } from "@mui/material";

const CustomSlider = ({ label, value, onChange, min, max, step }) => {
  const [sliderValue, setSliderValue] = useState(value);

  const handleSliderChange = (event, newValue) => {
    setSliderValue(newValue);
  };

  const handleSliderChangeCommitted = (event, newValue) => {
    const steppedValue = Math.round(newValue / step) * step;
    setSliderValue(steppedValue);
    onChange(event, steppedValue);
  };

  const getDecimalPlaces = (step) => {
    if (step >= 1) return 0;
    return Math.abs(Math.floor(Math.log10(step))) + 1;
  };

  const decimalPlaces = getDecimalPlaces(step);

  const formatValue = (value) => {
    return Number(value.toFixed(decimalPlaces));
  };

  return (
    <div>
      <p className="!my-4">{label}:</p>
      <Box display="flex" alignItems="center">
        <Typography
          variant="body1"
          color="textSecondary"
          sx={{ mr: 1, minWidth: "30px" }}
        >
          {formatValue(min)}
        </Typography>
        <Slider
          value={sliderValue}
          onChange={handleSliderChange}
          onChangeCommitted={handleSliderChangeCommitted}
          aria-labelledby={`${label.toLowerCase().replace(/\s+/g, "-")}-slider`}
          valueLabelDisplay="auto"
          valueLabelFormat={formatValue}
          step={0.00000001} // Very small step for smooth sliding
          min={min}
          max={max}
          sx={{ flex: 1, mx: 2, color: "#097045" }}
        />
        <Typography
          variant="body1"
          color="textSecondary"
          sx={{ ml: 1, minWidth: "30px" }}
        >
          {formatValue(max)}
        </Typography>
      </Box>
    </div>
  );
};

export default CustomSlider;
