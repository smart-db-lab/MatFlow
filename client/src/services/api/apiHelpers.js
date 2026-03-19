/**
 * API Helper Functions
 * Shared utilities for API service files
 */

import { apiFetch } from "../../util/apiClient";

const rawApiBaseUrl = import.meta.env.VITE_APP_API_URL || "http://localhost:9000";

// Accept either .../api or bare host in env, then normalize to bare host/base path.
export const API_BASE_URL = rawApiBaseUrl
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");

/**
 * Helper function to handle response parsing
 */
export const parseResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        const text = await response.text();
        if (!text) return {};
        try {
            // Sanitize NaN, Infinity, and -Infinity before parsing (invalid JSON)
            const sanitized = text
                .replace(/:\s*NaN\b/g, ": null")
                .replace(/:\s*Infinity\b/g, ": null")
                .replace(/:\s*-Infinity\b/g, ": null");
            return JSON.parse(sanitized);
        } catch (e) {
            console.error("Failed to parse JSON:", e);
            console.error("Original text:", text.substring(0, 500));
            return { error: "Failed to parse response" };
        }
    }

    if (contentType.includes("image/")) {
        return response;
    }

    return response;
};

/**
 * Extract a readable API error message from a parsed payload.
 */
export const extractApiErrorMessage = (
    data,
    fallback = "Request failed. Please check your input and try again.",
) => {
    if (!data) return fallback;
    if (typeof data === "string") return data;
    if (typeof data?.error === "string" && data.error.trim()) {
        if (typeof data?.details === "string" && data.details.trim()) {
            return `${data.error} ${data.details}`;
        }
        return data.error;
    }
    if (typeof data?.detail === "string" && data.detail.trim()) {
        return data.detail;
    }
    return fallback;
};

/**
 * Build an Error object from API payload + HTTP metadata.
 */
export const createApiError = (response, data, fallbackMessage) => {
    const message = extractApiErrorMessage(data, fallbackMessage);
    const err = new Error(message);
    err.status = response?.status;
    err.data = data;
    return err;
};

/**
 * Helper function to handle BaseViewSet response format
 */
export const extractData = (responseData) => {
    if (responseData.success && responseData.data) {
        return responseData.data;
    }
    if (Array.isArray(responseData)) {
        return responseData;
    }
    return responseData;
};
