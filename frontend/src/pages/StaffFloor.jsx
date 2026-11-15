import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Users,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  UtensilsCrossed,
  Receipt,
  RotateCcw,
  Plus,
  RefreshCw,
  X,
  Filter,
} from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';

export default function StaffFloor() {
  const navigate = useNavigate();

  const [tables, setTables] = useState([]);
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  // Seating Modal
  const [seatingTable, setSeatingTable] = useState(null);
  const [guestCount, setGuestCount] = useState(2);
  const [customerName, setCustomerName] = useState('Walk-in Guest');
  const [seatingNotes, setSeatingNotes] = useState('');
  const [submittingSeat, setSubmittingSeat] = useState(false);

  // Close Session Confirmation Modal
  const [closingTable, setClosingTable] = useState(null);
  const [closeError, setCloseError] = useState('');
  const [forceOverride, setForceOverride] = useState(false);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tables');
      setTables(res.data.data);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();

    // Socket.io real-time listener for table changes
    const socket = getSocket();
    const handleTableUpdated = (updatedTable) => {
      setTables((prev) =>
        prev.map((t) => (t._id === updatedTable._id ? updatedTable : t))
      );
    };

    socket.on('table:status:updated', handleTableUpdated);

    return () => {
      socket.off('table:status:updated', handleTableUpdated);
    };
  }, []);

  const sections = ['All', 'Main Dining', 'Terrace', 'Private Dining', 'Bar Lounge'];
  const statuses = ['All', 'available', 'reserved', 'occupied', 'cleaning', 'out_of_service'];

  const filteredTables = tables.filter((t) => {
    const matchSec = selectedSection === 'All' || t.section === selectedSection;
    const matchStat = selectedStatus === 'All' || t.status === selectedStatus;
    return matchSec && matchStat;
  });

  // Calculate elapsed time from session start
  const getElapsedMinutes = (startTime) => {
    if (!startTime) return 0;
    const diff = Math.floor((new Date() - new Date(startTime)) / (1000 * 60));
    return Math.max(0, diff);
  };

  // Seat guests action
  const handleConfirmSeat = async (e) => {
    e.preventDefault();
    if (!seatingTable) return;
    setSubmittingSeat(true);
    try {
      await api.post(`/tables/${seatingTable._id}/seat`, {
        guestCount,
        customerName,
        notes: seatingNotes,
      });
      setSeatingTable(null);
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to seat guests.');
    } finally {
      setSubmittingSeat(false);
    }
  };

  // Close session action
  const handleCloseSession = async (table, override = false) => {
    try {
      setCloseError('');
      await api.post(`/tables/${table._id}/close-session`, {
        forceOverride: override,
      });
      setClosingTable(null);
      fetchTables();
    } catch (err) {
      setCloseError(err.response?.data?.message || 'Cannot close table session.');
      setForceOverride(true);
    }
  };

  // Mark table cleaned
  const handleMarkCleaned = async (table) => {
    try {
      await api.post(`/tables/${table._id}/mark-cleaned`);
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update table.');
    }
  };

  // Status badge config
  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return { label: 'Available', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'reserved':
        return { label: 'Reserved', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'occupied':
        return { label: 'Occupied', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'cleaning':
        return { label: 'Cleaning', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      default:
        return { label: 'Out of Service', bg: 'bg-stone-800 text-stone-500 border-stone-700' };
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Operational Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5 text-amber-500" />
              <h1 className="text-2xl font-bold font-display text-stone-100">
                Floor Plan & Table Sessions
              </h1>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Real-time table status lifecycle: Available → Seated → Occupied → Bill Requested → Settle → Cleaning
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/staff/pos')}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold rounded-xl text-xs transition shadow-md shadow-amber-500/10"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Dine-In POS Ordering</span>
            </button>
            <button
              onClick={fetchTables}
              className="p-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-300 transition"
              title="Refresh Floor"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Floor Metrics Ticker */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total Tables', count: tables.length, color: 'text-stone-100' },
            { label: 'Available Now', count: tables.filter((t) => t.status === 'available').length, color: 'text-emerald-400' },
            { label: 'Occupied Tables', count: tables.filter((t) => t.status === 'occupied').length, color: 'text-amber-400' },
            { label: 'Reserved', count: tables.filter((t) => t.status === 'reserved').length, color: 'text-blue-400' },
            { label: 'Needs Cleaning', count: tables.filter((t) => t.status === 'cleaning').length, color: 'text-purple-400' },
          ].map((m, i) => (
            <div key={i} className="p-3 bg-stone-900 border border-stone-800 rounded-xl text-center">
              <p className="text-[11px] text-stone-500 uppercase tracking-wider">{m.label}</p>
              <p className={`text-xl font-bold font-display mt-0.5 ${m.color}`}>{m.count}</p>
            </div>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="p-3 bg-stone-900/60 border border-stone-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Section Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-stone-500 font-semibold mr-1">Section:</span>
            {sections.map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                  selectedSection === sec
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          {/* Status Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-stone-500 font-semibold mr-1">Status:</span>
            {statuses.map((stat) => (
              <button
                key={stat}
                onClick={() => setSelectedStatus(stat)}
                className={`px-2.5 py-1 rounded-lg capitalize transition shrink-0 ${
                  selectedStatus === stat
                    ? 'bg-stone-100 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {stat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const badge = getStatusBadge(table.status);
            const isOccupied = table.status === 'occupied';
            const isAvailable = table.status === 'available';
            const isReserved = table.status === 'reserved';
            const isCleaning = table.status === 'cleaning';

            const session = table.activeSession;
            const order = table.activeOrder || session?.activeOrders?.[0];
            const elapsed = session ? getElapsedMinutes(session.startTime) : 0;

            return (
              <div
                key={table._id}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition duration-200 shadow-md ${
                  isOccupied
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : isAvailable
                    ? 'bg-stone-900 border-stone-800 hover:border-emerald-500/40'
                    : isReserved
                    ? 'bg-blue-950/20 border-blue-500/40'
                    : isCleaning
                    ? 'bg-purple-950/20 border-purple-500/40'
                    : 'bg-stone-900/50 border-stone-800 opacity-60'
                }`}
              >
                {/* Top Table Card Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-bold font-display text-stone-100">
                      {table.tableNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-400 pb-3 border-b border-stone-800/80">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Max {table.capacity} Guests
                    </span>
                    <span className="text-[11px] bg-stone-950 px-2 py-0.5 rounded border border-stone-800 font-medium">
                      {table.section}
                    </span>
                  </div>

                  {/* Active Session Info if Occupied */}
                  {isOccupied && session && (
                    <div className="py-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">Guest:</span>
                        <strong className="text-stone-200">{session.customerName || 'Dine-In Guest'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">Seating Duration:</span>
                        <span className="font-mono text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {elapsed} mins
                        </span>
                      </div>
                      {order && (
                        <div className="flex items-center justify-between pt-1 border-t border-stone-800/50">
                          <span className="text-stone-400">Live Bill Total:</span>
                          <span className="font-bold text-amber-400 text-sm">₹{order.finalTotal || 0}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reserved info */}
                  {isReserved && (
                    <div className="py-3 text-xs text-stone-400 space-y-1">
                      <p className="text-blue-300 font-semibold">Reserved for Guest</p>
                      <p className="text-[11px]">Arrival expected this evening</p>
                    </div>
                  )}

                  {/* Cleaning state */}
                  {isCleaning && (
                    <div className="py-3 text-xs text-purple-300 space-y-1">
                      <p className="font-semibold">Sanitizing & Table Reset</p>
                      <p className="text-[11px] text-stone-400">Ready for next guests once wiped</p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions based on status */}
                <div className="pt-3 border-t border-stone-800/80 space-y-2">
                  {isAvailable && (
                    <button
                      onClick={() => {
                        setSeatingTable(table);
                        setGuestCount(table.capacity);
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Seat Walk-in Guests</span>
                    </button>
                  )}

                  {isReserved && (
                    <button
                      onClick={() => {
                        setSeatingTable(table);
                        setGuestCount(table.capacity);
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-stone-100 font-bold rounded-xl text-xs transition"
                    >
                      Seat Arrived Guests
                    </button>
                  )}

                  {isOccupied && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => navigate(`/staff/pos?tableId=${table._id}`)}
                        className="py-1.5 px-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1"
                      >
                        <UtensilsCrossed className="w-3 h-3 text-amber-400" />
                        <span>Order POS</span>
                      </button>
                      <button
                        onClick={() => setClosingTable(table)}
                        className="py-1.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Close Bill</span>
                      </button>
                    </div>
                  )}

                  {isCleaning && (
                    <button
                      onClick={() => handleMarkCleaned(table)}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-stone-100 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Table Cleaned</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Seat Guests Modal */}
        {seatingTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div>
                  <h3 className="text-base font-bold text-stone-100">
                    Seat Guests at Table {seatingTable.tableNumber}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {seatingTable.section} • Capacity: {seatingTable.capacity} guests
                  </p>
                </div>
                <button
                  onClick={() => setSeatingTable(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmSeat} className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Guest Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Guest / Party Name"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Guest Count</label>
                  <input
                    type="number"
                    min={1}
                    max={seatingTable.capacity + 2}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Host / Captain Notes</label>
                  <textarea
                    value={seatingNotes}
                    onChange={(e) => setSeatingNotes(e.target.value)}
                    placeholder="E.g., Window view requested, celebration lunch..."
                    rows={2}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSeatingTable(null)}
                    className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSeat}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs transition disabled:opacity-50"
                  >
                    {submittingSeat ? 'Seating...' : 'Open Table Session'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Close Session Confirmation Modal */}
        {closingTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <h3 className="text-base font-bold text-stone-100">
                  Close Session for Table {closingTable.tableNumber}
                </h3>
                <button
                  onClick={() => {
                    setClosingTable(null);
                    setCloseError('');
                    setForceOverride(false);
                  }}
                  className="p-1.5 text-stone-400 hover:text-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {closeError ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 space-y-2">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Unpaid Balance Detected</span>
                  </p>
                  <p className="text-[11px] leading-relaxed">{closeError}</p>
                  <p className="text-[11px] text-stone-400">
                    Go to <strong>Billing & Checkout</strong> to settle payment, or proceed with Manager override.
                  </p>
                </div>
              ) : (
                <p className="text-stone-300">
                  Closing this table session will mark the table for cleaning and archive active dining orders. Are you sure?
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setClosingTable(null);
                    setCloseError('');
                    setForceOverride(false);
                  }}
                  className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                {forceOverride ? (
                  <button
                    type="button"
                    onClick={() => handleCloseSession(closingTable, true)}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-stone-100 font-bold rounded-xl transition"
                  >
                    Manager Override & Close
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCloseSession(closingTable, false)}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl transition"
                  >
                    Confirm & Close Table
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
