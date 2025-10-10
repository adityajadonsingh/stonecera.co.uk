// src/app/register/page.tsx
import RegisterForm from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      <p className="mb-6 text-sm text-gray-600">Create a new account to place orders and track purchases.</p>
      <RegisterForm />
    </main>
  );
}