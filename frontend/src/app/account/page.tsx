import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AccountDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <p className="text-gray-700">
        Hello, <strong>{user.userDetails?.fullName ?? user.username}</strong>!
      </p>
      <p className="mt-2 text-gray-600">
        From your account dashboard you can view your{" "}
        <Link href="/account/orders" className="text-blue-600 hover:underline">
          recent orders
        </Link>
        , manage your{" "}
        <Link href="/account/addresses" className="text-blue-600 hover:underline">
          shipping and billing addresses
        </Link>
        , and{" "}
        <Link href="/account/details" className="text-blue-600 hover:underline">
          edit your password and account details
        </Link>
        .
      </p>
    </div>
  );
}