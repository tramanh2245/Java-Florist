import { useState, useEffect } from "react";
import { getPartnerOrders, updateOrderStatus } from "../api/orders";

const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL || "https://localhost:7107";

export default function PartnerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⭐ default tab = all
  const [activeTab, setActiveTab] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getPartnerOrders();
      setOrders(data || []);
    } catch (err) {
      console.error("Failed to load partner orders", err);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Helpers
  // =========================
  const parseDate = (dateString) => {
    if (!dateString || dateString.startsWith("0001")) return null;
    const utc = dateString.endsWith("Z") ? dateString : dateString + "Z";
    return new Date(utc);
  };

  const formatDateTime = (dateString) => {
    const d = parseDate(dateString);
    if (!d) return "N/A";
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

 
  const statusColor = (s) => {
    s = (s || "").toLowerCase();
    if (s.includes("assign"))
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (s.includes("deliver"))
      return "bg-orange-100 text-orange-700 border-orange-200";
    if (s.includes("complete"))
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (s.includes("paid"))
      return "bg-blue-100 text-blue-700 border-blue-200";

    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  // =========================
  // IMAGE HANDLING
  // =========================
  const getItemImageUrl = (item) => {
    const bouquet = item.bouquet || item.bouquetDto;
    if (!bouquet?.images?.length) return null;

    const img = bouquet.images[0];
    if (!img?.url) return null;

    return `${BACKEND_URL}${img.url}`;
  };

  // =========================
  // Filtering
  // =========================
  const filterOrders = () => {
    return orders.filter((o) => {
      const s = o.status || "Pending";

      // ⭐ Tab filter
      if (
        activeTab === "processing" &&
        !["Assigned", "Delivering", "Paid"].includes(s)
      ) {
        return false;
      }

      if (activeTab === "completed" && !["Completed"].includes(s)) {
        return false;
      }

      // ⭐ tab Pending
      if (activeTab === "pending" && !["Pending"].includes(s)) {
        return false;
      }

      // Date filter
      const created = parseDate(o.createdAt);
      if (!created) return true;

      if (dateFrom && created < new Date(dateFrom + "T00:00:00")) return false;
      if (dateTo && created > new Date(dateTo + "T23:59:59")) return false;

      return true;
    });
  };

  const handleStatusChange = async (id, newStatus) => {
    if (!window.confirm(`Change status to "${newStatus}"?`)) return;
    try {
      await updateOrderStatus(id, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.orderId === id ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, dateFrom, dateTo]);

  if (loading)
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-lg text-pink-500">Loading partner orders...</div>
      </div>
    );

  const filtered = filterOrders();

  // =========================
  // Pagination
  // =========================
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentPageOrders = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  const getPageNumbers = () => {
    const max = 5;
    if (totalPages <= max) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + max - 1);

    if (end - start < max - 1) {
      start = Math.max(1, end - max + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const lockedStatuses = ["Completed"];

  const renderItems = (order) => {
    const details = order.orderDetails || [];

    if (!details.length) {
      return (
        <div className="text-xs text-gray-400 italic">
          No items for this order.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {details.map((d, idx) => {
          const bouquet = d.bouquet || {};
          const name = bouquet.name || "Bouquet";
          const qty = d.quantity || 1;
          const linePrice = (d.unitPrice || 0) * qty;

          const imgUrl = getItemImageUrl(d);
          const occasionName = bouquet.occasion?.name || "Not specified";

          return (
            <div
              key={idx}
              className="flex gap-4 items-center bg-pink-50 rounded-xl p-4 border border-pink-100"
            >
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 flex items-center justify-center rounded-xl bg-pink-100 text-xs text-pink-500">
                  No Img
                </div>
              )}

              <div>
                <p className="font-medium text-gray-800">{name}</p>
                <p className="text-sm text-gray-500">Qty: {qty}</p>
                <p className="text-xs text-purple-600 mt-1">
                  Occasion: {occasionName}
                </p>
                <p className="text-pink-500 font-semibold mt-1">
                  ${linePrice.toFixed(2)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // =========================
  // LAYOUT
  // =========================
  return (
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* HEADER + FILTERS */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-pink-700">
              Partner Order Management
            </h1>
            <p className="text-sm text-pink-500 mt-1">
              View, filter and update your assigned orders.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            {/* Tabs */}
            <div className="flex bg-pink-50 p-1 rounded-xl shadow-sm border border-pink-200">
              {[
                ["all", "All"],
                ["pending", "Pending"],
                ["processing", "Processing"],
                ["completed", "Completed"],
              ].map(([key, label]) => {
                const count = orders.filter((o) => {
                  const s = o.status || "Pending";
                  if (key === "all") return true;
                  if (key === "pending") return s === "Pending";
                  if (key === "processing")
                    return ["Assigned", "Delivering", "Paid"].includes(s);
                  if (key === "completed") return ["Completed"].includes(s);
                  return false;
                }).length;

                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      activeTab === key
                        ? "bg-pink-500 text-white shadow-md"
                        : "text-pink-600 hover:bg-pink-100 hover:text-pink-700"
                    }`}
                  >
                    {label}{" "}
                    <span
                      className={`ml-1 text-[10px] ${
                        activeTab === key ? "text-pink-100" : "text-pink-300"
                      }`}
                    >
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Date filter */}
            <div className="flex flex-wrap gap-3 justify-end text-xs">
              <div className="flex items-center gap-1">
                <span className="text-pink-700">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border border-pink-200 rounded-lg px-2 py-1 text-xs bg-pink-50 focus:ring-pink-300 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-pink-700">To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border border-pink-200 rounded-lg px-2 py-1 text-xs bg-pink-50 focus:ring-pink-300 focus:outline-none"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="px-3 py-1 border border-pink-200 rounded-lg text-xs text-pink-700 bg-pink-50 hover:bg-pink-100"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LIST */}
        {currentPageOrders.length === 0 ? (
          <div className="bg-pink-50 rounded-2xl p-12 text-center border border-dashed border-pink-200">
            <div className="text-pink-300 text-lg">
              No orders found with current filter.
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {currentPageOrders.map((order) => {
              const details = order.orderDetails || [];
              const totalQty = details.reduce(
                (sum, d) => sum + (d.quantity || 0),
                0
              );

              return (
                <div
                  key={order.orderId}
                  className="bg-pink-50 rounded-2xl shadow-[0_4px_20px_rgba(255,182,193,0.25)] border border-pink-200 p-7 hover:shadow-[0_4px_24px_rgba(255,182,193,0.4)] transition"
                >
                  {/* HEADER */}
                  <div className="flex flex-wrap justify-between gap-4 pb-4 border-b border-pink-200">
                    <div className="flex flex-wrap gap-6 items-center">
                      <div>
                        <p className="text-xs text-pink-400 uppercase tracking-wide">
                          Order ID
                        </p>
                        <p className="text-lg font-semibold text-pink-800">
                          #{order.orderId}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-pink-400 uppercase tracking-wide">
                          Date Placed
                        </p>
                        <p className="text-pink-800">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-pink-400 uppercase tracking-wide">
                          Items
                        </p>
                        <p className="text-pink-800 font-semibold">
                          {totalQty} item{totalQty !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`h-fit px-4 py-1 rounded-full text-sm font-semibold border ${statusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </div>
                  </div>

                  {/* BODY */}
                  <div className="grid lg:grid-cols-3 gap-6 pt-6">
                    <div className="lg:col-span-2">{renderItems(order)}</div>

                    <div className="bg-pink-50 border border-pink-200 rounded-xl p-5 shadow-sm space-y-4 h-fit">
                      <div>
                        <p className="text-sm text-pink-400">Recipient</p>
                        <p className="font-medium text-pink-800">
                          {order.customerName}
                        </p>
                        <p className="text-sm text-pink-700">
                          Phone: {order.phone}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-pink-400">
                          Shipping Address
                        </p>
                        <p className="font-medium text-pink-800">
                          {order.shippingAddress}
                        </p>
                        {order.serviceZone && (
                          <p className="text-xs text-pink-600 mt-1 font-semibold">
                            Region: {order.serviceZone}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-sm text-pink-400">
                          Estimated Delivery
                        </p>
                        <p className="text-pink-700 font-semibold">
                          {formatDateTime(order.estimatedDeliveryTime)}
                        </p>
                      </div>

                      {order.message && (
                        <div className="text-sm p-3 bg-pink-100 rounded-xl border border-pink-200 italic text-pink-800">
                          "{order.message}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-6 pt-4 border-t border-pink-200 gap-3">
                    {!lockedStatuses.includes(order.status) ? (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-pink-700">
                          Update Status:
                        </span>
                        <select
                          className={`px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-300 ${statusColor(
                            order.status
                          )}`}
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.orderId, e.target.value)
                          }
                        >
                          <option value="Assigned">Assigned</option>
                          <option value="Delivering">Delivering</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    ) : (
                      <div className="text-sm text-pink-400">
                        This order is locked (completed).
                      </div>
                    )}

                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-pink-400 text-sm">Total:</span>
                      <span className="text-2xl font-bold text-pink-700">
                        ${Number(order.totalAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {filtered.length > 0 && (
          <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-xs text-pink-600">
              Showing{" "}
              <span className="font-semibold text-pink-800">
                {currentPageOrders.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-pink-800">
                {filtered.length}
              </span>{" "}
              orders
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-pink-200 text-pink-700 disabled:text-pink-300 disabled:border-pink-100 bg-pink-50 hover:bg-pink-100"
              >
                Prev
              </button>

              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`px-3 py-1.5 text-xs rounded-lg border ${
                    p === currentPage
                      ? "bg-pink-500 text-white border-pink-500"
                      : "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-pink-200 text-pink-700 disabled:text-pink-300 disabled:border-pink-100 bg-pink-50 hover:bg-pink-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
