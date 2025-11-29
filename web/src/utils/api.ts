export async function apiFetch(url: string, options: RequestInit = {}) {
  const response = await fetch(`http://localhost:3000${url}`, {
    ...options,
    credentials: 'include',  // ← السطر اللي هيحل كل المشكلة
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('API error');
  }

  return response.json();
}

// مثال للـ refresh
export async function refreshToken() {
  return apiFetch('/auth/refresh', { method: 'POST' });
}