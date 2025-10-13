"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { AppUser } from "@/lib/types";

export default function AuthMenu() {
  const [user, setUser] = useState<AppUser | null | undefined>(undefined); // undefined = loading
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function fetchUser(): Promise<void> {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const json = (await res.json()) as AppUser | null;
      setUser(json);
    } catch (err) {
      setUser(null);
    }
  }

  useEffect(() => {
    void fetchUser();
    // Listen for auth events from login/logout/user-details forms
    function onAuth() {
      void fetchUser();
    }
    window.addEventListener("auth", onAuth);
    window.addEventListener("storage", (e) => { if (e.key === "auth") void fetchUser(); });
    return () => {
      window.removeEventListener("auth", onAuth);
    };
  }, []);

  if (user === undefined) {
    return <div className="px-4">...</div>; // placeholder while loading
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-sm px-3 py-1 border rounded hover:bg-gray-50">Login</Link>
        <Link href="/register" className="text-sm px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900">Register</Link>
      </div>
    );
  }

  const avatarUrl = user.userDetails?.profileImage?.url ?? "/media/user.png";
  const displayName = user.userDetails?.fullName ?? user.username ?? user.email ?? "User";

  return (
    <div className="relative inline-block text-left">
      <button type="button" onClick={() => setOpen(s => !s)} className="flex items-center gap-3 px-3 py-1 rounded hover:bg-gray-100">
        {avatarUrl.startsWith("http") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <Image src={avatarUrl} alt={displayName} width={32} height={32} className="rounded-full object-cover" />
        )}
        <span className="text-sm font-medium">{displayName}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpen(false)}>Profile</Link>
            <button type="button" onClick={() => { setOpen(false); void (async () => {
              await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
              window.dispatchEvent(new Event("auth")); localStorage.setItem("auth", String(Date.now())); router.refresh(); router.push("/login");
            })(); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</button>
          </div>
        </div>
      )}
    </div>
  );
}