import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import UserDetailsForm from "@/components/account/UserDetailsForm";

export const metadata: Metadata = {
  title: "Account Details",
};

export default async function AccountDetailsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Account details</h1>
      <p className="mb-6 text-gray-600">Update your name, profile image, and phone numbers.</p>
      <UserDetailsForm initialData={user.userDetails ?? null} />
    </main>
  );
}