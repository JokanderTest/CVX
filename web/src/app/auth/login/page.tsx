"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // OTP flow when email not verified
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  // Get CSRF token from cookie
  const getCsrfToken = () => {
    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(c => c.trim().startsWith('csrf_token='));
    return csrfCookie ? csrfCookie.split('=')[1] : null;
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Essential for cookies
      });

      const data = await res.json();

      if (!res.ok && data?.error !== "email_not_verified") {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      if (data?.error === "email_not_verified") {
        setPendingEmail(data.user?.email ?? email);
        setShowCode(true);
        setInfo("Your email is not verified. Enter the 6-digit code sent to your email.");
        setLoading(false);
        return;
      }

      // Success - tokens are now in HttpOnly cookies
      // No need to store anything in localStorage
      setInfo("Login successful! Redirecting...");
      
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);

    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3000/auth/register-verify", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: pendingEmail, code }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Verification failed");
        setLoading(false);
        return;
      }

      // Success - tokens in cookies
      setInfo("Verification successful! Redirecting...");
      
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);

    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3000/auth/resend-register-code", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: pendingEmail || email }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Resend failed");
      } else {
        const minutes = Math.round((data.expiresIn || 900) / 60);
        setInfo(`Code resent successfully. Expires in ${minutes} minutes.`);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="w-full max-w-md bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-700">
        
        {!showCode && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-gray-400 mt-2">Sign in to your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Email Address
                </label>
                <input 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg px-4 py-3 bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Password
                </label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg px-4 py-3 bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {info && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
                  {info}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all py-3 rounded-lg font-semibold shadow-lg hover:shadow-indigo-500/50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <a 
                href="/auth/forgot-password" 
                className="text-sm text-indigo-400 hover:text-indigo-300 transition"
              >
                Forgot password?
              </a>
              
              <div className="text-gray-400 text-sm">
                Don't have an account?{" "}
                <a 
                  href="/auth/register" 
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition"
                >
                  Create one
                </a>
              </div>
            </div>
          </>
        )}

        {showCode && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
              <p className="text-gray-400 text-sm">
                We sent a 6-digit code to<br />
                <span className="text-white font-medium">{pendingEmail}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-center text-gray-300">
                  Enter Verification Code
                </label>
                <input 
                  type="text" 
                  inputMode="numeric" 
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={code} 
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  className="w-full px-4 py-4 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {info && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
                  {info}
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  type="submit" 
                  disabled={loading || code.length !== 6}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all py-3 rounded-lg font-semibold shadow-lg"
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
                
                <button 
                  type="button" 
                  onClick={handleResend} 
                  disabled={loading}
                  className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition py-3 px-5 rounded-lg font-medium"
                >
                  Resend
                </button>
              </div>
            </form>

            <div className="text-center mt-6">
              <button
                onClick={() => {
                  setShowCode(false);
                  setCode("");
                  setError("");
                  setInfo("");
                }}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition"
              >
                ← Back to login
              </button>
            </div>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-xs text-gray-500">
          Protected by industry-standard encryption
        </div>
      </div>
    </div>
  );
}