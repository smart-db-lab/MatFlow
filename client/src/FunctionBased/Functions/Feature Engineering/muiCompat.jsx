import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import MuiCheckbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MuiRadio from "@mui/material/Radio";
import MuiRadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MuiButton from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

const mapColor = (color) => {
  if (color === "success") return "success";
  if (color === "secondary") return "secondary";
  if (color === "error") return "error";
  return "primary";
};

export const Input = ({
  label,
  fullWidth,
  size = "sm",
  type = "text",
  step,
  value,
  onChange,
  placeholder,
  className,
  bordered,
  clearable,
  ...rest
}) => (
  <TextField
    label={label}
    fullWidth={Boolean(fullWidth)}
    size={size === "md" ? "medium" : "small"}
    type={type}
    inputProps={step !== undefined ? { step } : undefined}
    value={value ?? ""}
    onChange={onChange}
    placeholder={placeholder}
    className={className}
    variant="outlined"
    sx={{
      "& .MuiOutlinedInput-root": {
        borderRadius: "12px",
        minHeight: "42px",
        backgroundColor: "#ffffff",
      },
      "& .MuiInputBase-input": {
        fontSize: "0.95rem",
      },
      "& .MuiInputLabel-root": {
        fontSize: "0.86rem",
      },
      "& .MuiInputLabel-root.MuiInputLabel-shrink": {
        fontSize: "0.8rem",
      },
    }}
    {...rest}
  />
);

export const Textarea = ({
  label,
  fullWidth,
  size,
  value,
  onChange,
  placeholder,
  rows,
  minRows,
  className,
}) => (
  <TextField
    label={label}
    fullWidth={Boolean(fullWidth)}
    size={size === "sm" ? "small" : "medium"}
    multiline
    rows={rows}
    minRows={minRows}
    value={value ?? ""}
    onChange={onChange}
    placeholder={placeholder}
    className={className}
    variant="outlined"
  />
);

export const Checkbox = ({
  children,
  onChange,
  color = "primary",
  size = "medium",
  isSelected,
  checked,
  ...rest
}) => (
  <FormControlLabel
    control={
      <MuiCheckbox
        color={mapColor(color)}
        size={size === "sm" ? "small" : size}
        checked={typeof isSelected === "boolean" ? isSelected : checked}
        onChange={(event) =>
          onChange?.({
            target: event.target,
            valueOf: () => event.target.checked,
          })
        }
        {...rest}
      />
    }
    label={children}
  />
);

export const Radio = ({ value, children, color = "primary" }) => (
  <FormControlLabel
    value={value}
    control={<MuiRadio color={mapColor(color)} size="small" />}
    label={children}
  />
);

const RadioGroupCompat = ({
  label,
  orientation = "vertical",
  value,
  defaultValue,
  onChange,
  children,
}) => (
  <FormControl>
    {label ? (
      <FormLabel className="!text-xs !font-medium !text-gray-700 !mb-1.5">
        {label}
      </FormLabel>
    ) : null}
    <MuiRadioGroup
      row={orientation === "horizontal"}
      value={value}
      defaultValue={defaultValue}
      onChange={(event) => onChange?.(event.target.value)}
    >
      {children}
    </MuiRadioGroup>
  </FormControl>
);

Radio.Group = RadioGroupCompat;

export const Progress = ({ value = 0 }) => (
  <LinearProgress variant="determinate" value={value} />
);

export const Button = ({ children, onPress, onClick, ...props }) => (
  <MuiButton onClick={onClick || onPress} {...props}>
    {children}
  </MuiButton>
);

export const Modal = ({ open, onClose, width, children }) => {
  const resolvedMaxWidth = width && String(width).startsWith("8") ? "md" : "sm";
  return (
    <Dialog open={Boolean(open)} onClose={onClose} fullWidth maxWidth={resolvedMaxWidth}>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
};

export const Loading = ({ size = "md", children }) => (
  <div className="flex items-center gap-2">
    <CircularProgress size={size === "lg" ? 24 : size === "sm" ? 16 : 20} />
    {children ? <span className="text-sm text-gray-600">{children}</span> : null}
  </div>
);

