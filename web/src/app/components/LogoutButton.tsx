'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

function readCsrfFromCookie(): string | null {
  try {
    const v = document.cookie.split(';').map(s => s.trim()).find(s => s.startsWith('csrf_token='));
    return v ? decodeURIComponent(v.split('=')[1]) : null;
  } catch {
    return null;
  }
}

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);

    const csrf = readCsrfFromCookie();

    try {
      const res = await fetch('http://localhost:3000/auth/logout', {
        method: 'POST',
        credentials: 'include', // مهم لإرسال الكوكيز HttpOnly
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'x-csrf-token': csrf } : {}),
        },
        body: JSON.stringify({}), // body اختياري حسب الـ backend
      });

      // نحاول قراءة JSON حتى لو كان 200 بدون body
      let ok = res.ok;
      try {
        const data = await res.json().catch(() => null);
        if (data && typeof data.ok === 'boolean') ok = ok && data.ok;
      } catch {}

      // امسح الحالة المحلية
      try {
        localStorage.removeItem('access'); // إذا تستعمل
        localStorage.removeItem('accessToken');
        sessionStorage.clear();
        // إذا تستخدم Redux / Zustand / Context → دعه يتصرف هنا (reset state)
      } catch (e) {
        // ignore
      }

      // أعد توجيه المستخدم لصفحة تسجيل الدخول
      router.push('/auth/login');
    } catch (err) {
      console.error('Logout failed', err);
      // حتى لو فشل، نعيد توجيه لتجنب بقاء المستخدم في حالة مشبوهة
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={className ?? 'px-3 py-1 rounded bg-gray-200 text-sm'}
      aria-busy={loading}
    >
      {loading ? 'Logging out…' : 'Logout'}
    </button>
  );
}
