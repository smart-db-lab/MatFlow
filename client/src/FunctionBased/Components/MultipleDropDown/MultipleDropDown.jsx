import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { Autocomplete, Checkbox, TextField } from "@mui/material";
import { useEffect, useState } from "react";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const MultipleDropDown = ({
  columnNames,
  setSelectedColumns,
  curInd = 0,
  disabled = false,
  defaultValue,
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAllLabel, setSelectAllLabel] = useState("Select All");

  const handleSelectionChange = (newValue) => {
    if (newValue.includes(selectAllLabel)) {
      if (selectAllLabel === "Select All") {
        // Select all items
        const allOptions = [...columnNames];
        setSelectedItems(allOptions);
        setSelectedColumns(allOptions, curInd);
        setSelectAllLabel("Unselect All");
      } else {
        // Unselect all items
        setSelectedItems([]);
        setSelectedColumns([], curInd);
        setSelectAllLabel("Select All");
      }
    } else {
      // Handle normal selections
      setSelectedItems(newValue);
      setSelectedColumns(newValue, curInd);

      // Update "Select All" label based on current selection state
      if (newValue.length === columnNames.length) {
        setSelectAllLabel("Unselect All");
      } else {
        setSelectAllLabel("Select All");
      }
    }
  };

  useEffect(() => {
    if (defaultValue) {
      setSelectedItems(defaultValue);
      if (defaultValue.length === columnNames.length) {
        setSelectAllLabel("Unselect All");
      }
    }
  }, [defaultValue, columnNames]);

  return (
    <div className="mt-1">
      <Autocomplete
        multiple
        fullWidth
        limitTags={2}
        id="checkboxes-tags-demo"
        options={[selectAllLabel, ...columnNames]} // Dynamic label for "Select All"
        disabled={disabled}
        disableCloseOnSelect
        value={selectedItems}
        onChange={(e, newValue) => handleSelectionChange(newValue)}
        getOptionLabel={(option) => option}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 4 }}
              checked={
                selected ||
                (option === selectAllLabel &&
                  selectedItems.length === columnNames.length)
              }
            />
            {option}
          </li>
        )}
        size="small"
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
                px: 1.25,
                py: 0.65,
                fontSize: '0.92rem',
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
              '& .MuiAutocomplete-tag': {
                margin: '2px',
                height: '24px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 500,
              },
            }}
          />
        )}
      />
    </div>
  );
};

export default MultipleDropDown;
