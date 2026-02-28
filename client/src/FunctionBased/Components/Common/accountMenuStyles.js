export const accountMenuStyles = {
  dropdown: "absolute right-0 top-full mt-4 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50",
  header: "px-4 py-2.5 border-b border-gray-100 bg-gray-50/80 rounded-t-xl flex items-start justify-between gap-2",
  headerName: "text-sm font-semibold text-gray-900 truncate",
  item: "flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors duration-150",
  iconWrap: "w-5 h-5 rounded-md flex items-center justify-center border border-primary/20 bg-primary/10",
  icon: "text-primary",
  divider: "my-1 border-gray-100",
  dangerItem: "flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 w-full text-left",
  dangerIconWrap: "w-5 h-5 rounded-md flex items-center justify-center border border-red-200 bg-red-50",
};

export const getRoleBadgeClass = (isAdmin) =>
  `shrink-0 inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${
    isAdmin
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : "text-gray-500 bg-gray-100 border-gray-200"
  }`;
