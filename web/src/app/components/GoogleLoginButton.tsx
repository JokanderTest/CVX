// components/GoogleLoginButton.tsx
'use client';
import React from 'react';

export default function GoogleLoginButton({
  label = 'Sign in with Google',
  origin = 'login',
}: {
  label?: string;
  origin?: 'login' | 'signup';
}) {

  const handleClick = () => {
    // يوجه المستخدم إلى backend الذي يعيد التوجيه إلى Google Consent
    const url = origin === 'signup'
    ? 'http://localhost:3000/auth/google?origin=signup'
    : 'http://localhost:3000/auth/google?origin=login';

    window.location.href = url;

};

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-3 py-2 rounded-lg bg-white text-black hover:opacity-95"
    >
      <img src="/google-icon-logo.svg" alt="Google" style={{ width: 18, height: 18 }} />
      <span className="font-medium">{label}</span>
    </button>
  );
}
