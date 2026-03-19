import { FolderOpen, PlusCircle, X } from "lucide-react";

function CreateProjectModal({
    isOpen,
    isEditMode,
    formName,
    formDescription,
    setFormName,
    setFormDescription,
    onClose,
    onSubmit,
    modalPrimaryLabel,
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-[0_20px_55px_rgba(15,23,42,0.22)] max-w-sm w-full mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-5 bg-[#0D9488] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#0B7F74] flex items-center justify-center text-white">
                            <FolderOpen size={16} />
                        </div>
                        <h2 className="text-lg leading-none font-bold text-white tracking-tight">
                            {isEditMode ? "Edit Project" : "Create New Project"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                        aria-label="Close"
                    >
                        <X size={18} strokeWidth={2.5} />
                    </button>
                </div>
                <div className="px-5 py-4 space-y-4">
                    <div>
                        <label
                            htmlFor="create-project-name"
                            className="flex items-center gap-2 text-sm font-bold text-[#0F172A] mb-1.5"
                        >
                            <span>Project Name</span>
                            <span className="text-xs font-semibold tracking-wide text-red-600 uppercase">
                                Required
                            </span>
                        </label>
                        <input
                            id="create-project-name"
                            type="text"
                            placeholder="My project"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            autoFocus
                            className="w-full px-3.5 py-2.5 bg-white border border-[#BCD8FA] rounded-xl text-sm text-[#0F172A] placeholder:text-[#86A4CC] focus:ring-2 focus:ring-[#0D9488]/25 focus:border-[#0D9488] outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="create-project-desc"
                            className="flex items-center gap-2 text-sm font-bold text-[#0F172A] mb-1.5"
                        >
                            <span>Description</span>
                            <span className="inline-flex items-center rounded-full border border-[#BFD7F7] bg-[#EAF2FF] px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide text-[#365A8C]">
                                Optional
                            </span>
                        </label>
                        <textarea
                            id="create-project-desc"
                            placeholder="What is this project about?"
                            rows={3}
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#BCD8FA] rounded-xl text-sm text-[#0F172A] placeholder:text-[#86A4CC] focus:ring-2 focus:ring-[#0D9488]/25 focus:border-[#0D9488] outline-none resize-none transition-colors"
                        />
                    </div>
                </div>
                <div className="px-5 pb-4 pt-1 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors"
                    >
                        <X size={14} />
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={!formName.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(13,148,136,0.22)] hover:bg-[#0F766E] hover:shadow-[0_8px_20px_rgba(13,148,136,0.3)] disabled:bg-[#E7EFFB] disabled:text-[#94AACE] disabled:shadow-none disabled:cursor-not-allowed transition-all"
                    >
                        <PlusCircle size={14} />
                        <span>{modalPrimaryLabel}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateProjectModal;
