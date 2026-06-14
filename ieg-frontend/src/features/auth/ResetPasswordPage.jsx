import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../config/api";
import toast from "react-hot-toast";

/**
 * ResetPasswordPage
 *
 * Mounted at: /auth/reset-password/:token
 *
 * Flow:
 *  1. User arrives from the email link with a raw reset token in the URL.
 *  2. User enters and confirms a new password.
 *  3. POST /auth/reset-password/:token  →  backend hashes token, validates expiry, updates password.
 *  4. On success: show a success state and redirect to login after 3 s.
 *  5. On error: show the backend error message (invalid/expired token, weak password, etc.).
 */
export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // Redirect to login if no token in URL
  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link. Please request a new one.");
      navigate("/auth/forgot-password", { replace: true });
    }
  }, [token, navigate]);

  // Auto-redirect to login after success
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => navigate("/auth/login", { replace: true }), 3000);
    return () => clearTimeout(t);
  }, [success, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.password) {
      errs.password = "Password is required";
    } else if (form.password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }
    if (!form.confirmPassword) {
      errs.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, {
        password: form.password,
      });
      setSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to reset password. The link may have expired.";
      toast.error(message);
      // If token is invalid/expired surface a specific error
      if (err.response?.status === 400) {
        setErrors({ token: message });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Password strength indicator ────────────────────────────────────────────
  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthScore = getStrength(form.password);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strengthScore] || "";
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"][strengthScore] || "transparent";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Logo */}
      <div className="flex justify-center pt-10 pb-6">
        <span
          className="text-[#f5b400] font-black text-5xl tracking-[4px]"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          IEG
        </span>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-4">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 w-full max-w-4xl px-16 py-14">
          {/* ── Success state ── */}
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="font-black text-[#1a2340] text-3xl mb-2">
                Password Reset!
              </h2>
              <p className="text-gray-600 font-semibold text-base mb-2">
                Your password has been updated successfully.
              </p>
              <p className="text-gray-400 text-sm mb-6">
                Redirecting you to login in 3 seconds…
              </p>
              <Link
                to="/auth/login"
                className="text-[#f5b400] font-bold text-base hover:underline"
              >
                Go to Login now →
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <h1 className="font-black text-[#1a2340] text-4xl text-center mb-3">
                Set New Password
              </h1>
              <p className="text-gray-600 font-semibold text-center text-base mb-8">
                Enter a strong new password for your account.
              </p>

              {/* Invalid token banner */}
              {errors.token && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 font-semibold text-sm text-center">
                  {errors.token}{" "}
                  <Link
                    to="/auth/forgot-password"
                    className="underline font-bold"
                  >
                    Request a new link
                  </Link>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* New password */}
                <div>
                  <div
                    className={`flex items-center border-2 rounded-2xl px-5 py-4 gap-3 ${
                      errors.password
                        ? "border-red-400"
                        : "border-[#1a2340]"
                    }`}
                  >
                    {/* Lock icon */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1a2340"
                      strokeWidth="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="New Password"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      className="flex-1 outline-none text-base font-semibold text-[#1a2340] placeholder-gray-400 bg-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-gray-400 hover:text-[#1a2340] transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm font-semibold mt-1 pl-2">
                      {errors.password}
                    </p>
                  )}

                  {/* Strength bar */}
                  {form.password.length > 0 && (
                    <div className="mt-2 px-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor:
                                i <= strengthScore ? strengthColor : "#e5e7eb",
                            }}
                          />
                        ))}
                      </div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: strengthColor }}
                      >
                        {strengthLabel}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <div
                    className={`flex items-center border-2 rounded-2xl px-5 py-4 gap-3 ${
                      errors.confirmPassword
                        ? "border-red-400"
                        : "border-[#1a2340]"
                    }`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1a2340"
                      strokeWidth="2"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" stroke="#f5b400" strokeWidth="2.5" />
                    </svg>
                    <input
                      type={showConfirm ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm New Password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      className="flex-1 outline-none text-base font-semibold text-[#1a2340] placeholder-gray-400 bg-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="text-gray-400 hover:text-[#1a2340] transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm font-semibold mt-1 pl-2">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Requirements hint */}
                <div className="bg-gray-50 rounded-2xl px-5 py-3 text-sm text-gray-500 font-medium space-y-1">
                  <p className="font-bold text-gray-600 mb-1">Password must:</p>
                  <p className={form.password.length >= 8 ? "text-green-500" : ""}>
                    {form.password.length >= 8 ? "✓" : "·"} Be at least 8 characters
                  </p>
                  <p className={/[A-Z]/.test(form.password) ? "text-green-500" : ""}>
                    {/[A-Z]/.test(form.password) ? "✓" : "·"} Include an uppercase letter
                  </p>
                  <p className={/[0-9]/.test(form.password) ? "text-green-500" : ""}>
                    {/[0-9]/.test(form.password) ? "✓" : "·"} Include a number
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !!errors.token}
                  className="w-full bg-[#f5b400] text-white font-black text-xl py-3 rounded-2xl hover:bg-[#e0a200] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Resetting…
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>

              <div className="flex justify-center mt-8">
                <Link
                  to="/auth/login"
                  className="flex items-center gap-2 text-[#1a2340] font-bold text-base hover:text-[#f5b400] transition-colors"
                >
                  <span>→</span>
                  <span>Back to Login</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-[#0d1b3e] py-4 mt-10">
        <p className="text-center text-white/50 text-base font-semibold">
          © 2026 International Export Gateway | All rights reserved
        </p>
      </div>
    </div>
  );
}
