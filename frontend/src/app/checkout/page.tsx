"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AppUser } from "@/lib/types";

function currencyFormat(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

export default function CheckoutPage() {
  const router = useRouter();

  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    pincode: "",
    country: "United Kingdom (UK)",
  });

  useEffect(() => {
    // Load data from session storage on component mount
    const data = sessionStorage.getItem("checkoutData");
    if (!data) {
      alert("Your session has expired. Redirecting to cart.");
      router.push("/cart");
      return;
    }
    const parsedData = JSON.parse(data);
    setCheckoutData(parsedData);

    // Pre-fill pincode from the cart page
    if (parsedData.shipping?.pincode) {
      setShippingAddress((prev) => ({
        ...prev,
        pincode: parsedData.shipping.pincode,
      }));
    }

    // Fetch user to pre-fill details if logged in
    async function fetchUser() {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const userData = (await res.json()) as AppUser;
        setUser(userData);
        setContactEmail(userData.email || "");
        if (userData.userDetails?.fullName) {
          const [firstName, ...lastNameParts] =
            userData.userDetails.fullName.split(" ");
          setShippingAddress((prev) => ({
            ...prev,
            firstName,
            lastName: lastNameParts.join(" "),
          }));
        }
      }
    }
    fetchUser();
  }, [router]);

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    setError(null);

    // Combine all data into the final order payload for Strapi
    const finalOrderPayload = {
      ...checkoutData,
      contact: { email: contactEmail, phone: contactPhone },
      shippingAddress, // Add the detailed shipping address
    };
    console.log(finalOrderPayload);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalOrderPayload),
        credentials: "include", // Important for passing the auth cookie
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to place order.");
      }

      const createdOrder = await res.json();

      // Clear the cart/checkout data and redirect to a success page
      sessionStorage.removeItem("checkoutData");
      // Optionally clear the cart from the backend as well
      await fetch("/api/cart", { method: "DELETE", credentials: "include" });

      router.push(`/order/success/${createdOrder.id}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!checkoutData) {
    return <p className="p-6">Loading checkout session...</p>;
  }

  const { items, totals } = checkoutData;

  return (
    <main className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Form */}
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePlaceOrder();
            }}
          >
            <section className="mb-8">
              <h2 className="text-lg font-semibold">Contact information</h2>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Email address"
                className="w-full mt-2 p-2 border rounded"
                required
              />
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full mt-2 p-2 border rounded"
                required
              />
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold">Shipping address</h2>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <input
                  value={shippingAddress.firstName}
                  onChange={(e) =>
                    setShippingAddress((p) => ({
                      ...p,
                      firstName: e.target.value,
                    }))
                  }
                  placeholder="First name"
                  className="p-2 border rounded"
                  required
                />
                <input
                  value={shippingAddress.lastName}
                  onChange={(e) =>
                    setShippingAddress((p) => ({
                      ...p,
                      lastName: e.target.value,
                    }))
                  }
                  placeholder="Last name"
                  className="p-2 border rounded"
                  required
                />
              </div>
              <input
                value={shippingAddress.address}
                onChange={(e) =>
                  setShippingAddress((p) => ({ ...p, address: e.target.value }))
                }
                placeholder="Address"
                className="w-full mt-4 p-2 border rounded"
                required
              />
              <div className="grid grid-cols-3 gap-4 mt-4">
                <input
                  value={shippingAddress.city}
                  onChange={(e) =>
                    setShippingAddress((p) => ({ ...p, city: e.target.value }))
                  }
                  placeholder="City"
                  className="p-2 border rounded col-span-1"
                  required
                />
                <select
                  className="p-2 border rounded col-span-1"
                  value={shippingAddress.country}
                  onChange={(e) =>
                    setShippingAddress((p) => ({
                      ...p,
                      country: e.target.value,
                    }))
                  }
                >
                  <option>United Kingdom (UK)</option>
                </select>
                <input
                  value={shippingAddress.pincode}
                  onChange={(e) =>
                    setShippingAddress((p) => ({
                      ...p,
                      pincode: e.target.value,
                    }))
                  }
                  placeholder="Postcode"
                  className="p-2 border rounded col-span-1"
                  required
                />
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Payment options</h2>
              <div className="mt-2 border rounded">
                <div className="p-4 border-b">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="direct-bank-transfer"
                      checked
                      readOnly
                    />
                    Direct bank transfer
                  </label>
                </div>
                <p className="p-4 text-sm text-gray-600 bg-gray-50">
                  Make your payment directly into our bank account. Please use
                  your Order ID as the payment reference. Your order will not be
                  shipped until the funds have cleared in our account.
                </p>
              </div>
            </section>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 disabled:bg-gray-400"
              >
                {isLoading ? "Placing Order..." : "Place Order"}
              </button>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
          </form>
        </div>

        {/* Right Column: Order Summary */}
        <div className=" p-6 rounded-lg h-fit">
          <h2 className="text-lg font-semibold mb-4">Order summary</h2>
          <div className="space-y-4">
            {items.map((item: any, index: number) => (
              <div
                key={index}
                className="flex items-center gap-4 border-b pb-4"
              >
                <div className="flex-grow">
                  <p className="font-medium">Product ID: {item.product}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p>{currencyFormat(item.unit_price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 mt-4 pt-4 border-t">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{currencyFormat(totals.cartSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{currencyFormat(totals.shippingCost)}</span>
            </div>
            {totals.tailLift > 0 && (
              <div className="flex justify-between">
                <span>Tail Lift</span>
                <span>{currencyFormat(totals.tailLift)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl mt-2">
              <span>Total</span>
              <span>{currencyFormat(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
