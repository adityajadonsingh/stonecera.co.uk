// src/app/account/page.tsx
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/auth/LogoutButton";
import Link from "next/link";
export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Account</h1>
        <p>You are not logged in. <Link href="/login">Login</Link></p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Account</h1>
      <p>Welcome, <strong>{user.username ?? user.email}</strong></p>
      <pre className="mt-4 text-sm p-3 rounded">{JSON.stringify(user, null, 2)}</pre>
      <div className="mt-4">
        <LogoutButton />
      </div>
    </main>
  );
}