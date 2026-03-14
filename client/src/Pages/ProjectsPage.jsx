import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { commonApi } from '../services/api/apiService';
import { isLoggedIn, isAuthenticated } from '../util/adminAuth';
import { isGuestMode } from '../util/guestSession';
import { clearIndexedDB } from '../util/indexDB';
import { sessionSetString } from '../util/sessionProjectStorage';
import ConfirmDeleteModal from '../Components/ConfirmDeleteModal';

const STORAGE_KEY = 'mlflow_projects';
const GUEST_PROJECTS_KEY = 'mlflow_guest_projects';
const PAGE_SIZE = 6;

/** Generate a UUID v4 */
const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const primeProjectLandingState = (projectId) => {
  if (!projectId) return;
  sessionSetString('currentTab', projectId, 'file');
  sessionSetString('activeFunction', projectId, '');
  sessionSetString('activeFileId', projectId, '');
  sessionSetString('activeFolder', projectId, '');
};

function ProjectsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('empty'); // 'empty' | 'list' | 'create' | 'edit'
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleError, setSampleError] = useState(null);

  const guest = isGuestMode();

  // Load projects — guests use localStorage, authenticated users use the API
  useEffect(() => {
    const loadProjects = async () => {
      if (guest) {
        // Guest: read from localStorage only
        try {
          const stored = localStorage.getItem(GUEST_PROJECTS_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const normalized = parsed.map((p) => ({
                ...p,
                createdAt: new Date(p.created_at || p.createdAt || Date.now()).getTime(),
                updatedAt: new Date(p.updated_at || p.updatedAt || p.created_at || p.createdAt || Date.now()).getTime(),
                isFavorite: !!p.is_favorite || !!p.isFavorite,
              }));
              setProjects(normalized);
              setViewMode('list');
              return;
            }
          }
        } catch (_) {}
        setProjects([]);
        setViewMode('empty');
        return;
      }

      // Authenticated user: fetch from backend
      try {
        const data = await commonApi.projects.list();
        if (Array.isArray(data) && data.length > 0) {
          setProjects(
            data.map((p) => ({
              ...p,
              createdAt: new Date(p.created_at || p.createdAt).getTime(),
              updatedAt: new Date(p.updated_at || p.updatedAt || p.created_at || p.createdAt).getTime(),
              isFavorite: !!p.is_favorite || !!p.isFavorite,
            }))
          );
          setViewMode('list');
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } else {
          setProjects([]);
          setViewMode('empty');
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (_) {
        // Fallback to localStorage cache if backend fails
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const normalized = parsed.map((p) => ({
                ...p,
                createdAt: p.createdAt || Date.now(),
                updatedAt: p.updatedAt || p.createdAt || Date.now(),
                isFavorite: typeof p.isFavorite === 'boolean' ? p.isFavorite : false,
              }));
              setProjects(normalized);
              setViewMode('list');
            }
          }
        } catch (_) {}
      }
    };

    loadProjects();
  }, [guest]);

  const sortedProjects = useMemo(() => {
    // Most recently updated first, then by name
    return [...projects].sort((a, b) => {
      const aTime = a.updatedAt || a.createdAt || 0;
      const bTime = b.updatedAt || b.createdAt || 0;
      if (bTime !== aTime) return bTime - aTime;
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = sortedProjects;

    if (q) {
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (showFavoritesOnly) {
      list = list.filter((p) => p.isFavorite);
    }

    return list;
  }, [sortedProjects, searchQuery, showFavoritesOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const visibleProjects = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProjects.slice(start, start + PAGE_SIZE);
  }, [filteredProjects, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const openCreate = () => {
    if (guest) {
      toast.info('Sign up to create custom projects.', { toastId: 'guest-create' });
      return;
    }
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setViewMode('create');
  };

  const handleCreateProject = async () => {
    if (!formName.trim() || guest) return;
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || '',
      };
      const created = await commonApi.projects.create(payload);
      const newProject = {
        ...created,
        createdAt: new Date(created.created_at || Date.now()).getTime(),
        updatedAt: new Date(created.updated_at || created.created_at || Date.now()).getTime(),
        isFavorite: !!created.is_favorite,
      };
      const updatedProjects = [...projects, newProject];
      setProjects(updatedProjects);
      // Update localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
      setFormName('');
      setFormDescription('');
      setEditingId(null);
      setViewMode('list');
      setSelectedId(newProject.id);
      setCurrentPage(1);
      setSearchQuery('');
      // Navigate straight into the new project's dashboard
      primeProjectLandingState(newProject.id);
      navigate(`/matflow/dashboard/${newProject.id}`);
    } catch (_) {
      // If backend fails, stay in modal; user can retry
    }
  };

  const handleCancelModal = () => {
    setFormName('');
    setFormDescription('');
    setEditingId(null);
    setViewMode(projects.length > 0 ? 'list' : 'empty');
  };

  const handleEditProject = (project) => {
    setEditingId(project.id);
    setFormName(project.name || '');
    setFormDescription(project.description || '');
    setViewMode('edit');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !formName.trim()) return;

    if (guest) {
      // Guest: update in localStorage only
      setProjects((prev) => {
        const updatedProjects = prev.map((p) =>
          p.id === editingId
            ? { ...p, name: formName.trim(), description: formDescription.trim() || '', updatedAt: Date.now() }
            : p
        );
        localStorage.setItem(GUEST_PROJECTS_KEY, JSON.stringify(updatedProjects));
        return updatedProjects;
      });
      setFormName('');
      setFormDescription('');
      setEditingId(null);
      setViewMode('list');
      return;
    }

    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || '',
      };
      const updated = await commonApi.projects.update(editingId, payload);
      const updatedProject = {
        ...updated,
        createdAt: new Date(updated.created_at || Date.now()).getTime(),
        updatedAt: new Date(updated.updated_at || updated.created_at || Date.now()).getTime(),
        isFavorite: !!updated.is_favorite,
      };
      setProjects((prev) => {
        const updatedProjects = prev.map((p) => (p.id === editingId ? updatedProject : p));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
        return updatedProjects;
      });
      setFormName('');
      setFormDescription('');
      setEditingId(null);
      setViewMode('list');
    } catch (error) {
      console.error('Failed to update project:', error);
      alert('Failed to update project. Please try again.');
    }
  };

  const handleDeleteProject = async (project, e) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    const modelsDbName = `models:${projectToDelete.id}`;

    if (guest) {
      // Guest: remove from localStorage only
      const updatedProjects = projects.filter((p) => p.id !== projectToDelete.id);
      setProjects(updatedProjects);
      if (updatedProjects.length > 0) {
        localStorage.setItem(GUEST_PROJECTS_KEY, JSON.stringify(updatedProjects));
      } else {
        localStorage.removeItem(GUEST_PROJECTS_KEY);
      }
      if (selectedId === projectToDelete.id) setSelectedId(null);
      if (updatedProjects.length === 0) setViewMode('empty');
      try {
        await clearIndexedDB(modelsDbName);
      } catch (_) {}
      setShowDeleteModal(false);
      setProjectToDelete(null);
      return;
    }

    try {
      await commonApi.projects.remove(projectToDelete.id);
      try {
        await clearIndexedDB(modelsDbName);
      } catch (_) {}
      const updatedProjects = projects.filter((p) => p.id !== projectToDelete.id);
      setProjects(updatedProjects);
      if (updatedProjects.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      if (selectedId === projectToDelete.id) setSelectedId(null);
      if (updatedProjects.length === 0) setViewMode('empty');
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const toggleFavorite = async (project, e) => {
    e.stopPropagation();
    const newFavoriteStatus = !project.isFavorite;
    const storageKey = guest ? GUEST_PROJECTS_KEY : STORAGE_KEY;

    // Optimistically update UI
    setProjects((prev) => {
      const updatedProjects = prev.map((p) =>
        p.id === project.id ? { ...p, isFavorite: newFavoriteStatus, updatedAt: Date.now() } : p
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedProjects));
      return updatedProjects;
    });

    // Guest: localStorage is the source of truth, no API call needed
    if (guest) return;

    try {
      await commonApi.projects.update(project.id, { is_favorite: newFavoriteStatus });
    } catch (error) {
      console.error('Failed to update favorite status:', error);
      setProjects((prev) => {
        const revertedProjects = prev.map((p) =>
          p.id === project.id ? { ...p, isFavorite: !newFavoriteStatus } : p
        );
        localStorage.setItem(storageKey, JSON.stringify(revertedProjects));
        return revertedProjects;
      });
    }
  };

  const showPagination = filteredProjects.length > PAGE_SIZE;

  const showModal = viewMode === 'create' || viewMode === 'edit';
  const modalTitle = viewMode === 'edit' ? 'Edit project' : 'Create project';
  const modalPrimaryLabel = viewMode === 'edit' ? 'Save changes' : 'Create project';
  const modalPrimaryAction = viewMode === 'edit' ? handleSaveEdit : handleCreateProject;

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <p className="text-xs font-semibold text-[#0D9488] uppercase tracking-[0.16em]">
            Projects
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900">
            {guest ? 'Welcome, Guest' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 max-w-xl">
            {guest
              ? 'Try our sample projects to explore EDA, feature engineering, and model building.'
              : 'Create and organize Matflow projects to keep your experiments and workflows tidy.'}
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column: Get started */}
          <section className="flex-1 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-[0.14em]">
              Get started
            </h2>

            <button
              type="button"
              onClick={openCreate}
              className="w-full text-left rounded-2xl border border-gray-200 bg-white hover:border-[#0D9488]/60 hover:shadow-md transition-all p-4 sm:p-5 flex items-center gap-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0D9488]/10 text-[#0D9488]">
                <span className="text-xl font-bold">+</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Create a new project
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Start a fresh workspace for a new dataset, model, or experiment.
                </p>
              </div>
            </button>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                Try a sample project
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Use one of the curated examples to quickly explore EDA, feature engineering,
                and model building in Matflow.
              </p>
              <button
                type="button"
                onClick={() => setShowSampleModal(true)}
                className="inline-flex items-center text-xs font-medium text-gray-600 hover:text-[#0D9488]"
              >
                Browse examples
              </button>
            </div>
          </section>

          {/* Right column: Projects list */}
          <section className="w-full lg:w-5/12 xl:w-4/12">
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-800">
                    Project List
                  </h2>
                  {projects.length > 0 && (
                    <span className="text-[11px] text-gray-500">
                      {projects.length} total
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 rounded-full border border-gray-200 px-1 py-0.5 text-[11px] bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setShowFavoritesOnly(false)}
                    className={`px-2 py-0.5 rounded-full ${
                      !showFavoritesOnly
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFavoritesOnly(true)}
                    className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      showFavoritesOnly
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span className="text-xs">★</span>
                    Starred
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search all projects"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none"
                  />
                </div>
              </div>

              {filteredProjects.length === 0 && (
                <div className="py-10 text-center text-xs text-gray-500">
                  <p className="mb-3">
                    {projects.length === 0
                      ? 'No projects yet. Create your first project to get started.'
                      : 'No projects match your search.'}
                  </p>
                  <button
                    type="button"
                    onClick={openCreate}
                    className="text-xs font-medium text-[#0D9488] hover:text-[#0F766E]"
                  >
                    Create project
                  </button>
                </div>
              )}

              {filteredProjects.length > 0 && (
                <>
                  <div className="space-y-1">
                    {visibleProjects.map((project) => (
                      <div
                        key={project.id}
                        className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm border ${
                          selectedId === project.id
                            ? 'border-[#0D9488] bg-[#eff6ff]'
                            : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                        } cursor-pointer transition-colors`}
                        onClick={() => {
                          setSelectedId(project.id);
                          primeProjectLandingState(project.id);
                          navigate(`/matflow/dashboard/${project.id}`);
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0D9488]/10 text-[#0D9488] text-xs font-semibold">
                            MF
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {project.name || 'Untitled project'}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">
                              {project.description ||
                                `Updated ${new Date(
                                  project.updatedAt || project.createdAt || Date.now()
                                ).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(project, e)}
                            className={`p-1.5 rounded-lg text-gray-500 hover:bg-yellow-50 hover:text-yellow-500 transition-colors ${
                              project.isFavorite ? 'text-yellow-500' : ''
                            }`}
                            title={project.isFavorite ? 'Unstar project' : 'Star project'}
                            aria-label="Star project"
                          >
                            <span className="text-sm">{project.isFavorite ? '★' : '☆'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditProject(project)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#0D9488] transition-colors"
                            title="Edit project"
                            aria-label="Edit project"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteProject(project, e)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete project"
                            aria-label="Delete project"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {showPagination && (
                    <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                      <span>
                        {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredProjects.length)}{' '}
                        –{' '}
                        {Math.min(currentPage * PAGE_SIZE, filteredProjects.length)} of{' '}
                        {filteredProjects.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-2 py-1 border border-gray-300 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-2 py-1 border border-gray-300 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Project List modal (from "Go to dashboard") */}
      {showProjectsModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowProjectsModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">Project List</h2>
              <button
                type="button"
                onClick={() => setShowProjectsModal(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 min-h-0">
              {sortedProjects.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  <p className="mb-3">No projects yet.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProjectsModal(false);
                      openCreate();
                    }}
                    className="text-sm font-medium text-[#0D9488] hover:text-[#0F766E]"
                  >
                    Create project
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {sortedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm border border-transparent hover:border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setShowProjectsModal(false);
                        primeProjectLandingState(project.id);
                        navigate(`/matflow/dashboard/${project.id}`);
                      }}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0D9488]/10 text-[#0D9488] text-xs font-semibold">
                        MF
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {project.name || 'Untitled project'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {project.description ||
                            `Updated ${new Date(
                              project.updatedAt || project.createdAt || Date.now()
                            ).toLocaleDateString()}`}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sample project modal (Browse examples) */}
      {showSampleModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => !sampleLoading && setShowSampleModal(false)}
        >
          <div
            className="bg-white rounded-[16px] shadow-2xl max-w-[440px] w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-[1.1rem] font-bold text-gray-800">Try a sample</h2>
              <button
                type="button"
                disabled={sampleLoading}
                onClick={() => setShowSampleModal(false)}
                className="p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-md transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {sampleError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {sampleError.error || sampleError.message || 'Failed to create sample project.'}
                </p>
              )}
              {[
                { type: 'classification', label: 'Classification', description: 'Sample dataset for classification tasks.', color: 'bg-[#149b82]' },
                { type: 'regression', label: 'Regression', description: 'Sample dataset for regression tasks.', color: 'bg-[#f59e0b]' },
                { type: 'graph', label: 'Graph', description: 'Sample dataset for graph workflows.', color: 'bg-[#8b5cf6]' },
              ].map(({ type, label, description, color }) => (
                <button
                  key={type}
                  type="button"
                  disabled={sampleLoading}
                  onClick={async () => {
                    setSampleError(null);
                    setSampleLoading(true);
                    try {
                      let created;
                      if (guest) {
                        // Guest flow: generate UUID, call guest endpoint, save to localStorage
                        const projectId = generateUUID();
                        created = await commonApi.projects.seedGuestSample(projectId, type);
                        if (created && created.id) {
                          const guestProject = {
                            ...created,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            is_favorite: false,
                          };
                          const existing = JSON.parse(localStorage.getItem(GUEST_PROJECTS_KEY) || '[]');
                          existing.push(guestProject);
                          localStorage.setItem(GUEST_PROJECTS_KEY, JSON.stringify(existing));
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
                        const isAuthError = typeof msg === 'string' && /auth|credentials|login|unauthorized/i.test(msg);
                        setSampleError(isAuthError ? { error: 'Please log in to continue.' } : (created || { error: 'Invalid response from server.' }));
                      }
                    } catch (err) {
                      const data = err?.response?.data || err?.data || {};
                      const msg = data.detail || data.error || data.message || err?.message;
                      const isAuthError = typeof msg === 'string' && /auth|credentials|login|unauthorized/i.test(msg);
                      setSampleError(isAuthError ? { error: 'Please log in to continue.' } : (data.error ? data : { error: msg || 'Failed to create sample project.' }));
                    } finally {
                      setSampleLoading(false);
                    }
                  }}
                  className="w-full text-left rounded-[10px] border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4"
                >
                  <div className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[8px] ${color} text-white font-bold text-lg`}>
                    {label.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-gray-800">{label}</p>
                    <p className="text-[13px] text-gray-500 mt-0.5">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-[16px] shadow-2xl max-w-[460px] w-full mx-4 flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-[#149b82] flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h2 className="text-[1.1rem] font-bold tracking-wide">
                  {modalTitle === 'Edit project' ? 'Edit Project' : 'Create New Project'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCancelModal}
                className="p-1 rounded-[6px] bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
                aria-label="Close"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label htmlFor="modal-project-name" className="flex items-center text-[15px] mb-2">
                  <span className="font-bold text-gray-900">Project Name</span>
                  <span className="ml-[10px] text-[11px] font-bold text-[#e14f4f] uppercase tracking-wider">Required</span>
                </label>
                <input
                  id="modal-project-name"
                  type="text"
                  placeholder="My project"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 text-[15px] border-[1.5px] border-[#149b82] rounded-[10px] focus:outline-none focus:ring-[1.5px] focus:ring-[#149b82] placeholder-gray-400 text-gray-800"
                />
              </div>
              <div>
                <label htmlFor="modal-project-description" className="flex items-center text-[15px] mb-2">
                  <span className="font-bold text-gray-900">Description</span>
                  <span className="ml-[10px] px-2.5 py-[3px] rounded-full bg-[#f1f5f9] text-[10px] font-bold text-slate-500 uppercase tracking-wider">Optional</span>
                </label>
                <textarea
                  id="modal-project-description"
                  placeholder="What is this project about?"
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-3 text-[15px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[10px] focus:outline-none focus:border-[#149b82] resize-none placeholder-gray-400 text-gray-800 transition-colors"
                />
              </div>
            </div>

            <div className="px-6 pb-6 pt-2 flex gap-3 justify-center items-center">
              <button
                type="button"
                onClick={handleCancelModal}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-[15px] text-white bg-[#dc3545] rounded-xl hover:bg-[#c82333] font-bold shadow-[0_4px_12px_rgba(220,53,69,0.35)] transition-all"
              >
                <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Cancel
              </button>
              <button
                type="button"
                onClick={modalPrimaryAction}
                disabled={!formName.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-[15px] rounded-xl font-bold transition-all disabled:bg-[#f1f5f9] disabled:text-[#94a3b8] disabled:border border-transparent disabled:border-[#e2e8f0] bg-[#149b82] text-white hover:bg-[#11846f] disabled:cursor-not-allowed shadow-sm disabled:shadow-none"
              >
                <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{modalTitle === 'Edit project' ? 'Save changes' : 'Create project'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={showDeleteModal && Boolean(projectToDelete)}
        onClose={() => {
          setShowDeleteModal(false);
          setProjectToDelete(null);
        }}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        itemName={projectToDelete?.name || 'Untitled'}
        itemTypeLabel="project"
      />
    </div>
  );
}

export default ProjectsPage;
