"use client";

const BACKEND_URL = "http://localhost:3000";
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${BACKEND_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  };

  try {
    let response = await fetch(url, defaultOptions);

    // إذا حصلنا على 401
    if (response.status === 401) {
      console.log("🔴 Got 401 for:", endpoint);

      // تجنب حلقة لا نهائية مع /refresh نفسه
      if (url.includes("/auth/refresh")) {
        console.log("⚠️ Refresh endpoint itself returned 401");
        return response;
      }

      // إذا كان هناك refresh جاري، انتظره
      if (isRefreshing && refreshPromise) {
        console.log("⏳ Waiting for ongoing refresh...");
        const success = await refreshPromise;
        if (success) {
          console.log("♻️ Retrying request after refresh");
          response = await fetch(url, defaultOptions);
        }
        return response;
      }

      // نبدأ refresh جديد
      console.log("🔄 Starting token refresh...");
      isRefreshing = true;
      refreshPromise = attemptRefresh();
      
      const success = await refreshPromise;
      
      if (success) {
        console.log("✅ Refresh successful! Retrying request...");
        response = await fetch(url, defaultOptions);
      } else {
        console.log("❌ Refresh failed");
        
        // فحص المسار الحالي
        const currentPath = window.location.pathname;
        console.log("📍 Current path:", currentPath);
        
        // قائمة الصفحات المسموح بها بدون تسجيل
        const allowedPaths = ["/auth", "/make-new-cv", "/landing", "/dashboard"];
        const isAllowed = allowedPaths.some(path => currentPath.startsWith(path));
        
        if (isAllowed) {
          console.log("✅ Allowed path - staying on page");
        } else {
          console.log("🚪 Protected path - redirecting to login");
          window.location.href = "/auth/login";
        }
      }

      isRefreshing = false;
      refreshPromise = null;
    }

    return response;

  } catch (error) {
    console.error("🔥 Network error:", error);
    isRefreshing = false;
    refreshPromise = null;
    throw error;
  }
}

async function attemptRefresh(): Promise<boolean> {
  try {
    console.log("🔄 Calling /auth/refresh...");
    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    
    console.log("📡 Refresh response status:", res.status);
    return res.ok;
  } catch (error) {
    console.error("🔥 Refresh request failed:", error);
    return false;
  }
}