import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Shield, UserCheck, UtensilsCrossed, ChefHat, Receipt, User, CheckCircle2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RoleSwitcherModal({ isOpen, onClose }) {
  const { user, demoLogin, isLoading } = useAuthStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const roles = [
    {
      role: 'admin',
      name: 'Rajesh Sharma',
      title: 'Administrator',
      email: 'admin@dinedesk.com',
      icon: Shield,
      color: 'from-amber-600 to-amber-800 text-amber-200 border-amber-500/30',
      destination: '/admin',
      desc: 'Full access: Analytics, Menu CRUD, Tables, Staff, Settings & System Logs',
    },
    {
      role: 'manager',
      name: 'Priya Mehta',
      title: 'Restaurant Manager',
      email: 'manager@dinedesk.com',
      icon: UserCheck,
      color: 'from-blue-600 to-indigo-800 text-blue-200 border-blue-500/30',
      destination: '/staff/floor',
      desc: 'Floor operations, Table assignments, Reservations & Menu availability',
    },
    {
      role: 'waiter',
      name: 'Rohan Verma',
      title: 'Captain / Waiter',
      email: 'waiter@dinedesk.com',
      icon: UtensilsCrossed,
      color: 'from-emerald-600 to-teal-800 text-emerald-200 border-emerald-500/30',
      destination: '/staff/pos',
      desc: 'Table seating, Dine-in POS order taking, Round 2 additions & Bill request',
    },
    {
      role: 'kitchen',
      name: 'Chef Sanjeev',
      title: 'Head Kitchen Chef',
      email: 'chef@dinedesk.com',
      icon: ChefHat,
      color: 'from-rose-600 to-red-800 text-rose-200 border-rose-500/30',
      destination: '/kitchen/kds',
      desc: 'Real-time Kitchen Display System (KDS), Ticket prep status & item ready marks',
    },
    {
      role: 'cashier',
      name: 'Aakash Kapoor',
      title: 'Billing Cashier',
      email: 'cashier@dinedesk.com',
      icon: Receipt,
      color: 'from-purple-600 to-violet-800 text-purple-200 border-purple-500/30',
      destination: '/billing',
      desc: 'Bill settlement, Split bills, Discount codes, GST tax invoices & table closing',
    },
    {
      role: 'customer',
      name: 'Ananya Iyer',
      title: 'Guest / Customer',
      email: 'customer@dinedesk.com',
      icon: User,
      color: 'from-stone-600 to-stone-800 text-stone-200 border-stone-500/30',
      destination: '/menu',
      desc: 'Explore menu, online takeaway ordering, table booking & live order tracking',
    },
  ];

  const handleSwitch = async (roleObj) => {
    const res = await demoLogin(roleObj.role);
    if (res.success) {
      onClose();
      navigate(roleObj.destination);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-800 bg-stone-900/60">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1">
              One-Click Role Switcher
            </div>
            <h2 className="text-xl font-bold text-stone-100">Switch Operational Persona</h2>
            <p className="text-xs text-stone-400">Experience DineDesk from each specialized stakeholder view</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles Grid */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          {roles.map((r) => {
            const Icon = r.icon;
            const isCurrent = user?.role === r.role;
            return (
              <button
                key={r.role}
                onClick={() => handleSwitch(r)}
                disabled={isLoading}
                className={`relative flex flex-col p-4 rounded-xl border text-left transition duration-150 ${
                  isCurrent
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                    : 'border-stone-800 bg-stone-900/40 hover:bg-stone-800/80 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${r.color} border shadow-sm`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-100 text-sm">{r.name}</h3>
                      <p className="text-xs text-amber-400/90 font-medium">{r.title}</p>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 leading-relaxed mt-1">{r.desc}</p>
                <div className="mt-3 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500">
                  <span>{r.email}</span>
                  <span className="text-amber-500/90 font-medium">Jump to view →</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/50 flex items-center justify-between text-xs text-stone-400">
          <span>All demo accounts share password: <code className="text-amber-400 bg-stone-800 px-1.5 py-0.5 rounded">password123</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
