import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Successful",
};
function currencyFormat(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
}
// This is a server-side helper to fetch the specific order details
async function getOrder(orderId: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const res = await fetch(`${process.env.STRAPI_API_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
}

export default async function OrderSuccessPage({ params }: { params: { orderId: string } }) {
    const order = await getOrder(params.orderId);

    return (
        <main className="max-w-2xl mx-auto p-6 text-center">
            <h1 className="text-3xl font-bold text-green-600 mb-4">Thank you. Your order has been received.</h1>
            {order ? (
                <div className="text-left bg-gray-50 p-6 rounded-lg border">
                    <h2 className="text-xl font-semibold mb-4">Order Details</h2>
                    <p><strong>Order Number:</strong> {order.orderNumber}</p>
                    <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                    <p><strong>Total:</strong> {currencyFormat(order.totals.total)}</p>
                    <p><strong>Payment Method:</strong> Direct Bank Transfer</p>
                </div>
            ) : (
                <p>Loading order details...</p>
            )}

            <div className="mt-8 text-left p-6 rounded-lg border bg-blue-50">
                <h2 className="text-xl font-semibold mb-4">Our Bank Details (Dummy Info)</h2>
                <p><strong>Bank:</strong> Stonecera Bank</p>
                <p><strong>Account Name:</strong> Stonecera UK Ltd</p>
                <p><strong>Sort Code:</strong> 12-34-56</p>
                <p><strong>Account Number:</strong> 12345678</p>
                <p className="mt-4">Please use your <strong>Order Number</strong> as the payment reference.</p>
            </div>
            
            <Link href="/account/orders" className="inline-block mt-8 px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900">
                View My Orders
            </Link>
        </main>
    );
}