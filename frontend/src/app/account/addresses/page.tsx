import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AddressForm from "@/components/account/AddressForm";
import type { AppUser, Address } from "@/lib/types";

export const metadata: Metadata = {
  title: "My Addresses",
};

// This is a server-side helper function to fetch user details.
// It can only be used in Server Components.
async function getUserDetails(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return null;
  }

  const STRAPI_URL = process.env.STRAPI_API_URL;
  if (!STRAPI_URL) {
    console.error("STRAPI_API_URL is not set.");
    return null;
  }

  try {
    const res = await fetch(`${STRAPI_URL}/api/user-details/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store", // Always fetch the latest data
    });

    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    return null;
  }
}

export default async function AddressesPage() {
  // 1. Fetch the user and their details on the server.
  const user = await getUserDetails();

  // 2. If no user, redirect to login.
  if (!user) {
    redirect("/login");
  }

  // 3. Safely extract the addresses, defaulting to an empty array.
  const savedAddresses = user.userDetails?.savedAddresses || [];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">My Addresses</h1>
      <p className="text-gray-600 mb-6">
        Manage your saved shipping and billing addresses.
      </p>

      {/* 4. Pass the fetched addresses as a prop to the client form. */}
      <AddressForm initialAddresses={savedAddresses as Address[]} />
    </div>
  );
}
