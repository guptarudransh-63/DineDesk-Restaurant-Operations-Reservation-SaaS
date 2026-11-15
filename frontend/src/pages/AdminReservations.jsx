import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Users,
  RefreshCw,
  Phone,
  Mail,
  UserCheck,
} from 'lucide-react';
import api from '../services/api';

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reservations', {
        params: {
          status: statusFilter || undefined,
          date: dateFilter || undefined,
          search: searchQuery || undefined,
        },
      });
      setReservations(res.data.data);
    } catch (err) {
      console.error('Failed to load reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter, dateFilter]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/reservations/${id}/status`, { status: newStatus });
      setReservations((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update reservation status.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'seated':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30 font-bold';
      case 'completed':
        return 'bg-stone-800 text-stone-300 border-stone-700';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30 line-through';
      case 'no_show':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      default:
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              <h1 className="text-2xl font-bold font-display text-stone-100">
                Table Reservations Management
              </h1>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Guest booking directory, arrival statuses, table assignments, and cancellations
            </p>
          </div>

          <button
            onClick={fetchReservations}
            className="p-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-300 transition self-start sm:self-auto"
            title="Refresh Bookings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-3.5 bg-stone-900/60 border border-stone-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchReservations()}
              placeholder="Search reference (RES-...), guest name, phone..."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-stone-950 border border-stone-800 text-stone-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-stone-400 hover:text-stone-200 text-[11px]"
              >
                Clear Date
              </button>
            )}
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {['', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition ${
                  statusFilter === st
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {st || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Reservations Table */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-950 text-stone-400 border-b border-stone-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Reference & Guest</th>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Party</th>
                <th className="p-3.5">Table</th>
                <th className="p-3.5">Occasion / Notes</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-500">
                    No reservations found matching filters.
                  </td>
                </tr>
              ) : (
                reservations.map((r) => (
                  <tr key={r._id} className="hover:bg-stone-800/40 transition">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-amber-400 block text-xs">
                        {r.bookingReference}
                      </span>
                      <p className="font-semibold text-stone-200 text-sm mt-0.5">{r.customerName}</p>
                      <p className="text-[11px] text-stone-500">{r.customerPhone}</p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-medium text-stone-200">{r.date}</p>
                      <p className="text-amber-400 font-bold">{r.timeSlot}</p>
                    </td>

                    <td className="p-3.5 text-stone-300 font-semibold">
                      {r.partySize} Guests
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-emerald-400">
                        {r.table?.tableNumber || 'Pending Table'}
                      </span>
                      <span className="text-[10px] text-stone-500 block">{r.table?.section}</span>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <span className="capitalize font-semibold text-stone-300 block">{r.occasion}</span>
                      {r.specialRequests && (
                        <p className="text-[11px] text-stone-400 italic truncate">{r.specialRequests}</p>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getStatusBadge(r.status)}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {r.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusUpdate(r._id, 'seated')}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold rounded-lg text-[11px] transition"
                        >
                          Mark Seated
                        </button>
                      )}
                      {r.status === 'seated' && (
                        <button
                          onClick={() => handleStatusUpdate(r._id, 'completed')}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold rounded-lg text-[11px] transition"
                        >
                          Complete
                        </button>
                      )}
                      {['confirmed', 'pending'].includes(r.status) && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(r._id, 'no_show')}
                            className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded-lg text-[11px] transition"
                          >
                            No-Show
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(r._id, 'cancelled')}
                            className="px-2 py-1 bg-stone-800 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[11px] transition"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
