// app/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const cookieStore = await cookies();

  // ⚠️ التغيير هنا: نفحص الـ refresh_token لأنه يدوم طويلاً (30 يوماً)
  // access_token يختفي بسرعة، فلا تعتمد عليه في التوجيه الأولي
  const hasSession = cookieStore.has('refresh_token');

  // 1) إذا لم يكن لديه جلسة طويلة الأمد -> تسجيل الدخول
  if (!hasSession) {
    redirect('/auth/login');
  }

  // 2) إذا كان لديه جلسة -> لوحة التحكم
  // (لوحة التحكم ستحاول جلب البيانات، وإذا فشلت ستجدد التوكن تلقائياً)
  redirect('/dashboard');
}