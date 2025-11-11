import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders",
};

// This is a placeholder for your actual order fetching logic
async function getUserOrders() {
  // TODO: Create a server helper function to fetch orders from `/api/orders`
  // For now, it returns an empty array.
  return [];
}

export default async function OrdersPage() {
  const orders = await getUserOrders();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">My Orders</h1>
      {orders.length === 0 ? (
        <p>You have not placed any orders yet.</p>
      ) : (
        <div className="space-y-4">
          {/* We will implement the order list here later */}
          <p>Order list will be displayed here.</p>
        </div>
      )}
    </div>
  );
}