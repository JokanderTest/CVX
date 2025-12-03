// src/app/auth/register/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import RegisterForm from "./register-form"; // استيراد الفورم الذي غيرت اسمه

export default async function RegisterPage() {
  // 1. قراءة الكوكيز من السيرفر
  const cookieStore = await cookies();

  // 2. فحص هل هو مسجل بالفعل؟ (لديه Refresh Token)
  const hasSession = cookieStore.has("refresh_token");

  // 3. نعم -> اطرده إلى الداش بورد فوراً
  if (hasSession) {
    redirect("/dashboard");
  }

  // 4. لا -> اعرض له صفحة التسجيل
  return <RegisterForm />;
}