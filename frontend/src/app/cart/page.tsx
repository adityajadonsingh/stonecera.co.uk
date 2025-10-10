// FILE: frontend/src/app/cart/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";

type MinimalImage = { url: string; alt?: string | null };

type MinimalProduct = {
  id?: number;
  name?: string;
  slug?: string;
  images?: MinimalImage[];
  [key: string]: unknown;
};

type NormalizedItem = {
  id: number;
  quantity: number;
  unit_price?: number | null;
  product?: MinimalProduct | null;
  metadata?: Record<string, unknown> | null;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function toNumber(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string" && x.trim() !== "" && !Number.isNaN(Number(x))) return Number(x);
  return null;
}

function toString(x: unknown): string | null {
  return typeof x === "string" && x.trim() !== "" ? x : null;
}

function extractImages(obj: unknown): MinimalImage[] {
  if (!obj) return [];

  // If it's already an array of possible image objects
  if (Array.isArray(obj)) {
    const imgs: MinimalImage[] = [];
    for (const item of obj) {
      if (!isRecord(item)) continue;

      // shape: { url, alt? }
      if (typeof item.url === "string") {
        imgs.push({
          url: item.url,
          alt: typeof item.alt === "string" ? item.alt : null,
        });
        continue;
      }

      // shape: { attributes: { url, alternativeText? } }
      if (isRecord(item.attributes) && typeof item.attributes.url === "string") {
        const attrs = item.attributes as Record<string, unknown>;
        imgs.push({
          url: String(attrs.url),
          alt: typeof attrs.alternativeText === "string" ? String(attrs.alternativeText) : null,
        });
        continue;
      }
    }
    return imgs;
  }

  // relation shape: { data: [...] } or { data: { ... } }
  if (isRecord(obj) && Array.isArray(obj.data)) {
    return extractImages(obj.data);
  }
  if (isRecord(obj) && isRecord(obj.data)) {
    return extractImages(obj.data);
  }

  return [];
}

export default function CartPage() {
  const [items, setItems] = useState<NormalizedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchCart = async (): Promise<void> => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/cart", { credentials: "include" });
      if (!res.ok) {
        const text = await res.text().catch(() => "Failed to fetch cart");
        setErr(text);
        setItems([]);
        return;
      }
      const raw = (await res.json()) as unknown;
      setItems(normalizeCartRaw(raw));
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error("fetchCart error:", e);
      setErr("Server error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizeCartRaw = (raw: unknown): NormalizedItem[] => {
    // handle shapes: array, { data: [] }, single { data: { ... } }, { items: [] }, etc.
    let arr: unknown[] = [];

    if (!raw) return [];
    if (Array.isArray(raw)) arr = raw;
    else if (isRecord(raw) && Array.isArray(raw.data)) arr = raw.data;
    else if (isRecord(raw) && isRecord(raw.data) && (typeof raw.data.id !== "undefined" || typeof raw.data.attributes !== "undefined")) arr = [raw.data];
    else if (isRecord(raw) && Array.isArray(raw.items)) arr = raw.items;
    else if (isRecord(raw) && Array.isArray(raw.cart)) arr = raw.cart;
    else if (isRecord(raw) && isRecord(raw.data) && Array.isArray(raw.data.items)) arr = raw.data.items;
    else return [];

    return arr.map((entry) => {
      const entryObj = isRecord(entry) ? entry : {};
      const attr = isRecord(entryObj.attributes) ? entryObj.attributes : entryObj;

      // id extraction
      const idCandidate = entryObj.id ?? (isRecord(attr) ? (attr.id ?? null) : null);
      const idNum = toNumber(idCandidate) ?? 0;

      // quantity
      const qtyCandidate = isRecord(attr) ? (attr.quantity ?? attr.qty ?? 1) : 1;
      const qtyNum = toNumber(qtyCandidate) ?? (typeof qtyCandidate === "string" ? Number(qtyCandidate) || 1 : 1);

      // unit_price
      const priceCandidate = isRecord(attr) ? (attr.unit_price ?? attr.unitPrice ?? attr.price ?? null) : null;
      const unitPriceNum = toNumber(priceCandidate);

      // product normalization
      const productField = isRecord(attr) ? (attr.product ?? null) : null;
      let productEntity: unknown = null;

      if (isRecord(productField) && isRecord(productField.data)) productEntity = productField.data;
      else productEntity = productField;

      const productAttrs = isRecord(productEntity) && isRecord(productEntity.attributes) ? productEntity.attributes : (isRecord(productEntity) ? productEntity : null);

      let product: MinimalProduct | null = null;
      if (productAttrs && isRecord(productAttrs)) {
        const pId = toNumber((productEntity && isRecord(productEntity) && typeof (productEntity as Record<string, unknown>).id !== "undefined") ? (productEntity as Record<string, unknown>).id : productAttrs.id) ?? undefined;
        const name = typeof productAttrs.name === "string" ? productAttrs.name : undefined;
        const slug = typeof productAttrs.slug === "string" ? productAttrs.slug : undefined;
        const imgs = extractImages(productAttrs.images ?? productAttrs.images);
        product = { id: pId, name, slug, images: imgs };
      }

      const metadata = isRecord(attr) && isRecord(attr.metadata) ? (attr.metadata as Record<string, unknown>) : null;

      const normalized: NormalizedItem = {
        id: Number(idNum),
        quantity: Number(qtyNum),
        unit_price: unitPriceNum ?? null,
        product,
        metadata,
      };

      return normalized;
    });
  };

  const handleRemove = async (itemId: number): Promise<void> => {
    if (!confirm("Remove this item from cart?")) return;
    setRemovingId(itemId);
    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const text = await res.text().catch(() => "Failed to remove");
        alert("Remove failed: " + text);
      } else {
        await fetchCart();
      }
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error("remove error", e);
      alert("Server error");
    } finally {
      setRemovingId(null);
    }
  };

  const handleUpdateQty = async (itemId: number, qty: number): Promise<void> => {
    if (qty < 1) return;
    setUpdatingId(itemId);
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "Failed to update");
        alert("Update failed: " + text);
      } else {
        await fetchCart();
      }
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error("update error", e);
      alert("Server error");
    } finally {
      setUpdatingId(null);
    }
  };

  const total = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.unit_price ?? 0) * Number(it.quantity ?? 1)), 0);
  }, [items]);

  if (loading) return <div className="p-6">Loading cart…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!items.length) return <div className="p-6">Your cart is empty.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Cart</h1>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 border text-left">Product</th>
              <th className="p-3 border text-left">Unit price</th>
              <th className="p-3 border text-left">Qty</th>
              <th className="p-3 border text-left">Subtotal</th>
              <th className="p-3 border text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it) => {
              const product = it.product;
              const imageUrl = product?.images?.[0]?.url
                ? (product.images[0].url.startsWith("http")
                    ? product.images[0].url
                    : `${process.env.NEXT_PUBLIC_MEDIA_URL ?? ""}${product.images[0].url}`)
                : null;

              const unitPriceNum = typeof it.unit_price === "number" ? it.unit_price : Number(it.unit_price ?? 0);

              return (
                <tr key={it.id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-3 border">
                    <div className="flex items-center gap-3">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt={product?.name ?? "product"} className="w-16 h-16 object-cover" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 flex items-center justify-center">—</div>
                      )}
                      <div>
                        <div className="font-medium">{product?.name ?? "Unknown product"}</div>
                        <div className="text-xs text-gray-600">{product?.slug}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 border">£{unitPriceNum.toFixed(2)}</td>

                  <td className="p-3 border">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(e) => {
                          const next = Math.max(1, Number(e.target.value || 1));
                          setItems((s) => s.map((x) => (x.id === it.id ? { ...x, quantity: next } : x)));
                        }}
                        className="w-20 border rounded px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => void handleUpdateQty(it.id, it.quantity)}
                        disabled={updatingId === it.id}
                        className="px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-800"
                      >
                        {updatingId === it.id ? "Updating..." : "Update"}
                      </button>
                    </div>
                  </td>

                  <td className="p-3 border">£{(unitPriceNum * it.quantity).toFixed(2)}</td>

                  <td className="p-3 border">
                    <button
                      onClick={() => void handleRemove(it.id)}
                      disabled={removingId === it.id}
                      className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      {removingId === it.id ? "Removing..." : "Remove"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-right">
        <div className="text-lg">
          Total: <strong>£{total.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
}