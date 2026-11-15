import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  UtensilsCrossed,
  Shield,
  UserCheck,
  ChefHat,
  Receipt,
  User,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const { login, demoLogin, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleFormLogin = async (e) => {
    e.preventDefault();
    const res = await login(email, password);
    if (res.success) {
      if (res.user.role === 'kitchen') navigate('/kitchen/kds');
      else if (res.user.role === 'cashier') navigate('/billing');
      else if (res.user.role === 'waiter' || res.user.role === 'manager') navigate('/staff/floor');
      else if (res.user.role === 'admin') navigate('/admin');
      else navigate(from);
    }
  };

  const handleQuickDemo = async (role, destination) => {
    const res = await demoLogin(role);
    if (res.success) {
      navigate(destination);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-bold shadow-lg shadow-amber-500/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold font-display tracking-tight text-stone-100">
              Dine<span className="text-amber-500">Desk</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold font-display text-stone-100">
            Sign In to DineDesk
          </h2>
          <p className="text-xs text-stone-400">
            Access operations terminals, order tracking, and table reservations
          </p>
        </div>

        {/* Demo Fast Login Buttons Card */}
        <div className="p-4 bg-stone-900 border border-amber-500/30 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Sparkles className="w-3.5 h-3.5" /> 1-Click Demo Login
            </span>
            <span className="text-[11px] text-stone-500">Instant Role Switch</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              { role: 'admin', label: 'Admin', icon: Shield, path: '/admin', color: 'text-amber-400' },
              { role: 'manager', label: 'Manager', icon: UserCheck, path: '/staff/floor', color: 'text-blue-400' },
              { role: 'waiter', label: 'Waiter/POS', icon: UtensilsCrossed, path: '/staff/pos', color: 'text-emerald-400' },
              { role: 'kitchen', label: 'Chef KDS', icon: ChefHat, path: '/kitchen/kds', color: 'text-rose-400' },
              { role: 'cashier', label: 'Cashier', icon: Receipt, path: '/billing', color: 'text-purple-400' },
              { role: 'customer', label: 'Customer', icon: User, path: '/menu', color: 'text-stone-300' },
            ].map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.role}
                  type="button"
                  onClick={() => handleQuickDemo(btn.role, btn.path)}
                  className="p-2 bg-stone-950 border border-stone-800 hover:border-amber-500/50 rounded-xl flex items-center gap-2 transition text-left"
                >
                  <Icon className={`w-3.5 h-3.5 ${btn.color} shrink-0`} />
                  <span className="text-[11px] font-semibold text-stone-200">{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Standard Email/Password Login Form */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleFormLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-stone-400 mb-1 font-medium">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-stone-400 mb-1 font-medium">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-stone-800/80 text-xs text-stone-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-amber-400 hover:underline font-semibold">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
