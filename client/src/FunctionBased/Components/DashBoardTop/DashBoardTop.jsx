import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { User, LayoutDashboard, LogOut, Menu as MenuIcon, Shield } from "lucide-react";
import { logout, isAdminLoggedIn, isAuthenticated, AUTH_STATE_CHANGED_EVENT, getCurrentUserCached } from "../../../util/adminAuth";
import { isGuestMode, endGuestSession } from "../../../util/guestSession";
import { setShowLeftSideBar, setShowProfile } from "../../../Slices/SideBarSlice";
import { serviceAdminApi } from "../../../services/api/apiService";
import { accountMenuStyles, getRoleBadgeClass } from "../Common/accountMenuStyles";

function DashBoardTop() {
  const showLeftSideBar = useSelector((state) => state.sideBar.showLeftSideBar);
  const showProfile = useSelector((state) => state.sideBar.showProfile);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTitleConfirm, setShowTitleConfirm] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [headerSection, setHeaderSection] = useState(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const dropdownRef = useRef(null);

  const guest = isGuestMode();
  const withAvatarCacheBust = (user) => {
    if (!user?.profile_image_url) return user;
    const separator = user.profile_image_url.includes("?") ? "&" : "?";
    return { ...user, profile_image_url: `${user.profile_image_url}${separator}t=${Date.now()}` };
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const loadHeader = async () => {
      try {
        const data = await serviceAdminApi.landing.getHeaderSection("matflow");
        setHeaderSection(data);
      } catch (_) {}
    };
    loadHeader();
  }, []);

  const handleProfileClick = () => {
    dispatch(setShowProfile(!showProfile));
    setShowDropdown(false);
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    if (guest) {
      endGuestSession();
      toast.success("Guest session ended.");
      navigate("/matflow");
      window.location.reload();
      return;
    }
    const result = await logout();
    if (result.success) {
      toast.success(result.message || "Logged out successfully");
      navigate("/matflow");
      window.location.reload();
    } else {
      toast.error(result.message || "Failed to logout");
    }
  };

  useEffect(() => {
    const fetchUserData = async (force = false) => {
      if (isGuestMode()) {
        setUserData({ email: "Guest" });
        setIsAdmin(false);
        return;
      }
      if (!isAuthenticated()) {
        setUserData(null);
        setIsAdmin(false);
        return;
      }
      try {
        const user = await getCurrentUserCached({ force });
        setUserData(withAvatarCacheBust(user || null));
        const adminStatus = (user && (user.is_superuser || user.is_staff)) || isAdminLoggedIn();
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error("Failed to load user data:", error);
        setIsAdmin(isAdminLoggedIn());
      }
    };

    fetchUserData();

    const handleProfileUpdate = () => fetchUserData(true);
    const handleAuthStateChanged = () => fetchUserData(true);
    window.addEventListener("profileUpdated", handleProfileUpdate);
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged);

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged);
    };
  }, [guest]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [userData?.profile_image_url]);

  const getDisplayName = () => {
    const username = userData?.username?.trim();
    const emailLocal = userData?.email?.split("@")[0]?.trim();
    if (username && (!emailLocal || username.toLowerCase() !== emailLocal.toLowerCase())) {
      return username;
    }
    const firstName = userData?.first_name?.trim();
    if (firstName) return firstName;
    const fullName = userData?.full_name?.trim();
    if (fullName) return fullName;
    if (username) return username;
    if (userData?.email) return userData.email.split("@")[0];
    return "User";
  };

  const getInitials = () => {
    const displayName = getDisplayName();
    if (displayName) {
      const names = displayName.trim().split(" ");
      if (names.length >= 2) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      return displayName.charAt(0).toUpperCase();
    }
    if (userData?.email) return userData.email.charAt(0).toUpperCase();
    return "A";
  };

  const baseUrl = import.meta.env.VITE_APP_API_URL || "";
  const titleImageUrl = headerSection?.title_image
    ? headerSection.title_image.startsWith("http") ? headerSection.title_image : `${baseUrl}${headerSection.title_image}`
    : null;
  const brandName = headerSection?.title || "MATFLOW";
  const pageTitle = headerSection?.title?.trim() || "Matflow";

  useEffect(() => {
    const previousTitle = document.title;
    document.title = pageTitle;
    return () => {
      document.title = previousTitle;
    };
  }, [pageTitle]);

  return (
    <nav className="relative w-full z-50 bg-white border-b border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left — hamburger + brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(setShowLeftSideBar(!showLeftSideBar))}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label={showLeftSideBar ? "Collapse sidebar" : "Open sidebar"}
          >
            <MenuIcon size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setShowTitleConfirm(true)}
            className="flex items-center hover:opacity-80 transition-opacity duration-200"
          >
            {titleImageUrl ? (
              <img
                src={titleImageUrl}
                alt={brandName}
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  const parent = e.target.parentElement;
                  if (parent && !parent.querySelector("span.fallback-text")) {
                    const textEl = document.createElement("span");
                    textEl.textContent = brandName;
                    textEl.className = "fallback-text text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary-dark to-primary";
                    parent.appendChild(textEl);
                  }
                }}
              />
            ) : (
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary-dark to-primary">
                {brandName}
              </span>
            )}
          </button>

        </div>

        {/* Right — user avatar / actions */}
        <div className="flex items-center gap-2">
          {guest && (
            <button
              onClick={() => { endGuestSession(); navigate("/register"); }}
              className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-primary transition-colors duration-200 group"
            >
              <User size={15} strokeWidth={2} className="text-primary" />
              <span>Sign Up</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
            </button>
          )}

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="flex items-center focus:outline-none"
              title="Account"
            >
              {userData?.profile_image_url && !avatarLoadFailed ? (
                <img
                  src={userData.profile_image_url}
                  alt="Profile"
                  onError={() => setAvatarLoadFailed(true)}
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 hover:border-primary/40 transition-colors"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-gray-200 hover:border-primary/40 flex items-center justify-center text-primary text-xs font-semibold transition-colors">
                  {getInitials()}
                </div>
              )}
            </button>

            {showDropdown && (
              <div className={accountMenuStyles.dropdown}>
                {userData && (
                  <div className={accountMenuStyles.header}>
                    <div className="min-w-0">
                      <p className={accountMenuStyles.headerName}>
                        {getDisplayName()}
                      </p>
                    </div>
                    {(isAdmin || guest) && (
                      <span className={getRoleBadgeClass(isAdmin)}>
                        {isAdmin ? 'ADMIN' : 'Guest'}
                      </span>
                    )}
                  </div>
                )}

                {!guest && (
                  <button
                    onClick={handleProfileClick}
                    className={`${accountMenuStyles.item} w-full`}
                  >
                    {showProfile ? (
                      <>
                        <span className={accountMenuStyles.iconWrap}>
                          <LayoutDashboard size={13} className={accountMenuStyles.icon} strokeWidth={2} />
                        </span>
                        <span>Dashboard</span>
                      </>
                    ) : (
                      <>
                        <span className={accountMenuStyles.iconWrap}>
                          <User size={13} className={accountMenuStyles.icon} strokeWidth={2} />
                        </span>
                        <span>Profile</span>
                      </>
                    )}
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate("/matflow-admin", { state: { fromSettingsOrigin: "dashboard" } });
                    }}
                    className={`${accountMenuStyles.item} w-full`}
                  >
                    <span className={accountMenuStyles.iconWrap}>
                      <Shield size={13} className={accountMenuStyles.icon} strokeWidth={2} />
                    </span>
                    <span>Settings</span>
                  </button>
                )}

                {guest && (
                  <>
                    <hr className={accountMenuStyles.divider} />
                    <button
                      onClick={() => { setShowDropdown(false); navigate("/login"); }}
                      className={`${accountMenuStyles.item} w-full`}
                    >
                      <span className={accountMenuStyles.iconWrap}>
                        <User size={13} className={accountMenuStyles.icon} strokeWidth={2} />
                      </span>
                      <span>Sign Up / Login</span>
                    </button>
                  </>
                )}

                <hr className={accountMenuStyles.divider} />
                <button
                  onClick={handleLogout}
                  className={`${accountMenuStyles.dangerItem} w-full`}
                >
                  <span className={accountMenuStyles.dangerIconWrap}>
                    <LogOut size={13} strokeWidth={2} />
                  </span>
                  <span>{guest ? "Exit Guest Mode" : "Logout"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showTitleConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowTitleConfirm(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-900">Leave dashboard?</h3>
            <p className="mt-2 text-sm text-gray-600">
              You are about to return to the Matflow landing page.
            </p>
            <p className="mt-2 text-sm font-medium text-red-600">
              Warning: continuing will clear your current dashboard progress.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTitleConfirm(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTitleConfirm(false);
                  navigate("/matflow");
                }}
                className="rounded-md bg-[#0D9488] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0F766E]"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default DashBoardTop;
