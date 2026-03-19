import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { adminLogin, isLoggedIn, checkAdminStatus } from "../util/adminAuth";
import { loginSchema } from "../schemas/authSchemas";

function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/admin-dashboard";
  const [user, setUser] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      if (isLoggedIn()) {
        const isAdmin = await checkAdminStatus();
        if (isAdmin) {
          navigate(redirectTo, { replace: true });
        } else {
          setCheckingAuth(false);
        }
      } else {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate, redirectTo]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUser((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setValidationErrors({});

    try {
      try {
        loginSchema.parse({ email: user.email, password: user.password });
      } catch (error) {
        if (error.errors) {
          const errors = {};
          error.errors.forEach((err) => {
            const field = err.path[0];
            if (field !== "password") {
              errors[field] = err.message;
            }
          });
          setValidationErrors(errors);
          const firstError = error.errors.find((err) => err.path[0] !== "password");
          if (firstError) {
            toast.error(`${firstError.path.join(".")}: ${firstError.message}`);
          } else {
            toast.error("Please check your credentials.");
          }
        }
        setLoading(false);
        return;
      }

      const result = await adminLogin(user.email, user.password);

      if (result.success) {
        if (result.isAdmin) {
          toast.success("Welcome back, Admin!");
          navigate(redirectTo, { replace: true });
        } else {
          toast.error("You don't have admin access. Please use the regular login page.");
        }
      } else {
        toast.error(result.message || "Login failed. Check your credentials.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Login failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="mt-12 relative bg-gradient-to-b from-white to-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-btn"></div>
      </div>
    );
  }

  return (
    <div className="mt-12 relative bg-gradient-to-b from-white to-gray-50 min-h-screen">
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-[80%] rounded-full blur-3xl bg-primary-btn/10" />
      <div className="grid place-items-center py-12">
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="w-7 h-7 text-primary-btn"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <h1 className="text-3xl font-bold font-sans">
            Admin Login
          </h1>
        </div>
        <p className="text-gray-500 text-sm mb-8">
          Authorized personnel only
        </p>
        <div className="max-w-md w-full px-6">
          <div className="border border-primary-btn/20 p-6 rounded-2xl shadow-xl bg-white/90 backdrop-blur">
            <p className="text-sm font-light mb-4 text-gray-600">
              Sign in with your admin credentials to access the dashboard.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col items-start">
              <label
                htmlFor="email"
                className="text-md font-medium text-gray-700"
              >
                EMAIL
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={user.email}
                onChange={handleInputChange}
                className={`my-2 p-2 rounded outline-none border-2 shadow hover:border-primary-btn hover:border-2 w-full focus:ring-2 focus:ring-primary-btn/30 ${
                  validationErrors.email ? "border-red-500" : ""
                }`}
                placeholder="Enter admin email"
              />
              {validationErrors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.email}
                </p>
              )}

              <label
                htmlFor="password"
                className="text-md font-medium text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={user.password}
                onChange={handleInputChange}
                className={`my-2 p-2 rounded outline-none border-2 hover:border-primary-btn shadow w-full focus:ring-2 focus:ring-primary-btn/30 ${
                  validationErrors.password ? "border-red-500" : ""
                }`}
                placeholder="Enter admin password"
              />
              {validationErrors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.password}
                </p>
              )}

              <button
                className="border-2 mt-4 text-md px-6 py-2 border-primary-btn rounded-md hover:bg-primary-btn hover:text-white shadow focus:outline-none focus:ring-2 focus:ring-primary-btn/30 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Login as Admin"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full py-2 px-6 text-md font-medium text-white bg-primary-btn border border-primary-btn rounded-md hover:bg-primary-btn/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-btn/30 shadow"
            >
              Go to User Login
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              Not an admin? Use the regular login page instead.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
