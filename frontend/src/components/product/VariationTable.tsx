"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductVariation } from "@/lib/types";

interface Props {
  productId: number | string;
  variations: ProductVariation[];
  productDiscount?: number;
  categoryDiscount?: number;
  priceBeforeDiscount?: { Per_m2: number; Price: number } | null;
}

export default function VariationTable({
  productId,
  variations = [],
}: Props) {
  const router = useRouter();

  // Build stable internal keys from numeric id (fallback to index if missing)
  const keys = useMemo(
    () => variations.map((v, i) => (v.id !== undefined && v.id !== null ? String(v.id) : `idx-${i}`)),
    [variations]
  );

  // initial qty keyed by internalKey (string)
  const initialQty = useMemo(() => {
    return keys.reduce((acc, k) => {
      acc[k] = 1;
      return acc;
    }, {} as Record<string, number>);
  }, [keys]);

  const [qty, setQty] = useState<Record<string, number>>(initialQty);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);

  // Ensure qty has entries for newly added variations while preserving existing values
  useEffect(() => {
    setQty((prev) => {
      const next: Record<string, number> = { ...prev };
      for (const k of keys) {
        if (!Object.prototype.hasOwnProperty.call(next, k)) next[k] = 1;
      }
      return next;
    });
  }, [keys]);

  const onQtyChange = (internalKey: string, value: number) => {
    setQty((s) => ({ ...s, [internalKey]: Math.max(1, Math.floor(value || 1)) }));
  };

  const handleAddToCart = async (internalKey: string, variationIdRaw: number | string) => {
    const variationId = Number(variationIdRaw);
    if (!variationId) {
      alert("Invalid variation id");
      return;
    }

    const quantity = qty[internalKey] ?? 1;
    setLoadingKey(internalKey);
    setSuccessKey(null);

    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: productId,
          variation_id: variationId,
          quantity,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        console.error("Add to cart failed:", res.status, text);
        alert("Add to cart failed: " + text);
        return;
      }

      // success
      setSuccessKey(internalKey);
      // revalidate server components / refresh cart indicator
      try {
        router.refresh();
      } catch (e) {
        // ignore
      }

      // clear success indicator after 2 seconds
      setTimeout(() => setSuccessKey((k) => (k === internalKey ? null : k)), 2000);
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("Add to cart unexpected error");
    } finally {
      setLoadingKey((k) => (k === internalKey ? null : k));
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 border text-left">Thickness</th>
            <th className="p-3 border text-left">Size</th>
            <th className="p-3 border text-left">Finish</th>
            <th className="p-3 border text-left">Pcs</th>
            <th className="p-3 border text-left">Pack Size</th>
            <th className="p-3 border text-left">Per m²</th>
            <th className="p-3 border text-left">Stock</th>
            <th className="p-3 border text-left">Qty</th>
            <th className="p-3 border text-left">Price</th>
            <th className="p-3 border text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          {variations.map((v, i) => {
            const internalKey = keys[i];
            const currentQty = qty[internalKey] ?? 1;

            const priceNum = typeof v.Price === "number" ? v.Price : 0;
            const perM2Num = typeof v.Per_m2 === "number" ? v.Per_m2 : 0;
            const stockNum = typeof v.Stock === "number" ? v.Stock : undefined;

            return (
              <tr key={internalKey} className="odd:bg-white even:bg-gray-50">
                <td className="p-3 border text-center">{v.Thickness ?? "—"}</td>
                <td className="p-3 border text-center">{v.Size ?? "—"}</td>
                <td className="p-3 border text-center">{v.Finish ?? "—"}</td>
                <td className="p-3 border text-center">{v.Pcs ?? "—"}</td>
                <td className="p-3 border text-center">{v.PackSize ?? "—"}</td>
                <td className="p-3 border text-center">
                  {perM2Num ? `${perM2Num.toFixed(2)} /m²` : "—"}
                </td>
                <td className="p-3 border text-center">
                  {typeof stockNum === "number" ? `${stockNum} Stock` : "—"}
                </td>

                <td className="p-3 border text-center">
                  <input
                    type="number"
                    min={1}
                    max={stockNum ?? 9999}
                    value={currentQty}
                    onChange={(e) => onQtyChange(internalKey, Number(e.target.value))}
                    className="w-20 border rounded px-2 py-1 text-sm"
                  />
                </td>

                <td className="p-3 border text-center">£{priceNum.toFixed(2)}</td>

                <td className="p-3 border text-center">
                  <button
                    onClick={() => handleAddToCart(internalKey, v.id)}
                    disabled={stockNum !== undefined && stockNum <= 0}
                    className={`px-3 py-1 rounded text-white ${
                      stockNum !== undefined && stockNum <= 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gray-700 hover:bg-gray-800"
                    }`}
                    title="Add to cart (not functional yet)"
                  >
                    {loadingKey === internalKey ? "Adding..." : successKey === internalKey ? "Added" : "🛒"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}