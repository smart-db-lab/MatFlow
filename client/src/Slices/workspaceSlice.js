/**
 * workspaceSlice.js
 * -----------------
 * Manages the active Project / Workspace context so that all feature
 * engineering, EDA, and model views can send { workspace_id, filename }
 * to the backend instead of embedding raw CSV rows in every request.
 *
 * Shape:
 *   {
 *     projects         : Project[]       – full list owned by current user
 *     activeProjectId  : string | null
 *     activeWorkspaceId: string | null
 *     activeFilename   : string | null   – dataset filename within the workspace
 *     loading          : boolean
 *     error            : string | null
 *   }
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { projectsApi } from "../services/api/projectsApi";

// ─── Async thunks ────────────────────────────────────────────────────────────

export const fetchProjects = createAsyncThunk(
    "workspace/fetchProjects",
    async (_, { rejectWithValue }) => {
        try {
            return await projectsApi.listProjects();
        } catch (err) {
            return rejectWithValue(err.message || "Failed to load projects");
        }
    },
);

export const createProject = createAsyncThunk(
    "workspace/createProject",
    async ({ name, description = "" }, { rejectWithValue }) => {
        try {
            return await projectsApi.createProject({ name, description });
        } catch (err) {
            return rejectWithValue(err.message || "Failed to create project");
        }
    },
);

export const deleteProject = createAsyncThunk(
    "workspace/deleteProject",
    async (projectId, { rejectWithValue }) => {
        try {
            await projectsApi.deleteProject(projectId);
            return projectId;
        } catch (err) {
            return rejectWithValue(err.message || "Failed to delete project");
        }
    },
);

export const fetchWorkspaces = createAsyncThunk(
    "workspace/fetchWorkspaces",
    async (projectId, { rejectWithValue }) => {
        try {
            return await projectsApi.listWorkspaces(projectId);
        } catch (err) {
            return rejectWithValue(err.message || "Failed to load workspaces");
        }
    },
);

export const uploadWorkspace = createAsyncThunk(
    "workspace/uploadWorkspace",
    async ({ projectId, file, name }, { rejectWithValue }) => {
        try {
            return await projectsApi.uploadDataset(projectId, file, name);
        } catch (err) {
            return rejectWithValue(err.message || "Failed to upload dataset");
        }
    },
);

export const deleteWorkspace = createAsyncThunk(
    "workspace/deleteWorkspace",
    async ({ projectId, workspaceId }, { rejectWithValue }) => {
        try {
            await projectsApi.deleteWorkspace(projectId, workspaceId);
            return workspaceId;
        } catch (err) {
            return rejectWithValue(err.message || "Failed to delete workspace");
        }
    },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const workspaceSlice = createSlice({
    name: "workspace",
    initialState: {
        /** Full list of projects returned by the API */
        projects: [],
        /** Workspaces for the currently selected project */
        workspaces: [],
        activeProjectId: null,
        activeWorkspaceId: null,
        /** Filename of the dataset in use within the active workspace */
        activeFilename: null,
        loading: false,
        error: null,
    },
    reducers: {
        setActiveProject(state, { payload }) {
            state.activeProjectId = payload;
            // Clear workspace context when switching projects
            state.activeWorkspaceId = null;
            state.activeFilename = null;
            state.workspaces = [];
        },
        setActiveWorkspace(state, { payload: { workspaceId, filename } }) {
            state.activeWorkspaceId = workspaceId;
            state.activeFilename = filename || null;
        },
        setActiveFilename(state, { payload }) {
            state.activeFilename = payload;
        },
        clearWorkspaceContext(state) {
            state.activeWorkspaceId = null;
            state.activeFilename = null;
        },
        clearError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // ── fetchProjects ──
        builder
            .addCase(fetchProjects.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjects.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.projects = payload;
            })
            .addCase(fetchProjects.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            });

        // ── createProject ──
        builder
            .addCase(createProject.fulfilled, (state, { payload }) => {
                state.projects.push(payload);
            })
            .addCase(createProject.rejected, (state, { payload }) => {
                state.error = payload;
            });

        // ── deleteProject ──
        builder
            .addCase(
                deleteProject.fulfilled,
                (state, { payload: projectId }) => {
                    state.projects = state.projects.filter(
                        (p) => p.id !== projectId,
                    );
                    if (state.activeProjectId === projectId) {
                        state.activeProjectId = null;
                        state.activeWorkspaceId = null;
                        state.activeFilename = null;
                        state.workspaces = [];
                    }
                },
            )
            .addCase(deleteProject.rejected, (state, { payload }) => {
                state.error = payload;
            });

        // ── fetchWorkspaces ──
        builder
            .addCase(fetchWorkspaces.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkspaces.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.workspaces = payload;
            })
            .addCase(fetchWorkspaces.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            });

        // ── uploadWorkspace ──
        builder
            .addCase(uploadWorkspace.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(uploadWorkspace.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.workspaces.push(payload);
                // Auto-select the newly created workspace
                state.activeWorkspaceId = payload.id;
                state.activeFilename = payload.dataset_filename;
            })
            .addCase(uploadWorkspace.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            });

        // ── deleteWorkspace ──
        builder
            .addCase(
                deleteWorkspace.fulfilled,
                (state, { payload: workspaceId }) => {
                    state.workspaces = state.workspaces.filter(
                        (w) => w.id !== workspaceId,
                    );
                    if (state.activeWorkspaceId === workspaceId) {
                        state.activeWorkspaceId = null;
                        state.activeFilename = null;
                    }
                },
            )
            .addCase(deleteWorkspace.rejected, (state, { payload }) => {
                state.error = payload;
            });
    },
});

export const {
    setActiveProject,
    setActiveWorkspace,
    setActiveFilename,
    clearWorkspaceContext,
    clearError,
} = workspaceSlice.actions;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectActiveWorkspaceId = (state) =>
    state.workspace.activeWorkspaceId;
export const selectActiveFilename = (state) => state.workspace.activeFilename;
export const selectActiveProjectId = (state) => state.workspace.activeProjectId;
export const selectProjects = (state) => state.workspace.projects;
export const selectWorkspaces = (state) => state.workspace.workspaces;
export const selectWorkspaceLoading = (state) => state.workspace.loading;
export const selectWorkspaceError = (state) => state.workspace.error;

/** Returns { workspace_id, filename } – the minimal context for every API call */
export const selectWorkspaceContext = (state) => ({
    workspace_id: state.workspace.activeWorkspaceId,
    filename: state.workspace.activeFilename,
});

export default workspaceSlice.reducer;
