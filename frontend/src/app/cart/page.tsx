// FILE: frontend/src/app/cart/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

type MinimalImage = { url: string; alt?: string | null };

type MinimalProduct = {
  id?: number;
  name?: string;
  slug?: string;
  image?: string | null;       // prefer single image returned by backend
  images?: MinimalImage[];     // fallback array
  [key: string]: unknown;
};

type Variation = {
  id?: number | string | null;
  stock?: number | null;
  [key: string]: unknown;
};

type NormalizedItem = {
  id: number;
  quantity: number;
  unit_price?: number | null;
  product?: MinimalProduct | null;
  metadata?: Record<string, unknown> | null;
  variation?: Variation | null;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function toNumber(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string" && x.trim() !== "" && !Number.isNaN(Number(x))) return Number(x);
  return null;
}

function extractImages(obj: unknown): MinimalImage[] {
  if (!obj) return [];
  if (Array.isArray(obj)) {
    return obj
      .map((it) => {
        if (!isRecord(it)) return null;
        if (typeof it.url === "string") return { url: it.url, alt: typeof it.alt === "string" ? it.alt : null };
        if (isRecord(it.attributes) && typeof it.attributes.url === "string") {
          const attrs = it.attributes as Record<string, unknown>;
          return { url: String(attrs.url), alt: typeof attrs.alternativeText === "string" ? String(attrs.alternativeText) : null };
        }
        return null;
      })
      .filter((x): x is MinimalImage => x !== null);
  }
  if (isRecord(obj) && Array.isArray(obj.data)) return extractImages(obj.data);
  if (isRecord(obj) && isRecord(obj.data)) return extractImages([obj.data]);
  return [];
}

function resolveImageUrl(product?: MinimalProduct | null, metadata?: Record<string, unknown>): string | null {
  // Prefer product.image if backend set it
  const candidate = (product?.image ?? product?.images?.[0]?.url ?? metadata?.productImage ?? metadata?.product_image ?? null) as unknown;
  if (!candidate) return null;
  if (typeof candidate !== "string") return null;
  if (candidate.startsWith("http")) return candidate;
  // If relative path returned, prefix with NEXT_PUBLIC_MEDIA_URL (if set)
  const base = process.env.NEXT_PUBLIC_MEDIA_URL ?? "";
  return `${base.replace(/\/$/, "")}${candidate.startsWith("/") ? candidate : `/${candidate}`}`;
}

export default function CartPage(): JSX.Element {
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
    if (!raw) return [];
    let arr: unknown[] = [];

    // accept multiple shapes
    if (Array.isArray(raw)) arr = raw;
    else if (isRecord(raw) && Array.isArray(raw.data)) arr = raw.data;
    else if (isRecord(raw) && isRecord(raw.data) && (typeof (raw as Record<string, unknown>).data.id !== "undefined" || typeof (raw as Record<string, unknown>).data.attributes !== "undefined")) arr = [raw.data];
    else if (isRecord(raw) && Array.isArray((raw as Record<string, unknown>).items)) arr = (raw as Record<string, unknown>).items;
    else if (isRecord(raw) && Array.isArray((raw as Record<string, unknown>).cart)) arr = (raw as Record<string, unknown>).cart;
    else if (isRecord(raw) && isRecord((raw as Record<string, unknown>).data) && Array.isArray((raw as Record<string, unknown>).data.items)) arr = (raw as Record<string, unknown>).data.items;
    else return [];

    return arr.map((entry) => {
      const entryObj = isRecord(entry) ? entry : {};
      const attr = isRecord(entryObj.attributes) ? entryObj.attributes : entryObj;

      // If backend already returned minimal mapped item (our desired shape),
      // just coerce types and return.
      if (isRecord(entryObj) && isRecord(entryObj.product) && ("quantity" in entryObj)) {
        const id = toNumber(entryObj.id ?? (attr && attr.id) ?? null) ?? 0;
        const quantity = toNumber(entryObj.quantity ?? (attr && attr.quantity) ?? 1) ?? 1;
        const unit_price = toNumber(entryObj.unit_price ?? (attr && (attr.unit_price ?? attr.price)) ?? null) ?? null;

        const prod = entryObj.product as Record<string, unknown>;
        const product: MinimalProduct = {
          id: toNumber(prod.id) ?? undefined,
          name: typeof prod.name === "string" ? String(prod.name) : undefined,
          slug: typeof prod.slug === "string" ? String(prod.slug) : undefined,
          image: typeof prod.image === "string" ? String(prod.image) : undefined,
        };

        // variation may already be present (id, stock)
        let variation = null;
        if (isRecord(entryObj.variation)) {
          const v = entryObj.variation as Record<string, unknown>;
          variation = {
            id: v.id ?? v.ID ?? v.uuid ?? null,
            stock: toNumber(v.stock ?? v.Stock ?? v.availableStock ?? v.available_stock ?? null),
          } as unknown as Variation;
        } else if (isRecord(entryObj.metadata) && (entryObj.metadata as Record<string, unknown>).availableStock) {
          variation = { stock: toNumber((entryObj.metadata as Record<string, unknown>).availableStock) ?? null };
        }

        const metadata = isRecord(entryObj.metadata) ? (entryObj.metadata as Record<string, unknown>) : null;

        return {
          id: Number(id),
          quantity: Number(quantity),
          unit_price,
          product,
          metadata,
          variation,
        } as NormalizedItem;
      }

      // fallback: older DB shapes, try to extract product and metadata
      const idCandidate = entryObj.id ?? (isRecord(attr) ? attr.id ?? null : null);
      const idNum = toNumber(idCandidate) ?? 0;

      const qtyCandidate = isRecord(attr) ? (attr.quantity ?? attr.qty ?? 1) : 1;
      const qtyNum = toNumber(qtyCandidate) ?? 1;

      const priceCandidate = isRecord(attr) ? (attr.unit_price ?? attr.unitPrice ?? attr.price ?? null) : null;
      const unitPriceNum = toNumber(priceCandidate) ?? null;

      // product
      const productField = isRecord(attr) ? attr.product ?? null : null;
      let product: MinimalProduct | null = null;
      if (isRecord(productField)) {
        const p = isRecord(productField.data) ? productField.data : productField;
        const pAttrs = isRecord(p.attributes) ? p.attributes : p;
        const pId = toNumber((p as Record<string, unknown>).id ?? pAttrs?.id) ?? undefined;
        const name = typeof pAttrs?.name === "string" ? String(pAttrs.name) : undefined;
        const slug = typeof pAttrs?.slug === "string" ? String(pAttrs.slug) : undefined;
        const imgs = extractImages(pAttrs?.images ?? pAttrs?.images);
        product = { id: pId, name, slug, images: imgs };
      }

      const metadata = isRecord(attr) && isRecord(attr.metadata) ? (attr.metadata as Record<string, unknown>) : null;

      // Try to read stock from metadata if backend didn't return variation
      const stockFromMeta = isRecord(attr) && isRecord(attr.metadata)
        ? toNumber((attr.metadata as Record<string, unknown>).availableStock ?? (attr.metadata as Record<string, unknown>).available_stock ?? (attr.metadata as Record<string, unknown>).stock ?? null)
        : null;

      return {
        id: Number(idNum),
        quantity: Number(qtyNum),
        unit_price: unitPriceNum ?? null,
        product,
        metadata,
        variation: stockFromMeta !== null ? { stock: stockFromMeta } : undefined,
      } as NormalizedItem;
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
      console.error("remove error:", e);
      alert("Server error");
    } finally {
      setRemovingId(null);
    }
  };

  const handleUpdateQty = async (itemId: number, qty: number): Promise<void> => {
    if (qty < 1) return;
    setUpdatingId(itemId);
    try {
      const item = items.find((it) => it.id === itemId);
      const stock = item?.variation?.stock ?? null;
      const qtyToSend = stock !== null && stock !== undefined ? Math.min(Number(qty), Number(stock)) : qty;
      if (stock !== null && qty > stock) {
        alert(`Only ${stock} available in stock. Quantity adjusted.`);
      }

      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qtyToSend }),
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
  console.log(items);
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
              const imageUrl = product?.image ?? product?.images?.[0]?.url
                ? (product?.image ?? product?.images?.[0]?.url).toString().startsWith("http")
                    ? (product?.image ?? product?.images?.[0]?.url).toString()
                    : `${process.env.NEXT_PUBLIC_MEDIA_URL ?? ""}${(product?.image ?? product?.images?.[0]?.url).toString()}`
                : null;
              const unitPriceNum = typeof it.unit_price === "number" ? it.unit_price : Number(it.unit_price ?? 0);
              const stockNum = it.variation?.stock ?? undefined;

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
                        max={stockNum ?? 9999}
                        value={it.quantity}
                        onChange={(e) => {
                          const max = stockNum ?? 9999;
                          const raw = Number(e.target.value || 1);
                          const next = Math.max(1, Math.min(raw, max));
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
                    {stockNum !== undefined && (
                      <div className="text-xs text-gray-500 mt-1">
                        {stockNum > 0 ? `${stockNum} in stock` : "Out of stock"}
                      </div>
                    )}
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