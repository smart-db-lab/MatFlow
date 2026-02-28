import { Autocomplete, TextField } from "@mui/material";
import { useEffect, useState } from "react";

function SingleDropDown({
  columnNames,
  onValueChange,
  initValue,
  disabled = false,
}) {
  const [value, setValue] = useState(initValue || null);

  useEffect(() => {
    setValue(initValue || null);
  }, [initValue]);

  return (
    <div className="mt-1">
      <Autocomplete
        disablePortal
        size="small"
        value={value}
        disabled={disabled}
        onChange={(e, newValue) => {
          setValue(newValue);
          onValueChange(newValue || "");
        }}
        options={columnNames || []}
        isOptionEqualToValue={(option, value) => option === value}
        renderInput={(params) => (
          <TextField
            {...params}
            sx={{
              '& .MuiOutlinedInput-root': {
                padding: '12px 8px',
                borderRadius: '12px',
                minHeight: '40px',
                backgroundColor: '#ffffff',
                '& fieldset': {
                  borderColor: '#d1d5db',
                  borderWidth: '1px',
                },
                '&:hover fieldset': {
                  borderColor: '#9ca3af',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0D9488',
                  borderWidth: '1px',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#f3f4f6',
                },
              },
              '& .MuiInputBase-input': {
                padding: '0 !important',
              },
            }}
          />
        )}
      />
    </div>
  );
}

export default SingleDropDown;
