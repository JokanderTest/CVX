"use client";

import { useState } from "react";
import GoogleLoginButton from "../../components/GoogleLoginButton";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // OTP flow when email not verified
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  // Get CSRF token from cookie (currently unused, but kept for future use)
  const getCsrfToken = () => {
    const cookies = document.cookie.split(";");
    const csrfCookie = cookies.find((c) =>
      c.trim().startsWith("csrf_token="),
    );
    return csrfCookie ? csrfCookie.split("=")[1] : null;
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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
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
        setInfo(
          "Your email is not verified. Enter the 6-digit code sent to your email.",
        );
        setLoading(false);
        return;
      }

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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: pendingEmail, code }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Verification failed");
        setLoading(false);
        return;
      }

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
      const res = await fetch(
        "http://localhost:3000/auth/resend-register-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: pendingEmail || email }),
          credentials: "include",
        },
      );

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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-lg p-8 border border-white/5">
        {!showCode && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">Welcome back</h1>
              <p className="text-sm text-foreground/70 mt-2">
                Sign in to your account
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg px-4 py-3 bg-background text-foreground placeholder-foreground/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg px-4 py-3 bg-background text-foreground placeholder-foreground/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {error && (
                <div className="text-red-400 bg-red-500/10 border border-red-500/40 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {info && (
                <div className="text-green-400 bg-green-500/10 border border-green-500/40 px-4 py-3 rounded-lg text-sm">
                  {info}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors py-3 rounded-lg font-semibold text-foreground"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <div className="mt-4">
                <GoogleLoginButton label="Continue with Google" />
              </div>
            </form>

            <div className="mt-6 text-center space-y-3 text-sm">
              <a href="/auth/forgot-password" className="text-primary">
                Forgot password?
              </a>

              <div className="text-foreground/70">
                Don&apos;t have an account?{" "}
                <a href="/auth/register" className="text-primary font-medium">
                  Create one
                </a>
              </div>
            </div>
          </>
        )}

        {showCode && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">Verify your email</h1>
              <p className="text-sm text-foreground/70">
                We sent a 6-digit code to
                <br />
                <span className="text-foreground font-medium">
                  {pendingEmail}
                </span>
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div>
                <label className="block text-sm mb-2 text-center">
                  Enter verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                  className="w-full px-4 py-4 rounded-lg bg-background text-foreground placeholder-foreground/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-[0.5em]"
                />
              </div>

              {error && (
                <div className="text-red-400 bg-red-500/10 border border-red-500/40 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {info && (
                <div className="text-green-400 bg-green-500/10 border border-green-500/40 px-4 py-3 rounded-lg text-sm">
                  {info}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors py-3 rounded-lg font-semibold text-foreground"
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="py-3 px-5 rounded-lg bg-background border border-white/10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="text-sm text-primary"
              >
                ← Back to login
              </button>
            </div>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-foreground/60">
          Protected by industry-standard encryption
        </div>
      </div>
    </div>
  );
}
