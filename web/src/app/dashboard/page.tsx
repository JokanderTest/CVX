"use client";

import { useEffect, useState } from "react";

type SafeUser = {
  id: string;
  email?: string;
  name?: string;
  role?: string;
};

export default function DashboardPage() {
  const [access, setAccess] = useState<string | null>(null);
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
    setAccess(token);
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("http://localhost:3000/auth/whoami", {
          method: "GET",
          headers,
          credentials: 'include',  // ← أضفته هنا لإرسال الكوكيز
        });

        // If server returns JSON even on 401/403, parse it.
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          if (res.status === 401) {  // ← أضفته: إذا 401 (expired)، عمل refresh
            await handleRefresh();
            return; // يعيد تشغيل useEffect بعد refresh
          }
          // not authenticated or token expired -> stay guest
          setUser(null);
          if (data?.message) setError(data.message);
        } else {
          setUser(data?.user ?? null);
        }
      } catch (err) {
        setError("Network error while fetching user info");
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ← أضفت هذه الدالة الجديدة للـ refresh تلقائي
  async function handleRefresh() {
    try {
      const res = await fetch("http://localhost:3000/auth/refresh", {
        method: "POST",
        credentials: 'include',  // يرسل الكوكي
      });

      if (!res.ok) {
        throw new Error('Refresh failed');
      }

      const data = await res.json();
      localStorage.setItem("access", data.accessToken);
      window.location.reload();  // يحدث الصفحة ليعيد whoami
    } catch (err) {
      setError("Session expired. Please sign in again.");
      localStorage.removeItem("access");
      window.location.href = "/auth/login";
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="text-sm text-gray-400">CVX</div>
        </div>
        <div className="mt-6">
          {loading ? (
            <div className="text-gray-300">Loading user info…</div>
          ) : (
            <>
              <p className="text-gray-300">
                {user ? (
                  <>Welcome back, <span className="font-semibold text-white">{user.name ?? user.email}</span>.</>
                ) : (
                  <>Welcome, <span className="font-semibold text-white">Guest</span>.</>
                )}
              </p>
              {error && <div className="mt-3 text-red-400 text-sm">{error}</div>}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={user ? "/projects/new" : "/auth/register"}
                  className="block text-center bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg font-medium"
                >
                  {user ? "Create a new CV" : "Create account to save CVs"}
                </a>
                <a
                  href={user ? "/my-documents" : "/auth/login"}
                  className="block text-center bg-gray-700 hover:bg-gray-600 py-2 rounded-lg"
                >
                  {user ? "My Documents" : "Sign in"}
                </a>
              </div>
              <div className="mt-6 text-sm text-gray-400">
                <div>Access Token: <span className={access ? "text-green-400" : "text-yellow-300"}>{access ? "Loaded" : "Missing"}</span></div>
                <div className="mt-1">Account status: <span className="font-medium text-white">{user ? "Authenticated" : "Not authenticated"}</span></div>
              </div>
            </>
          )}
        </div>
        <div className="mt-8 text-xs text-gray-500">
          <p>
            Note: public view — some actions require sign in. Sensitive server endpoints remain protected.
          </p>
        </div>
      </div>
    </div>
  );
}