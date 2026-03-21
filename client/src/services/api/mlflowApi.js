/**
 * MLflow Common API
 * Shared APIs for MLflow platform (auth, articles, services, landing)
 */

import { apiFetch } from "../../util/apiClient";
import { API_BASE_URL, parseResponse, extractData } from "./apiHelpers";

// Helper to append service_key query parameter
const withServiceKey = (baseUrl, serviceKey) => {
    const key = serviceKey || "mlflow";
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}service_key=${encodeURIComponent(key)}`;
};

export const mlflowApi = {
    // ========== Authentication ==========
    auth: {
        login: async (email, password) => {
            const response = await apiFetch(`${API_BASE_URL}/api/auth/login/`, {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            return await parseResponse(response);
        },

        adminLogin: async (email, password) => {
            const response = await apiFetch(`${API_BASE_URL}/api/auth/admin/login/`, {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            return await parseResponse(response);
        },

        signup: async (first_name, last_name, email, password) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/auth/signup/`,
                {
                    method: "POST",
                    body: JSON.stringify({ first_name, last_name, email, password }),
                },
            );
            return await parseResponse(response);
        },

        verifyCode: async (email, code) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/auth/verify-otp/`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        email,
                        code,
                        purpose: "registration",
                    }),
                },
            );
            return await parseResponse(response);
        },

        resendVerificationOtp: async (email) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/auth/resend-otp/`,
                {
                    method: "POST",
                    body: JSON.stringify({ email }),
                },
            );
            return await parseResponse(response);
        },

        forgotPassword: async (email) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/auth/forgot-password/`,
                {
                    method: "POST",
                    body: JSON.stringify({ email }),
                },
            );
            return await parseResponse(response);
        },

        verifyForgotPasswordOtp: async (email, code) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/auth/verify-forgot-password-otp/`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        email,
                        code,
                        purpose: "password_reset",
                    }),
                },
            );
            return await parseResponse(response);
        },

        resetPassword: async (token, newPassword, confirmPassword) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/auth/reset-password/`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        token,
                        new_password: newPassword,
                        confirm_password: confirmPassword,
                    }),
                },
            );
            return await parseResponse(response);
        },

        logout: async (refreshToken) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/auth/logout/`,
                {
                    method: "POST",
                    body: JSON.stringify({ refresh_token: refreshToken }),
                },
            );
            return await parseResponse(response);
        },

        getCurrentUser: async () => {
            const response = await apiFetch(`${API_BASE_URL}/api/auth/users/me/`);
            return await parseResponse(response);
        },

        updateCurrentUser: async (payload) => {
            // If payload is FormData, send as-is; otherwise stringify JSON
            const body =
                payload instanceof FormData ? payload : JSON.stringify(payload);
            const response = await apiFetch(`${API_BASE_URL}/api/auth/users/me/`, {
                method: "PUT",
                body: body,
            });
            return await parseResponse(response);
        },

        refreshToken: async (refreshToken) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/auth/token/refresh/`,
                {
                    method: "POST",
                    body: JSON.stringify({ refresh: refreshToken }),
                },
            );
            return await parseResponse(response);
        },
    },

    // ========== Articles/Publications ==========
    articles: {
        getJournals: async () => {
            const response = await apiFetch(`${API_BASE_URL}/api/journals/`);
            const data = await parseResponse(response);
            return extractData(data);
        },

        getConferences: async () => {
            const response = await apiFetch(`${API_BASE_URL}/api/conferences/`);
            const data = await parseResponse(response);
            return extractData(data);
        },

        getBooks: async () => {
            const response = await apiFetch(`${API_BASE_URL}/api/books/`);
            const data = await parseResponse(response);
            return extractData(data);
        },

        getPatents: async () => {
            const response = await apiFetch(`${API_BASE_URL}/api/patents/`);
            const data = await parseResponse(response);
            return extractData(data);
        },

        getDatasets: async () => {
            const response = await apiFetch(`${API_BASE_URL}/api/datasets/`);
            const data = await parseResponse(response);
            return extractData(data);
        },

        createJournal: async (data) => {
            const response = await apiFetch(`${API_BASE_URL}/api/journals/`, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return await parseResponse(response);
        },

        createConference: async (data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/conferences/`,
                {
                    method: "POST",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        createBook: async (data) => {
            const response = await apiFetch(`${API_BASE_URL}/api/books/`, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return await parseResponse(response);
        },

        createPatent: async (data) => {
            const response = await apiFetch(`${API_BASE_URL}/api/patents/`, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return await parseResponse(response);
        },

        createDataset: async (data, file = null) => {
            let requestBody;
            let headers = {};

            if (file) {
                requestBody = data; // FormData
                // Don't set Content-Type for FormData
            } else {
                requestBody = JSON.stringify(data);
                headers["Content-Type"] = "application/json";
            }

            const response = await apiFetch(`${API_BASE_URL}/api/datasets/`, {
                method: "POST",
                headers,
                body: requestBody,
            });
            return await parseResponse(response);
        },

        updateJournal: async (id, data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/journals/${id}/`,
                {
                    method: "PUT",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        updateConference: async (id, data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/conferences/${id}/`,
                {
                    method: "PUT",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        updateBook: async (id, data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/books/${id}/`,
                {
                    method: "PUT",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        updatePatent: async (id, data) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/patents/${id}/`,
                {
                    method: "PUT",
                    body: JSON.stringify(data),
                },
            );
            return await parseResponse(response);
        },

        updateDataset: async (id, data, file = null) => {
            let requestBody;
            let headers = {};

            if (file) {
                requestBody = data; // FormData
            } else {
                requestBody = JSON.stringify(data);
                headers["Content-Type"] = "application/json";
            }

            const response = await apiFetch(
                `${API_BASE_URL}/api/datasets/${id}/`,
                {
                    method: "PUT",
                    headers,
                    body: requestBody,
                },
            );
            return await parseResponse(response);
        },

        deleteJournal: async (id) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/journals/${id}/`,
                {
                    method: "DELETE",
                },
            );
            return response.ok || response.status === 204;
        },

        deleteConference: async (id) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/conferences/${id}/`,
                {
                    method: "DELETE",
                },
            );
            return response.ok || response.status === 204;
        },

        deleteBook: async (id) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/books/${id}/`,
                {
                    method: "DELETE",
                },
            );
            return response.ok || response.status === 204;
        },

        deletePatent: async (id) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/patents/${id}/`,
                {
                    method: "DELETE",
                },
            );
            return response.ok || response.status === 204;
        },

        deleteDataset: async (id) => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/datasets/${id}/`,
                {
                    method: "DELETE",
                },
            );
            return response.ok || response.status === 204;
        },
    },

    // ========== Services (service-scoped) ==========
    services: {
        getAll: async (serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/our-services/`,
                serviceKey,
            );
            const response = await apiFetch(url);
            const data = await parseResponse(response);
            return extractData(data);
        },

        create: async (formData, serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/our-services/`,
                serviceKey,
            );
            const response = await apiFetch(url, {
                method: "POST",
                body: formData,
            });
            return await parseResponse(response);
        },

        update: async (id, formData, serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/our-services/${id}/`,
                serviceKey,
            );
            const response = await apiFetch(url, {
                method: "PATCH",
                body: formData,
            });
            return await parseResponse(response);
        },

        delete: async (id, serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/our-services/${id}/`,
                serviceKey,
            );
            const response = await apiFetch(url, {
                method: "DELETE",
            });
            return response.ok || response.status === 204;
        },
    },

    // ========== Landing Page Content (service-scoped) ==========
    landing: {
        getHeroImages: async (serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/hero-image/`,
                serviceKey,
            );
            const response = await apiFetch(url);
            const data = await parseResponse(response);
            return extractData(data);
        },

        getHeaderSection: async (serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/header-section/`,
                serviceKey,
            );
            const response = await apiFetch(url);
            const data = await parseResponse(response);
            const extracted = extractData(data);
            return Array.isArray(extracted) && extracted.length > 0
                ? extracted[0]
                : null;
        },

        getSupportLogos: async (serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/support-logo/`,
                serviceKey,
            );
            const response = await apiFetch(url);
            const data = await parseResponse(response);
            return extractData(data);
        },

        createHeroImage: async (formData, serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/hero-image/`,
                serviceKey,
            );
            const response = await apiFetch(url, {
                method: "POST",
                body: formData,
            });
            return await parseResponse(response);
        },

        updateHeroImage: async (id, formData, serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/hero-image/${id}/`,
                serviceKey,
            );
            const response = await apiFetch(url, {
                method: "PATCH",
                body: formData,
            });
            return await parseResponse(response);
        },

        deleteHeroImage: async (id, serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/hero-image/${id}/`,
                serviceKey,
            );
            const response = await apiFetch(url, {
                method: "DELETE",
            });
            return response.ok || response.status === 204;
        },

        createSupportLogo: async (formData, serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/support-logo/`,
                serviceKey,
            );
            const response = await apiFetch(url, {
                method: "POST",
                body: formData,
            });
            return await parseResponse(response);
        },

        updateSupportLogo: async (id, formData, serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/support-logo/${id}/`,
                serviceKey,
            );
            const response = await apiFetch(url, {
                method: "PATCH",
                body: formData,
            });
            return await parseResponse(response);
        },

        deleteSupportLogo: async (id, serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/support-logo/${id}/`,
                serviceKey,
            );
            const response = await apiFetch(url, {
                method: "DELETE",
            });
            return response.ok || response.status === 204;
        },

        createHeaderSection: async (formData, serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/header-section/`,
                serviceKey,
            );
            // If formData is not FormData, stringify it for JSON request
            const body =
                formData instanceof FormData
                    ? formData
                    : JSON.stringify(formData);
            const response = await apiFetch(url, {
                method: "POST",
                body: body,
            });
            return await parseResponse(response);
        },

        updateHeaderSection: async (id, formData, serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/header-section/${id}/`,
                serviceKey,
            );
            // If formData is not FormData, stringify it for JSON request
            const body =
                formData instanceof FormData
                    ? formData
                    : JSON.stringify(formData);
            const response = await apiFetch(url, {
                method: "PATCH",
                body: body,
            });
            return await parseResponse(response);
        },
    },

    // ========== FAQ ==========
    faq: {
        getAll: async (serviceKey = "mlflow") => {
            const url = withServiceKey(`${API_BASE_URL}/api/faq/`, serviceKey);
            const response = await apiFetch(url);
            const data = await parseResponse(response);
            return extractData(data);
        },

        create: async (faqData, serviceKey = "mlflow") => {
            const url = withServiceKey(`${API_BASE_URL}/api/faq/`, serviceKey);
            const response = await apiFetch(url, {
                method: "POST",
                body: JSON.stringify(faqData),
            });
            return await parseResponse(response);
        },

        update: async (id, faqData, serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/faq/${id}/`,
                serviceKey,
            );
            const response = await apiFetch(url, {
                method: "PATCH",
                body: JSON.stringify(faqData),
            });
            return await parseResponse(response);
        },

        delete: async (id, serviceKey = "mlflow") => {
            const url = withServiceKey(
                `${API_BASE_URL}/api/faq/${id}/`,
                serviceKey,
            );
            const response = await apiFetch(url, {
                method: "DELETE",
            });
            return response.ok || response.status === 204;
        },
    },

    // ========== Visitor Tracking ==========
    visitors: {
        trackVisit: async (visitorId, visitorType = "guest") => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/track-visit/`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        visitor_id: visitorId,
                        visitor_type: visitorType,
                    }),
                },
            );
            return await parseResponse(response);
        },

        getStats: async () => {
            const response = await apiFetch(
                `${API_BASE_URL}/api/visitor-stats/`,
            );
            return await parseResponse(response);
        },
    },
};
