import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  isLoggedIn,
  isAuthenticated,
  checkAdminStatus,
  isAdminLoggedIn,
} from "../util/adminAuth";
import { isGuestMode } from "../util/guestSession";

/**
 * AdminRoute — only allows admin users through.
 * Non-admins are redirected to /admin with a ?redirect= param.
 */
export function AdminRoute({ children }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (isAuthenticated()) {
        const admin = await checkAdminStatus();
        setIsAdmin(admin || isAdminLoggedIn());
      } else {
        setIsAdmin(false);
      }
      setChecking(false);
    };
    verify();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-btn"></div>
      </div>
    );
  }

  if (!isAdmin) {
    const redirectUrl = `/admin?redirect=${encodeURIComponent(
      location.pathname
    )}`;
    return <Navigate to={redirectUrl} replace />;
  }

  return children;
}

/**
 * AuthRoute — allows authenticated users and guests.
 * Unauthenticated visitors (no account, not guest) are redirected to /login
 * with a ?redirect= param so they return after login.
 */
export function AuthRoute({ children }) {
  const location = useLocation();

  if (!isLoggedIn() && !isGuestMode()) {
    const redirectUrl = `/login?redirect=${encodeURIComponent(
      location.pathname
    )}`;
    return <Navigate to={redirectUrl} replace />;
  }

  return children;
}
