"use client";

import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  // 1. استخدام الكونتكست بدلاً من الـ Fetch اليدوي
  const { user, loading, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-surface rounded-xl shadow-lg p-8 border border-white/5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-sm text-foreground/70 mt-1">
              Overview of your CVX account status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs uppercase tracking-wide text-foreground/60">
              CVX
            </div>
            {/* استبدال LogoutButton بدالة logout من الكونتكست مع الحفاظ على نفس التصميم */}
            <button
              onClick={() => logout()}
              className="px-3 py-1.5 bg-background border border-white/10 rounded text-sm text-foreground hover:bg-background/80 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="text-foreground/80">Loading user info…</div>
          ) : (
            <>
              {/* قسم الترحيب */}
              <div className="mb-4">
                <p className="text-foreground/90 text-lg">
                  {user ? (
                    <>
                      Welcome back,{" "}
                      <span className="font-semibold">
                        {user.name || "User"}
                      </span>
                      .
                    </>
                  ) : (
                    <>
                      Welcome, <span className="font-semibold">Guest</span>.
                    </>
                  )}
                </p>

                {/* ✅ إضافة الإيميل هنا كما طلبت */}
                {user?.email && (
                  <p className="text-sm text-foreground/60 mt-1">
                    email : <span className="font-mono">{user.email}</span>
                  </p>
                )}
              </div>

              {/* الأزرار كما هي تماماً */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={user ? "/make-new-cv" : "/auth/register"}
                  className="block text-center bg-primary hover:bg-primary/90 py-2.5 rounded-lg font-medium !text-[var(--foreground)]"
                >
                  {user ? "Create a new CV" : "Create account to save CVs"}
                </a>
                <a
                  href={user ? "/my-documents" : "/auth/login"}
                  className="block text-center bg-background border border-white/10 hover:bg-background/80 py-2.5 rounded-lg font-medium text-foreground"
                >
                  {user ? "My Documents" : "Sign in"}
                </a>
              </div>

              {/* المعلومات التقنية (Token & Status) كما هي تماماً */}
              <div className="mt-6 text-sm text-foreground/75 space-y-1.5">
                <div>
                  Access Token:
                  <span
                    className={
                      user
                        ? "ml-2 text-green-400"
                        : "ml-2 text-red-400"
                    }
                  >
                    {user ? "Active (Auto-Refreshed)" : "Missing"}
                  </span>
                </div>
                <div>
                  Account status:
                  <span className="font-medium ml-2">
                    {user ? "Authenticated" : "Not authenticated"}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 text-xs text-foreground/60">
          <p>
            Note: some actions require sign in. Sensitive server endpoints
            remain protected.
          </p>
        </div>
      </div>
    </div>
  );
}