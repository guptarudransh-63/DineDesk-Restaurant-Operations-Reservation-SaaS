import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
  Award,
  ChevronRight,
  Star,
  MapPin,
  Flame,
} from 'lucide-react';
import api from '../services/api';
import ItemCustomizationModal from '../components/ItemCustomizationModal';

export default function Home() {
  const [featuredDishes, setFeaturedDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [menuRes, catRes] = await Promise.all([
          api.get('/menu?chefSpecial=true'),
          api.get('/menu/categories'),
        ]);
        setFeaturedDishes(menuRes.data.data.slice(0, 6));
        setCategories(catRes.data.data);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* 1. Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background culinary imagery with multi-layer vignettes */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=85"
            alt="DineDesk Grand Bistro Ambience"
            className="w-full h-full object-cover scale-105 filter brightness-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-black/70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0,transparent_70%)]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-6 shadow-inner animate-in fade-in duration-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Award-Winning Artisan Dining & Cloud Kitchen Operations</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold font-display tracking-tight text-stone-100 leading-[1.1] mb-6">
            Where Heritage Recipes <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
              Meet Modern Culinary Art
            </span>
          </h1>

          <p className="text-base sm:text-lg text-stone-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Indulge in 36-hour slow-braised delicacies, wood-fired sourdough pizzas, and botanical cocktails in an enchanting ambient setting.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              to="/reservations"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-sm transition shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Reserve a Table</span>
            </Link>

            <Link
              to="/menu"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700/80 text-stone-100 font-semibold text-sm transition backdrop-blur-sm flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Order Takeaway</span>
            </Link>
          </div>

          {/* Quick Metrics ticker */}
          <div className="mt-14 pt-8 border-t border-stone-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-amber-400 font-display">4.9 ★</p>
              <p className="text-xs text-stone-400">1,200+ Epicurean Reviews</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-100 font-display">35+</p>
              <p className="text-xs text-stone-400">Handcrafted Gourmet Dishes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400 font-display">~15m</p>
              <p className="text-xs text-stone-400">Average Preparation Time</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-100 font-display">100%</p>
              <p className="text-xs text-stone-400">Real-Time Kitchen Sync</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Philosophy & Introduction */}
      <section className="py-20 bg-stone-900/50 border-y border-stone-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-stone-800 text-amber-400 border border-stone-700">
                <Award className="w-3.5 h-3.5" /> Culinary Craftsmanship
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-stone-100 leading-tight">
                Authentic Flavours, Honest Ingredients & Operational Precision
              </h2>
              <p className="text-sm text-stone-300 leading-relaxed font-light">
                At DineDesk Grand Bistro, gastronomy is elevated to an experience. From single-origin spices harvested from the Malabar coast to wild Himalayan morels and 48-hour fermented Neapolitan doughs, each plate tells a story of passion and heritage.
              </p>
              <p className="text-sm text-stone-400 leading-relaxed font-light">
                Behind the scenes, our restaurant operations run on state-of-the-art kitchen display systems, precision table allocation algorithms, and instant billing—ensuring every guest enjoys seamless, timely hospitality.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">Open 7 Days</h4>
                    <p className="text-[11px] text-stone-400">11:30 AM to Midnight</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">Certified Organic</h4>
                    <p className="text-[11px] text-stone-400">Locally Sourced Produce</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Collage Images */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"
                  alt="Braised Lamb"
                  className="rounded-2xl object-cover h-64 w-full border border-stone-800 shadow-xl"
                />
                <img
                  src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80"
                  alt="Belgian Chocolate Dome"
                  className="rounded-2xl object-cover h-44 w-full border border-stone-800 shadow-xl"
                />
              </div>
              <div className="space-y-4 pt-8">
                <img
                  src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"
                  alt="Wood Fired Pizza"
                  className="rounded-2xl object-cover h-44 w-full border border-stone-800 shadow-xl"
                />
                <img
                  src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
                  alt="Awadhi Biryani"
                  className="rounded-2xl object-cover h-64 w-full border border-stone-800 shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Chef's Tasting Specials Carousel */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Curated Seasonal Selection
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-stone-100">
              Chef Sanjeev's Tasting Signatures
            </h2>
          </div>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
          >
            <span>Explore All 35+ Menu Items</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dish Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredDishes.map((dish) => (
            <div
              key={dish._id}
              className="group bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden hover:border-stone-700 transition duration-300 flex flex-col shadow-lg"
            >
              {/* Dish Photo */}
              <div className="relative h-52 overflow-hidden bg-stone-950">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 brightness-95"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-black/30" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span
                    className={`inline-block w-3 h-3 rounded-full border ${
                      dish.dietary === 'veg'
                        ? 'border-emerald-500 bg-emerald-500/40'
                        : dish.dietary === 'vegan'
                        ? 'border-teal-500 bg-teal-500/40'
                        : 'border-rose-500 bg-rose-500/40'
                    }`}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-900/80 text-stone-300 backdrop-blur-sm border border-stone-700">
                    {dish.dietary}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
                    ★ Chef Choice
                  </span>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-bold text-stone-100 text-lg group-hover:text-amber-400 transition font-display">
                      {dish.name}
                    </h3>
                    <span className="text-lg font-bold text-amber-400 shrink-0">₹{dish.price}</span>
                  </div>
                  <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed mb-4">
                    {dish.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-stone-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ~{dish.preparationTimeMinutes || 15} mins
                  </span>
                  <button
                    onClick={() => setSelectedItemForModal(dish)}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg text-xs transition shadow-md shadow-amber-500/10"
                  >
                    Add to Order
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Menu Category Highlights */}
      <section className="py-16 bg-stone-900/30 border-y border-stone-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold font-display text-stone-100 mb-3">
              Explore Our Culinary Categories
            </h2>
            <p className="text-xs text-stone-400">
              From crisp starters to rich curries, fragrant biryanis, and artisan confections.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/menu?category=${cat.slug}`}
                className="group p-5 bg-stone-900/60 hover:bg-stone-900 border border-stone-800/80 hover:border-amber-500/40 rounded-2xl transition duration-200 text-left flex flex-col justify-between h-36"
              >
                <div>
                  <h3 className="font-semibold text-stone-200 text-sm group-hover:text-amber-400 transition font-display">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-stone-400 line-clamp-2 mt-1 leading-snug">
                    {cat.description}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-amber-500 font-medium">
                  <span>Browse Category</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Reservation Banner CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/40 border border-amber-500/20 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Exclusive Hospitality
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-stone-100">
                Reserve Your Evening Experience
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
                Whether celebrating an anniversary on our open-air terrace, hosting a corporate dinner in our Private Dining Room (PDR), or dining casually in the Main Hall, our concierge ensures your table is ready.
              </p>
            </div>
            <Link
              to="/reservations"
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold rounded-xl text-sm transition shadow-xl shadow-amber-500/20 shrink-0"
            >
              Book Table Online →
            </Link>
          </div>
        </div>
      </section>

      {/* Customization Modal */}
      <ItemCustomizationModal
        item={selectedItemForModal}
        isOpen={!!selectedItemForModal}
        onClose={() => setSelectedItemForModal(null)}
      />
    </div>
  );
}
