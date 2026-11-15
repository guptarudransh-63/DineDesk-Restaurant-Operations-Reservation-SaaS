import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Sparkles,
  Clock,
  Flame,
  AlertCircle,
  Plus,
  UtensilsCrossed,
  Check,
} from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import ItemCustomizationModal from '../components/ItemCustomizationModal';

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('');
  const [chefSpecialOnly, setChefSpecialOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);

  // Fetch categories and items
  const fetchMenu = async () => {
    try {
      setLoading(true);
      const [catRes, itemsRes] = await Promise.all([
        api.get('/menu/categories'),
        api.get('/menu', {
          params: {
            category: selectedCategory || undefined,
            dietary: dietaryFilter || undefined,
            search: searchQuery || undefined,
            chefSpecial: chefSpecialOnly ? 'true' : undefined,
          },
        }),
      ]);
      setCategories(catRes.data.data);
      setMenuItems(itemsRes.data.data);
    } catch (err) {
      console.error('Failed to load menu data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [selectedCategory, dietaryFilter, chefSpecialOnly]);

  // Handle live socket events for real-time menu updates
  useEffect(() => {
    const socket = getSocket();

    const handleAvailabilityChanged = ({ itemId, availability }) => {
      setMenuItems((prev) =>
        prev.map((item) => (item._id === itemId ? { ...item, availability } : item))
      );
    };

    const handleItemCreated = (newItem) => {
      setMenuItems((prev) => [newItem, ...prev]);
    };

    const handleItemUpdated = (updatedItem) => {
      setMenuItems((prev) =>
        prev.map((item) => (item._id === updatedItem._id ? updatedItem : item))
      );
    };

    const handleItemArchived = ({ itemId }) => {
      setMenuItems((prev) => prev.filter((item) => item._id !== itemId));
    };

    socket.on('menu:availability:changed', handleAvailabilityChanged);
    socket.on('menu:item:created', handleItemCreated);
    socket.on('menu:item:updated', handleItemUpdated);
    socket.on('menu:item:archived', handleItemArchived);

    return () => {
      socket.off('menu:availability:changed', handleAvailabilityChanged);
      socket.off('menu:item:created', handleItemCreated);
      socket.off('menu:item:updated', handleItemUpdated);
      socket.off('menu:item:archived', handleItemArchived);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMenu();
  };

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Grand Bistro Artisan Menu</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-display text-stone-100 tracking-tight">
            Curated Epicurean Collection
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-2 font-light">
            Every dish is prepared à la minute with locally sourced produce, artisanal spices, and heartfelt hospitality.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-stone-900/80 border border-stone-800 p-4 rounded-2xl shadow-xl space-y-4 mb-8 backdrop-blur-md">
          {/* Top row: Search and Dietary filters */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes, ingredients, curries..."
                className="w-full pl-9 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </form>

            {/* Dietary Tags */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {[
                { id: '', label: 'All Dishes' },
                { id: 'veg', label: 'Vegetarian', color: 'emerald' },
                { id: 'non-veg', label: 'Non-Vegetarian', color: 'rose' },
                { id: 'vegan', label: 'Vegan', color: 'teal' },
              ].map((diet) => (
                <button
                  key={diet.id}
                  onClick={() => setDietaryFilter(diet.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    dietaryFilter === diet.id
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/10'
                      : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                  }`}
                >
                  {diet.label}
                </button>
              ))}

              <button
                onClick={() => setChefSpecialOnly(!chefSpecialOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  chefSpecialOnly
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Chef Specials</span>
              </button>
            </div>
          </div>

          {/* Categories Horizontal Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-stone-800/80 scrollbar-none">
            <button
              onClick={() => handleCategorySelect('')}
              className={`shrink-0 px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                !selectedCategory
                  ? 'bg-stone-100 text-stone-950 shadow'
                  : 'bg-stone-950/80 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`shrink-0 px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedCategory === cat.slug
                    ? 'bg-stone-100 text-stone-950 shadow'
                    : 'bg-stone-950/80 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-stone-900 rounded-2xl border border-stone-800" />
            ))}
          </div>
        ) : menuItems.length === 0 ? (
          <div className="p-16 text-center bg-stone-900/40 rounded-2xl border border-stone-800 space-y-3">
            <UtensilsCrossed className="w-10 h-10 text-stone-600 mx-auto" />
            <h3 className="text-lg font-bold text-stone-200 font-display">No dishes match your selection</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Try adjusting your category filter, dietary preferences, or search keywords.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('');
                setDietaryFilter('');
                setChefSpecialOnly(false);
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-medium"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => {
              const isAvailable = item.availability === 'available';
              const isSoldOut = item.availability === 'sold_out';
              const isTempUnavailable = item.availability === 'temporarily_unavailable';

              return (
                <div
                  key={item._id}
                  className={`group bg-stone-900 border rounded-2xl overflow-hidden transition duration-200 flex flex-col shadow-lg ${
                    !isAvailable
                      ? 'border-stone-800/60 opacity-70 bg-stone-900/50'
                      : 'border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {/* Food Image */}
                  <div className="relative h-48 bg-stone-950 overflow-hidden shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className={`w-full h-full object-cover transition duration-500 ${
                        isAvailable ? 'group-hover:scale-105' : 'grayscale'
                      }`}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-black/30" />

                    {/* Dietary badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`inline-block w-3 h-3 rounded-full border ${
                          item.dietary === 'veg'
                            ? 'border-emerald-500 bg-emerald-500/40'
                            : item.dietary === 'vegan'
                            ? 'border-teal-500 bg-teal-500/40'
                            : 'border-rose-500 bg-rose-500/40'
                        }`}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-900/80 text-stone-300 backdrop-blur-sm border border-stone-700">
                        {item.dietary}
                      </span>
                    </div>

                    {/* Availability or Chef Special badge */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                      {item.isChefSpecial && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
                          ★ Chef Special
                        </span>
                      )}
                      {isSoldOut && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-sm">
                          Sold Out
                        </span>
                      )}
                      {isTempUnavailable && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700 backdrop-blur-sm">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-stone-100 text-base font-display group-hover:text-amber-400 transition">
                          {item.name}
                        </h3>
                        <span className="text-base font-bold text-amber-400 shrink-0">₹{item.price}</span>
                      </div>
                      <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed mb-4">
                        {item.description}
                      </p>
                    </div>

                    {/* Metadata & Action */}
                    <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[11px] text-stone-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> ~{item.preparationTimeMinutes || 15}m
                        </span>
                        <span className="flex items-center gap-0.5 text-stone-400 capitalize">
                          <Flame className="w-3 h-3 text-amber-500" /> {item.spiceLevel || 'medium'}
                        </span>
                      </div>

                      {isAvailable ? (
                        <button
                          onClick={() => setSelectedItemForModal(item)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg text-xs transition shadow-md shadow-amber-500/10 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      ) : (
                        <span className="text-xs text-stone-500 italic font-medium">
                          {isSoldOut ? 'Sold Out Today' : 'Unavailable'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item Customization Modal */}
      <ItemCustomizationModal
        item={selectedItemForModal}
        isOpen={!!selectedItemForModal}
        onClose={() => setSelectedItemForModal(null)}
      />
    </div>
  );
}
