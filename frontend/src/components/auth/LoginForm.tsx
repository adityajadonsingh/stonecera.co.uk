"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  identifier: string;
  password: string;
};

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // critical for cookies
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Login failed");
        setError(text);
        return;
      }

      // notify same tab and other tabs
      window.dispatchEvent(new Event("auth"));
      try {
        localStorage.setItem("auth", String(Date.now()));
      } catch {
        /* ignore */
      }

      // revalidate server components (Header etc.)
      router.refresh();

      // go to account
      router.replace("/account");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Login error", err);
      setError("Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm">Email or username</label>
        <input name="identifier" value={form.identifier} onChange={handleChange} className="w-full border rounded p-2" required />
      </div>

      <div>
        <label className="block text-sm">Password</label>
        <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full border rounded p-2" required />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </form>
  );
}