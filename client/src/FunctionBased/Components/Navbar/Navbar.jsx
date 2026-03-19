import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, LayoutDashboard, LogOut, Blocks, BookOpen, Database } from "lucide-react";
import { isLoggedIn, isAuthenticated, isAdminLoggedIn, getCurrentUserCached, logout, AUTH_STATE_CHANGED_EVENT } from "../../../util/adminAuth";
import { isGuestMode, endGuestSession } from "../../../util/guestSession";
import { serviceAdminApi } from "../../../services/api/apiService";
import { accountMenuStyles, getRoleBadgeClass } from "../Common/accountMenuStyles";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMatflowPage = location.pathname === '/matflow';
  const isProjectsPage =
    location.pathname === '/projects' ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/matflow/dashboard');
  const settingsOrigin = isProjectsPage ? "dashboard" : "landing";
  const isDashboardPage = location.pathname === '/admin-dashboard';
  const isMatflowContext = isMatflowPage || isProjectsPage || location.state?.fromMatflow || false;
  const [isLoggedInState, setIsLoggedInState] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [headerSection, setHeaderSection] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userData, setUserData] = useState(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const profileDropdownRef = useRef(null);
  const isUserAuthenticated = isAuthenticated();
  const withAvatarCacheBust = (user) => {
    if (!user?.profile_image_url) return user;
    const separator = user.profile_image_url.includes("?") ? "&" : "?";
    return { ...user, profile_image_url: `${user.profile_image_url}${separator}t=${Date.now()}` };
  };

  const fetchHeaderSection = async (serviceKey) => {
    try {
      const data = await serviceAdminApi.landing.getHeaderSection(serviceKey);
      setHeaderSection(data);
    } catch (error) {
      console.error('Error fetching header section:', error);
    }
  };

  useEffect(() => {
    const serviceKey = isMatflowContext ? "matflow" : "mlflow";
    const load = () => fetchHeaderSection(serviceKey);
    load();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') load();
    };
    const handleFocus = () => load();
    const handleHeaderUpdate = () => load();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('headerSectionUpdated', handleHeaderUpdate);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('headerSectionUpdated', handleHeaderUpdate);
    };
  }, [isMatflowContext]);

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = isLoggedIn();
      setIsLoggedInState(loggedIn);

      if (isAuthenticated()) {
        try {
          const user = await getCurrentUserCached();
          const adminStatus = Boolean(user?.is_superuser || user?.is_staff);
          setIsAdmin(adminStatus || isAdminLoggedIn());
        } catch {
          setIsAdmin(isAdminLoggedIn());
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAuth();

    window.addEventListener(AUTH_STATE_CHANGED_EVENT, checkAuth);
    return () => {
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, checkAuth);
    };
  }, []);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [userData?.profile_image_url]);

  useEffect(() => {
    const fetchUserData = async (force = false) => {
      if (!isAuthenticated()) {
        setUserData(null);
        return;
      }
      try {
        const user = await getCurrentUserCached({ force });
        setUserData(withAvatarCacheBust(user || null));
      } catch {
        setUserData(null);
      }
    };

    fetchUserData();
    const handleProfileUpdated = () => fetchUserData(true);
    const handleAuthChanged = () => fetchUserData(true);
    window.addEventListener("profileUpdated", handleProfileUpdated);
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChanged);

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdated);
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChanged);
    };
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < 100 || currentScrollY < lastScrollY);
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowProfileDropdown(false);
    await logout();
    endGuestSession();
    setIsLoggedInState(false);
    setIsAdmin(false);
    navigate('/login');
  };

  const defaultBrand = isMatflowContext ? 'MATFLOW' : 'MLFLOW';
  const brandName = headerSection?.title || defaultBrand;
  const homeLink = isMatflowContext ? '/matflow' : '/';
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAdminLoginPage = location.pathname === '/admin' || location.pathname === '/admin-login';
  const baseUrl = import.meta.env.VITE_APP_API_URL || 'http://localhost:9000';
  const titleImageUrl = headerSection?.title_image
    ? (headerSection.title_image.startsWith('http') ? headerSection.title_image : `${baseUrl}${headerSection.title_image}`)
    : null;

  const scrollToSection = (sectionId) => {
    if (isLandingPage) {
      const element = document.getElementById(sectionId);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navLinkClass = "relative px-3 py-2 font-medium text-gray-700 hover:text-primary transition-colors duration-200 group";
  const tabIconWrapClass = "w-5 h-5 rounded-md flex items-center justify-center border border-primary/20 bg-primary/10 group-hover:bg-primary/15 transition-colors";
  const tabIconClass = "w-3.5 h-3.5 text-primary";

  const getCustomDisplayName = () => {
    const username = userData?.username?.trim();
    const emailLocal = userData?.email?.split("@")[0]?.trim();
    if (!username) return "";
    if (!emailLocal) return username;
    return username.toLowerCase() !== emailLocal.toLowerCase() ? username : "";
  };

  const getDisplayName = () => {
    const customDisplayName = getCustomDisplayName();
    if (customDisplayName) return customDisplayName;
    const firstName = userData?.first_name?.trim();
    if (firstName) return firstName;
    const fullName = userData?.full_name?.trim();
    if (fullName) return fullName;
    const username = userData?.username?.trim();
    if (username) return username;
    if (userData?.email) return userData.email.split("@")[0];
    return "User";
  };

  const getInitials = () => {
    const displayName = getDisplayName();
    if (displayName) {
      const names = displayName.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return displayName.charAt(0).toUpperCase();
    }
    if (userData?.email) return userData.email.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <nav
      className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
    >
      <div className={`relative flex justify-between items-center py-2.5 w-full ${isDashboardPage ? 'px-4' : 'px-6 lg:max-w-[1400px] lg:mx-auto'}`}>
        {/* Left zone — Brand */}
        <div className="text-2xl font-bold shrink-0">
          <Link to={homeLink} className="flex items-center hover:opacity-80 transition-opacity duration-200">
            {titleImageUrl ? (
              <img
                src={titleImageUrl}
                alt={brandName}
                className="h-10 md:h-12 lg:h-14 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const parent = e.target.parentElement;
                  if (parent && !parent.querySelector('span.fallback-text')) {
                    const textElement = document.createElement('span');
                    textElement.textContent = brandName;
                    textElement.className = 'fallback-text font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary-dark to-primary';
                    parent.appendChild(textElement);
                  }
                }}
              />
            ) : (
              <span className="font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary-dark to-primary">{brandName}</span>
            )}
          </Link>
        </div>

        {/* Center zone — Section links (landing page) */}
        {isLandingPage && (
          <div className="hidden sm:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <button onClick={() => scrollToSection('services')} className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <span className={tabIconWrapClass}>
                  <Blocks className={tabIconClass} size={14} strokeWidth={2.2} />
                </span>
                <span>Services</span>
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
            </button>
            <button onClick={() => scrollToSection('publications')} className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <span className={tabIconWrapClass}>
                  <BookOpen className={tabIconClass} size={14} strokeWidth={2.2} />
                </span>
                <span>Publications</span>
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
            </button>
            <button onClick={() => scrollToSection('datasets')} className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <span className={tabIconWrapClass}>
                  <Database className={tabIconClass} size={14} strokeWidth={2.2} />
                </span>
                <span>Dataset</span>
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
            </button>
          </div>
        )}

        {/* Right zone — Auth + actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!isLoggedInState && (
            isAuthPage ? (
              <button
                onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
                className="px-3 py-2 font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                &larr; Go Back
              </button>
            ) : (
              isAdminLoginPage ? (
                <Link
                  to="/"
                  className="relative flex items-center gap-1.5 px-3 py-2 font-medium text-gray-700 hover:text-primary transition-colors duration-200 group"
                >
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776 12 3l8.25 6.776V20.25a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75V16.5a2.25 2.25 0 0 0-4.5 0v3.75a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75V9.776Z" />
                  </svg>
                  <span>Home</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="relative flex items-center gap-1.5 px-3 py-2 font-medium text-gray-700 hover:text-primary transition-colors duration-200 group"
                >
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                  </svg>
                  <span>Sign In</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
                </Link>
              )
            )
          )}

          {isGuestMode() && !isUserAuthenticated && (
            <button
              onClick={() => {
                endGuestSession();
                navigate("/register");
              }}
              className="relative flex items-center gap-1.5 px-3 py-2 font-medium text-gray-700 hover:text-primary transition-colors duration-200 group"
            >
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
              </svg>
              <span>Sign Up</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
            </button>
          )}

          {isUserAuthenticated ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setShowProfileDropdown((prev) => !prev)}
                className="flex items-center gap-2 focus:outline-none"
                title="Profile"
              >
                <span className="hidden md:inline-block max-w-[140px] truncate text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                  {getDisplayName()}
                </span>
                {userData?.profile_image_url && !avatarLoadFailed ? (
                  <img
                    src={userData.profile_image_url}
                    alt="Profile"
                    onError={() => setAvatarLoadFailed(true)}
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 hover:border-primary/40 transition-colors"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 border-2 border-gray-200 hover:border-primary/40 flex items-center justify-center text-primary text-xs font-semibold transition-colors">
                    {getInitials()}
                  </div>
                )}
              </button>
              {showProfileDropdown && (
                <div className={accountMenuStyles.dropdown}>
                  <div className={accountMenuStyles.header}>
                    <p className={accountMenuStyles.headerName}>
                      {getDisplayName()}
                    </p>
                    {(isAdmin || isGuestMode()) && (
                      <span className={getRoleBadgeClass(isAdmin)}>
                        {isAdmin ? "ADMIN" : "Guest"}
                      </span>
                    )}
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setShowProfileDropdown(false)}
                    className={accountMenuStyles.item}
                  >
                    <span className={accountMenuStyles.iconWrap}>
                      <User size={13} className={accountMenuStyles.icon} strokeWidth={2} />
                    </span>
                    My Profile
                  </Link>
                  <hr className={accountMenuStyles.divider} />
                  {isAdmin && isMatflowContext ? (
                    <Link
                      to="/matflow-admin"
                      state={{ fromSettingsOrigin: settingsOrigin }}
                      onClick={() => setShowProfileDropdown(false)}
                      className={accountMenuStyles.item}
                    >
                      <span className={accountMenuStyles.iconWrap}>
                        <LayoutDashboard size={13} className={accountMenuStyles.icon} strokeWidth={2} />
                      </span>
                      Settings
                    </Link>
                  ) : isAdmin ? (
                    <Link
                      to="/admin-dashboard"
                      onClick={() => setShowProfileDropdown(false)}
                      className={accountMenuStyles.item}
                    >
                      <span className={accountMenuStyles.iconWrap}>
                        <LayoutDashboard size={13} className={accountMenuStyles.icon} strokeWidth={2} />
                      </span>
                      Dashboard
                    </Link>
                  ) : isMatflowContext ? (
                    <Link
                      to="/matflow/dashboard"
                      onClick={() => setShowProfileDropdown(false)}
                      className={accountMenuStyles.item}
                    >
                      <span className={accountMenuStyles.iconWrap}>
                        <LayoutDashboard size={13} className={accountMenuStyles.icon} strokeWidth={2} />
                      </span>
                      Dashboard
                    </Link>
                  ) : null}
                  <hr className={accountMenuStyles.divider} />
                  <button
                    onClick={handleLogout}
                    className={accountMenuStyles.dangerItem}
                  >
                    <span className={accountMenuStyles.dangerIconWrap}>
                      <LogOut size={13} strokeWidth={2} />
                    </span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
