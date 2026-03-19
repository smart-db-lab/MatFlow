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

function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const response = await commonApi.auth.forgotPassword(email.trim());
      if (response?.success) {
        toast.success(
          response.message || "Code sent. Please check your email.",
        );
        navigate(
          `/verify-email?email=${encodeURIComponent(email.trim())}&purpose=forget-password`,
        );
      } else {
        toast.error(
          getErrorMessage(
            response,
            "Could not send code. Please try again.",
          ),
        );
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Could not send code. Please try again later.");
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
            <h2 className="text-white font-bold text-xl">Forgot Password</h2>
            <p className="text-white/90 text-sm mt-1">
              Enter your email to receive a reset code
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="px-6 pt-5 pb-6 space-y-4"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/80 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold text-sm shadow-md shadow-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending code..." : "Forgot Password"}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-primary-btn hover:underline"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
