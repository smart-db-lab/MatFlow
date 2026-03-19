/**
 * Authentication utility functions
 * Manages JWT tokens and admin session state
 */

import { commonApi } from '../services/api/apiService';
import { isGuestMode, endGuestSession } from './guestSession';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const ADMIN_SESSION_KEY = 'adminSession';
const USER_EMAIL_KEY = 'userEmail';
const CURRENT_USER_TTL_MS = 5 * 60 * 1000;
let currentUserCache = null;
let currentUserCacheAt = 0;
let currentUserInFlight = null;

/** Custom event name dispatched whenever auth state changes (login, logout, etc.) */
export const AUTH_STATE_CHANGED_EVENT = 'auth:state-changed';

/**
 * Notify listeners (e.g. Navbar) that the auth state has changed.
 * Call this after any login, logout, or token change.
 */
export const notifyAuthStateChanged = () => {
  currentUserCache = null;
  currentUserCacheAt = 0;
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
};

export const clearCurrentUserCache = () => {
  currentUserCache = null;
  currentUserCacheAt = 0;
};

export const getCurrentUserCached = async ({ force = false } = {}) => {
  const now = Date.now();
  if (!force && currentUserCache && now - currentUserCacheAt < CURRENT_USER_TTL_MS) {
    return currentUserCache;
  }

  if (!force && currentUserInFlight) {
    return currentUserInFlight;
  }

  currentUserInFlight = (async () => {
    const data = await commonApi.auth.getCurrentUser();
    const user = data?.user || data || null;
    currentUserCache = user;
    currentUserCacheAt = Date.now();
    return user;
  })();

  try {
    return await currentUserInFlight;
  } finally {
    currentUserInFlight = null;
  }
};

/**
 * Get access token from localStorage
 * @returns {string|null}
 */
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get refresh token from localStorage
 * @returns {string|null}
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Set tokens in localStorage
 * @param {string} accessToken
 * @param {string} refreshToken
 */
export const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Clear tokens from localStorage
 */
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem('userLoggedIn');
  clearCurrentUserCache();
};

/**
 * Check if user is logged in (includes guest mode).
 * @returns {boolean}
 */
export const isLoggedIn = () => {
  return !!getAccessToken() || isGuestMode();
};

/**
 * Check if user is authenticated with a real account (NOT guest).
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

/**
 * Get the current user role.
 * @returns {"admin"|"user"|"guest"}
 */
export const getUserRole = () => {
  if (isGuestMode() && !getAccessToken()) return "guest";
  if (isAdminLoggedIn()) return "admin";
  if (getAccessToken()) return "user";
  return "guest";
};

/**
 * Check if admin is logged in
 * @returns {boolean}
 */
export const isAdminLoggedIn = () => {
  return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
};

/**
 * Set admin session
 * @param {boolean} value
 */
export const setAdminSession = (value) => {
  localStorage.setItem(ADMIN_SESSION_KEY, value ? 'true' : 'false');
};

/**
 * Get authorization header for API requests
 * @returns {Object}
 */
export const getAuthHeaders = () => {
  const token = getAccessToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Check admin status with backend
 * @returns {Promise<boolean>}
 */
export const checkAdminStatus = async () => {
  try {
    const token = getAccessToken();
    if (!token) {
      setAdminSession(false);
      return false;
    }

    try {
      const data = await commonApi.auth.getCurrentUser();

      // Detect auth failure responses — the API returns { detail: "..." } on 401
      // after apiFetch already tried (and failed) to refresh the token.
      if (!data || data.detail || data.code === 'token_not_valid') {
        // Tokens are stale/invalid — clear them so we stop retrying
        clearTokens();
        setAdminSession(false);
        return false;
      }

      if (data.is_superuser === true || data.is_staff === true) {
        setAdminSession(true);
        if (data.email) {
          localStorage.setItem(USER_EMAIL_KEY, data.email);
        }
        return true;
      }
      // User exists but is not admin — keep tokens, just return false
      setAdminSession(false);
      return false;
    } catch (error) {
      // If 401, try to refresh token
      if (error.response?.status === 401 || error.message?.includes('401')) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return await checkAdminStatus(); // Retry after refresh
        }
        // Refresh truly failed with a 401 — tokens are invalid
        clearTokens();
      }
      // For network errors, don't clear tokens — keep the session alive
      setAdminSession(false);
      return false;
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Refresh access token using refresh token
 * @returns {Promise<boolean>}
 */
export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const data = await commonApi.auth.refreshToken(refreshToken);
      
      if (data && data.access) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
        return true;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, message?: string, isAdmin?: boolean}>}
 */
export const login = async (email, password) => {
  try {
    const data = await commonApi.auth.login(email, password);

    if (data && data.success) {
      // Store tokens
      if (data.access && data.refresh) {
        setTokens(data.access, data.refresh);
      }
      
      // Store email
      if (data.email) {
        localStorage.setItem(USER_EMAIL_KEY, data.email);
      }
      
      // Set user logged in status
      localStorage.setItem('userLoggedIn', 'true');
      
      // Check if user is admin by fetching profile
      const isAdmin = await checkAdminStatus();

      // Notify listeners (Navbar, etc.) immediately
      notifyAuthStateChanged();
      
      return { 
        success: true, 
        message: data.message || 'Login successful',
        isAdmin: isAdmin
      };
    } else {
      return { 
        success: false, 
        message: data.error || data.message || 'Login failed' 
      };
    }
  } catch (error) {
    console.error('Error during login:', error);
    return { 
      success: false, 
      message: error.message || 'Network error. Please try again.' 
    };
  }
};

/**
 * Login through admin-only endpoint.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, message?: string, isAdmin?: boolean}>}
 */
export const adminLogin = async (email, password) => {
  try {
    const data = await commonApi.auth.adminLogin(email, password);

    if (data && data.success) {
      if (data.access && data.refresh) {
        setTokens(data.access, data.refresh);
      }

      if (data.email) {
        localStorage.setItem(USER_EMAIL_KEY, data.email);
      }

      localStorage.setItem('userLoggedIn', 'true');
      setAdminSession(true);
      notifyAuthStateChanged();

      return {
        success: true,
        message: data.message || 'Admin login successful',
        isAdmin: true,
      };
    }

    return {
      success: false,
      message: data.error || data.message || 'Login failed',
    };
  } catch (error) {
    console.error('Error during admin login:', error);
    return {
      success: false,
      message: error.message || 'Network error. Please try again.',
    };
  }
};

/**
 * Logout
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const logout = async () => {
  try {
    const refreshToken = getRefreshToken();
    
    // Clear tokens and guest session regardless of response
    clearTokens();
    endGuestSession();

    // Notify listeners (Navbar, etc.) immediately
    notifyAuthStateChanged();
    
    if (refreshToken) {
      try {
        const data = await commonApi.auth.logout(refreshToken);
        return { success: true, message: data?.message || 'Logout successful' };
      } catch (error) {
        // Ignore errors on logout - tokens already cleared
        console.error('Error during logout API call:', error);
      }
    }
    
    return { success: true, message: 'Logged out successfully' };
  } catch (error) {
    console.error('Error during logout:', error);
    clearTokens(); // Clear local tokens even if API call fails
    return { success: true, message: 'Logged out locally' };
  }
};

// Legacy function names for backward compatibility
export const adminLogout = logout;
