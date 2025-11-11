// FILE: frontend/src/app/cart/page.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AppUser, Address } from "@/lib/types";

// --- Type Definitions ---

type MinimalImage = { url: string; alt: string | null };

type MinimalProduct = {
  id?: number;
  name?: string;
  slug?: string;
  image?: string | null;
  images?: MinimalImage[];
  [key: string]: unknown;
};

type Variation = {
  id?: number | string | null;
  stock?: number | null;
  [key: string]: unknown;
};

type CartItem = {
  id: number;
  quantity: number;
  unit_price?: number | null;
  product?: MinimalProduct | null;
  metadata?: Record<string, unknown> | null;
  variation?: Variation | null;
};

type DeliveryResponse = {
  postcode?: string;
  economy_price?: string;
  premium_price?: string;
};

const TAIL_LIFT_COST = 5;

// --- Helper Functions ---

function currencyFormat(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

// --- Main Component ---

export default function CartPage() {
  const router = useRouter();

  // State for cart, user, and delivery logic
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [pincode, setPincode] = useState("");
  const [delivery, setDelivery] = useState<DeliveryResponse | null>(null);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const [method, setMethod] = useState<"economy" | "premium" | null>(null);
  const [tailLift, setTailLift] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const fetchCart = useCallback(async () => {
    // Wrapped in useCallback to satisfy the useEffect dependency array
    try {
      const res = await fetch("/api/cart", { credentials: "include" });
      if (!res.ok) {
        setErr("Failed to load cart");
        setItems([]);
        return;
      }
      const cartJson = (await res.json()) as CartItem[];
      console.log(cartJson);
      setItems(Array.isArray(cartJson) ? cartJson : []);
    } catch (e: unknown) {
      console.error("fetchCart error:", e);
      setErr("Server error");
    }
  }, []);

  // Fetch initial cart and user data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await fetchCart(); // Fetch cart first
      try {
        const userRes = await fetch("/api/auth/me", { credentials: "include" });
        if (userRes.ok) {
          const userJson = await userRes.json();
          if (isRecord(userJson) && typeof userJson.id === "number") {
            const typedUser = userJson as unknown as AppUser;
            setUser(typedUser);
            // Safely access nested properties
            const savedAddresses = typedUser.userDetails?.savedAddresses;
            if (savedAddresses && savedAddresses.length > 0) {
              const firstAddress = savedAddresses[0];
              setSelectedAddressId(String(firstAddress.id ?? 0));
              if (firstAddress.pincode) {
                setPincode(firstAddress.pincode);
                void fetchDelivery(firstAddress.pincode);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to load user data:", e);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [fetchCart]);

  // --- Memoized Calculations for Totals ---

  const cartSubtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.unit_price ?? 0) * it.quantity), 0);
  }, [items]);

  const shippingCost = useMemo(() => {
    if (!delivery || !method) return 0;
    const priceStr = method === "economy" ? delivery.economy_price : delivery.premium_price;
    return Number(priceStr ?? 0);
  }, [delivery, method]);

  const total = useMemo(() => {
    return cartSubtotal + shippingCost + (tailLift ? TAIL_LIFT_COST : 0);
  }, [cartSubtotal, shippingCost, tailLift]);

  // --- API Handlers ---

  async function fetchDelivery(pincodeValue: string) {
    setDelivery(null);
    setDeliveryError(null);
    if (!pincodeValue || pincodeValue.trim().length < 3) {
      setDeliveryError("Please enter a valid postcode.");
      return;
    }
    setLoadingDelivery(true);
    try {
      const res = await fetch(`/api/delivery/${encodeURIComponent(pincodeValue)}`);
      if (!res.ok) {
        const txt = await res.text().catch(() => "Delivery check failed.");
        setDeliveryError(txt);
        return;
      }
      const json = (await res.json()) as DeliveryResponse;
      setDelivery(json);
      if (json && json.economy_price) {
        setMethod("economy");
      }
    } catch (err: unknown) {
      setDeliveryError("Could not connect to delivery service.");
    } finally {
      setLoadingDelivery(false);
    }
  }

  async function handleRemoveItem(itemId: number) {
    if (!confirm("Are you sure you want to remove this item?")) return;
    setItems((prev) => prev.filter((it) => it.id !== itemId)); // Optimistic update
    try {
      await fetch(`/api/cart/${itemId}`, { method: "DELETE", credentials: "include" });
    } catch (err) {
      console.error("Failed to remove item:", err);
      void fetchCart(); // Revert on failure
    }
  }

  async function handleUpdateQuantity(itemId: number, newQuantity: number) {
    const item = items.find((it) => it.id === itemId);
    if (!item) return;

    const stock = item.variation?.stock ?? Infinity;
    const clampedQuantity = Math.max(1, Math.min(newQuantity, stock));

    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, quantity: clampedQuantity } : it))
    );

    try {
      await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: clampedQuantity }),
        credentials: "include",
      });
    } catch (err) {
      console.error("Failed to update quantity:", err);
      void fetchCart(); // Revert on failure
    }
  }

  function handleProceedToCheckout() {
    if (!method) {
      alert("Please select a delivery option.");
      return;
    }
    const selectedSavedAddress = user?.userDetails?.savedAddresses?.find(
      (addr) => String(addr.id) === selectedAddressId
    );

    const checkoutData = {
      items: items.map(it => ({
        product: it.product?.id,
        variation_id: it.variation?.id,
        quantity: it.quantity,
        unit_price: it.unit_price,
      })),
      shipping: { pincode, method, shippingCost, tailLift, address: selectedSavedAddress ?? { pincode } },
      totals: { cartSubtotal, shippingCost, tailLift: tailLift ? TAIL_LIFT_COST : 0, total },
    };
    // console.log(checkoutData);
    sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData));
    router.push("/checkout");
  }

  if (loading) return <div className="p-6">Loading Cart...</div>;
  if (err) return <div className="p-6 text-red-500">{err}</div>;

  return (
    <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left Column: Cart Items */}
      <div className="md:col-span-2">
        <h1 className="text-2xl font-semibold mb-4">Your Cart</h1>
        <div className="space-y-4">
          {items.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            items.map((item) => {
              const stock = item.variation?.stock;
              const imageUrl = item.product?.image;

              return (
                <div key={item.id} className="flex items-start justify-between border-b pb-4">
                  <div className="flex items-start gap-4">
                    {imageUrl ? (
                      <img src={imageUrl} alt={item.product?.name ?? ""} className="w-24 h-24 object-cover rounded" />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 rounded"></div>
                    )}
                    <div>
                      <h3 className="font-medium">{item.product?.name}</h3>
                      <p className="text-sm text-gray-500">Unit Price: {currencyFormat(Number(item.unit_price ?? 0))}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <label htmlFor={`quantity-${item.id}`} className="text-sm">Quantity:</label>
                        <input
                          id={`quantity-${item.id}`}
                          type="number"
                          min="1"
                          max={stock ?? 999}
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value, 10))}
                          className="w-20 border rounded px-2 py-1 text-center"
                        />
                      </div>
                       {stock !== undefined && stock !== null && <p className="text-xs text-gray-500 mt-1">{stock > 0 ? `${stock} in stock` : "Out of stock"}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{currencyFormat(Number(item.unit_price ?? 0) * item.quantity)}</p>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm mt-2"
                    >
                      Remove item
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Cart Totals & Delivery */}
      <div className="md:col-span-1 space-y-6">
        <div className="p-4 border rounded-lg ">
          <h2 className="text-lg font-semibold mb-4">Cart Totals</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{currencyFormat(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{shippingCost > 0 ? currencyFormat(shippingCost) : "—"}</span>
            </div>
             <div className="flex justify-between">
              <span>Tail Lift</span>
              <span>{tailLift ? currencyFormat(TAIL_LIFT_COST) : "—"}</span>
            </div>
            <hr className="my-2"/>
            <div className="flex justify-between font-bold text-xl">
              <span>Total</span>
              <span>{currencyFormat(total)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Delivery Options</h2>
          {user?.userDetails?.savedAddresses && user.userDetails.savedAddresses.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Use a saved address</label>
              <select
                value={selectedAddressId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedAddressId(newId);
                  const selected = user.userDetails?.savedAddresses?.find(addr => String(addr.id) === newId);
                  if (selected?.pincode) {
                    setPincode(selected.pincode);
                    void fetchDelivery(selected.pincode);
                  }
                }}
                className="w-full border rounded p-2"
              >
                <option value="">-- Select an address --</option>
                {user.userDetails.savedAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.address}, {addr.city}, {addr.pincode}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end gap-2 mb-4">
            <div className="flex-grow">
              <label htmlFor="pincode" className="block text-sm font-medium mb-1">Or enter Postcode</label>
              <input
                id="pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.toUpperCase())}
                className="w-full border rounded p-2"
                placeholder="e.g. SW1A 0AA"
              />
            </div>
            <button
              onClick={() => void fetchDelivery(pincode)}
              disabled={!pincode || loadingDelivery}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:bg-gray-400"
            >
              {loadingDelivery ? "Checking..." : "Check"}
            </button>
          </div>

          {deliveryError && <p className="text-sm text-red-500">{deliveryError}</p>}
          
          {delivery && (
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-100">
                <input type="radio" name="deliveryMethod" checked={method === 'economy'} onChange={() => setMethod('economy')} />
                <div>
                  <span className="font-medium">Economy Delivery</span>
                  <span className="ml-2">{currencyFormat(Number(delivery.economy_price ?? 0))}</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-100">
                <input type="radio" name="deliveryMethod" checked={method === 'premium'} onChange={() => setMethod('premium')} />
                <div>
                  <span className="font-medium">Premium Delivery</span>
                   <span className="ml-2">{currencyFormat(Number(delivery.premium_price ?? 0))}</span>
                </div>
              </label>
            </div>
          )}

          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={tailLift} onChange={(e) => setTailLift(e.target.checked)} />
              <span className="text-sm">Add Tail Lift Service (+{currencyFormat(TAIL_LIFT_COST)})</span>
            </label>
          </div>
        </div>
        
        <button
          onClick={handleProceedToCheckout}
          disabled={items.length === 0 || !method || loading}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          Proceed to Checkout
        </button>
      </div>
    </main>
  );
}