import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  User,
  Heart,
  Briefcase,
  Cake,
  GlassWater,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Reservation() {
  const { user } = useAuthStore();

  const todayStr = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(todayStr);
  const [partySize, setPartySize] = useState(2);
  const [timeSlot, setTimeSlot] = useState('');
  const [occasion, setOccasion] = useState('casual');
  const [specialRequests, setSpecialRequests] = useState('');

  // Guest details
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');

  // Availability state
  const [slotsData, setSlotsData] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch real-time available slots whenever date or partySize changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!date) return;
      setLoadingSlots(true);
      setErrorMessage('');
      try {
        const res = await api.get('/reservations/availability', {
          params: { date, partySize },
        });
        setSlotsData(res.data.slots || []);
        // Reset selected timeSlot if no longer available
        setTimeSlot('');
      } catch (err) {
        console.error('Availability check failed:', err);
        setErrorMessage('Failed to fetch table availability. Please choose another date.');
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchAvailability();
  }, [date, partySize]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!timeSlot) {
      alert('Please select an available dining time slot.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload = {
        customerName,
        customerPhone,
        customerEmail,
        date,
        timeSlot,
        partySize,
        specialRequests,
        occasion,
      };

      const res = await api.post('/reservations', payload);
      setConfirmedReservation(res.data.data);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to confirm table booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
            <Calendar className="w-3.5 h-3.5" />
            <span>Table Reservations</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-stone-100 tracking-tight">
            Reserve Your Culinary Table
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-2 font-light">
            Real-time table slot engine ensures guaranteed seating without waiting.
          </p>
        </div>

        {/* Confirmation Screen */}
        {confirmedReservation ? (
          <div className="bg-stone-900 border border-amber-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Booking Confirmed
              </span>
              <h2 className="text-2xl font-bold font-display text-stone-100">
                We Look Forward to Welcoming You, {confirmedReservation.customerName}!
              </h2>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                A confirmation has been recorded with our concierge. Your assigned table is reserved for 90 minutes.
              </p>
            </div>

            {/* Reference Badge */}
            <div className="inline-block p-4 bg-stone-950 rounded-2xl border border-stone-800">
              <p className="text-[11px] text-stone-500 uppercase tracking-wider">Booking Reference</p>
              <p className="text-2xl font-mono font-bold text-amber-400 tracking-widest mt-0.5">
                {confirmedReservation.bookingReference}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto text-xs bg-stone-950/60 p-4 rounded-xl border border-stone-800/80">
              <div>
                <p className="text-stone-500">Date</p>
                <p className="font-semibold text-stone-200 mt-0.5">{confirmedReservation.date}</p>
              </div>
              <div>
                <p className="text-stone-500">Time</p>
                <p className="font-semibold text-amber-400 mt-0.5">{confirmedReservation.timeSlot}</p>
              </div>
              <div>
                <p className="text-stone-500">Party Size</p>
                <p className="font-semibold text-stone-200 mt-0.5">{confirmedReservation.partySize} Guests</p>
              </div>
              <div>
                <p className="text-stone-500">Assigned Table</p>
                <p className="font-semibold text-emerald-400 mt-0.5">
                  {confirmedReservation.table?.tableNumber || 'Auto-Allocated'}
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => setConfirmedReservation(null)}
                className="px-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-xl text-xs transition"
              >
                Make Another Booking
              </button>
              <a
                href={`tel:+918049108899`}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs transition"
              >
                Call Concierge Desk
              </a>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form
            onSubmit={handleSubmit}
            className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 backdrop-blur-md"
          >
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 1: Party Size & Date */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-[11px] font-bold">1</span>
                <span>Party Size & Dining Date</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date Picker */}
                <div>
                  <label className="block text-xs text-stone-400 mb-1.5 font-medium">Select Date *</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                {/* Party Size Selector */}
                <div>
                  <label className="block text-xs text-stone-400 mb-1.5 font-medium">Number of Guests *</label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setPartySize(num)}
                        className={`w-9 h-10 rounded-xl text-xs font-semibold shrink-0 transition ${
                          partySize === num
                            ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                            : 'bg-stone-950 border border-stone-800 text-stone-300 hover:border-stone-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Available Time Slots */}
            <div className="space-y-4 pt-4 border-t border-stone-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-[11px] font-bold">2</span>
                  <span>Available Dining Slots for {partySize} Guests</span>
                </h3>
                {loadingSlots && <span className="text-xs text-amber-400 animate-pulse">Checking capacity...</span>}
              </div>

              {slotsData.length === 0 && !loadingSlots ? (
                <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-400 text-center">
                  Select a date and party size to see available slots.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {slotsData.map((slot) => {
                    const isSelected = timeSlot === slot.time;
                    return (
                      <button
                        type="button"
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setTimeSlot(slot.time)}
                        className={`p-2.5 rounded-xl text-xs font-medium border text-center transition ${
                          !slot.available
                            ? 'bg-stone-950/40 border-stone-900 text-stone-600 line-through cursor-not-allowed'
                            : isSelected
                            ? 'bg-amber-500 border-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                            : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-amber-500/50 hover:text-stone-100'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 mx-auto mb-1 opacity-70" />
                        <span>{slot.time}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Occasion & Special Requests */}
            <div className="space-y-4 pt-4 border-t border-stone-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-[11px] font-bold">3</span>
                <span>Dining Occasion & Atmosphere</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'casual', label: 'Casual Lunch / Dinner', icon: GlassWater },
                  { id: 'birthday', label: 'Birthday Party', icon: Cake },
                  { id: 'anniversary', label: 'Anniversary / Date', icon: Heart },
                  { id: 'business', label: 'Business Dining', icon: Briefcase },
                ].map((occ) => {
                  const Icon = occ.icon;
                  const isSelected = occasion === occ.id;
                  return (
                    <button
                      type="button"
                      key={occ.id}
                      onClick={() => setOccasion(occ.id)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-amber-200'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold">{occ.label}</span>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs text-stone-400 mb-1.5 font-medium">Special Requests & Dietary Notes</label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="E.g., Window terrace seating, high chair for infant, gluten allergies, birthday candle on dessert..."
                  rows={2}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Step 4: Guest Contact Details */}
            <div className="space-y-4 pt-4 border-t border-stone-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-[11px] font-bold">4</span>
                <span>Guest Contact Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-stone-400 mb-1 font-medium">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="E.g., Ananya Iyer"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1 font-medium">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1 font-medium">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="ananya@example.com"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={submitting || !timeSlot}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold rounded-2xl text-sm transition shadow-xl shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                'Securing Your Table...'
              ) : (
                <>
                  <span>Confirm Table Reservation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
