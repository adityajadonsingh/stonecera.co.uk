// FILE: frontend/src/app/account/edit/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import UserDetailsForm from "@/components/account/UserDetailsForm";

export const metadata: Metadata = {
  title: "Edit Profile",
};

export default async function EditProfilePage(){
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const userDetails = user?.userDetails ?? null;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Edit profile</h1>
      <p className="mb-4 text-sm text-gray-600">Update your name, profile image, phone numbers and addresses.</p>

      {/* Client form */}
      <UserDetailsForm initialData={userDetails} />
    </main>
  );
}