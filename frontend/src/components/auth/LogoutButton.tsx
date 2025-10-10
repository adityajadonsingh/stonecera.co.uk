"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      if (!res.ok) {
        const text = await res.text().catch(() => "Logout failed");
        setError(`Logout failed: ${text}`);
        return;
      }

      // notify current tab + other tabs
      window.dispatchEvent(new Event("auth"));
      try {
        localStorage.setItem("auth", String(Date.now()));
      } catch {
        /* ignore */
      }

      // revalidate server components and navigate
      router.refresh();
      router.push("/login");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", err);
      setError("Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <button
        onClick={handleLogout}
        disabled={loading}
        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-60"
        aria-busy={loading}
      >
        {loading ? "Logging out…" : "Logout"}
      </button>
    </div>
  );
}