import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  Volume2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
} from 'lucide-react';
import api from '../services/api';
import { getSocket, joinRoom, leaveRoom } from '../services/socket';

export default function KitchenKDS() {
  const [tickets, setTickets] = useState([]);
  const [filterStatus, setFilterStatus] = useState('active'); // 'active', 'new', 'preparing', 'ready', 'completed'
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Timer tick every 10 seconds to update elapsed counters
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'active') {
        params.status = filterStatus;
      }
      const res = await api.get('/kitchen/tickets', { params });
      setTickets(res.data.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch kitchen tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    const socket = getSocket();
    joinRoom('kitchen');

    const handleNewTicket = (newTicket) => {
      setTickets((prev) => {
        const exists = prev.some((t) => t._id === newTicket._id);
        if (exists) return prev;
        return [newTicket, ...prev];
      });
      // Try soft audio tone for new tickets if supported
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 tone
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch (e) {
        // Audio policy ignore
      }
    };

    const handleUpdatedTicket = (updatedTicket) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
      );
    };

    socket.on('kitchen:ticket:new', handleNewTicket);
    socket.on('kitchen:ticket:updated', handleUpdatedTicket);

    return () => {
      leaveRoom('kitchen');
      socket.off('kitchen:ticket:new', handleNewTicket);
      socket.off('kitchen:ticket:updated', handleUpdatedTicket);
    };
  }, [filterStatus]);

  // Update whole ticket status
  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      const res = await api.patch(`/kitchen/tickets/${ticketId}/status`, {
        status: newStatus,
      });
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? res.data.data : t))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update ticket status.');
    }
  };

  // Toggle single item status
  const handleToggleItemStatus = async (ticketId, itemIndex, currentStatus) => {
    let nextStatus = 'preparing';
    if (currentStatus === 'pending') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'pending';

    try {
      const res = await api.patch(`/kitchen/tickets/${ticketId}/items/${itemIndex}/status`, {
        status: nextStatus,
      });
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? res.data.data : t))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update item status.');
    }
  };

  // Compute elapsed time in minutes
  const getElapsedMins = (createdAt) => {
    const diff = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60));
    return Math.max(0, diff);
  };

  // Timer color classification: Green < 10m, Amber 10-20m, Red > 20m
  const getTimerColor = (mins) => {
    if (mins < 10) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (mins < 20) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse';
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Top KDS Control Bar */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-600 text-stone-100 shadow-md shadow-rose-600/20">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display text-stone-100">
                Kitchen Display System (KDS)
              </h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live Socket
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Live preparation tickets • Tap dishes to mark ready • Syncs with Captain POS
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {[
            { id: 'active', label: 'Active Pipeline' },
            { id: 'new', label: 'New Tickets' },
            { id: 'preparing', label: 'In Prep' },
            { id: 'ready', label: 'Ready to Serve' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterStatus === tab.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 font-bold'
                  : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={fetchTickets}
            className="p-2 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-300 transition"
            title="Refresh Tickets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ticket Grid View */}
      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-xs text-stone-500 animate-pulse">
            Loading kitchen tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-center p-8 bg-stone-900/40 rounded-3xl border border-dashed border-stone-800 space-y-3">
            <div className="w-16 h-16 rounded-full bg-stone-900 flex items-center justify-center text-stone-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-200 font-display">Kitchen Board Clear</h3>
            <p className="text-xs text-stone-500 max-w-sm">
              All orders have been prepared and served. Incoming dine-in and takeaway tickets will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {tickets.map((ticket) => {
              const elapsed = getElapsedMins(ticket.createdAt);
              const timerStyle = getTimerColor(elapsed);
              const isRush = ticket.priority === 'rush' || ticket.round > 1;

              return (
                <div
                  key={ticket._id}
                  className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition duration-200 ${
                    ticket.status === 'ready'
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : ticket.status === 'preparing'
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : ticket.status === 'completed'
                      ? 'bg-stone-900/40 border-stone-800 opacity-60'
                      : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {/* Ticket Header Card */}
                  <div className="p-4 border-b border-stone-800 bg-stone-950/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold font-mono text-stone-100">
                          {ticket.ticketNumber}
                        </span>
                        {isRush && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                            ⚡ RUSH (R-{ticket.round})
                          </span>
                        )}
                      </div>

                      {/* Elapsed Timer */}
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border flex items-center gap-1 ${timerStyle}`}>
                        <Clock className="w-3.5 h-3.5" /> {elapsed}m
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-stone-800/60">
                      <span className="font-bold text-amber-400">
                        {ticket.orderType === 'dine_in'
                          ? `Table ${ticket.tableNumber}`
                          : 'Takeaway / Pickup'}
                      </span>
                      <span className="text-stone-500 font-mono text-[11px]">{ticket.orderNumber}</span>
                    </div>

                    {ticket.notes && (
                      <p className="text-[11px] text-amber-300/90 italic bg-amber-500/10 p-1.5 rounded mt-2 border border-amber-500/20">
                        "{ticket.notes}"
                      </p>
                    )}
                  </div>

                  {/* Ticket Dish Items (Interactive Checkboxes) */}
                  <div className="p-4 flex-1 space-y-2.5 overflow-y-auto max-h-72">
                    {ticket.items.map((item, idx) => {
                      const isItemReady = item.status === 'ready';
                      const isItemPrep = item.status === 'preparing';

                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleItemStatus(ticket._id, idx, item.status)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer select-none transition flex items-start gap-2.5 ${
                            isItemReady
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-stone-400 line-through'
                              : isItemPrep
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-100'
                              : 'bg-stone-950/80 border-stone-800 text-stone-200 hover:border-stone-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center shrink-0 ${
                              isItemReady
                                ? 'bg-emerald-500 border-emerald-500 text-stone-950'
                                : isItemPrep
                                ? 'bg-amber-500 border-amber-500 text-stone-950'
                                : 'border-stone-600'
                            }`}
                          >
                            {isItemReady && <Check className="w-3 h-3 stroke-[3]" />}
                            {isItemPrep && <Flame className="w-2.5 h-2.5 text-stone-950" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between font-semibold">
                              <span className="truncate">{item.name}</span>
                              <span className="text-amber-400 shrink-0 font-bold ml-1">x{item.quantity}</span>
                            </div>

                            {item.customizations?.length > 0 && (
                              <p className="text-[10px] text-stone-400 mt-0.5">
                                {item.customizations.map((c) => c.optionName).join(', ')}
                              </p>
                            )}

                            {item.specialInstructions && (
                              <p className="text-[10px] text-rose-300 italic mt-0.5">
                                Note: {item.specialInstructions}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ticket Bottom Workflow Actions */}
                  <div className="p-3 border-t border-stone-800 bg-stone-950/90 space-y-2">
                    {ticket.status === 'new' && (
                      <button
                        onClick={() => handleUpdateTicketStatus(ticket._id, 'preparing')}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Accept & Start Prep</span>
                      </button>
                    )}

                    {ticket.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateTicketStatus(ticket._id, 'ready')}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Entire Ticket Ready</span>
                      </button>
                    )}

                    {ticket.status === 'ready' && (
                      <button
                        onClick={() => handleUpdateTicketStatus(ticket._id, 'completed')}
                        className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <span>Serve / Hand Off Ticket</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {ticket.status === 'completed' && (
                      <div className="text-center text-[11px] text-stone-500 font-medium py-1">
                        ✓ Dispatched & Completed
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
