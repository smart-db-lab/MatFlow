/**
 * API Client with automatic token refresh
 * Wraps fetch to automatically handle 401 errors by refreshing the token.
 * When the server is unreachable (network error), clears tokens and dispatches auth:server-down
 * so the UI can show logged-out state immediately.
 * On 401 after refresh fails, shows a toast asking the user to log in.
 */

import { toast } from 'react-toastify';
import { getAuthHeaders, refreshAccessToken, clearTokens, getAccessToken } from './adminAuth';
import { isGuestMode, getGuestSessionId } from './guestSession';

/** Event name dispatched when server is unreachable and tokens were cleared */
export const AUTH_SERVER_DOWN_EVENT = 'auth:server-down';
let refreshPromise = null;

const waitForOngoingRefresh = async () => {
  if (!refreshPromise) return;
  try {
    await refreshPromise;
  } catch (_) {
    // Ignore refresh errors here; downstream request flow handles auth failures.
  }
};

/**
 * Check if an error is a network/server-unreachable error (e.g. connection refused)
 * @param {unknown} err
 * @returns {boolean}
 */
const isNetworkError = (err) => {
  if (!err || typeof err !== 'object') return false;
  const message = err.message || '';
  const name = err.name || '';
  return (
    message === 'Failed to fetch' ||
    name === 'TypeError' ||
    (typeof message === 'string' && message.toLowerCase().includes('network'))
  );
};

/**
 * Get CSRF token from cookies
 * @returns {string|null} CSRF token or null if not found
 */
const getCsrfToken = () => {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
};

/**
 * Fetch CSRF token from Django by making a GET request
 * This will set the CSRF cookie if it's not already set
 * @returns {Promise<string|null>} CSRF token or null
 */
const fetchCsrfToken = async () => {
  try {
    // Skip CSRF bootstrap for guest mode.
    if (!getAccessToken() || isGuestMode()) {
      return null;
    }

    const base = (import.meta.env.VITE_APP_API_URL || "").replace(/\/+$/, "");
    const endpoint = `${base}/api/csrf/`;
    await fetch(endpoint, {
      method: 'GET',
      credentials: 'include',
    });

    // Check if cookie was set
    const token = getCsrfToken();
    if (token) {
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
};

/**
 * Fetch wrapper that automatically refreshes token on 401 errors
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export const apiFetch = async (url, options = {}) => {
  // Check if body is FormData
  const isFormData = options.body instanceof FormData;

  // If another request is currently refreshing, wait for it first so this request
  // can use the newest token and avoid an expected transient 401.
  const guestActive = isGuestMode();
  if (!guestActive && getAccessToken() && refreshPromise) {
    await waitForOngoingRefresh();
  }

  // Build headers - don't set Content-Type for FormData (browser will set it with boundary)
  // In guest mode, NEVER send auth headers — even if stale tokens somehow remain in
  // localStorage, sending an expired JWT causes DRF to return 401 before AllowAny runs.
  const authHeaders = guestActive ? {} : getAuthHeaders();
  const headers = {
    ...authHeaders,
    ...options.headers,
  };

  // Add guest session header so the backend can identify guest temp storage
  if (guestActive) {
    const guestId = getGuestSessionId();
    if (guestId) {
      headers["X-Guest-Session"] = guestId;
    }
  }
  
  // Only set Content-Type for non-FormData requests
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Add CSRF token for Django
  let csrfToken = getCsrfToken();
  
  // If CSRF token is not found and this is a POST/PUT/DELETE/PATCH request, try to fetch it
  if (!csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || '')) {
    csrfToken = await fetchCsrfToken();
  }
  
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }

  try {
    // Make the initial request
    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    // If we get a 401 and we actually sent an auth token, try to refresh and retry.
    // Skip refresh logic entirely for guest/unauthenticated requests.
    if (response.status === 401 && !guestActive && getAccessToken()) {
      // Single-flight refresh: avoid parallel refresh calls racing each other.
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const refreshed = await refreshPromise;

      if (refreshed) {
        // Retry the request with the new token
        const newHeaders = {
          ...getAuthHeaders(),
          ...options.headers,
        };

        // Only set Content-Type for non-FormData requests
        if (!isFormData && !newHeaders['Content-Type']) {
          newHeaders['Content-Type'] = 'application/json';
        }

        // Add CSRF token again
        if (csrfToken) {
          newHeaders['X-CSRFToken'] = csrfToken;
        }

        response = await fetch(url, {
          ...options,
          headers: newHeaders,
          credentials: 'include',
        });
      } else {
        // Refresh failed — tokens are stale. Clear them so we stop retrying
        // on background polls. Only warn once (toastId deduplicates).
        clearTokens();
      }
    }

    return response;
  } catch (err) {
    // Server unreachable — don't clear tokens for temporary network glitches.
    // Only log a warning; the user can retry or tokens will refresh on next success.
    if (isNetworkError(err) && getAccessToken()) {
      console.warn('Network error while authenticated. Server may be temporarily unreachable.');
    }
    throw err;
  }
};

