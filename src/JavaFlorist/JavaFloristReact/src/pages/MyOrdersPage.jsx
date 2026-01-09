import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyOrders } from "../api/orders";

const BACKEND_URL = "https://localhost:7107";

export default function MyOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getMyOrders();
                setOrders(data);
            } catch (err) {
                setError("Failed to load your orders.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        const utcDateString = dateString.endsWith("Z") ? dateString : dateString + "Z";
        return new Date(utcDateString).toLocaleString("en-US", {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const statusColor = (s) => {
        s = (s || "").toLowerCase();
        if (s.includes("pending")) return "bg-yellow-200 text-yellow-700";
        if (s.includes("paid")) return "bg-green-200 text-green-700";
        if (s.includes("assigned")) return "bg-blue-200 text-blue-600";
        if (s.includes("delivering")) return "bg-purple-200 text-purple-700";
        if (s.includes("delivered") || s.includes("completed")) return "bg-emerald-200 text-emerald-700";
        if (s.includes("cancel")) return "bg-red-200 text-red-700";
        if (s.includes("refunded")) return "bg-gray-300 text-gray-700";
        return "bg-gray-200 text-gray-600";
    };

    if (loading)
        return <div className="text-center py-20 text-lg text-gray-500">Loading your orders...</div>;

    if (error)
        return <div className="text-center py-20 text-red-500 text-lg">{error}</div>;

    return (
        <div className="max-w-5xl mx-auto px-6 py-10">
            <h1 className="text-4xl font-bold text-pink-600 mb-10 text-center">My Orders</h1>

            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
                    <Link to="/all-products" className="px-6 py-3 bg-pink-500 text-white rounded-full shadow hover:bg-pink-600 transition">Shop Now</Link>
                </div>
            ) : (
                <div className="space-y-10">
                    {orders.map((order) => (
                        <div key={order.orderId} className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(255,182,193,0.25)] border border-pink-100 p-8 hover:shadow-[0_4px_26px_rgba(255,182,193,0.45)] transition">

                            {/* HEADER */}
                            <div className="flex flex-wrap justify-between gap-4 pb-6 border-b border-pink-100">
                                <div className="flex flex-wrap gap-6">
                                    <div>
                                        <p className="text-sm text-gray-400">Order ID</p>
                                        <p className="text-lg font-semibold text-gray-800">#{order.orderId}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-400">Date Placed</p>
                                        <p className="text-gray-700">{formatDateTime(order.createdAt)}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-400">Payment</p>
                                        {order.status === "Pending Payment" ? (
                                            <span className="text-yellow-600 font-medium">Unpaid</span>
                                        ) : order.status === "Refunded" ? (
                                            <span className="text-gray-500 font-semibold">Refunded (Cancelled)</span>
                                        ) : (
                                            <span className="text-green-600 font-semibold">Paid (PayPal)</span>
                                        )}
                                    </div>
                                </div>

                                <div className={`h-fit px-4 py-1 rounded-full text-sm font-semibold ${statusColor(order.status)}`}>
                                    {order.status}
                                </div>
                            </div>

                            {/* BODY */}
                            <div className="grid lg:grid-cols-3 gap-6 pt-6">

                                {/* LEFT: ITEMS */}
                                <div className="lg:col-span-2 space-y-4">
                                    {order.orderDetails?.map((d) => (
                                        <div key={d.id} className="flex gap-4 items-center bg-pink-50 rounded-xl p-4 border border-pink-100">
                                            {d.bouquet?.images?.length > 0 ? (
                                                <img
                                                    src={`${BACKEND_URL}${d.bouquet.images[0].url}`}
                                                    alt=""
                                                    className="w-20 h-20 rounded-xl object-cover"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 flex items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-500">No Img</div>
                                            )}

                                            <div>
                                                <p className="font-medium text-gray-800">{d.bouquet?.name || "Bouquet"}</p>
                                                <p className="text-sm text-gray-500">Qty: {d.quantity}</p>
                                                <p className="text-pink-500 font-semibold mt-1">${(d.unitPrice * d.quantity).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* RIGHT: DELIVERY */}
                                <div className="bg-white border border-pink-100 rounded-xl p-5 shadow-sm space-y-4 h-fit">
                                    <div>
                                        <p className="text-sm text-gray-400">Recipient</p>
                                        <p className="font-medium text-gray-700">{order.customerName}</p>
                                        <p className="text-sm text-gray-500">Phone: {order.phone}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-400">Shipping Address</p>
                                        <p className="font-medium text-gray-700">{order.shippingAddress}</p>
                                        {order.serviceZone && (
                                            <p className="text-xs text-blue-500 mt-1 font-semibold">Region: {order.serviceZone}</p>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-400">Estimated Delivery</p>
                                        <p className="text-yellow-600 font-semibold">{formatDateTime(order.estimatedDeliveryTime)}</p>
                                    </div>

                                    {order.message && (
                                        <div className="text-sm p-3 bg-pink-50 rounded-xl border border-pink-100 italic">"{order.message}"</div>
                                    )}
                                </div>
                            </div>

                            {/* FOOTER */}
                            <div className="flex justify-end items-center mt-8 pt-4 border-t border-pink-100">
                                <span className="text-gray-400 mr-2">Total:</span>
                                <span className="text-2xl font-bold text-pink-600">${order.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
