import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  ShoppingBag,
  Search,
  AlertCircle,
  UtensilsCrossed,
  ArrowRight,
  ShieldCheck,
  Phone,
} from 'lucide-react';
import api from '../services/api';
import { getSocket, joinRoom, leaveRoom } from '../services/socket';

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [orderQuery, setOrderQuery] = useState(id || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = async (queryId) => {
    if (!queryId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/orders/track/${queryId}`);
      setOrder(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Order not found. Please check your order number.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setOrderQuery(id);
      fetchOrder(id);
    }
  }, [id]);

  // Connect to live Socket.io room for this order
  useEffect(() => {
    if (!order?._id) return;

    const socket = getSocket();
    const room = `order:${order._id}`;
    joinRoom(room);

    const handleOrderUpdate = (data) => {
      if (data.order && (data.order._id === order._id || data.order.orderNumber === order.orderNumber)) {
        setOrder(data.order);
      } else if (data.orderStatus) {
        setOrder((prev) => (prev ? { ...prev, orderStatus: data.orderStatus } : prev));
      }
    };

    socket.on('order:updated', handleOrderUpdate);
    socket.on(room, handleOrderUpdate);

    return () => {
      leaveRoom(room);
      socket.off('order:updated', handleOrderUpdate);
      socket.off(room, handleOrderUpdate);
    };
  }, [order?._id]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (orderQuery) {
      navigate(`/orders/track/${orderQuery.trim()}`);
      fetchOrder(orderQuery.trim());
    }
  };

  // Status mapping and steps
  const statusSteps = [
    { key: 'placed', label: 'Order Placed', desc: 'Received & routed to kitchen queue' },
    { key: 'accepted', label: 'Accepted by Kitchen', desc: 'Assigned to executive station' },
    { key: 'preparing', label: 'Preparing Fresh', desc: 'Sautéing, braising and assembling' },
    { key: 'ready', label: 'Ready for Service', desc: 'Plated, garnished & packaged' },
    { key: 'completed', label: 'Completed', desc: 'Served at table / picked up' },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'placed': return 0;
      case 'accepted': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'completed': return 4;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const currentStep = order ? getStepIndex(order.orderStatus) : 0;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header & Search */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>Live Kitchen Tracking</span>
          </div>
          <h1 className="text-3xl font-bold font-display text-stone-100">
            Track Your Dining Order
          </h1>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Real-time updates directly from our kitchen display terminals.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto pt-2">
            <input
              type="text"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value.toUpperCase())}
              placeholder="Enter Order # (e.g., ORD-2026-0001)"
              className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 uppercase placeholder-stone-600 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs transition"
            >
              Track
            </button>
          </form>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="p-12 text-center text-stone-400 text-xs animate-pulse">
            Fetching real-time kitchen status...
          </div>
        )}

        {order && !loading && (
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 animate-in fade-in">
            {/* Top Order Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-800 gap-4">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {order.orderNumber}
                </span>
                <h2 className="text-xl font-bold text-stone-100 font-display mt-0.5">
                  {order.orderType === 'dine_in'
                    ? `Dine-In Table ${order.tableNumber || ''}`
                    : 'Takeaway Pickup'}
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Guest: <strong className="text-stone-200">{order.customerName}</strong> • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="flex flex-col sm:items-end">
                <span className="text-[11px] text-stone-500">Live Status:</span>
                <span
                  className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    order.orderStatus === 'ready'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                      : order.orderStatus === 'preparing'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-stone-800 text-stone-300 border border-stone-700'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  {order.orderStatus}
                </span>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="py-4">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
                {statusSteps.map((step, idx) => {
                  const isDone = currentStep >= idx;
                  const isCurrent = currentStep === idx;
                  return (
                    <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isDone
                            ? 'bg-amber-500 text-stone-950 ring-4 ring-amber-500/20 shadow-lg'
                            : 'bg-stone-800 text-stone-500 border border-stone-700'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>
                      <p
                        className={`text-xs font-semibold mt-2 ${
                          isCurrent
                            ? 'text-amber-400 font-bold'
                            : isDone
                            ? 'text-stone-200'
                            : 'text-stone-500'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[10px] text-stone-500 mt-0.5 leading-tight hidden sm:block">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items summary */}
            <div className="space-y-3 pt-4 border-t border-stone-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Ordered Dishes & Preparation Snapshot
              </h3>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-stone-200">
                        {item.quantity}x {item.name}
                      </span>
                      {item.customizations?.length > 0 && (
                        <p className="text-[10px] text-stone-400">
                          {item.customizations.map((c) => c.optionName).join(', ')}
                        </p>
                      )}
                      {item.specialInstructions && (
                        <p className="text-[10px] text-amber-500/90 italic">
                          "{item.specialInstructions}"
                        </p>
                      )}
                    </div>
                    <span className="font-semibold text-amber-400">₹{item.itemTotal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary details */}
            <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-1.5 text-xs text-stone-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span>-₹{order.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST (CGST + SGST)</span>
                <span>₹{order.taxAmount}</span>
              </div>
              <div className="pt-2 border-t border-stone-800 flex justify-between font-bold text-sm text-stone-100">
                <span>Total Amount</span>
                <span className="text-amber-400">₹{order.finalTotal}</span>
              </div>
              <div className="pt-1 flex justify-between text-[11px] text-stone-500">
                <span>Payment Status</span>
                <span className="capitalize font-semibold text-stone-300">{order.paymentStatus}</span>
              </div>
            </div>

            {/* Help footer */}
            <div className="text-center pt-2 text-[11px] text-stone-500 flex items-center justify-center gap-2">
              <Phone className="w-3.5 h-3.5 text-amber-500" />
              <span>Questions about your order? Call kitchen desk at <strong>+91 80 4910 8899</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
