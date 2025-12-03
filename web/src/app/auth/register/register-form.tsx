// src/app/auth/register/register-form.tsx
"use client";

import { useState } from "react";
import GoogleLoginButton from "../../components/GoogleLoginButton";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [stage, setStage] = useState<"form" | "code" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [code, setCode] = useState("");

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch("http://localhost:3000/auth/register-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Registration failed");
      } else {
        setStage("code");
        setInfo(
          `A 6-digit code was sent to ${email}. Expires in ${Math.round(
            (data.expiresIn || 900) / 60
          )} minutes.`
        );
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3000/auth/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Verification failed");
      } else {
        // ✅ تم الحذف: لم نعد نحفظ التوكن في localStorage
        // الباك-إند قام بضبط الكوكيز تلقائياً
        setStage("done");
      }
    } catch (err) {
      setError("Network error");
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok) setError(data.message || "Resend failed");
      else
        setInfo(
          `Code resent. Expires in ${Math.round(
            (data.expiresIn || 900) / 60
          )} minutes.`
        );
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  // === DONE STAGE ===
  if (stage === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl shadow-lg p-8 text-center bg-surface">
          <h1 className="text-2xl font-bold mb-4">Account ready ✅</h1>
          <p className="mb-6 text-sm text-foreground/80">
            Your account was created and email verified.<br />
            You are signed in.
          </p>
          <a
            href="/dashboard"
            className="inline-block w-full bg-primary hover:bg-primary/90 py-3 px-4 rounded-lg font-medium !text-[var(--foreground)] text-center"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // === FORM & CODE STAGES ===
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl shadow-lg p-8 bg-surface">
        {stage === "form" && (
          <>
            <h1 className="text-2xl font-bold text-center mb-6">
              Create Account
            </h1>
            <form onSubmit={handleStart} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-background text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Iskander Trabelsi"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-background text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-background text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••••••••••"
                />
              </div>
              {error && (
                <div className="text-red-400 text-sm mt-1">{error}</div>
              )}
              {info && (
                <div className="text-green-400 text-sm mt-1">{info}</div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 py-3 rounded-lg font-medium text-foreground"
              >
                {loading ? "Processing..." : "Create Account"}
              </button>
              <div className="my-4">
                <GoogleLoginButton label="Continue with Google" />
              </div>
            </form>
            <div className="text-center mt-4">
              <a href="/auth/login" className="text-primary hover:underline">
                Back to login
              </a>
            </div>
          </>
        )}

        {stage === "code" && (
          <>
            <h1 className="text-2xl font-bold text-center mb-4">
              Enter verification code
            </h1>
            <p className="text-sm mb-4 text-foreground/80">{info}</p>
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3 py-3 rounded-lg bg-background text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-center text-xl tracking-widest"
              />
              {error && (
                <div className="text-red-400 text-sm mt-1">{error}</div>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary/90 py-3 rounded-lg font-medium text-foreground"
                >
                  {loading ? "Verifying..." : "Verify code"}
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="py-3 px-4 rounded-lg bg-background border border-white/10 text-sm"
                >
                  Resend
                </button>
              </div>
            </form>
            <div className="text-center mt-4">
              <a href="/auth/login" className="text-primary hover:underline">
                Back to login
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}