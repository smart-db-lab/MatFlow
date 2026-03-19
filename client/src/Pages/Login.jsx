import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { login, isAuthenticated } from "../util/adminAuth";
import { isGuestMode } from "../util/guestSession";
import { loginSchema } from "../schemas/authSchemas";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [user, setUser] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const purpose = searchParams.get("purpose");
    if (mode === "register" || purpose === "register") {
      navigate("/register", { replace: true });
      return;
    }

    const checkAuth = async () => {
      if (isAuthenticated() || isGuestMode()) {
        navigate(redirectTo, { replace: true });
      } else {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate, redirectTo, searchParams]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUser((prevState) => ({ ...prevState, [name]: value }));
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
            if (err.path[0] !== "password") errors[err.path[0]] = err.message;
          });
          setValidationErrors(errors);
          const firstError = error.errors.find((err) => err.path[0] !== "password");
          if (firstError) {
            toast.error(`${firstError.path.join(".")}: ${firstError.message}`);
          } else {
            toast.error("Please check your credentials.");
          }
        } else {
          toast.error("Validation failed. Please check all fields.");
        }
        setLoading(false);
        return;
      }

      const result = await login(user.email, user.password);

      if (result.success) {
        toast.success(result.message || "Login successful!");
        setUser({ email: "", password: "" });
        setValidationErrors({});
        navigate(redirectTo, { replace: true });
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

  const inputClass = (field) =>
    `w-full px-4 py-2.5 rounded-xl border bg-gray-50/80 text-gray-900 text-sm transition-all duration-200 outline-none placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary ${
      validationErrors[field]
        ? 'border-red-300 bg-red-50/50 focus:ring-red-200 focus:border-red-400'
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
    }`;

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ paddingTop: '70px' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{ paddingTop: '70px' }}>
      <div className="w-full max-w-[420px]">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
          {/* Colorful Header */}
          <div className="bg-gradient-to-r from-primary via-primary-dark to-primary px-6 pt-6 pb-5 text-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h2 className="text-white font-bold text-xl">Welcome Back</h2>
          </div>

          {/* Glow Line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-primary-light to-transparent shadow-[0_0_8px_rgba(94,234,212,0.5)]"></div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pt-6 pb-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={user.email}
                onChange={handleInputChange}
                className={inputClass('email')}
                placeholder="you@example.com"
              />
              {validationErrors.email && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={user.password}
                  onChange={handleInputChange}
                  className={`${inputClass('password')} pr-10`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {validationErrors.password}
                </p>
              )}
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>

            <div className="text-center">
              <Link
                to={`/forgot-password${user.email ? `?email=${encodeURIComponent(user.email)}` : ""}`}
                className="text-sm text-primary hover:text-primary-dark"
              >
                Forgot password?
              </Link>
            </div>
            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-primary hover:text-primary-dark transition-colors"
              >
                Create Account
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
