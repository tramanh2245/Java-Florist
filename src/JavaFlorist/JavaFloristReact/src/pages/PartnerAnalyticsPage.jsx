import { useEffect, useMemo, useState } from "react";
import {
  getPartnerAnalyticsSummary,
  getPartnerAnalyticsDaily,
  getPartnerAnalyticsHourly,
  getPartnerAnalyticsByZone,
  getPartnerAnalyticsByOccasion,
  getPartnerAnalyticsTimeline,
} from "../api/orders";
import Page from "../components/Page";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const presetRanges = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "custom", label: "Custom", days: null },
];

const PIE_COLORS = ["#f97373", "#fb7185", "#facc15", "#34d399", "#60a5fa", "#a855f7", "#f97316"];

export default function PartnerAnalyticsPage() {
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [byZone, setByZone] = useState([]);
  const [byOccasion, setByOccasion] = useState([]);
  const [timeline, setTimeline] = useState([]);

  const [loading, setLoading] = useState(false);
  const [rangeKey, setRangeKey] = useState("30d");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("overview"); // overview | hourly | zone | occasion | timeline

  const buildParams = () => {
    const params = {};
    if (rangeKey !== "custom") {
      const preset = presetRanges.find((r) => r.key === rangeKey);
      if (preset?.days) {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - preset.days);
        params.from = from.toISOString().substring(0, 10);
        params.to = to.toISOString().substring(0, 10);
      }
    } else {
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
    }
    return params;
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams();

      const [
        summaryData,
        dailyData,
        hourlyData,
        zoneData,
        occasionData,
        timelineData,
      ] = await Promise.all([
        getPartnerAnalyticsSummary(params),
        getPartnerAnalyticsDaily(params),
        getPartnerAnalyticsHourly(params),
        getPartnerAnalyticsByZone(params),
        getPartnerAnalyticsByOccasion(params),
        getPartnerAnalyticsTimeline(params),
      ]);

      setSummary(summaryData);
      setDaily(
        (dailyData || []).map((d) => ({
          ...d,
          dateLabel: new Date(d.date).toLocaleDateString(),
        }))
      );
      setHourly(hourlyData || []);
      setByZone(zoneData || []);
      setByOccasion(occasionData || []);
      setTimeline(timelineData || []);
    } catch (err) {
      console.error("Analytics error:", err);
      setError("Cannot load analytics data. Please try again.");
      setSummary(null);
      setDaily([]);
      setHourly([]);
      setByZone([]);
      setByOccasion([]);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  const handleApplyCustom = () => {
    setRangeKey("custom");
    loadData();
  };

  const hasData = !!summary && summary.totalOrders > 0;

  const chartTitle = useMemo(() => {
    if (!summary) return "";
    const from = new Date(summary.fromDate).toLocaleDateString();
    const to = new Date(summary.toDate).toLocaleDateString();
    return `${from} → ${to}`;
  }, [summary]);

  // Aggregate hourly to “by hour of day” (0–23)
  const hourlyByHour = useMemo(() => {
    if (!hourly || hourly.length === 0) return [];
    const map = {};
    hourly.forEach((h) => {
      const hour = h.hour;
      if (!map[hour]) {
        map[hour] = { hour, orderCount: 0, revenue: 0 };
      }
      map[hour].orderCount += h.orderCount || 0;
      map[hour].revenue += h.revenue || 0;
    });
    return Object.values(map).sort((a, b) => a.hour - b.hour);
  }, [hourly]);

  return (
    <Page title="Partner Analytics">
      <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          {/* Header + date range */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-pink-600 tracking-tight">
                Analytics &amp; Income
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                View your performance, orders, revenue, and trends over time.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap gap-2 justify-end">
                {presetRanges.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRangeKey(r.key)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all
                    ${
                      rangeKey === r.key
                        ? "bg-pink-500 text-white border-pink-500 shadow"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-pink-50"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="date"
                  className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-white"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
                <span>→</span>
                <input
                  type="date"
                  className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-white"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
                <button
                  onClick={handleApplyCustom}
                  className="ml-2 px-4 py-1.5 rounded-lg bg-pink-500 text-white text-xs font-semibold hover:bg-pink-600 shadow-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { key: "overview", label: "Overview" },
              { key: "hourly", label: "Hourly (Realtime-style)" },
              { key: "zone", label: "By State" },
              { key: "occasion", label: "By Occasion" },
              { key: "timeline", label: "Order Timeline" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-full border transition-all ${
                  activeTab === tab.key
                    ? "bg-pink-600 text-white border-pink-600 shadow"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-pink-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
              <p className="text-xs text-gray-500 mt-3">
                Loading analytics data…
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && (!summary || summary.totalOrders === 0) && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-white border border-dashed border-pink-200 rounded-2xl px-6 py-6 shadow-sm max-w-md text-center">
                <p className="text-base font-semibold text-gray-700 mb-1">
                  No data found in this date range
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Try choosing a wider date range or wait until you receive some
                  orders.
                </p>
                <button
                  onClick={loadData}
                  className="px-4 py-1.5 rounded-lg bg-pink-500 text-white text-xs font-semibold hover:bg-pink-600"
                >
                  Refresh analytics
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && !error && summary && hasData && (
            <>
              {/* 4 cards tổng quan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/90 backdrop-blur border border-pink-100 rounded-2xl p-4 shadow hover:shadow-md transition">
                  <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-pink-600">
                    ₹ {summary.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {new Date(summary.fromDate).toLocaleDateString()} –{" "}
                    {new Date(summary.toDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="bg-white/90 backdrop-blur border border-emerald-100 rounded-2xl p-4 shadow hover:shadow-md transition">
                  <p className="text-xs text-gray-500 mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {summary.totalOrders}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Avg. order value: ₹{" "}
                    {summary.averageOrderValue
                      .toFixed(0)
                      .toLocaleString()}
                  </p>
                </div>

                <div className="bg-white/90 backdrop-blur border border-blue-100 rounded-2xl p-4 shadow hover:shadow-md transition">
                  <p className="text-xs text-gray-500 mb-1">
                    Completed / Pending
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {summary.completedOrders}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Pending: {summary.pendingOrders}
                  </p>
                </div>

                <div className="bg-white/90 backdrop-blur border border-red-100 rounded-2xl p-4 shadow hover:shadow-md transition">
                  <p className="text-xs text-gray-500 mb-1">Cancelled</p>
                  <p className="text-2xl font-bold text-red-500">
                    {summary.cancelledOrders}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Conversion rate:{" "}
                    {summary.totalOrders > 0
                      ? (
                          (summary.completedOrders / summary.totalOrders) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>

              {/* TAB CONTENT */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 items-stretch">
                  {/* Daily revenue chart */}
                  <div className="lg:col-span-2 bg-white/90 backdrop-blur border border-pink-100 rounded-2xl p-4 shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-sm font-semibold text-gray-800">
                        Daily Revenue
                      </h2>
                      <p className="text-[11px] text-gray-500">
                        {chartTitle}
                      </p>
                    </div>
                    {daily.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-10">
                        No completed orders in this date range.
                      </p>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={daily}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="dateLabel" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="revenue" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Daily breakdown table */}
                  <div className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl p-4 shadow flex flex-col">
                    <h2 className="text-sm font-semibold text-gray-800 mb-2">
                      Daily breakdown
                    </h2>
                    <div className="flex-1 max-h-64 overflow-y-auto text-xs">
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b text-[11px] text-gray-500">
                            <th className="py-1 pr-2">Date</th>
                            <th className="py-1 pr-2 text-right">Orders</th>
                            <th className="py-1 text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {daily.map((d) => (
                            <tr
                              key={d.date}
                              className="border-b last:border-0 hover:bg-pink-50/40"
                            >
                              <td className="py-1 pr-2">
                                {new Date(d.date).toLocaleDateString()}
                              </td>
                              <td className="py-1 pr-2 text-right">
                                {d.orderCount}
                              </td>
                              <td className="py-1 text-right">
                                ₹ {d.revenue.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {daily.length === 0 && (
                        <p className="text-[11px] text-gray-500 text-center py-4">
                          No data.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "hourly" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 items-stretch">
                  {/* Hour-of-day chart */}
                  <div className="lg:col-span-2 bg-white/90 backdrop-blur border border-pink-100 rounded-2xl p-4 shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-sm font-semibold text-gray-800">
                        Hourly demand (aggregated by hour of day)
                      </h2>
                      <p className="text-[11px] text-gray-500">
                        Peaks in evening and weekends
                      </p>
                    </div>
                    {hourlyByHour.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-10">
                        No hourly data in this range.
                      </p>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={hourlyByHour}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Area
                              type="monotone"
                              dataKey="orderCount"
                              name="Orders"
                              activeDot={{ r: 4 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Small side box */}
                  <div className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl p-4 shadow text-xs space-y-2">
                    <h2 className="text-sm font-semibold text-gray-800 mb-1">
                      Tips from hourly behaviour
                    </h2>
                    <p className="text-gray-600">
                      • Focus on evening hours (18–21h) – usually the peak.
                    </p>
                    <p className="text-gray-600">
                      • Weekends often have higher demand. Keep stock &amp; staff
                      ready.
                    </p>
                    <p className="text-gray-600">
                      • Use this chart to plan when you should be online and
                      respond faster.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "zone" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 items-stretch">
                  {/* Pie chart by zone */}
                  <div className="bg-white/90 backdrop-blur border border-pink-100 rounded-2xl p-4 shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-sm font-semibold text-gray-800">
                        Revenue by State (ServiceZone)
                      </h2>
                      <p className="text-[11px] text-gray-500">
                        Top regions for your orders
                      </p>
                    </div>
                    {byZone.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-10">
                        No data for service zones.
                      </p>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={byZone}
                              dataKey="revenue"
                              nameKey="serviceZone"
                              outerRadius={90}
                              labelLine={false}
                              label={(entry) => entry.serviceZone}
                            >
                              {byZone.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    PIE_COLORS[index % PIE_COLORS.length]
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Table by zone */}
                  <div className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl p-4 shadow flex flex-col text-xs">
                    <h2 className="text-sm font-semibold text-gray-800 mb-2">
                      ServiceZone breakdown
                    </h2>
                    <div className="flex-1 max-h-64 overflow-y-auto">
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b text-[11px] text-gray-500">
                            <th className="py-1 pr-2">State</th>
                            <th className="py-1 pr-2 text-right">Orders</th>
                            <th className="py-1 pr-2 text-right">Revenue</th>
                            <th className="py-1 text-right">Avg/order</th>
                          </tr>
                        </thead>
                        <tbody>
                          {byZone.map((z) => (
                            <tr
                              key={z.serviceZone}
                              className="border-b last:border-0 hover:bg-pink-50/40"
                            >
                              <td className="py-1 pr-2">{z.serviceZone}</td>
                              <td className="py-1 pr-2 text-right">
                                {z.orderCount}
                              </td>
                              <td className="py-1 pr-2 text-right">
                                ₹ {z.revenue.toLocaleString()}
                              </td>
                              <td className="py-1 text-right">
                                ₹ {z.averageOrderValue.toFixed(0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {byZone.length === 0 && (
                        <p className="text-[11px] text-gray-500 text-center py-4">
                          No data.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "occasion" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 items-stretch">
                  {/* Pie chart by occasion */}
                  <div className="bg-white/90 backdrop-blur border border-pink-100 rounded-2xl p-4 shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-sm font-semibold text-gray-800">
                        Revenue by Occasion
                      </h2>
                      <p className="text-[11px] text-gray-500">
                        Which events bring the most money?
                      </p>
                    </div>
                    {byOccasion.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-10">
                        No data for occasions.
                      </p>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={byOccasion}
                              dataKey="revenue"
                              nameKey="occasion"
                              outerRadius={90}
                              labelLine={false}
                              label={(entry) => entry.occasion}
                            >
                              {byOccasion.map((entry, index) => (
                                <Cell
                                  key={`cell-occasion-${index}`}
                                  fill={
                                    PIE_COLORS[index % PIE_COLORS.length]
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Table by occasion */}
                  <div className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl p-4 shadow flex flex-col text-xs">
                    <h2 className="text-sm font-semibold text-gray-800 mb-2">
                      Occasion breakdown
                    </h2>
                    <div className="flex-1 max-h-64 overflow-y-auto">
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b text-[11px] text-gray-500">
                            <th className="py-1 pr-2">Occasion</th>
                            <th className="py-1 pr-2 text-right">Orders</th>
                            <th className="py-1 text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {byOccasion.map((o) => (
                            <tr
                              key={o.occasion}
                              className="border-b last:border-0 hover:bg-pink-50/40"
                            >
                              <td className="py-1 pr-2">{o.occasion}</td>
                              <td className="py-1 pr-2 text-right">
                                {o.orderCount}
                              </td>
                              <td className="py-1 text-right">
                                ₹ {o.revenue.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {byOccasion.length === 0 && (
                        <p className="text-[11px] text-gray-500 text-center py-4">
                          No data.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "timeline" && (
                <div className="bg-white/90 backdrop-blur border border-pink-100 rounded-2xl p-4 shadow mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-gray-800">
                      Order Timeline
                    </h2>
                    <p className="text-[11px] text-gray-500">
                      Latest orders within selected range
                    </p>
                  </div>
                  {timeline.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-10">
                      No orders in this date range.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto text-xs">
                      {timeline.map((o) => (
                        <div
                          key={o.orderCode}
                          className="flex items-start gap-3 border border-gray-100 rounded-xl px-3 py-2 bg-white hover:bg-pink-50/40 transition"
                        >
                          <div className="mt-1">
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${
                                o.status === "Completed"
                                  ? "bg-emerald-500"
                                  : o.status === "Pending" ||
                                    o.status === "Processing"
                                  ? "bg-amber-400"
                                  : "bg-red-400"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center gap-2">
                              <div className="font-semibold text-gray-800 text-xs">
                                {o.orderCode}
                              </div>
                              <div className="text-[11px] text-gray-500">
                                {new Date(o.createdAt).toLocaleString()}
                              </div>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-pink-50 border border-pink-100 text-[10px] text-pink-700">
                                {o.status}
                              </span>
                              {o.serviceZone && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-700">
                                  {o.serviceZone}
                                </span>
                              )}
                              {o.occasion && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] text-blue-700">
                                  {o.occasion}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-[11px] text-gray-600">
                              Total: ₹ {o.totalAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
