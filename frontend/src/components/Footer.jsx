import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Phone, Mail, MapPin, Clock, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-950 border-t border-stone-800/80 text-stone-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-stone-950 font-bold">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold font-display text-stone-100 tracking-tight">
                Dine<span className="text-amber-500">Desk</span>
              </span>
            </div>
            <p className="text-stone-400 leading-relaxed">
              Artisan dining destination combining heritage recipes, seasonal ingredients, and intelligent real-time operations software.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-stone-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>GSTIN: 29AABCB1234F1Z8</span>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="space-y-3">
            <h4 className="font-semibold text-stone-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" /> Operating Hours
            </h4>
            <div className="space-y-1.5 leading-relaxed text-stone-400">
              <p className="flex justify-between">
                <span>Monday – Friday:</span>
                <span className="text-stone-200">11:30 AM – 11:30 PM</span>
              </p>
              <p className="flex justify-between">
                <span>Saturday – Sunday:</span>
                <span className="text-stone-200">11:00 AM – 12:30 AM</span>
              </p>
              <p className="flex justify-between text-amber-400/90 pt-1">
                <span>Kitchen Last Order:</span>
                <span>11:00 PM</span>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-stone-200 uppercase tracking-wider text-xs">Explore</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/menu" className="hover:text-amber-400 transition">Artisanal Menu</Link>
              </li>
              <li>
                <Link to="/reservations" className="hover:text-amber-400 transition">Table Reservations</Link>
              </li>
              <li>
                <Link to="/orders/track" className="hover:text-amber-400 transition">Live Order Tracking</Link>
              </li>
              <li>
                <Link to="/staff/floor" className="hover:text-amber-400 transition">Staff Floor Overview</Link>
              </li>
              <li>
                <Link to="/kitchen/kds" className="hover:text-amber-400 transition">Kitchen Display System (KDS)</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-amber-400 transition">Admin & Revenue Analytics</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div className="space-y-3">
            <h4 className="font-semibold text-stone-200 uppercase tracking-wider text-xs">Location & Concierge</h4>
            <div className="space-y-2 text-stone-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>42 Heritage Boulevard, 100 Ft Rd, Indiranagar, Bengaluru 560038</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span>+91 80 4910 8899 / +91 98450 11001</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <span>concierge@dinedesk.com</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-10 pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
          <p>© {new Date().getFullYear()} DineDesk Grand Bistro & SaaS. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with modern full-stack JavaScript, React, Tailwind & Socket.io
          </p>
        </div>
      </div>
    </footer>
  );
}
