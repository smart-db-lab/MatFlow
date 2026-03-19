import { X } from "lucide-react";

function ProjectInfoModal({ projectInfoTarget, onClose }) {
    if (!projectInfoTarget) return null;

    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="mx-4 w-full max-w-lg rounded-2xl bg-white shadow-[0_20px_55px_rgba(15,23,42,0.22)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 py-4 bg-[#0D9488] flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">
                        Project Info
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                        aria-label="Close project info"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="px-5 py-5 space-y-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Name
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 break-words">
                            {projectInfoTarget.name || "Untitled project"}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Description
                        </p>
                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap break-words">
                            {projectInfoTarget.description ||
                                "No description provided."}
                        </p>
                    </div>
                </div>
                <div className="px-5 pb-5 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E] transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProjectInfoModal;
