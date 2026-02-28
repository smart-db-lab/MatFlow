import React from "react";

/**
 * Accessible checkbox that does not pass invalid props to the DOM.
 * Use this instead of NextUI Checkbox when you need to avoid
 * isSelected/defaultSelected prop leakage warnings.
 * Supports controlled (isSelected + onChange) and uncontrolled (defaultSelected) usage.
 */
const SafeCheckbox = ({
  isSelected,
  defaultSelected,
  onChange,
  children,
  size = "md",
  "aria-label": ariaLabel,
  className = "",
  ...rest
}) => {
  const isControlled = isSelected !== undefined;
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}>
      <input
        type="checkbox"
        className={`rounded border-gray-300 text-[#0D9488] focus:ring-[#0D9488] cursor-pointer ${sizeClass}`}
        checked={isControlled ? !!isSelected : undefined}
        defaultChecked={!isControlled && defaultSelected !== undefined ? !!defaultSelected : undefined}
        onChange={(e) => onChange?.(e.target.checked)}
        aria-label={ariaLabel}
        {...rest}
      />
      {children}
    </label>
  );
};

export default SafeCheckbox;
