//C:\Users\JokanderX\cvx\web\src\context\AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch } from "@/lib/api-client";
import { useRouter, usePathname } from "next/navigation";

type User = {
  id: string;
  email: string;
  name?: string;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 👇 الصفحات التي لا تحتاج تسجيل دخول (لكن تحاول جلب بيانات المستخدم إن وُجد)
const OPTIONAL_AUTH_ROUTES = ["/make-new-cv"];

// 👇 الصفحات التي لا تحتاج أي تحقق من المصادقة أبداً
const PUBLIC_ROUTES = ["/auth"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const res = await apiFetch("/auth/whoami");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 👇 صفحات المصادقة: لا نفعل شيء أبداً
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
    if (isPublicRoute) {
      setLoading(false);
      return;
    }

    // 👇 الصفحات الهجينة (مثل /make-new-cv): نحاول جلب المستخدم لكن بدون إجبار
    const isOptionalAuth = OPTIONAL_AUTH_ROUTES.some(route => pathname.startsWith(route));
    if (isOptionalAuth) {
      // نجلب بيانات المستخدم بهدوء، إذا فشل = لا مشكلة
      fetchUser();
      return;
    }

    // 👇 الصفحات المحمية (مثل /dashboard): يجب جلب المستخدم
    fetchUser();
  }, [pathname]);

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      setUser(null);

      // منطق التوجيه بعد تسجيل الخروج
      if (pathname === "/dashboard") {
        router.push("/auth/login");
      } else if (pathname !== "/make-new-cv") {
        router.push("/auth/login");
      }
      // إذا كان في /make-new-cv، يبقى في نفس الصفحة
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}