import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/auth";
import Page from "../components/Page";
import Sparkles from "../components/Sparkles";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      setSuccess(res.message);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-300 to-pink-100 overflow-hidden">

        {/* Sparkles floating */}
        <Sparkles />

        {/* CARD */}
        <div className="bg-white/60 backdrop-blur-xl p-10 rounded-3xl shadow-xl w-full max-w-md">

          <h1 className="text-4xl font-bold text-pink-600 text-center mb-6">
            Forgot Password 💌
          </h1>

          {/* SUCCESS */}
          {success && (
            <div className="bg-green-100 border border-green-300 text-green-700 p-3 rounded-lg text-sm mb-4">
              {success}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-600 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block mb-1 text-gray-700 text-sm">
                  Your Email
                </label>
                <input
                  type="email"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-pink-300 focus:ring-2 focus:ring-pink-400 outline-none"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-xl shadow-lg transition"
              >
                {loading ? "Sending…" : "Send Reset Email"}
              </button>
            </form>
          )}

          {/* Back to login */}
          <p className="text-center mt-6 text-sm">
            <button
              onClick={() => navigate("/login")}
              className="text-pink-600 font-semibold hover:underline"
            >
              Back to Login →
            </button>
          </p>
        </div>
      </div>
    </Page>
  );
}
