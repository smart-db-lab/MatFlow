import React from "react";
import { Trash2, X } from "lucide-react";

function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemTypeLabel = "item",
}) {
  if (!isOpen) return null;

  const safeItemName = String(itemName || "");
  const truncatedItemName =
    safeItemName.length > 120
      ? `${safeItemName.slice(0, 117)}...`
      : safeItemName;

  const handleConfirm = async () => {
    try {
      await onConfirm?.();
    } finally {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-gray-200 max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex flex-col items-center text-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 border border-rose-100">
              <Trash2 size={20} className="text-rose-500" strokeWidth={1.8} />
            </div>
            <h2 className="text-base font-semibold text-gray-900 tracking-wide">
              {title}
            </h2>
          </div>

          <p className="text-sm text-gray-600 mt-3 leading-relaxed text-center">
            Are you sure you want to delete this {itemTypeLabel}?
          </p>
          <p
            className="mt-2 text-xs sm:text-sm font-medium text-gray-700 text-center break-words"
            title={safeItemName}
          >
            {truncatedItemName}
          </p>
          <p className="text-sm text-gray-600 mt-2 font-medium text-center">
            This action cannot be undone.
          </p>
        </div>

        <div className="px-6 pb-5 pt-2 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-rose-500 text-white border border-rose-500 rounded-lg font-semibold hover:bg-rose-600 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;
