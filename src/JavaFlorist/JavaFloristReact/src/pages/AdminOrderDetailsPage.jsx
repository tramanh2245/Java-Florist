import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminOrderById, assignOrder } from "../api/admin";
import Page from "../components/Page";

function statusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "pending" || s === "pending payment")
    return "bg-amber-50 text-amber-700";
  if (s === "paid") return "bg-sky-50 text-sky-700";
  if (s === "assigned") return "bg-indigo-50 text-indigo-700";
  if (s === "delivering") return "bg-orange-50 text-orange-700";
  if (s === "completed" || s === "delivered")
    return "bg-emerald-50 text-emerald-700";
  if (s === "refunded" || s === "declined")
    return "bg-rose-50 text-rose-700";
  return "bg-gray-50 text-gray-700";
}

export default function AdminOrderDetailsPage() {
  const { id } = useParams(); // /admin/orders/:id
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const data = await getAdminOrderById(id);
      setOrder(data);
    } catch (err) {
      console.error("Failed to load order detail", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (partnerId) => {
    if (!partnerId || !order) return;
    if (!window.confirm("Re-assign this order to selected partner?")) return;

    try {
      setAssigning(true);
      await assignOrder(order.orderId, partnerId);
      await loadOrder();
      alert("Order reassigned successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to re-assign order");
    } finally {
      setAssigning(false);
    }
  };

  const isCompleted = useMemo(() => {
    const s = (order?.status || "").toLowerCase();
    return s === "completed" || s === "delivered";
  }, [order?.status]);

  const eligiblePartners =
    order?.eligiblePartners || order?.EligiblePartners || [];

  if (loading) {
    return (
      <Page>
        <div className="min-h-screen bg-pink-50 px-4 md:px-8 py-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-pink-500">
            <span className="h-5 w-5 border-2 border-pink-200 border-t-transparent rounded-full animate-spin" />
            Loading order details...
          </div>
        </div>
      </Page>
    );
  }

  if (!order) {
    return (
      <Page>
        <div className="min-h-screen bg-pink-50 px-4 md:px-8 py-8">
          <button
            onClick={() => navigate("/admin/orders")}
            className="inline-flex items-center text-sm text-pink-600 mb-4 hover:text-pink-800"
          >
            ← Back to Orders
          </button>
          <div className="bg-white rounded-2xl shadow p-6 text-center text-slate-500">
            Order not found.
          </div>
        </div>
      </Page>
    );
  }

  // ==== Format helpers ====
  const createdAt = order.createdAt ? new Date(order.createdAt) : null;
  const createdDateStr = createdAt ? createdAt.toLocaleDateString() : "-";
  const createdTimeStr = createdAt
    ? createdAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
    : "-";

  const eta =
    order.estimatedDeliveryTime || order.eta || order.estimatedDeliveryAt;
  const etaStr = eta
    ? new Date(eta).toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    : "N/A";

  const items = order.items || order.orderItems || [];

  // price parts
  const totalAmount = order.totalAmount != null ? order.totalAmount : 0;
  const subTotal = order.subTotal != null ? order.subTotal : totalAmount;
  const vat = order.vat != null ? order.vat : null;
  const deliveryFee = order.deliveryFee != null ? order.deliveryFee : null;

  return (
    <Page>
      <div className="min-h-screen bg-pink-50 px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back */}
          <button
            onClick={() => navigate("/admin/orders")}
            className="inline-flex items-center text-xs md:text-sm text-pink-600 mb-4 hover:text-pink-800"
          >
            <span className="mr-1 text-base">←</span>
            Back to Orders
          </button>

          {/* Outer card */}
          <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-4 md:p-6 lg:p-8">
            {/* Header: Order number + actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <div className="text-xs uppercase tracking-[0.15em] text-pink-400">
                  Order Number
                </div>
                <div className="mt-1 text-2xl md:text-3xl font-semibold text-slate-900">
                  <span className="text-slate-800">#</span>
                  <span className="text-pink-500">{order.orderId}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(
                      order.status
                    )}`}
                  >
                    {order.status || "Unknown"}
                  </span>
                  {etaStr !== "N/A" && (
                    <span className="text-xs text-slate-500">
                      ETA{" "}
                      <span className="font-medium text-slate-700">
                        {etaStr}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Main 2-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_minmax(260px,1fr)] gap-6">
              {/* LEFT COLUMN */}
              <div className="space-y-6">
                {/* Items summary */}
                <div className="bg-pink-50 rounded-2xl border border-pink-100 p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-pink-700">
                      Items summary
                    </h2>
                  </div>

                  {items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs md:text-sm">
                        <thead>
                          <tr className="text-slate-400 text-[11px] md:text-xs uppercase tracking-wide border-b">
                            <th className="py-2 text-left font-medium">
                              Item
                            </th>
                            <th className="py-2 text-center font-medium">
                              QTY
                            </th>
                            <th className="py-2 text-right font-medium">
                              Price
                            </th>
                            <th className="py-2 text-right font-medium">
                              Total Price
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => {
                            const qty = item.quantity ?? item.qty ?? 1;
                            const unit = item.unitPrice ?? item.price ?? 0;
                            const lineTotal =
                              item.totalPrice ??
                              (unit != null ? unit * qty : null);

                            return (
                              <tr
                                key={idx}
                                className="border-b last:border-0 text-slate-700"
                              >
                                <td className="py-2 pr-2">
                                  <div className="font-medium">
                                    {item.bouquetName ||
                                      item.name ||
                                      "Bouquet"}
                                  </div>
                                  {item.occasion && (
                                    <div className="text-[11px] text-slate-500">
                                      Occasion: {item.occasion}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 text-center">{qty}</td>
                                <td className="py-2 text-right">
                                  {unit != null
                                    ? `$${unit.toFixed(2)}`
                                    : "-"}
                                </td>
                                <td className="py-2 text-right">
                                  {lineTotal != null
                                    ? `$${lineTotal.toFixed(2)}`
                                    : "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">
                      No item details available.
                    </div>
                  )}
                </div>

                {/* Customer & Order details */}
                <div className="bg-pink-50 rounded-2xl border border-pink-100 p-4 md:p-5">
                  <h2 className="text-sm font-semibold text-pink-700 mb-3">
                    Customer and Order Details
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs md:text-sm">
                    <div>
                      <div className="text-[11px] uppercase text-slate-400 mb-0.5">
                        Customer Name
                      </div>
                      <div className="text-slate-800">
                        {order.customerName ||
                          order.recipientName ||
                          "-"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase text-slate-400 mb-0.5">
                        Phone Number
                      </div>
                      <div className="text-slate-800">
                        {order.phone || "N/A"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase text-slate-400 mb-0.5">
                        Payment Method
                      </div>
                      <div className="text-slate-800">
                        {order.paymentMethod || "Unknown"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase text-slate-400 mb-0.5">
                        Payment Status
                      </div>
                      <div className="text-slate-800">
                        {order.paymentStatus || "N/A"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase text-slate-400 mb-0.5">
                        Service Zone
                      </div>
                      <div className="text-slate-800">
                        {order.serviceZone || "-"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase text-slate-400 mb-0.5">
                        Created At
                      </div>
                      <div className="text-slate-800">
                        {createdDateStr} · {createdTimeStr}
                      </div>
                    </div>

                    {order.message && (
                      <div className="md:col-span-2 mt-2">
                        <div className="text-[11px] uppercase text-slate-400 mb-0.5">
                          Card Message
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-white border border-pink-100 text-slate-700 whitespace-pre-line">
                          {order.message}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-5">
                {/* Partner (Rider) details */}
                <div className="bg-pink-50 rounded-2xl border border-pink-100 p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-pink-700">
                      Partner Details
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 text-xs font-semibold">
                      {order.partnerName
                        ? order.partnerName.charAt(0)
                        : "U"}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">
                        {order.partnerName || "Unassigned"}
                      </div>
                      {order.serviceZone && (
                        <div className="text-[11px] text-slate-500">
                          Zone: {order.serviceZone}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isCompleted && eligiblePartners.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[11px] uppercase text-slate-400 mb-1">
                        Re-assign partner
                      </div>
                      <select
                        disabled={assigning}
                        defaultValue=""
                        onChange={(e) => handleAssign(e.target.value)}
                        className="w-full border border-pink-200 rounded-lg px-3 py-2 text-xs md:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-300"
                      >
                        <option value="" disabled>
                          {assigning ? "Re-assigning..." : "Select partner…"}
                        </option>
                        {eligiblePartners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.companyName || p.name || "Partner"} (
                            {p.serviceArea || p.serviceZone || "Area"})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Order summary */}
                <div className="bg-pink-50 rounded-2xl border border-pink-100 p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-pink-700">
                      Order summary
                    </h2>
                    <span className="text-[11px] text-emerald-500 font-medium">
                      {order.status || "—"}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs md:text-sm text-slate-700">
                    <div className="flex justify-between">
                      <span>Order Created</span>
                      <span>
                        {createdDateStr} · {createdTimeStr}
                      </span>
                    </div>
                    {etaStr !== "N/A" && (
                      <div className="flex justify-between">
                        <span>Estimated Delivery</span>
                        <span>{etaStr}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-pink-100">
                      <span>Subtotal</span>
                      <span>${subTotal.toFixed(2)}</span>
                    </div>
                    {vat != null && (
                      <div className="flex justify-between">
                        <span>VAT</span>
                        <span>${vat.toFixed(2)}</span>
                      </div>
                    )}
                    {deliveryFee != null && (
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>${deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-pink-100 text-sm font-semibold text-slate-900">
                      <span>Total</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery address */}
                <div className="bg-pink-50 rounded-2xl border border-pink-100 p-4 md:p-5">
                  <h2 className="text-sm font-semibold text-pink-700 mb-3">
                    Delivery Address
                  </h2>
                  <div className="text-xs md:text-sm text-slate-700 space-y-1">
                    <div className="font-medium">
                      {order.customerName ||
                        order.recipientName ||
                        "-"}
                    </div>
                    {order.shippingAddress && (
                      <div className="whitespace-pre-line">
                        {order.shippingAddress}
                      </div>
                    )}
                    {order.phone && (
                      <div className="text-slate-500">
                        Phone: {order.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
