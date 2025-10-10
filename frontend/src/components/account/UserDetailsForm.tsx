// FILE: frontend/src/components/account/UserDetailsForm.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserDetails } from "@/lib/types";

interface Props {
  initialData?: UserDetails | null;
}

type SimplePhone = { phone?: string };
type SimpleAddress = { address?: string };

function toAbsolute(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const base = (process.env.NEXT_PUBLIC_STRAPI_API_URL ?? "").replace(/\/+$/, "");
  return base ? `${base}${url.startsWith("/") ? url : `/${url}`}` : url;
}

export default function UserDetailsForm({ initialData = null }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState<string>(initialData?.fullName ?? "");
  const [phoneNumbers, setPhoneNumbers] = useState<SimplePhone[]>(
    initialData?.phoneNumbers && initialData.phoneNumbers.length ? initialData.phoneNumbers : [{ phone: "" }]
  );
  const [savedAddresses, setSavedAddresses] = useState<SimpleAddress[]>(
    initialData?.savedAddresses && initialData.savedAddresses.length ? initialData.savedAddresses : [{ address: "" }]
  );

  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    initialData?.profileImage?.url ? toAbsolute(initialData.profileImage.url) : "/media/user.png"
  );
  const [profileImageId, setProfileImageId] = useState<number | null | undefined>(
    (initialData?.profileImage as any)?.id ?? null
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setFullName(initialData?.fullName ?? "");
    setPhoneNumbers(initialData?.phoneNumbers && initialData.phoneNumbers.length ? initialData.phoneNumbers : [{ phone: "" }]);
    setSavedAddresses(initialData?.savedAddresses && initialData.savedAddresses.length ? initialData.savedAddresses : [{ address: "" }]);
    setProfileImageUrl(initialData?.profileImage?.url ? toAbsolute(initialData.profileImage.url) : "/media/user.png");
    setProfileImageId((initialData?.profileImage as any)?.id ?? null);
  }, [initialData]);

  function updatePhone(idx: number, val: string) {
    setPhoneNumbers((s) => s.map((p, i) => (i === idx ? { phone: val } : p)));
  }
  function removePhone(idx: number) {
    setPhoneNumbers((s) => s.filter((_, i) => i !== idx));
  }
  function addPhone() {
    setPhoneNumbers((s) => [...s, { phone: "" }]);
  }

  function updateAddress(idx: number, val: string) {
    setSavedAddresses((s) => s.map((p, i) => (i === idx ? { address: val } : p)));
  }
  function removeAddress(idx: number) {
    setSavedAddresses((s) => s.filter((_, i) => i !== idx));
  }
  function addAddress() {
    setSavedAddresses((s) => [...s, { address: "" }]);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("files", file); // Strapi expects 'files'

      const res = await fetch("/api/user-details/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Upload failed");
        setError(`Upload failed: ${text}`);
        return;
      }

      const json = (await res.json()) as unknown;
      // expected normalized shape: { id, url, name }
      const id = (json as any)?.id ?? null;
      const url = (json as any)?.url ?? null;
      if (!id || !url) {
        setError("Upload did not return file info");
        return;
      }
      setProfileImageId(Number(id));
      setProfileImageUrl(toAbsolute(String(url)));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Upload error:", err);
      setError("Upload error");
    } finally {
      setUploading(false);
      // clear input value so same file can be re-selected later
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        fullName: fullName || null,
        phoneNumbers: phoneNumbers.filter((p) => p.phone && String(p.phone).trim()),
        savedAddresses: savedAddresses.filter((a) => a.address && String(a.address).trim()),
        profileImageId: profileImageId ?? null,
      };

      const res = await fetch("/api/user-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Save failed");
        setError(`Save failed: ${text}`);
        return;
      }

      // notify current tab and other tabs, revalidate server components
      window.dispatchEvent(new Event("auth"));
      try {
        localStorage.setItem("auth", String(Date.now()));
      } catch {
        /* ignore */
      }

      // revalidate server components (Header) and navigate to /account
      router.refresh();
      router.push("/account");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Save error:", err);
      setError("Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium mb-1">Full name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border rounded p-2" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Profile image</label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profileImageUrl ?? "/media/user.png"} alt="profile" className="w-full h-full object-cover" />
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} />
            {uploading && <div className="text-sm text-gray-600 mt-2">Uploading…</div>}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone numbers</label>
        <div className="space-y-2">
          {phoneNumbers.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={p.phone ?? ""}
                onChange={(e) => updatePhone(i, e.target.value)}
                className="flex-1 border rounded p-2"
                placeholder="Phone number"
              />
              <button type="button" className="px-2 py-1 text-sm border rounded" onClick={() => removePhone(i)} disabled={phoneNumbers.length === 1}>
                Remove
              </button>
            </div>
          ))}

          <div>
            <button type="button" onClick={addPhone} className="px-3 py-1 bg-gray-100 rounded text-sm">
              Add phone
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Saved addresses</label>
        <div className="space-y-2">
          {savedAddresses.map((a, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={a.address ?? ""}
                onChange={(e) => updateAddress(i, e.target.value)}
                className="flex-1 border rounded p-2"
                placeholder="Address"
              />
              <button type="button" className="px-2 py-1 text-sm border rounded" onClick={() => removeAddress(i)} disabled={savedAddresses.length === 1}>
                Remove
              </button>
            </div>
          ))}

          <div>
            <button type="button" onClick={addAddress} className="px-3 py-1 bg-gray-100 rounded text-sm">
              Add address
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button disabled={saving} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            // reset to initial
            setFullName(initialData?.fullName ?? "");
            setPhoneNumbers(initialData?.phoneNumbers && initialData.phoneNumbers.length ? initialData.phoneNumbers : [{ phone: "" }]);
            setSavedAddresses(initialData?.savedAddresses && initialData.savedAddresses.length ? initialData.savedAddresses : [{ address: "" }]);
            setProfileImageUrl(initialData?.profileImage?.url ? toAbsolute(initialData.profileImage.url) : "/media/user.png");
            setProfileImageId((initialData?.profileImage as any)?.id ?? null);
          }}
          className="px-3 py-2 border rounded"
        >
          Reset
        </button>
      </div>
    </form>
  );
}