/**
 * projectsApi.js
 * ──────────────
 * REST client for the Projects + Workspaces backend endpoints.
 *
 * Backend URLs (from projects/urls.py):
 *   GET  /api/projects/                       – list user projects
 *   POST /api/projects/                       – create project
 *   GET  /api/projects/<id>/                  – retrieve project
 *   PATCH/PUT /api/projects/<id>/             – update project
 *   DELETE    /api/projects/<id>/             – delete project
 *
 *   GET  /api/projects/<id>/workspaces/       – list workspaces
 *   POST /api/projects/<id>/workspaces/       – create workspace (no file)
 *   GET  /api/projects/<id>/workspaces/<wid>/ – retrieve workspace
 *   DELETE /api/projects/<id>/workspaces/<wid>/ – delete workspace
 *
 *   POST /api/projects/<id>/workspaces/upload/ – upload dataset → new workspace
 */

import { apiFetch } from "../../util/apiClient";
import { API_BASE_URL, parseResponse } from "./apiHelpers";

// Normalise the root so it always ends without a trailing slash
const BASE = (API_BASE_URL || "").replace(/\/api\/?$/, "");

/**
 * Thin wrapper that throws on non-2xx responses with the parsed error message.
 */
async function _call(path, options = {}) {
    const url = `${BASE}${path}`;
    const res = await apiFetch(url, options);
    const data = await parseResponse(res);
    if (!res.ok) {
        const msg =
            (typeof data === "object" && (data?.detail || data?.error)) ||
            `HTTP ${res.status}`;
        const err = new Error(msg);
        err.data = data;
        throw err;
    }
    return data;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export const projectsApi = {
    // ── List all projects owned by the logged-in user ──────────────────────
    listProjects: () => _call("/api/projects/"),

    // ── Create a new project ───────────────────────────────────────────────
    createProject: ({ name, description = "", is_favorite = false }) =>
        _call("/api/projects/", {
            method: "POST",
            body: JSON.stringify({ name, description, is_favorite }),
        }),

    // ── Get a single project ───────────────────────────────────────────────
    getProject: (projectId) => _call(`/api/projects/${projectId}/`),

    // ── Update a project ───────────────────────────────────────────────────
    updateProject: (projectId, fields) =>
        _call(`/api/projects/${projectId}/`, {
            method: "PATCH",
            body: JSON.stringify(fields),
        }),

    // ── Delete a project (also removes all workspaces from disk) ──────────
    deleteProject: (projectId) =>
        _call(`/api/projects/${projectId}/`, { method: "DELETE" }),

    // ── Toggle favourite ───────────────────────────────────────────────────
    toggleFavorite: (projectId, is_favorite) =>
        _call(`/api/projects/${projectId}/`, {
            method: "PATCH",
            body: JSON.stringify({ is_favorite }),
        }),

    // ─── Workspaces ────────────────────────────────────────────────────────

    // ── List workspaces in a project ───────────────────────────────────────
    // Served by the ProjectViewSet `workspaces` action:
    //   GET /api/projects/<id>/workspaces/
    listWorkspaces: (projectId) =>
        _call(`/api/projects/${projectId}/workspaces/`),

    // ── Get a single workspace ─────────────────────────────────────────────
    // Served by the WorkspaceViewSet router: GET /api/workspaces/<wid>/
    getWorkspace: (_projectId, workspaceId) =>
        _call(`/api/workspaces/${workspaceId}/`),

    // ── Delete a workspace (also removes its folder from disk) ────────────
    // Served by the WorkspaceViewSet router: DELETE /api/workspaces/<wid>/
    deleteWorkspace: (_projectId, workspaceId) =>
        _call(`/api/workspaces/${workspaceId}/`, { method: "DELETE" }),

    /**
     * Upload a CSV/Excel file and create a new workspace in one step.
     *
     * @param {string}      projectId  – UUID of the target project
     * @param {File}        file       – the dataset file (CSV / Excel)
     * @param {string}      [name]     – optional workspace name (defaults to
     *                                   "<stem>_<timestamp>" on the backend)
     * @returns {Promise<Workspace>}   – the created workspace record
     */
    uploadDataset: async (projectId, file, name) => {
        const form = new FormData();
        form.append("file", file);
        if (name) form.append("name", name);
        return _call(`/api/projects/${projectId}/workspaces/upload/`, {
            method: "POST",
            // Let the browser set the multipart boundary
            headers: {},
            body: form,
        });
    },

    /**
     * List the generated datasets saved in a workspace's output folder.
     *
     * @param {string} _projectId  (unused – kept for consistent call signature)
     * @param {string} workspaceId
     */
    listGeneratedDatasets: async (_projectId, workspaceId) => {
        const ws = await projectsApi.getWorkspace(null, workspaceId);
        return ws.generated_datasets ?? [];
    },
};

export default projectsApi;
