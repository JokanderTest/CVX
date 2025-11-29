"use client";

import { useState } from "react";

export default function RegisterPage() {
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
        credentials: 'include',  // ← أضفته هنا
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Registration failed");
      } else {
        setStage("code");
        setInfo(`A 6-digit code was sent to ${email}. Expires in ${Math.round((data.expiresIn || 900)/60)} minutes.`);
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
        credentials: 'include',  // ← أضفته هنا
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Verification failed");
      } else {
        // if server returned tokens, save access token
        if (data?.tokens?.accessToken || data?.accessToken) {
          const access = data.tokens?.accessToken ?? data.accessToken;
          localStorage.setItem("access", access);
        }
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
      const res = await fetch("http://localhost:3000/auth/resend-register-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: 'include',  // ← أضفته هنا
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || "Resend failed");
      else setInfo(`Code resent. Expires in ${Math.round((data.expiresIn || 900)/60)} minutes.`);
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (stage === "done") {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Account ready ✅</h1>
          <p className="text-gray-300 mb-6">Your account was created and email verified. You are signed in.</p>
          <a href="/dashboard" className="inline-block bg-indigo-600 hover:bg-indigo-700 py-2 px-4 rounded-lg font-medium">Go to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-lg p-8">
        {stage === "form" && (
          <>
            <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
            <form onSubmit={handleStart} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Full Name</label>
                <input type="text" value={name} onChange={(e)=>setName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm mb-1">Password</label>
                <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
              </div>

              {error && <div className="text-red-400 text-sm">{error}</div>}
              {info && <div className="text-green-400 text-sm">{info}</div>}

              <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg font-medium">
                {loading ? "Processing..." : "Create Account"}
              </button>
            </form>

            <div className="text-center mt-4">
              <a href="/auth/login" className="text-indigo-400 hover:underline">Back to login</a>
            </div>
          </>
        )}

        {stage === "code" && (
          <>
            <h1 className="text-2xl font-bold text-center mb-4">Enter verification code</h1>
            <p className="text-gray-300 text-sm mb-4">{info}</p>

            <form onSubmit={handleVerify} className="space-y-4">
              <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e)=>setCode(e.target.value)} placeholder="123456" className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-center text-xl tracking-widest" />
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg font-medium">{loading ? "Verifying..." : "Verify code"}</button>
                <button type="button" onClick={handleResend} disabled={loading} className="bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded-lg">Resend</button>
              </div>
            </form>
            <div className="text-center mt-4">
              <a href="/auth/login" className="text-indigo-400 hover:underline">Back to login</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}