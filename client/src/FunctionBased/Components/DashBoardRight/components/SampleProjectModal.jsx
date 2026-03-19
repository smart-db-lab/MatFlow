import { Crosshair, FlaskConical, Share2, TrendingUp, X } from "lucide-react";

const sampleOptions = [
    {
        type: "classification",
        label: "Classification Dataset",
        description: "Standardized data for categorical prediction models.",
        icon: <Crosshair size={20} />,
        iconBg: "bg-[#E9FBF6]",
        iconColor: "text-[#0D9488]",
    },
    {
        type: "regression",
        label: "Regression Dataset",
        description: "Structured values for continuous variable forecasting.",
        icon: <TrendingUp size={20} />,
        iconBg: "bg-[#FFF7EC]",
        iconColor: "text-[#F97316]",
    },
    {
        type: "graph",
        label: "Graph Topology",
        description: "Relational data for complex network analysis.",
        icon: <Share2 size={20} />,
        iconBg: "bg-[#EEF2FF]",
        iconColor: "text-[#4F46E5]",
    },
];

function SampleProjectModal({
    isOpen,
    sampleLoading,
    sampleError,
    onClose,
    onCreateSample,
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => !sampleLoading && onClose()}
        >
            <div
                className="bg-white rounded-2xl shadow-[0_20px_55px_rgba(15,23,42,0.22)] max-w-sm w-full mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 py-4 bg-[#0D9488] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#0B7F74] flex items-center justify-center text-white">
                            <FlaskConical size={16} />
                        </div>
                        <h2 className="text-lg leading-none font-bold text-white tracking-tight">
                            Explore Sample Data
                        </h2>
                    </div>
                    <button
                        type="button"
                        disabled={sampleLoading}
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center text-white hover:bg-white/25 transition-colors disabled:opacity-50"
                        aria-label="Close"
                    >
                        <X size={18} strokeWidth={2.5} />
                    </button>
                </div>
                <div className="px-5 py-5 space-y-3">
                    {sampleError && (
                        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                            {sampleError.error ||
                                sampleError.message ||
                                "Failed to create sample project."}
                        </p>
                    )}
                    {sampleOptions.map(
                        ({
                            type,
                            label,
                            description,
                            icon,
                            iconBg,
                            iconColor,
                        }) => (
                            <button
                                key={type}
                                type="button"
                                disabled={sampleLoading}
                                onClick={() => onCreateSample(type)}
                                className="w-full text-left rounded-xl border border-[#DCEAFD] bg-white hover:border-[#0D9488]/45 hover:bg-[#F8FFFD] px-4 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                            >
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
                                >
                                    {icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-base font-semibold text-[#0F172A] leading-tight">
                                        {label}
                                    </p>
                                    <p className="text-sm text-[#334155] leading-tight mt-1">
                                        {description}
                                    </p>
                                </div>
                            </button>
                        ),
                    )}
                </div>
                <div className="px-5 pb-5 flex justify-end">
                    <button
                        type="button"
                        disabled={sampleLoading}
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(220,38,38,0.24)] hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        <X size={14} />
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SampleProjectModal;
