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
        fullWidth
        size="small"
        value={value}
        disabled={disabled}
        onChange={(e, newValue) => {
          setValue(newValue);
          onValueChange(newValue || "");
        }}
        options={columnNames || []}
        isOptionEqualToValue={(option, value) => option === value}
        sx={{
          '& .MuiAutocomplete-inputRoot': {
            fontSize: '0.95rem',
            fontFamily: 'Inter, sans-serif',
          },
          '& .MuiAutocomplete-clearIndicator, & .MuiAutocomplete-popupIndicator': {
            color: '#6b7280',
          },
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)',
            },
          },
          listbox: {
            sx: {
              py: 0.5,
              '& .MuiAutocomplete-option': {
                minHeight: 36,
                px: 1.5,
                py: 0.75,
                fontSize: '0.95rem',
                fontWeight: 500,
                color: '#111827',
              },
              '& .MuiAutocomplete-option.Mui-focused': {
                backgroundColor: '#f0fdfa',
              },
              '& .MuiAutocomplete-option[aria-selected="true"]': {
                backgroundColor: '#e6fffb',
              },
              '& .MuiAutocomplete-option[aria-selected="true"].Mui-focused': {
                backgroundColor: '#ccfbf1',
              },
            },
          },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            sx={{
              '& .MuiOutlinedInput-root': {
                padding: '0 8px',
                borderRadius: '12px',
                minHeight: '35px',
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
                fontSize: '0.95rem',
                fontWeight: 500,
              },
            }}
          />
        )}
      />
    </div>
  );
}

export default SingleDropDown;
