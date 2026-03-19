function HomeConfirmModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-base font-semibold text-gray-900">
                    Go to workspace home?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                    Your current project view will be reset and you will return
                    to the Matflow workspace.
                </p>
                <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-md bg-[#0D9488] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0F766E]"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default HomeConfirmModal;
