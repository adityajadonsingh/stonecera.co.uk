// src/app/login/page.tsx
import LoginForm from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    // already logged in — go to account
    redirect("/account");
  }

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-4">Customer Login</h1>
      <p className="mb-6 text-sm text-gray-600">Sign in to access your account and orders.</p>
      <LoginForm />
    </main>
  );
}