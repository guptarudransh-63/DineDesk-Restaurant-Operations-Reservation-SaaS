import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Users,
  Grid,
  ChefHat,
  Calendar,
  UtensilsCrossed,
  Settings,
  Shield,
  ArrowUpRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../services/api';

export default function AdminDashboard() {
  const [range, setRange] = useState('30d');
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, anaRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/analytics', { params: { range } }),
      ]);
      setSummary(sumRes.data.data);
      setAnalytics(anaRes.data);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [range]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header & Range Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-stone-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-amber-500" />
              <h1 className="text-2xl font-bold font-display text-stone-100">
                Executive Operations & Revenue Dashboard
              </h1>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Live database metrics: Net revenue, dining analytics, table utilization, and product demand
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Sub-navigation links */}
            <Link
              to="/admin/menu"
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 rounded-xl text-xs font-semibold transition"
            >
              Menu Admin
            </Link>
            <Link
              to="/admin/reservations"
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 rounded-xl text-xs font-semibold transition"
            >
              Reservations
            </Link>
            <Link
              to="/admin/staff"
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 rounded-xl text-xs font-semibold transition"
            >
              Staff Roles
            </Link>
            <Link
              to="/admin/settings"
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 rounded-xl text-xs font-semibold transition"
            >
              Settings
            </Link>

            {/* Time range pills */}
            <div className="flex items-center bg-stone-900 p-1 rounded-xl border border-stone-800 ml-2">
              {[
                { id: 'today', label: 'Today' },
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '90d', label: '90D' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    range === r.id
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchDashboardData}
              className="p-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-300 transition"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-stone-900/90 border border-stone-800 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-stone-400 text-xs">
              <span>Total Settled Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-display text-stone-100 mt-2">
              ₹{(summary?.totalRevenue || 0).toLocaleString('en-IN')}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-800/60">
              <span>Avg Order: <strong className="text-stone-200">₹{summary?.avgOrderValue || 0}</strong></span>
              <span className="text-emerald-400 font-semibold">Excl. Cancelled</span>
            </div>
          </div>

          <div className="p-5 bg-stone-900/90 border border-stone-800 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-stone-400 text-xs">
              <span>Total Orders Placed</span>
              <ShoppingBag className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-display text-stone-100 mt-2">
              {summary?.totalOrdersCount || 0}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-800/60">
              <span>Dine-In: ₹{summary?.dineInRevenue || 0}</span>
              <span>Takeaway: ₹{summary?.takeawayRevenue || 0}</span>
            </div>
          </div>

          <div className="p-5 bg-stone-900/90 border border-stone-800 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-stone-400 text-xs">
              <span>Table Utilization</span>
              <Grid className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-display text-stone-100 mt-2">
              {summary?.tables?.occupied || 0} / {summary?.tables?.total || 14}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-800/60">
              <span className="text-emerald-400">{summary?.tables?.available || 0} Free</span>
              <span className="text-blue-400">{summary?.tables?.reserved || 0} Reserved</span>
            </div>
          </div>

          <div className="p-5 bg-stone-900/90 border border-stone-800 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-stone-400 text-xs">
              <span>Kitchen & Bookings</span>
              <ChefHat className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-display text-stone-100 mt-2">
              {summary?.pendingKitchenTickets || 0} In Kitchen
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-800/60">
              <span>Today Bookings: <strong className="text-stone-200">{summary?.todayReservations || 0}</strong></span>
              <span>Total: {summary?.totalReservations || 0}</span>
            </div>
          </div>
        </div>

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Over Time Area Chart */}
          <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-100 font-display">
                  Revenue Trend Over Time (₹)
                </h3>
                <p className="text-[11px] text-stone-400">Daily gross sales recorded from paid tickets</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {analytics?.revenueOverTime?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.revenueOverTime}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                    <XAxis dataKey="date" stroke="#78716c" fontSize={11} />
                    <YAxis stroke="#78716c" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '12px' }}
                      labelStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue (₹)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#revenueGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-stone-500">
                  No revenue data in range.
                </div>
              )}
            </div>
          </div>

          {/* Orders by Type Distribution */}
          <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-stone-100 font-display">
                Orders by Dining Type
              </h3>
              <p className="text-[11px] text-stone-400">Dine-in vs Online Takeaway & Curbside</p>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              {analytics?.ordersByType?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.ordersByType}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={4}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {analytics.ordersByType.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color || '#f59e0b'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-stone-500">No order distribution data.</div>
              )}
            </div>
          </div>

          {/* Top-Selling Dishes Bar Chart */}
          <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-stone-100 font-display">
                Top-Selling Gourmet Dishes
              </h3>
              <p className="text-[11px] text-stone-400">Ranked by quantities ordered</p>
            </div>

            <div className="h-64 w-full">
              {analytics?.topSellingDishes?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topSellingDishes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                    <XAxis type="number" stroke="#78716c" fontSize={11} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#78716c"
                      fontSize={10}
                      width={120}
                      tickFormatter={(v) => v.slice(0, 16) + '...'}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '12px' }}
                    />
                    <Bar dataKey="quantity" name="Units Sold" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-stone-500">
                  No dish sales recorded in period.
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-stone-100 font-display">
                Payment Method Revenue Share
              </h3>
              <p className="text-[11px] text-stone-400">UPI, Credit Card, Cash and Online</p>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              {analytics?.paymentDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.paymentDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {analytics.paymentDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color || '#3b82f6'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '12px' }}
                      formatter={(v) => `₹${v}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-stone-500">No payment data in period.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
