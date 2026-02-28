import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { commonApi } from "../services/api/apiService";

function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  const [email] = useState(emailFromQuery);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter the verification code.");
      return;
    }
    setLoading(true);
    try {
      const response = await commonApi.auth.verifyCode(email, code.trim());
      if (response && response.message && !response.error) {
        toast.success(response.message || "Email verified successfully!");
        navigate("/login");
      } else {
        toast.error(response?.error || "Verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12 relative bg-gradient-to-b from-white to-gray-50 min-h-screen">
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-[80%] rounded-full blur-3xl bg-primary-btn/10" />
      <div className="grid place-items-center py-12">
        <h1 className="text-3xl font-bold mb-8 font-sans">
          Verify Your Email
        </h1>
        <div className="max-w-md w-full px-6">
          <div className="border border-primary-btn/20 p-6 rounded-2xl shadow-xl bg-white/90 backdrop-blur">
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-primary-dark">
                    A 6-digit verification code has been printed to the{" "}
                    <strong>server terminal</strong>.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col items-start">
              <label
                htmlFor="email"
                className="text-md font-medium text-gray-700"
              >
                EMAIL
              </label>
              <input
                type="email"
                id="email"
                value={email}
                disabled
                className="my-2 p-2 rounded outline-none border-2 shadow w-full bg-gray-100 text-gray-500 cursor-not-allowed"
              />

              <label
                htmlFor="code"
                className="text-md font-medium text-gray-700 mt-2"
              >
                VERIFICATION CODE
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
                className="border-2 mt-4 text-md px-6 py-2 border-primary-btn rounded-md hover:bg-primary-btn hover:text-white shadow focus:outline-none focus:ring-2 focus:ring-primary-btn/30 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                type="submit"
                disabled={loading || code.length < 6}
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-primary-btn hover:underline"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
