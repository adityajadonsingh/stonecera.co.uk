"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Address } from "@/lib/types";

interface Props {
  initialAddresses?: Address[];
}

const emptyAddress: Omit<Address, "id"> = { label: "", address: "", city: "", pincode: "" };

export default function AddressForm({ initialAddresses = [] }: Props) {
  const router = useRouter();
  
  // The component's state is initialized directly from the prop
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<Address, "id">>(emptyAddress);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if the initial prop changes (e.g., after a router.refresh())
  useEffect(() => {
    setAddresses(initialAddresses);
  }, [initialAddresses]);

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedAddresses: addresses }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text() || "Failed to save addresses");
      }
      
      window.dispatchEvent(new Event("auth"));
      localStorage.setItem("auth", String(Date.now()));
      router.refresh(); // This will re-fetch data on the server page and re-render this component
      
      setEditingId(null);
      alert("Addresses saved successfully!");

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = (idToDelete: number) => {
    if (confirm("Are you sure you want to delete this address?")) {
      const updated = addresses.filter(addr => addr.id !== idToDelete);
      setAddresses(updated);
      // Note: The change is now local until "Save All Changes" is clicked.
    }
  };

  const handleInputChange = (id: number, field: keyof Address, value: string) => {
    setAddresses(prev => 
      prev.map(addr => 
        addr.id === id ? { ...addr, [field]: value } : addr
      )
    );
  };
  
  const handleAddNewAddress = () => {
    // A temporary ID is needed for the React `key` prop, but Strapi will assign a real one.
    const tempId = Date.now(); 
    setAddresses(prev => [...prev, { id: tempId, ...newAddress }]);
    setNewAddress(emptyAddress);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {error && <p className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</p>}

      <h3 className="text-lg font-semibold">Your Saved Addresses</h3>
      <div className="space-y-4">
        {addresses.length > 0 ? (
          addresses.map((addr) => (
            <div key={addr.id} className="p-4 border rounded-lg bg-white">
              {editingId === addr.id ? (
                // EDITING VIEW
                <div className="space-y-3">
                  <input value={addr.label ?? ""} onChange={(e) => handleInputChange(addr.id, 'label', e.target.value)} placeholder="Label (e.g., Home)" className="w-full border rounded p-2" />
                  <input value={addr.address ?? ""} onChange={(e) => handleInputChange(addr.id, 'address', e.target.value)} placeholder="Street Address" className="w-full border rounded p-2" required />
                  <input value={addr.city ?? ""} onChange={(e) => handleInputChange(addr.id, 'city', e.target.value)} placeholder="City" className="w-full border rounded p-2" required />
                  <input value={addr.pincode ?? ""} onChange={(e) => handleInputChange(addr.id, 'pincode', e.target.value)} placeholder="Postcode" className="w-full border rounded p-2" required />
                  <button onClick={() => setEditingId(null)} className="text-sm text-gray-600 hover:underline">Done</button>
                </div>
              ) : (
                // DISPLAY VIEW
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{addr.label || `Address`}</p>
                    <p className="text-gray-600">{addr.address}</p>
                    <p className="text-gray-600">{addr.city}, {addr.pincode}</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setEditingId(addr.id)} className="text-blue-600 hover:underline text-sm">Edit</button>
                    <button onClick={() => handleDelete(addr.id)} className="text-red-500 hover:underline text-sm">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">You have no saved addresses.</p>
        )}
      </div>

      {isAdding && (
        <div className="p-4 border-t pt-6 space-y-4">
          <h3 className="text-lg font-semibold">Add a New Address</h3>
          <input name="label" value={newAddress.label} onChange={(e) => setNewAddress(p => ({...p, label: e.target.value}))} placeholder="Label (e.g., Home, Work)" className="w-full border rounded p-2" />
          <input name="address" value={newAddress.address} onChange={(e) => setNewAddress(p => ({...p, address: e.target.value}))} placeholder="Street Address" className="w-full border rounded p-2" required />
          <input name="city" value={newAddress.city} onChange={(e) => setNewAddress(p => ({...p, city: e.target.value}))} placeholder="City" className="w-full border rounded p-2" required />
          <input name="pincode" value={newAddress.pincode} onChange={(e) => setNewAddress(p => ({...p, pincode: e.target.value}))} placeholder="Postcode" className="w-full border rounded p-2" required />
          <div className="flex gap-2">
            <button onClick={handleAddNewAddress} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add to List</button>
            <button onClick={() => setIsAdding(false)} className="px-3 py-1 border rounded">Cancel</button>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-8 pt-4 border-t">
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium"
          >
            + Add New Address
          </button>
        )}
        <div className="flex-grow"></div>
        <button 
          onClick={handleSaveAll} 
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </div>
  );
}