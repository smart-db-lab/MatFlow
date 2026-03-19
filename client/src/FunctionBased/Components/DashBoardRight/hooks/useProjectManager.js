import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { commonApi } from "../../../../services/api/apiService";
import { clearIndexedDB } from "../../../../util/indexDB";
import { isLoggedIn } from "../../../../util/adminAuth";
import { sessionSetString } from "../../../../util/sessionProjectStorage";

const STORAGE_KEY = "mlflow_projects";
const GUEST_PROJECTS_KEY = "mlflow_guest_projects";
const PAGE_SIZE = 6;

const generateUUID = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });

const primeProjectLandingState = (projectId) => {
    if (!projectId) return;
    sessionSetString("currentTab", projectId, "file");
    sessionSetString("activeFunction", projectId, "");
    sessionSetString("activeFileId", projectId, "");
    sessionSetString("activeFolder", projectId, "");
};

export function useProjectManager({ guest, projectId, navigate }) {
    const [showProjectsModal, setShowProjectsModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSampleModal, setShowSampleModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [projectInfoTarget, setProjectInfoTarget] = useState(null);
    const [projects, setProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [formName, setFormName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [sampleLoading, setSampleLoading] = useState(false);
    const [sampleError, setSampleError] = useState(null);

    const loadProjects = async () => {
        if (guest) {
            try {
                const stored = localStorage.getItem(GUEST_PROJECTS_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setProjects(
                            parsed.map((p) => ({
                                ...p,
                                createdAt: new Date(
                                    p.created_at || p.createdAt || Date.now(),
                                ).getTime(),
                                updatedAt: new Date(
                                    p.updated_at ||
                                        p.updatedAt ||
                                        p.created_at ||
                                        p.createdAt ||
                                        Date.now(),
                                ).getTime(),
                                isFavorite: !!p.is_favorite || !!p.isFavorite,
                            })),
                        );
                        return;
                    }
                }
            } catch (_) {}
            setProjects([]);
            return;
        }
        try {
            const data = await commonApi.projects.list();
            if (Array.isArray(data) && data.length > 0) {
                setProjects(
                    data.map((p) => ({
                        ...p,
                        createdAt: new Date(
                            p.created_at || p.createdAt,
                        ).getTime(),
                        updatedAt: new Date(
                            p.updated_at ||
                                p.updatedAt ||
                                p.created_at ||
                                p.createdAt,
                        ).getTime(),
                        isFavorite: !!p.is_favorite || !!p.isFavorite,
                    })),
                );
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } else {
                setProjects([]);
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (_) {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setProjects(
                            parsed.map((p) => ({
                                ...p,
                                createdAt: p.createdAt || Date.now(),
                                updatedAt:
                                    p.updatedAt || p.createdAt || Date.now(),
                                isFavorite:
                                    typeof p.isFavorite === "boolean"
                                        ? p.isFavorite
                                        : false,
                            })),
                        );
                    }
                }
            } catch (_) {}
        }
    };

    useEffect(() => {
        if (showProjectsModal) loadProjects();
    }, [showProjectsModal]);

    const sortedProjects = useMemo(() => {
        return [...projects].sort((a, b) => {
            const aTime = a.updatedAt || a.createdAt || 0;
            const bTime = b.updatedAt || b.createdAt || 0;
            if (bTime !== aTime) return bTime - aTime;
            return (a.name || "")
                .toLowerCase()
                .localeCompare((b.name || "").toLowerCase());
        });
    }, [projects]);

    const filteredProjects = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        let list = sortedProjects;
        if (q)
            list = list.filter(
                (p) =>
                    (p.name && p.name.toLowerCase().includes(q)) ||
                    (p.description && p.description.toLowerCase().includes(q)),
            );
        if (showFavoritesOnly) list = list.filter((p) => p.isFavorite);
        return list;
    }, [sortedProjects, searchQuery, showFavoritesOnly]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredProjects.length / PAGE_SIZE),
    );
    const visibleProjects = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredProjects.slice(start, start + PAGE_SIZE);
    }, [filteredProjects, currentPage]);
    const recentProjects = useMemo(
        () => sortedProjects.slice(0, 3),
        [sortedProjects],
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    useEffect(() => {
        loadProjects();
    }, [guest, projectId]);

    const handleCreateProject = async () => {
        if (!formName.trim() || guest) return;
        try {
            const created = await commonApi.projects.create({
                name: formName.trim(),
                description: formDescription.trim() || "",
            });
            const newProject = {
                ...created,
                createdAt: new Date(created.created_at || Date.now()).getTime(),
                updatedAt: new Date(
                    created.updated_at || created.created_at || Date.now(),
                ).getTime(),
                isFavorite: !!created.is_favorite,
            };
            const updatedProjects = [...projects, newProject];
            setProjects(updatedProjects);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
            setFormName("");
            setFormDescription("");
            setEditingId(null);
            setShowCreateModal(false);
            primeProjectLandingState(newProject.id);
            navigate(`/matflow/dashboard/${newProject.id}`);
        } catch (_) {}
    };

    const handleSaveEdit = async () => {
        if (!editingId || !formName.trim()) return;
        if (guest) {
            setProjects((prev) => {
                const updated = prev.map((p) =>
                    p.id === editingId
                        ? {
                              ...p,
                              name: formName.trim(),
                              description: formDescription.trim() || "",
                              updatedAt: Date.now(),
                          }
                        : p,
                );
                localStorage.setItem(
                    GUEST_PROJECTS_KEY,
                    JSON.stringify(updated),
                );
                return updated;
            });
            setFormName("");
            setFormDescription("");
            setEditingId(null);
            return;
        }
        try {
            const updated = await commonApi.projects.update(editingId, {
                name: formName.trim(),
                description: formDescription.trim() || "",
            });
            const updatedProject = {
                ...updated,
                createdAt: new Date(updated.created_at || Date.now()).getTime(),
                updatedAt: new Date(
                    updated.updated_at || updated.created_at || Date.now(),
                ).getTime(),
                isFavorite: !!updated.is_favorite,
            };
            setProjects((prev) => {
                const updatedList = prev.map((p) =>
                    p.id === editingId ? updatedProject : p,
                );
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
                return updatedList;
            });
            setFormName("");
            setFormDescription("");
            setEditingId(null);
        } catch (error) {
            console.error("Failed to update project:", error);
        }
    };

    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;
        const modelsDbName = `models:${projectToDelete.id}`;
        if (guest) {
            const updated = projects.filter((p) => p.id !== projectToDelete.id);
            setProjects(updated);
            if (updated.length > 0)
                localStorage.setItem(
                    GUEST_PROJECTS_KEY,
                    JSON.stringify(updated),
                );
            else localStorage.removeItem(GUEST_PROJECTS_KEY);
            try {
                await clearIndexedDB(modelsDbName);
            } catch (_) {}
            if (projectId === projectToDelete.id)
                navigate("/matflow/dashboard");
            setShowDeleteModal(false);
            setProjectToDelete(null);
            return;
        }
        try {
            await commonApi.projects.remove(projectToDelete.id);
            try {
                await clearIndexedDB(modelsDbName);
            } catch (_) {}
            const updated = projects.filter((p) => p.id !== projectToDelete.id);
            setProjects(updated);
            if (updated.length > 0)
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            else localStorage.removeItem(STORAGE_KEY);
            if (projectId === projectToDelete.id)
                navigate("/matflow/dashboard");
            setShowDeleteModal(false);
            setProjectToDelete(null);
        } catch (error) {
            console.error("Failed to delete project:", error);
        }
    };

    const toggleFavorite = async (project, e) => {
        e.stopPropagation();
        const newFav = !project.isFavorite;
        const storageKey = guest ? GUEST_PROJECTS_KEY : STORAGE_KEY;
        setProjects((prev) => {
            const updated = prev.map((p) =>
                p.id === project.id
                    ? { ...p, isFavorite: newFav, updatedAt: Date.now() }
                    : p,
            );
            localStorage.setItem(storageKey, JSON.stringify(updated));
            return updated;
        });
        if (guest) return;
        try {
            await commonApi.projects.update(project.id, {
                is_favorite: newFav,
            });
        } catch (_) {
            setProjects((prev) => {
                const reverted = prev.map((p) =>
                    p.id === project.id ? { ...p, isFavorite: !newFav } : p,
                );
                localStorage.setItem(storageKey, JSON.stringify(reverted));
                return reverted;
            });
        }
    };

    const openCreate = () => {
        if (guest) {
            toast.info("Sign up to create custom projects.", {
                toastId: "guest-create",
            });
            return;
        }
        if (!isLoggedIn()) {
            navigate("/login");
            return;
        }
        setEditingId(null);
        setFormName("");
        setFormDescription("");
        setShowCreateModal(true);
    };

    const openEdit = (project) => {
        setEditingId(project.id);
        setFormName(project.name || "");
        setFormDescription(project.description || "");
    };

    const handleCreateSample = async (type) => {
        setSampleError(null);
        setSampleLoading(true);
        try {
            let created;
            if (guest) {
                const pid = generateUUID();
                created = await commonApi.projects.seedGuestSample(pid, type);
                if (created && created.id) {
                    const guestProject = {
                        ...created,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        is_favorite: false,
                    };
                    const existing = JSON.parse(
                        localStorage.getItem(GUEST_PROJECTS_KEY) || "[]",
                    );
                    existing.push(guestProject);
                    localStorage.setItem(
                        GUEST_PROJECTS_KEY,
                        JSON.stringify(existing),
                    );
                }
            } else {
                created = await commonApi.projects.createSample(type);
            }
            if (created && created.id) {
                primeProjectLandingState(created.id);
                setShowSampleModal(false);
                setSampleError(null);
                navigate(`/matflow/dashboard/${created.id}`);
            } else {
                const msg = created?.detail || created?.error || created?.message;
                const isAuthErr =
                    typeof msg === "string" &&
                    /auth|credentials|login|unauthorized/i.test(msg);
                setSampleError(
                    isAuthErr
                        ? {
                              error: "Please log in to continue.",
                          }
                        : created || {
                              error: "Invalid response from server.",
                          },
                );
            }
        } catch (err) {
            const data = err?.response?.data || err?.data || {};
            const msg = data.detail || data.error || data.message || err?.message;
            const isAuthErr =
                typeof msg === "string" &&
                /auth|credentials|login|unauthorized/i.test(msg);
            setSampleError(
                isAuthErr
                    ? {
                          error: "Please log in to continue.",
                      }
                    : data.error
                      ? data
                      : {
                            error: msg || "Failed to create sample project.",
                        },
            );
        } finally {
            setSampleLoading(false);
        }
    };

    const isEditMode = !!editingId;
    const modalTitle = isEditMode ? "Edit project" : "Create project";
    const modalPrimaryLabel = isEditMode ? "Save changes" : "Create project";
    const modalPrimaryAction = isEditMode ? handleSaveEdit : handleCreateProject;
    const openProjectById = (targetProjectId) => {
        if (!targetProjectId) return;
        primeProjectLandingState(targetProjectId);
        navigate(`/matflow/dashboard/${targetProjectId}`);
    };

    return {
        projects,
        showProjectsModal,
        setShowProjectsModal,
        showCreateModal,
        setShowCreateModal,
        showSampleModal,
        setShowSampleModal,
        showDeleteModal,
        setShowDeleteModal,
        projectInfoTarget,
        setProjectInfoTarget,
        searchQuery,
        setSearchQuery,
        showFavoritesOnly,
        setShowFavoritesOnly,
        currentPage,
        setCurrentPage,
        formName,
        setFormName,
        formDescription,
        setFormDescription,
        editingId,
        setEditingId,
        projectToDelete,
        setProjectToDelete,
        sampleLoading,
        sampleError,
        setSampleError,
        sortedProjects,
        filteredProjects,
        totalPages,
        visibleProjects,
        recentProjects,
        loadProjects,
        confirmDeleteProject,
        handleSaveEdit,
        toggleFavorite,
        openCreate,
        openEdit,
        openProjectById,
        handleCreateSample,
        isEditMode,
        modalTitle,
        modalPrimaryLabel,
        modalPrimaryAction,
    };
}
