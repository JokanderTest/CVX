import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
// 1. إضافة هذا السطر
import { AuthProvider } from "@/context/AuthContext";

// Global Roboto font for the whole app
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "CVX SAAS",
  description: "Smart CV builder powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} antialiased`}>
        {/* 2. تغليف الـ children بالبروفايدر */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}