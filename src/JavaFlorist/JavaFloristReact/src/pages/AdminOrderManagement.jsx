import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminOrders, getPartnersList, assignOrder } from "../api/admin";
import Page from "../components/Page";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  "All",
  "Pending",
  "Paid",
  "Assigned",
  "Delivering",
  "Completed",
];

const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "last7", label: "Last 7 days" },
  { value: "thisWeek", label: "This week" },
  { value: "thisMonth", label: "This month" },
];

export default function AdminOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("all");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [ordersData, partnersData] = await Promise.all([
        getAdminOrders(),
        getPartnersList(),
      ]);
      setOrders(ordersData);
      setPartners(partnersData);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------
  // AUTO SELECT DATE RANGE
  // ------------------------
  const applyDateRange = (range) => {
    const now = new Date();
    let f = "";
    let t = "";

    if (range === "today") {
      const today = now.toISOString().substring(0, 10);
      f = today;
      t = today;
    }

    if (range === "last7") {
      const from = new Date(now);
      from.setDate(now.getDate() - 6);
      f = from.toISOString().substring(0, 10);
      t = now.toISOString().substring(0, 10);
    }

    if (range === "thisWeek") {
      const day = now.getDay();
      const diff = (day + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      f = monday.toISOString().substring(0, 10);
      t = sunday.toISOString().substring(0, 10);
    }

    if (range === "thisMonth") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      f = first.toISOString().substring(0, 10);
      t = now.toISOString().substring(0, 10);
    }

    if (range === "all") {
      f = "";
      t = "";
    }

    setDateFrom(f);
    setDateTo(t);
  };

  const handleRangeSelect = (value) => {
    setRangeFilter(value);
    applyDateRange(value);
    setCurrentPage(1);
  };

  // ------------------------
  // STATUS BADGE
  // ------------------------
  const statusClass = (status) => {
    const s = status?.toLowerCase();
    if (!s) return "";

    if (s === "pending") return "bg-amber-50 text-amber-700";
    if (s === "paid") return "bg-blue-50 text-blue-700";
    if (s === "assigned") return "bg-indigo-50 text-indigo-700";
    if (s === "delivering") return "bg-orange-50 text-orange-700";
    if (s === "completed") return "bg-emerald-50 text-emerald-700";
    return "bg-gray-50 text-gray-700";
  };

  // ------------------------
  // FILTER LOGIC
  // ------------------------
  const filteredOrders = useMemo(() => {
    let f = [...orders];

    if (searchText.trim() !== "") {
      const kw = searchText.toLowerCase();
      f = f.filter(
        (o) =>
          o.customerName?.toLowerCase().includes(kw) ||
          o.serviceZone?.toLowerCase().includes(kw) ||
          String(o.orderId).includes(kw)
      );
    }

    if (statusFilter !== "all") {
      f = f.filter(
        (o) => o.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      f = f.filter((o) => {
        if (!o.createdAt) return false;
        return new Date(o.createdAt) >= from;
      });
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      f = f.filter((o) => {
        if (!o.createdAt) return false;
        return new Date(o.createdAt) <= to;
      });
    }

    return f;
  }, [orders, searchText, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  const currentPageOrders = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const goToDetail = (id) => navigate(`/admin/orders/${id}`);

  const handleAssign = async (orderId, partnerId) => {
    if (!partnerId) return;
    if (!window.confirm("Assign this order to selected partner?")) return;

    try {
      await assignOrder(orderId, partnerId);
      await load();
      alert("Order reassigned successfully");
    } catch {
      alert("Failed to assign order");
    }
  };

  return (
    <Page>
      <div className="min-h-screen px-6 py-10 bg-pink-50">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-pink-700">Order Management</h1>

          <button
            onClick={load}
            disabled={loading}
            className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white px-6 py-3 rounded-xl shadow-md transition"
          >
            {loading ? "Refreshing..." : "Refresh Orders"}
          </button>
        </div>

        {/* SEARCH + STATUS CHIPS */}
        <div className="bg-white rounded-2xl shadow-md px-6 py-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-1/3">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-3 pl-12 rounded-xl border border-pink-200 focus:ring-2 focus:ring-pink-300 outline-none shadow-sm"
              />
              <span className="absolute left-4 top-2.5 text-pink-500 text-xl">
                🔍
              </span>
            </div>

            {/* Status Chips */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-end">
              {STATUS_OPTIONS.map((label) => {
                const value = label === "All" ? "all" : label.toLowerCase();
                const active = statusFilter === value;

                return (
                  <button
                    key={value}
                    onClick={() => {
                      setStatusFilter(value);
                      setCurrentPage(1);
                    }}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition
                      ${active
                        ? "bg-pink-500 text-white shadow"
                        : "bg-pink-100 text-pink-700 hover:bg-pink-200"
                      }
                    `}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RANGE + DATE INPUTS */}
        <div className="bg-white rounded-2xl shadow-md px-6 py-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Range Chips */}
            <div className="flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => handleRangeSelect(r.value)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition
                    ${rangeFilter === r.value
                      ? "bg-pink-500 text-white shadow"
                      : "bg-pink-100 text-pink-700 hover:bg-pink-200"
                    }
                  `}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Date Inputs */}
            <div className="flex items-center gap-6">
              {/* From Date */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-1">From date</span>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">
                    📅
                  </span>
                  <input
                    type="date"
                    className="border border-pink-200 px-3 py-2 pl-10 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none bg-white"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>

              {/* To Date */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-1">To date</span>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">
                    📅
                  </span>
                  <input
                    type="date"
                    className="border border-pink-200 px-3 py-2 pl-10 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none bg-white"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-xl p-6 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-pink-700 font-semibold border-b border-pink-100">
                <th className="py-3">Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Zone</th>
                <th>Status</th>
                <th>Partner</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {currentPageOrders.map((order) => {
                const isCompleted =
                  order.status?.toLowerCase() === "completed";

                const eligible =
                  order.eligiblePartners || order.EligiblePartners || [];

                return (
                  <tr
                    key={order.orderId}
                    className="border-b border-pink-50 hover:bg-pink-200/40 transition cursor-pointer"
                    onClick={() => goToDetail(order.orderId)}
                  >
                    <td className="py-3 font-semibold text-pink-600">
                      #{order.orderId}
                    </td>
                    <td className="text-gray-700">{order.customerName}</td>
                    <td className="font-semibold text-pink-600">
                      ${Number(order.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="text-gray-600">{order.serviceZone}</td>
                    <td>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="text-gray-700">
                      {order.partnerName || "Unassigned"}
                    </td>

                    {/* ACTION */}
                    <td
                      className="py-3 text-center align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-block w-56">
                        {!isCompleted ? (
                          <select
                            defaultValue=""
                            onChange={(e) =>
                              handleAssign(order.orderId, e.target.value)
                            }
                            className="border rounded-lg px-3 py-2 text-sm w-full"
                          >
                            <option value="" disabled>
                              Re-assign…
                            </option>
                            {eligible.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.companyName} ({p.serviceArea})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-400 italic text-sm block text-center">
                            No actions
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10 text-gray-500 italic"
                  >
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center mt-5">
          <p className="text-gray-500">
            Page {currentPage} / {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Prev
            </button>

            <button
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
}
