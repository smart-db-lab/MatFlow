export const FE_CARD_CLASS = "bg-white p-4";
export const FE_SECTION_TITLE_CLASS = "text-base font-semibold text-gray-900 mb-2";
export const FE_LABEL_CLASS = "block text-sm font-semibold text-gray-900 mb-1.5";
export const FE_SUB_LABEL_CLASS = "block text-sm font-medium text-gray-700 mb-1.5";
export const FE_ACTION_ROW_CLASS =
  "mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3";
export const FE_PRIMARY_BUTTON_CLASS =
  "px-4 py-2 bg-[#0D9488] text-white text-sm font-medium rounded-md hover:bg-[#0F766E] transition-colors inline-flex items-center gap-1.5";

export const FE_SELECT_MENU_PROPS = {
  anchorOrigin: { vertical: "bottom", horizontal: "left" },
  transformOrigin: { vertical: "top", horizontal: "left" },
  PaperProps: {
    sx: {
      maxHeight: 320,
      mt: 0.5,
      border: "1px solid #e5e7eb",
      boxShadow: "0 10px 28px rgba(2, 6, 23, 0.16)",
    },
  },
};

export const FE_SELECT_SX = {
  borderRadius: "10px",
  backgroundColor: "#fcfcfd",
  fontSize: "0.95rem",
  ".MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9ca3af" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0D9488", borderWidth: "2px" },
  "&.Mui-focused": { boxShadow: "0 0 0 3px rgba(13,148,136,0.12)" },
};

export const FE_TEXTFIELD_SX = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "#fcfcfd",
    "& fieldset": { borderColor: "#d1d5db" },
    "&:hover fieldset": { borderColor: "#9ca3af" },
    "&.Mui-focused fieldset": { borderColor: "#0D9488", borderWidth: "2px" },
    "&.Mui-focused": { boxShadow: "0 0 0 3px rgba(13,148,136,0.12)" },
  },
  "& .MuiInputBase-input": { fontSize: "0.95rem" },
};

export const FE_AUTOCOMPLETE_SX = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "#fcfcfd",
    "& fieldset": { borderColor: "#d1d5db" },
    "&:hover fieldset": { borderColor: "#9ca3af" },
    "&.Mui-focused fieldset": { borderColor: "#0D9488", borderWidth: "2px" },
    "&.Mui-focused": { boxShadow: "0 0 0 3px rgba(13,148,136,0.12)" },
  },
  "& .MuiInputBase-input": { fontSize: "0.95rem" },
};
