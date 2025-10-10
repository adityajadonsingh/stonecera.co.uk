"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { AppUser } from "@/lib/types";

interface Props {
  user?: AppUser | null;
}

export default function AuthMenu({ user }: Props) {
  const router = useRouter();

  // undefined = loading / not fetched yet; null = no user; AppUser = logged in
  const [localUser, setLocalUser] = useState<AppUser | null | undefined>(user ?? undefined);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchUser(): Promise<void> {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include", signal: controller.signal });
        if (!mounted) return;
        if (res.ok) {
          const json = (await res.json()) as AppUser | null;
          setLocalUser(json);
        } else {
          setLocalUser(null);
        }
      } catch (err) {
        if (!controller.signal.aborted && mounted) setLocalUser(null);
      }
    }

    // fetch on mount to ensure we are in sync
    void fetchUser();

    // Event handlers (same-tab and cross-tabs)
    function onAuth(): void {
      void fetchUser();
    }
    function onStorage(e: StorageEvent): void {
      if (e.key === "auth") void fetchUser();
    }

    window.addEventListener("auth", onAuth);
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      controller.abort();
      window.removeEventListener("auth", onAuth);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Unified logout used inside header dropdown
  async function handleLogout(): Promise<void> {
    setOpen(false);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      if (!res.ok) {
        // optional: read error text and show
        // eslint-disable-next-line no-console
        console.error("Logout failed", await res.text().catch(() => "no body"));
        setBusy(false);
        return;
      }

      // notify components in this tab instantly
      window.dispatchEvent(new Event("auth"));
      // notify other tabs
      try {
        localStorage.setItem("auth", String(Date.now()));
      } catch {
        /* ignore if storage blocked */
      }

      // revalidate server components (layout/header)
      router.refresh();
      router.push("/login");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Logout error", err);
    } finally {
      setBusy(false);
    }
  }

  // While still loading initial value show nothing (or a spinner)
  if (localUser === undefined) {
    return <div className="px-4">...</div>;
  }

  if (!localUser) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-sm px-3 py-1 border rounded hover:bg-gray-50">
          Login
        </Link>
        <Link href="/register" className="text-sm px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900">
          Register
        </Link>
      </div>
    );
  }
  const profileImage = localUser.userDetails?.profileImage;
  const avatarUrl =  localUser.userDetails?.profileImage?.url ?? "/media/user.png";
  const displayName = localUser.userDetails?.fullName ?? localUser.username ?? localUser.email ?? "User";

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-3 px-3 py-1 rounded hover:bg-gray-100"
        aria-expanded={open}
      >
        {typeof avatarUrl === "string" && avatarUrl.startsWith("http") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <Image src={avatarUrl} alt={displayName} width={32} height={32} className="rounded-full object-cover" />
        ) : (
          <Image src={avatarUrl} alt={displayName} width={32} height={32} className="rounded-full object-cover" />
        )}
        <span className="text-sm font-medium">{displayName}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpen(false)}>
              Profile
            </Link>

            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await handleLogout();
              }}
              disabled={busy}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {busy ? "Logging out…" : "Logout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}