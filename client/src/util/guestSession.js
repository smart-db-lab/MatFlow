/**
 * Guest Session Utilities
 * Manages guest mode state and session ID in localStorage.
 */

// Event name must match the one in adminAuth.js — defined inline to avoid circular imports
const AUTH_STATE_CHANGED = 'auth:state-changed';

const GUEST_MODE_KEY = "guestMode";
const GUEST_SESSION_ID_KEY = "guestSessionId";

/**
 * Generate a UUID v4
 * @returns {string}
 */
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Start a guest session — sets guestMode flag and generates a session ID.
 * Clears any existing auth tokens so stale JWTs don't cause 401s on
 * AllowAny endpoints (DRF rejects expired tokens before checking permissions).
 */
export const startGuestSession = () => {
  // Clear stale auth tokens — guest mode and authenticated mode are mutually exclusive
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("adminSession");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userLoggedIn");

  localStorage.setItem(GUEST_MODE_KEY, "true");
  const sessionId = generateUUID();
  localStorage.setItem(GUEST_SESSION_ID_KEY, sessionId);

  // Notify listeners (Navbar, etc.) immediately
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED));

  return sessionId;
};

/**
 * Check if the app is currently in guest mode.
 * @returns {boolean}
 */
export const isGuestMode = () => {
  return localStorage.getItem(GUEST_MODE_KEY) === "true";
};

/**
 * Get the current guest session ID.
 * @returns {string|null}
 */
export const getGuestSessionId = () => {
  return localStorage.getItem(GUEST_SESSION_ID_KEY);
};

/**
 * End the guest session — clears guest-related data from localStorage.
 */
export const endGuestSession = () => {
  localStorage.removeItem(GUEST_MODE_KEY);
  localStorage.removeItem(GUEST_SESSION_ID_KEY);

  // Notify listeners (Navbar, etc.) immediately
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED));
};
