import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { commonApi } from "../services/api/apiService";

const getErrorMessage = (response, fallback) => {
  if (!response) return fallback;
  if (typeof response.error === "string") return response.error;
  if (typeof response.message === "string" && response.success === false) {
    return response.message;
  }
  if (typeof response.detail === "string") return response.detail;
  const firstField = Object.values(response).find(
    (value) => Array.isArray(value) && value.length > 0,
  );
  if (firstField) return String(firstField[0]);
  return fallback;
};

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tokenFromQuery = searchParams.get("token") || "";

  const [token] = useState(tokenFromQuery);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token.trim()) {
      toast.error("Reset token is missing. Please verify OTP again.");
      navigate("/forgot-password", { replace: true });
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await commonApi.auth.resetPassword(
        token.trim(),
        newPassword,
        confirmPassword,
      );

      if (response?.success) {
        toast.success(response.message || "Password reset successfully.");
        navigate("/login", { replace: true });
      } else {
        toast.error(
          getErrorMessage(
            response,
            "Password reset failed. Please try again.",
          ),
        );
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Password reset failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
      style={{ paddingTop: "70px" }}
    >
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-primary via-primary-dark to-primary px-6 pt-6 pb-5 text-center">
            <h2 className="text-white font-bold text-xl">Reset Password</h2>
            <p className="text-white/90 text-sm mt-1">
              Enter your new password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-4">
            <div>
              <label
                htmlFor="new_password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="new_password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/80 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary pr-10"
                  placeholder="Enter a new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm_password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm_password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/80 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary pr-10"
                  placeholder="Re-enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold text-sm shadow-md shadow-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-primary-btn hover:underline"
              >
                Back to Forgot Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
