import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  Calendar,
  Clock,
  RotateCcw,
  XCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export default function CustomerDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'reservations'
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadUserData = async () => {
      try {
        setLoading(true);
        const [ordersRes, resvRes] = await Promise.all([
          api.get('/orders/my'),
          api.get('/reservations/my'),
        ]);
        setOrders(ordersRes.data.data);
        setReservations(resvRes.data.data);
      } catch (err) {
        console.error('Failed to load customer profile data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [isAuthenticated]);

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      await api.post(`/reservations/cancel/${reservationId}`, {
        reason: 'Cancelled by customer from profile dashboard',
      });
      setReservations((prev) =>
        prev.map((r) => (r._id === reservationId ? { ...r, status: 'cancelled' } : r))
      );
      alert('Reservation cancelled successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel reservation.');
    }
  };

  const handleReorder = (order) => {
    // Add all items from this order into current cart
    order.items?.forEach((item) => {
      addItem(
        {
          _id: item.menuItemId || item._id,
          name: item.name,
          price: item.unitPrice,
        },
        item.customizations || [],
        item.specialInstructions || '',
        item.quantity || 1
      );
    });
    alert('Items added to your active cart!');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Profile Header */}
        <div className="p-6 bg-stone-900 border border-stone-800 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-xl text-stone-950 shadow-lg shadow-amber-500/20">
              {user?.name?.slice(0, 2).toUpperCase() || 'GU'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display text-stone-100">{user?.name}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/menu"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs transition"
            >
              Order Takeaway
            </Link>
            <Link
              to="/reservations"
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-xl text-xs transition"
            >
              Book Table
            </Link>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>My Orders ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'reservations'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>My Reservations ({reservations.length})</span>
          </button>
        </div>

        {/* Content based on tab */}
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500 animate-pulse">
            Loading your dining records...
          </div>
        ) : activeTab === 'orders' ? (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="p-12 bg-stone-900/40 rounded-2xl border border-stone-800 text-center space-y-2">
                <ShoppingBag className="w-8 h-8 text-stone-600 mx-auto" />
                <h3 className="text-sm font-semibold text-stone-300">No past orders found</h3>
                <p className="text-xs text-stone-500">Treat yourself to our signature delicacies today.</p>
              </div>
            ) : (
              orders.map((o) => (
                <div
                  key={o._id}
                  className="p-5 bg-stone-900 border border-stone-800 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-xs">
                        {o.orderNumber}
                      </span>
                      <span className="text-xs text-stone-500">• {new Date(o.createdAt).toLocaleDateString()}</span>
                      <span className="capitalize text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-950 text-stone-300 border border-stone-800">
                        {o.orderType}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300">
                      {o.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>

                    <div className="flex items-center gap-3 text-xs pt-1">
                      <span className="font-bold text-amber-400 text-sm">₹{o.finalTotal}</span>
                      <span className="text-stone-500">|</span>
                      <span className="capitalize text-stone-400">Payment: <strong>{o.paymentStatus}</strong></span>
                      <span className="text-stone-500">|</span>
                      <span className="capitalize text-stone-400">Status: <strong>{o.orderStatus}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/orders/track/${o._id}`}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold transition"
                    >
                      Track Order
                    </Link>
                    <button
                      onClick={() => handleReorder(o)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg text-xs transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reorder</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.length === 0 ? (
              <div className="p-12 bg-stone-900/40 rounded-2xl border border-stone-800 text-center space-y-2">
                <Calendar className="w-8 h-8 text-stone-600 mx-auto" />
                <h3 className="text-sm font-semibold text-stone-300">No reservations found</h3>
                <p className="text-xs text-stone-500">Book an intimate terrace or private dining table in advance.</p>
              </div>
            ) : (
              reservations.map((r) => (
                <div
                  key={r._id}
                  className="p-5 bg-stone-900 border border-stone-800 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-xs">
                        {r.bookingReference}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border capitalize ${
                        r.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-stone-800 text-stone-400'
                      }`}>
                        {r.status}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-stone-200">
                      {r.date} at {r.timeSlot} • {r.partySize} Guests
                    </p>

                    <p className="text-xs text-stone-400">
                      Assigned Table: <strong className="text-amber-400">{r.table?.tableNumber || 'Pending Allocation'}</strong> ({r.table?.section || 'Dining'})
                    </p>
                  </div>

                  {r.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancelReservation(r._id)}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold transition"
                    >
                      Cancel Reservation
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
