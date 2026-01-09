import { useState, useEffect } from "react";
import { getRevenueStats } from "../api/admin";
import Page from "../components/Page";

export default function AdminRevenuePage() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getRevenueStats();
      setStats(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <div className="min-h-screen bg-pink-50 px-6 py-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
          <h1 className="text-3xl font-bold text-pink-700">Revenue Overview</h1>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl shadow-md transition"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-4 text-gray-600 text-sm mb-5">
          Total Partners: <b>{stats.length}</b>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.map((s) => (
            <div
              key={s.partnerId}
              className="
  bg-white rounded-2xl shadow-xl p-6 border border-pink-100
  hover:shadow-[0_8px_25px_rgba(255,105,180,0.25)]
  hover:ring-2 hover:ring-pink-300/40
  hover:-translate-y-1
  transition-all duration-300
"


            >
              <div className="mb-4">
                <p className="text-xl font-bold text-gray-800">
                  {s.partnerName}
                </p>
                <p className="text-sm text-pink-500">
                  {s.serviceArea || "No Zone"}
                </p>
              </div>

              <div className="space-y-3 text-gray-700">
                <div className="flex justify-between">
                  <span>Completed Orders:</span>
                  <span className="font-semibold">{s.totalOrders}</span>
                </div>

                <div className="flex justify-between">
                  <span>Total Revenue:</span>
                  <span className="font-bold text-green-700">
                    ${s.totalRevenue.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-dashed my-3"></div>

                <div className="flex justify-between text-pink-600">
                  <span>Platform Commission (10%):</span>
                  <span className="font-bold">
                    ${s.platformCommission.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
