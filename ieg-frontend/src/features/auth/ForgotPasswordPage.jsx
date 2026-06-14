import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../config/api";
import toast from "react-hot-toast";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("Check your email for reset instructions");
    } catch (err) {
      toast.error(err.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header - Logo */}
      <div className="flex justify-center pt-10 pb-6">
        <span className="text-[#f5b400] font-black text-5xl tracking-[4px]" style={{fontFamily:"'Bebas Neue', sans-serif"}}>
          IEG
        </span>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-4">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 w-full max-w-4xl px-16 py-14">

          {!sent ? (
            <>
              <h1 className="font-black text-[#1a2340] text-4xl text-center mb-3">
                Reset Your Password
              </h1>
              <p className="text-gray-600 font-semibold text-center text-base mb-6">
                Enter your email address below to receive a password reset link.
              </p>

              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-full bg-[#1a2340] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4" stroke="#f5b400" strokeWidth="2.5"/>
                  </svg>
                </div>
                <p className="text-gray-600 font-semibold text-sm">
                  Your account is secured by encrypted protocols and secure servers.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center border-2 border-[#1a2340] rounded-2xl px-5 py-4 gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a2340" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 outline-none text-base font-semibold text-[#1a2340] placeholder-gray-400 bg-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#f5b400] text-white font-black text-xl py-3 rounded-2xl hover:bg-[#e0a200] transition-colors"
                >
                  Send Reset Link
                </button>
              </form>

              <div className="flex justify-center mt-8">
                <Link to="/auth/login" className="flex items-center gap-2 text-[#1a2340] font-bold text-base hover:text-[#f5b400] transition-colors">
                  <span>→</span>
                  <span>Back to Login</span>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="font-black text-[#1a2340] text-3xl mb-2">Email Sent!</h2>
              <p className="text-gray-600 font-semibold text-base mb-6">
                Check your inbox for the password reset link.
              </p>
              <Link to="/auth/login" className="text-[#f5b400] font-bold text-base hover:underline">
                Back to Login
              </Link>
            </div>
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
};

export default ForgetPassword;