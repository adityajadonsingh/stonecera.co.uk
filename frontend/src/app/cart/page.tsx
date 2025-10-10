// FILE: frontend/src/app/cart/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "@/lib/types";

type NormalizedItem = {
  id: number;
  quantity: number;
  unit_price?: number | null;
  product?: Product | null;
  metadata?: any;
  raw?: any;
};

export default function CartPage() {
  const [items, setItems] = useState<NormalizedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchCart = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) {
        const text = await res.text().catch(() => "Failed to fetch cart");
        setErr(text);
        setItems([]);
        return;
      }
      const raw = await res.json();
      setItems(normalizeCartRaw(raw));
    } catch (e: any) {
      console.error("fetchCart error:", e);
      setErr("Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const normalizeCartRaw = (raw: any): NormalizedItem[] => {
    // handle shapes: array, { data: [] }, single { data: { ... } }
    let arr: any[] = [];

    if (!raw) return [];
    if (Array.isArray(raw)) arr = raw;
    else if (raw.data && Array.isArray(raw.data)) arr = raw.data;
    else if (raw.data && (raw.data.id || raw.data.attributes)) arr = [raw.data];
    else if (Array.isArray(raw.items)) arr = raw.items;
    else if (Array.isArray(raw.cart)) arr = raw.cart;
    else if (Array.isArray(raw.data?.items)) arr = raw.data.items;
    else return []; // unknown shape

    return arr.map((entry) => {
      // entry might be { id, attributes } or plain object
      const id = entry.id ?? entry.attributes?.id ?? null;
      const attr = entry.attributes ?? entry;
      // product can be { data: { id, attributes } } or full object
      const productEntity = attr.product?.data ?? attr.product;
      const productAttrs = productEntity?.attributes ?? productEntity ?? null;
      return {
        id: Number(id ?? 0),
        quantity: Number(attr.quantity ?? 1),
        unit_price: attr.unit_price ?? null,
        product: productAttrs
          ? {
              id: productEntity?.id ?? productAttrs?.id,
              name: productAttrs?.name,
              slug: productAttrs?.slug,
              images: productAttrs?.images ?? productAttrs?.images,
              ...productAttrs,
            }
          : null,
        metadata: attr.metadata ?? null,
        raw: entry,
      } as NormalizedItem;
    });
  };

  const handleRemove = async (itemId: number) => {
    if (!confirm("Remove this item from cart?")) return;
    setRemovingId(itemId);
    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text().catch(() => "Failed to remove");
        alert("Remove failed: " + text);
      } else {
        await fetchCart();
      }
    } catch (e) {
      console.error("remove error", e);
      alert("Server error");
    } finally {
      setRemovingId(null);
    }
  };

  const handleUpdateQty = async (itemId: number, qty: number) => {
    if (qty < 1) return;
    setUpdatingId(itemId);
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "Failed to update");
        alert("Update failed: " + text);
      } else {
        await fetchCart();
      }
    } catch (e) {
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
                ? // If Strapi returns relative URL, prefix with env var if present
                  (product.images[0].url.startsWith("http")
                    ? product.images[0].url
                    : `${process.env.NEXT_PUBLIC_MEDIA_URL || ""}${product.images[0].url}`)
                : null;

              return (
                <tr key={it.id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-3 border">
                    <div className="flex items-center gap-3">
                      {imageUrl ? (
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

                  <td className="p-3 border">£{(it.unit_price ?? 0).toFixed ? (it.unit_price ?? 0).toFixed(2) : it.unit_price}</td>

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
                        onClick={() => handleUpdateQty(it.id, it.quantity)}
                        disabled={updatingId === it.id}
                        className="px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-800"
                      >
                        {updatingId === it.id ? "Updating..." : "Update"}
                      </button>
                    </div>
                  </td>

                  <td className="p-3 border">£{((it.unit_price ?? 0) * it.quantity).toFixed(2)}</td>

                  <td className="p-3 border">
                    <button
                      onClick={() => handleRemove(it.id)}
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