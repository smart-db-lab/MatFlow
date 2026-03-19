import { Eye, FolderOpen, Pencil, Search, Star, Trash2, X } from "lucide-react";

function ProjectsModal({
    isOpen,
    onClose,
    projects,
    filteredProjects,
    visibleProjects,
    projectId,
    editingId,
    setEditingId,
    formName,
    setFormName,
    formDescription,
    setFormDescription,
    onSaveEdit,
    searchQuery,
    setSearchQuery,
    showFavoritesOnly,
    setShowFavoritesOnly,
    toggleFavorite,
    openEdit,
    setProjectToDelete,
    setShowDeleteModal,
    setProjectInfoTarget,
    currentPage,
    setCurrentPage,
    totalPages,
    onOpenProject,
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-[0_20px_55px_rgba(15,23,42,0.22)] max-w-xl w-full mx-4 max-h-[80vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 py-4 bg-[#0D9488] flex items-center justify-between shrink-0">
                    <h2 className="text-lg font-bold text-white">
                        My Projects
                        {projects.length > 0 && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-sm font-bold text-white">
                                {projects.length}
                            </span>
                        )}
                    </h2>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            setEditingId(null);
                        }}
                        className="h-8 w-8 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
                <div className="px-5 py-3 shrink-0 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#E6F7F5] text-[#0D9488] flex items-center justify-center">
                                <Search size={12} />
                            </span>
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                }
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-500 focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488] focus:bg-white outline-none transition-colors"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setShowFavoritesOnly(!showFavoritesOnly)
                            }
                            className={`w-8 h-8 rounded border flex items-center justify-center transition-all hover:scale-110 ${showFavoritesOnly ? "border-yellow-300 bg-yellow-50 text-yellow-500" : "border-gray-200 bg-white text-gray-400 hover:text-yellow-500 hover:border-yellow-300"}`}
                            title={
                                showFavoritesOnly
                                    ? "Show all"
                                    : "Show starred only"
                            }
                        >
                            <Star
                                size={14}
                                fill={showFavoritesOnly ? "currentColor" : "none"}
                            />
                        </button>
                    </div>
                </div>
                <div className="px-5 pb-4 overflow-y-auto flex-1 min-h-0">
                    {filteredProjects.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-sm text-gray-600">
                                {projects.length === 0
                                    ? "No projects yet."
                                    : "No results found."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-gray-100">
                                {visibleProjects.map((project) => (
                                    <div key={project.id}>
                                        {editingId === project.id ? (
                                            <div className="py-3 space-y-2">
                                                <input
                                                    type="text"
                                                    value={formName}
                                                    onChange={(e) =>
                                                        setFormName(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none"
                                                    placeholder="Project name"
                                                    autoFocus
                                                />
                                                <textarea
                                                    value={formDescription}
                                                    onChange={(e) =>
                                                        setFormDescription(
                                                            e.target.value,
                                                        )
                                                    }
                                                    rows={2}
                                                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none resize-none"
                                                    placeholder="Description"
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingId(null);
                                                            setFormName("");
                                                            setFormDescription(
                                                                "",
                                                            );
                                                        }}
                                                        className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={onSaveEdit}
                                                        disabled={!formName.trim()}
                                                        className="px-3 py-1 text-xs text-white bg-[#0D9488] rounded-lg hover:bg-[#0F766E] disabled:opacity-50"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className={`flex items-center gap-2 py-3 cursor-pointer transition-colors ${projectId === project.id ? "" : "hover:bg-gray-50"} -mx-5 px-5`}
                                                onClick={() => {
                                                    onClose();
                                                    onOpenProject(project.id);
                                                }}
                                            >
                                                <span className="h-10 w-10 shrink-0 rounded-xl bg-[#E6F7F5] text-[#0D9488] flex items-center justify-center">
                                                    <FolderOpen size={16} />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p
                                                        className={`font-semibold truncate text-[15px] ${projectId === project.id ? "text-[#0D9488]" : "text-gray-900"}`}
                                                    >
                                                        {project.name ||
                                                            "Untitled"}
                                                    </p>
                                                    <p className="text-sm text-gray-700 truncate">
                                                        {project.description ||
                                                            new Date(
                                                                project.updatedAt ||
                                                                    project.createdAt ||
                                                                    Date.now(),
                                                            ).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div
                                                    className="flex items-center gap-1.5 shrink-0"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setProjectInfoTarget(
                                                                project,
                                                            );
                                                        }}
                                                        className="w-6 h-6 rounded border border-indigo-300 bg-white flex items-center justify-center text-indigo-500 hover:bg-indigo-50 transition-all hover:scale-110"
                                                        title="View details"
                                                    >
                                                        <Eye size={12} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) =>
                                                            toggleFavorite(
                                                                project,
                                                                e,
                                                            )
                                                        }
                                                        className={`w-6 h-6 rounded border flex items-center justify-center transition-all hover:scale-110 ${project.isFavorite ? "border-yellow-300 bg-yellow-50 text-yellow-500" : "border-gray-200 bg-white text-gray-400 hover:text-yellow-500 hover:border-yellow-300"}`}
                                                        title={
                                                            project.isFavorite
                                                                ? "Unstar"
                                                                : "Star"
                                                        }
                                                    >
                                                        <Star
                                                            size={12}
                                                            fill={
                                                                project.isFavorite
                                                                    ? "currentColor"
                                                                    : "none"
                                                            }
                                                        />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEdit(project)
                                                        }
                                                        className="w-6 h-6 rounded border border-[#0D9488]/30 bg-white flex items-center justify-center text-[#0D9488] hover:bg-[#0D9488]/10 transition-all hover:scale-110"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setProjectToDelete(
                                                                project,
                                                            );
                                                            setShowDeleteModal(
                                                                true,
                                                            );
                                                        }}
                                                        className="w-6 h-6 rounded border border-red-300 bg-white flex items-center justify-center text-red-500 hover:bg-red-50 transition-all hover:scale-110"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {filteredProjects.length > 6 && (
                                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.max(1, p - 1),
                                            )
                                        }
                                        disabled={currentPage === 1}
                                        className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 transition-all hover:scale-110"
                                    >
                                        ‹
                                    </button>
                                    <span className="text-sm text-gray-700 font-medium">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(totalPages, p + 1),
                                            )
                                        }
                                        disabled={currentPage === totalPages}
                                        className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 transition-all hover:scale-110"
                                    >
                                        ›
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProjectsModal;
