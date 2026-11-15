import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  ShoppingBag,
  User,
  Users,
  Grid,
  ChefHat,
  Receipt,
  LayoutDashboard,
  Calendar,
  Compass,
  Menu as MenuIcon,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import RoleSwitcherModal from './RoleSwitcherModal';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { items, toggleCart, getCalculations } = useCartStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const { itemCount } = getCalculations();

  const isStaffOrAdmin = user && ['admin', 'manager', 'waiter', 'kitchen', 'cashier'].includes(user.role);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-stone-950/85 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              <UtensilsCrossed className="w-5 h-5 font-bold" />
            </div>
            <div>
              <span className="text-xl font-bold font-display tracking-tight text-stone-100 flex items-center gap-1">
                Dine<span className="text-amber-500">Desk</span>
              </span>
              <span className="text-[10px] text-stone-400 block -mt-1 tracking-wider uppercase font-semibold">
                Bistro & Operations
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-stone-300">
            <Link
              to="/menu"
              className={`px-3 py-1.5 rounded-lg transition ${
                isActive('/menu') ? 'bg-amber-500/10 text-amber-400 font-bold' : 'hover:text-stone-100 hover:bg-stone-900'
              }`}
            >
              Menu
            </Link>
            <Link
              to="/reservations"
              className={`px-3 py-1.5 rounded-lg transition ${
                isActive('/reservations') ? 'bg-amber-500/10 text-amber-400 font-bold' : 'hover:text-stone-100 hover:bg-stone-900'
              }`}
            >
              Book Table
            </Link>
            <Link
              to="/orders/track"
              className={`px-3 py-1.5 rounded-lg transition ${
                isActive('/orders/track') ? 'bg-amber-500/10 text-amber-400 font-bold' : 'hover:text-stone-100 hover:bg-stone-900'
              }`}
            >
              Track Order
            </Link>

            {/* Operational Quick Links (Separated by subtle divider) */}
            <div className="h-4 w-px bg-stone-800 mx-1" />

            <Link
              to="/staff/floor"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                isActive('/staff/floor') ? 'bg-amber-500/10 text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Floor
            </Link>
            <Link
              to="/staff/pos"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                isActive('/staff/pos') ? 'bg-amber-500/10 text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" /> POS
            </Link>
            <Link
              to="/kitchen/kds"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                isActive('/kitchen/kds') ? 'bg-amber-500/10 text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5 text-rose-400" /> KDS
            </Link>
            <Link
              to="/billing"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                isActive('/billing') ? 'bg-amber-500/10 text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" /> Billing
            </Link>
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                location.pathname.startsWith('/admin') ? 'bg-amber-500/10 text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Admin
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Quick Role Switcher Button */}
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-200 text-xs font-medium transition shadow-sm"
              title="Switch demo operational persona"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Role:</span>
              <span className="capitalize font-bold text-amber-400">{user?.role || 'Guest'}</span>
            </button>

            {/* Cart Trigger */}
            <button
              onClick={toggleCart}
              className="relative p-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-200 transition"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold text-[11px] flex items-center justify-center animate-bounce">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Profile / Auth */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-stone-900 transition border border-transparent hover:border-stone-800"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-800 text-stone-100 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    {user?.name?.slice(0, 2) || 'US'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden sm:block" />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-stone-900 border border-stone-800 shadow-2xl py-1.5 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-stone-800">
                      <p className="font-semibold text-stone-100 truncate">{user?.name}</p>
                      <p className="text-[11px] text-stone-400 truncate">{user?.email}</p>
                      <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 uppercase tracking-wider">
                        {user?.role}
                      </span>
                    </div>

                    <Link
                      to="/customer/dashboard"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="block px-3 py-2 text-stone-300 hover:bg-stone-800 hover:text-stone-100 transition"
                    >
                      My Orders & Bookings
                    </Link>

                    {isStaffOrAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="block px-3 py-2 text-stone-300 hover:bg-stone-800 hover:text-stone-100 transition"
                      >
                        Operations Control
                      </Link>
                    )}

                    <div className="border-t border-stone-800 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        setIsUserDropdownOpen(false);
                        navigate('/');
                      }}
                      className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs transition"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-900"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-800 bg-stone-950 px-4 py-4 space-y-2 text-sm font-medium">
            <Link
              to="/menu"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-stone-900 text-stone-200"
            >
              Browse Menu
            </Link>
            <Link
              to="/reservations"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-stone-900 text-stone-200"
            >
              Table Reservations
            </Link>
            <Link
              to="/orders/track"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-stone-900 text-stone-200"
            >
              Track Active Order
            </Link>

            <div className="pt-2 border-t border-stone-800 text-xs text-stone-500 uppercase tracking-wider font-semibold px-3">
              Operations
            </div>
            <Link
              to="/staff/floor"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-stone-900 text-stone-300"
            >
              Table Floor Management
            </Link>
            <Link
              to="/staff/pos"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-stone-900 text-stone-300"
            >
              Dine-In POS Ordering
            </Link>
            <Link
              to="/kitchen/kds"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-stone-900 text-rose-300"
            >
              Kitchen Display (KDS)
            </Link>
            <Link
              to="/billing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-stone-900 text-stone-300"
            >
              Billing & Checkout
            </Link>
            <Link
              to="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-stone-900 text-amber-400 font-bold"
            >
              Admin Dashboard & Analytics
            </Link>
          </div>
        )}
      </header>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />
    </>
  );
}
