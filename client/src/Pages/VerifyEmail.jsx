import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { commonApi } from "../services/api/apiService";

const RESEND_COOLDOWN_SECONDS = 5 * 60;

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

function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";
  const purposeFromQuery = (searchParams.get("purpose") || "registration").toLowerCase();
  const isPasswordResetFlow = purposeFromQuery === "password_reset" || purposeFromQuery === "forget-password";

  const [email] = useState(emailFromQuery);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const formatCooldown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (cooldown <= 0) return undefined;

    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email address is missing. Please start again.");
      navigate(isPasswordResetFlow ? "/forgot-password" : "/register", { replace: true });
      return;
    }
    if (!code.trim()) {
      toast.error("Please enter your 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const response = isPasswordResetFlow
        ? await commonApi.auth.verifyForgotPasswordOtp(email.trim(), code.trim())
        : await commonApi.auth.verifyCode(email, code.trim());

      if (response?.success) {
        if (isPasswordResetFlow && response?.token) {
          toast.success(response.message || "Code verified successfully!");
          navigate(
            `/reset-password?token=${encodeURIComponent(response.token)}&email=${encodeURIComponent(email.trim())}`,
          );
        } else {
          toast.success(response.message || "Email verified successfully!");
          navigate("/login");
        }
      } else {
        toast.error(getErrorMessage(response, "Verification failed. Please try again."));
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error("Email address is missing. Please start again.");
      navigate(isPasswordResetFlow ? "/forgot-password" : "/register", { replace: true });
      return;
    }

    setResending(true);
    try {
      const response = isPasswordResetFlow
        ? await commonApi.auth.forgotPassword(email.trim())
        : await commonApi.auth.resendVerificationOtp(email.trim());

      if (response?.success) {
        toast.success(response.message || "Code resent successfully.");
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        toast.error(getErrorMessage(response, "Could not resend code. Please try again."));
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      toast.error("Could not resend code. Please try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mt-12 relative bg-gradient-to-b from-white to-gray-50 min-h-screen">
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-[80%] rounded-full blur-3xl bg-primary-btn/10" />
      <div className="grid place-items-center py-12">
        <h1 className="text-3xl font-bold mb-8 font-sans">
          {isPasswordResetFlow ? "Verify Reset Code" : "Verify Your Email"}
        </h1>
        <div className="max-w-md w-full px-6">
          <div className="border border-primary-btn/20 p-6 rounded-2xl shadow-xl bg-white/90 backdrop-blur">
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary-dark">
                {`Hello ${email || "there"}, please enter the 6-digit code sent to your email address.`}
              </p>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col items-start">
              <label
                htmlFor="code"
                className="text-md font-medium text-gray-700 mt-2"
              >
                6-DIGIT CODE
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="my-2 p-2 rounded outline-none border-2 shadow hover:border-primary-btn hover:border-2 w-full focus:ring-2 focus:ring-primary-btn/30 text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
                autoFocus
              />

              <button
                className="border-2 mt-4 text-md px-6 py-2 bg-primary text-white border-primary-btn rounded-md hover:bg-primary-btn hover:text-white shadow focus:outline-none focus:ring-2 focus:ring-primary-btn/30 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                type="submit"
                disabled={loading || code.length < 6}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <div className="mt-3 w-full flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {cooldown > 0
                    ? `Resend available in ${formatCooldown(cooldown)}`
                    : "You can request a new code now."}
                </span>
                
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || loading || cooldown > 0}
                  className="text-sm text-primary-btn hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                  {resending ? "Resending..." : "Resend Code"}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => navigate(isPasswordResetFlow ? "/forgot-password" : "/login")}
                className="text-sm text-primary-btn hover:underline"
              >
                {isPasswordResetFlow ? "Back to Forgot Password" : "Back to Login"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
