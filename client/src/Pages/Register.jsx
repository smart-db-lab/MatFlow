import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { registerSchema } from "../schemas/authSchemas";
import { commonApi } from "../services/api/apiService";
import TermsAndConditionsContent from "../Components/TermsAndConditionsContent";

const normalizeSignupMessage = (message) => {
    if (!message || typeof message !== "string") return null;
    const cleaned = message.trim();
    const lower = cleaned.toLowerCase();

    const looksLikeDuplicateEmail =
        lower.includes("already registered") ||
        lower.includes("already exists") ||
        lower.includes("already in use") ||
        lower.includes("email exists") ||
        lower.includes("duplicate") ||
        lower.includes("unique");

    if (looksLikeDuplicateEmail) {
        return "This email is already registered. Please sign in or use a different email address.";
    }

    return cleaned;
};

const getFirstFieldError = (source) => {
    if (!source || typeof source !== "object") return null;
    const values = Object.values(source);

    for (const value of values) {
        if (Array.isArray(value) && value.length > 0) {
            return String(value[0]);
        }
        if (value && typeof value === "object") {
            const nested = getFirstFieldError(value);
            if (nested) return nested;
        }
    }

    return null;
};

const getErrorMessage = (response, fallback) => {
    if (!response) return fallback;

    const source = response.errors || response;
    const firstFieldError = getFirstFieldError(source);
    const normalizedFieldError = normalizeSignupMessage(firstFieldError);
    if (normalizedFieldError) return normalizedFieldError;

    const normalizedError = normalizeSignupMessage(response.error);
    if (normalizedError) return normalizedError;

    const normalizedDetail = normalizeSignupMessage(response.detail);
    if (normalizedDetail) return normalizedDetail;

    if (typeof response.message === "string" && response.success === false) {
        const normalizedMessage = normalizeSignupMessage(response.message);
        if (normalizedMessage && normalizedMessage.toLowerCase() !== "registration failed") {
            return normalizedMessage;
        }
    }

    return fallback;
};

function Register() {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirm_password: "",
        terms_accepted: true,
    });
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        const nextValue = type === "checkbox" ? checked : value;
        setUser((prevState) => ({ ...prevState, [name]: nextValue }));
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
                registerSchema.parse(user);
            } catch (error) {
                if (error.errors) {
                    const errors = {};
                    error.errors.forEach((err) => {
                        errors[err.path[0]] = err.message;
                    });
                    setValidationErrors(errors);
                    const firstError = error.errors[0];
                    const firstField = firstError?.path?.[0];
                    if (firstField === "terms_accepted") {
                        toast.error("Please accept the Terms and Conditions to continue.");
                    } else {
                        toast.error(
                            firstError?.message || "Please review the form and try again.",
                        );
                    }
                } else {
                    toast.error("Validation failed. Please check all fields.");
                }
                setLoading(false);
                return;
            }

            const response = await commonApi.auth.signup(
                user.first_name,
                user.last_name,
                user.email,
                user.password,
            );

            if (response?.success) {
                toast.success("Account created. Check your email for OTP.");
                const verifyEmail = response.email || user.email;

                setUser({
                    first_name: "",
                    last_name: "",
                    email: "",
                    password: "",
                    confirm_password: "",
                    terms_accepted: true,
                });
                setValidationErrors({});

                if (verifyEmail) {
                    navigate(
                        `/verify-email?email=${encodeURIComponent(verifyEmail)}&purpose=register`,
                    );
                } else {
                    navigate("/login");
                }
            } else {
                const serverErrors = response?.errors;
                if (serverErrors && typeof serverErrors === "object") {
                    const mappedErrors = {};
                    Object.entries(serverErrors).forEach(([field, value]) => {
                        if (Array.isArray(value) && value.length > 0) {
                            mappedErrors[field] = String(value[0]);
                        } else if (typeof value === "string") {
                            mappedErrors[field] = value;
                        }
                    });

                    if (Object.keys(mappedErrors).length > 0) {
                        setValidationErrors(mappedErrors);
                    }
                }

                toast.error(
                    getErrorMessage(
                        response,
                        "We could not complete registration. Please try again.",
                    ),
                );
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Registration failed. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (field) =>
        `w-full px-4 py-2.5 rounded-xl border bg-gray-50/80 text-gray-900 text-sm transition-all duration-200 outline-none placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary ${
            validationErrors[field]
                ? "border-red-300 bg-red-50/50 focus:ring-red-200 focus:border-red-400"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`;

    return (
        <div
            className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
            style={{ paddingTop: "70px" }}
        >
            <div className="w-full max-w-[420px]">
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
                    {/* Colorful Header */}
                    <div className="bg-gradient-to-r from-primary via-primary-dark to-primary px-6 pt-6 pb-5 text-center">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl mx-auto mb-3 flex items-center justify-center">
                            <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-white font-bold text-xl">
                            Create Account
                        </h2>
                    </div>

                    {/* Glow Line */}
                    <div className="h-[2px] bg-gradient-to-r from-transparent via-primary-light to-transparent shadow-[0_0_8px_rgba(94,234,212,0.5)]"></div>

                    <form
                        onSubmit={handleSubmit}
                        className="px-6 pt-6 pb-6 space-y-4"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="first_name"
                                    className="block text-sm font-medium text-gray-700 mb-1.5"
                                >
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    value={user.first_name}
                                    onChange={handleInputChange}
                                    className={inputClass("first_name")}
                                    placeholder="Enter your first name"
                                />
                                {validationErrors.first_name && (
                                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                        <svg
                                            className="w-3.5 h-3.5 flex-shrink-0"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        {validationErrors.first_name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="last_name"
                                    className="block text-sm font-medium text-gray-700 mb-1.5"
                                >
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    value={user.last_name}
                                    onChange={handleInputChange}
                                    className={inputClass("last_name")}
                                    placeholder="Enter your last name"
                                />
                                {validationErrors.last_name && (
                                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                        <svg
                                            className="w-3.5 h-3.5 flex-shrink-0"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        {validationErrors.last_name}
                                    </p>
                                )}
                            </div>
                        </div>

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
                                name="email"
                                value={user.email}
                                onChange={handleInputChange}
                                className={inputClass("email")}
                                placeholder="you@example.com"
                            />
                            {validationErrors.email && (
                                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                    <svg
                                        className="w-3.5 h-3.5 flex-shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    {validationErrors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-1.5"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={user.password}
                                    onChange={handleInputChange}
                                    className={`${inputClass("password")} pr-10`}
                                    placeholder="Create a password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg
                                            className="w-4.5 h-4.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="w-4.5 h-4.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {validationErrors.password && (
                                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                    <svg
                                        className="w-3.5 h-3.5 flex-shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    {validationErrors.password}
                                </p>
                            )}
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
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    id="confirm_password"
                                    name="confirm_password"
                                    value={user.confirm_password}
                                    onChange={handleInputChange}
                                    className={`${inputClass("confirm_password")} pr-10`}
                                    placeholder="Re-enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword((v) => !v)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <svg
                                            className="w-4.5 h-4.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="w-4.5 h-4.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {validationErrors.confirm_password && (
                                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                    <svg
                                        className="w-3.5 h-3.5 flex-shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    {validationErrors.confirm_password}
                                </p>
                            )}
                        </div>

                        <div className="pt-1">
                            <div className="mb-3">
                                <label className="flex items-start gap-2.5 text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        name="terms_accepted"
                                        checked={user.terms_accepted}
                                        onChange={handleInputChange}
                                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span>
                                        I agree to the{" "}
                                        <button
                                            type="button"
                                            onClick={() => setShowTermsModal(true)}
                                            className="font-medium text-primary hover:text-primary-dark underline underline-offset-2"
                                        >
                                            Terms and Conditions
                                        </button>
                                        .
                                    </span>
                                </label>
                                {validationErrors.terms_accepted && (
                                    <p className="text-red-500 text-xs mt-1.5 ml-6">
                                        {validationErrors.terms_accepted}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                {loading
                                    ? "Creating account..."
                                    : "Create Account"}
                            </button>
                        </div>

                        <p className="text-center text-sm text-gray-500 pt-2">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="text-primary hover:text-primary-dark font-medium transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </form>
                </div>
            </div>

            {showTermsModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={() => setShowTermsModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">
                                Terms and Conditions
                            </h2>
                        </div>
                        <div className="px-6 py-5 overflow-y-auto flex-1 text-[15px] text-gray-600 leading-[1.8] space-y-4">
                            <TermsAndConditionsContent />
                        </div>
                        <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowTermsModal(false)}
                                className="text-sm font-medium text-primary hover:text-primary-dark transition-colors duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Register;
