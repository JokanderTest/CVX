// src/app/auth/login/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "./login-form"; // استيراد الفورم الذي غيرت اسمه

export default async function LoginPage() {
  // 1. قراءة الكوكيز من السيرفر مباشرة
  const cookieStore = await cookies();

  // 2. فحص وجود "بطاقة الهوية الدائمة"
  const hasSession = cookieStore.has("refresh_token");

  // 3. إذا كان مسجلاً -> اطرده إلى الداش بورد
  if (hasSession) {
    redirect("/dashboard");
  }

  // 4. إذا لم يكن مسجلاً -> اعرض له الفورم
  return <LoginForm />;
}