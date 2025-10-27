// src/components/auth/RegisterForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const validate = () => {
    if (!email || !password || !username) {
      setError("Please fill all required fields.");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return false;
    }
    if (password !== password2) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { error: text }; }

      if (!res.ok) {
        setError(data?.error?.message ?? data?.error ?? "Registration failed");
        setLoading(false);
        return;
      }

      // If Strapi requires email confirmation, response will indicate that
      // If registration returns user, redirect to account or show message
      router.refresh(); 
      router.push("/account");
    } catch (err) {
      console.error("Register error:", err);
      setError("Unexpected server error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-white p-6 rounded shadow-sm">
      {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Username</span>
        <input value={username} onChange={(e)=>setUsername(e.target.value)} required className="mt-1 block w-full border rounded px-3 py-2" />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Email</span>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required className="mt-1 block w-full border rounded px-3 py-2" />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Password</span>
        <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required className="mt-1 block w-full border rounded px-3 py-2" />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Confirm Password</span>
        <input value={password2} onChange={(e)=>setPassword2(e.target.value)} type="password" required className="mt-1 block w-full border rounded px-3 py-2" />
      </label>

      <div className="flex items-center justify-between mt-2">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-amber-600 text-white rounded">
          {loading ? "Creating…" : "Create account"}
        </button>
      </div>
    </form>
  );
}