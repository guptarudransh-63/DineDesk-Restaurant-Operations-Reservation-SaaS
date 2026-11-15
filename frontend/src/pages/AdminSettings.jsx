import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Building,
  Clock,
  Receipt,
  Calendar,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [restaurantName, setRestaurantName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Hours
  const [weekdayOpen, setWeekdayOpen] = useState('11:30');
  const [weekdayClose, setWeekdayClose] = useState('23:30');
  const [weekendOpen, setWeekendOpen] = useState('11:00');
  const [weekendClose, setWeekendClose] = useState('00:30');

  // Tax & Billing
  const [gstin, setGstin] = useState('29AABCB1234F1Z8');
  const [cgstRate, setCgstRate] = useState(2.5);
  const [sgstRate, setSgstRate] = useState(2.5);
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  const [reservationDurationMinutes, setReservationDurationMinutes] = useState(90);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/settings');
        const d = res.data.data;
        if (d) {
          setRestaurantName(d.name || '');
          setTagline(d.tagline || '');
          setDescription(d.description || '');
          setStreet(d.address?.street || '');
          setCity(d.address?.city || '');
          setState(d.address?.state || '');
          setPostalCode(d.address?.postalCode || '');
          setPhone(d.phone || '');
          setEmail(d.email || '');

          setWeekdayOpen(d.openingHours?.weekdayOpen || '11:30');
          setWeekdayClose(d.openingHours?.weekdayClose || '23:30');
          setWeekendOpen(d.openingHours?.weekendOpen || '11:00');
          setWeekendClose(d.openingHours?.weekendClose || '00:30');

          setGstin(d.taxSettings?.gstin || '29AABCB1234F1Z8');
          setCgstRate(d.taxSettings?.cgstRate ?? 2.5);
          setSgstRate(d.taxSettings?.sgstRate ?? 2.5);
          setIsTaxInclusive(!!d.taxSettings?.isTaxInclusive);
          setReservationDurationMinutes(d.reservationDurationMinutes || 90);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await api.patch('/admin/settings', {
        name: restaurantName,
        tagline,
        description,
        address: { street, city, state, postalCode, country: 'India' },
        phone,
        email,
        openingHours: { weekdayOpen, weekdayClose, weekendOpen, weekendClose },
        taxSettings: {
          gstin,
          cgstRate: Number(cgstRate),
          sgstRate: Number(sgstRate),
          isTaxInclusive,
        },
        reservationDurationMinutes: Number(reservationDurationMinutes),
      });

      setSuccessMsg('Settings updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              <h1 className="text-2xl font-bold font-display text-stone-100">
                Restaurant & Operational Settings
              </h1>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Configure business profile, GSTIN tax slabs, operating shifts, and table session rules
            </p>
          </div>

          {successMsg && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* Section 1: Business Identity */}
          <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-200 flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-500" />
              <span>Restaurant Identity & Location</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-400 mb-1 font-medium">Restaurant Brand Name</label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-medium">Tagline / Motto</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-400 mb-1 font-medium">Culinary Narrative</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-medium">Street Address</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-stone-400 mb-1 font-medium">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-medium">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-medium">Concierge Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-medium">Concierge Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200"
                />
              </div>
            </div>
          </div>

          {/* Section 2: GST & Tax Architecture */}
          <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-200 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-500" />
              <span>GSTIN & Tax Slabs (India)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-stone-400 mb-1 font-medium">GSTIN Number</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-medium">Central GST Rate (CGST %)</label>
                <input
                  type="number"
                  step="0.1"
                  value={cgstRate}
                  onChange={(e) => setCgstRate(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-medium">State GST Rate (SGST %)</label>
                <input
                  type="number"
                  step="0.1"
                  value={sgstRate}
                  onChange={(e) => setSgstRate(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 text-[11px] text-stone-400">
              Composite Restaurant GST: <strong className="text-amber-400">{(Number(cgstRate) + Number(sgstRate)).toFixed(1)}%</strong>
              (Calculated transparently on final taxable item totals across dine-in and takeaway).
            </div>
          </div>

          {/* Section 3: Operating Shifts & Table Allocation Rules */}
          <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Operating Shifts & Table Timing Rules</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-stone-400 mb-1 font-medium">Weekday Open</label>
                <input
                  type="time"
                  value={weekdayOpen}
                  onChange={(e) => setWeekdayOpen(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200"
                />
              </div>
              <div>
                <label className="block text-stone-400 mb-1 font-medium">Weekday Close</label>
                <input
                  type="time"
                  value={weekdayClose}
                  onChange={(e) => setWeekdayClose(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200"
                />
              </div>
              <div>
                <label className="block text-stone-400 mb-1 font-medium">Weekend Open</label>
                <input
                  type="time"
                  value={weekendOpen}
                  onChange={(e) => setWeekendOpen(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200"
                />
              </div>
              <div>
                <label className="block text-stone-400 mb-1 font-medium">Weekend Close</label>
                <input
                  type="time"
                  value={weekendClose}
                  onChange={(e) => setWeekendClose(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-stone-400 mb-1 font-medium">
                Standard Reservation Duration (minutes)
              </label>
              <input
                type="number"
                value={reservationDurationMinutes}
                onChange={(e) => setReservationDurationMinutes(e.target.value)}
                className="w-48 bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Used by the table availability engine to compute overlapping slot buffers.
              </p>
            </div>
          </div>

          {/* Save Action */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving System Changes...' : 'Save Restaurant Configuration'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
