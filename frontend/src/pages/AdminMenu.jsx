import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Search,
  Sparkles,
  CheckCircle,
  AlertCircle,
  X,
  Filter,
} from 'lucide-react';
import api from '../services/api';

export default function AdminMenu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Dish Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [dietary, setDietary] = useState('veg');
  const [spiceLevel, setSpiceLevel] = useState('medium');
  const [isChefSpecial, setIsChefSpecial] = useState(false);
  const [preparationTimeMinutes, setPreparationTimeMinutes] = useState(15);
  const [availability, setAvailability] = useState('available');

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const [itemsRes, catRes] = await Promise.all([
        api.get('/menu'),
        api.get('/menu/categories'),
      ]);
      setItems(itemsRes.data.data);
      setCategories(catRes.data.data);
      if (catRes.data.data.length > 0 && !categoryId) {
        setCategoryId(catRes.data.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setPrice('');
    setImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80');
    setDietary('veg');
    setSpiceLevel('medium');
    setIsChefSpecial(false);
    setPreparationTimeMinutes(15);
    setAvailability('available');
    if (categories.length > 0) setCategoryId(categories[0]._id);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setCategoryId(item.category?._id || item.category || '');
    setPrice(item.price);
    setImage(item.image || '');
    setDietary(item.dietary || 'veg');
    setSpiceLevel(item.spiceLevel || 'medium');
    setIsChefSpecial(!!item.isChefSpecial);
    setPreparationTimeMinutes(item.preparationTimeMinutes || 15);
    setAvailability(item.availability || 'available');
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name,
        description,
        categoryId,
        price: Number(price),
        image,
        dietary,
        spiceLevel,
        isChefSpecial,
        preparationTimeMinutes: Number(preparationTimeMinutes),
        availability,
      };

      if (editingItem) {
        await api.patch(`/menu/items/${editingItem._id}`, payload);
      } else {
        await api.post('/menu/items', payload);
      }

      setIsModalOpen(false);
      fetchMenuData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save menu item.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle availability directly
  const handleAvailabilityChange = async (itemId, newAvailability) => {
    try {
      await api.patch(`/menu/items/${itemId}/availability`, {
        availability: newAvailability,
      });
      setItems((prev) =>
        prev.map((i) => (i._id === itemId ? { ...i, availability: newAvailability } : i))
      );
    } catch (err) {
      alert('Failed to update availability.');
    }
  };

  // Archive item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to archive this dish from the menu?')) return;
    try {
      await api.delete(`/menu/items/${itemId}`);
      setItems((prev) => prev.filter((i) => i._id !== itemId));
    } catch (err) {
      alert('Failed to archive menu item.');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchCat = !selectedCategory || item.category?.slug === selectedCategory;
    const matchSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-amber-500" />
              <h1 className="text-2xl font-bold font-display text-stone-100">
                Menu Management & Stock Availability
              </h1>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Add new creations, adjust prices, edit recipes, and instantly toggle dish availability across customer interfaces
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold rounded-xl text-xs transition shadow-md shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-3 bg-stone-900/60 border border-stone-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 ${
                !selectedCategory
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              All Categories ({items.length})
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedCategory(c.slug)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 ${
                  selectedCategory === c.slug
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-950 text-stone-400 border-b border-stone-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Dish</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Dietary</th>
                <th className="p-3.5 text-right">Price</th>
                <th className="p-3.5">Live Availability</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filteredItems.map((item) => (
                <tr key={item._id} className="hover:bg-stone-800/40 transition">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover bg-stone-950"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                      <div>
                        <p className="font-bold text-stone-200 text-sm flex items-center gap-1.5">
                          {item.name}
                          {item.isChefSpecial && (
                            <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                              Chef Pick
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-stone-500 line-clamp-1 max-w-xs">{item.description}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5 text-stone-300 font-medium">
                    {item.category?.name || 'Uncategorized'}
                  </td>

                  <td className="p-3.5">
                    <span className="capitalize font-semibold text-stone-300">{item.dietary}</span>
                  </td>

                  <td className="p-3.5 text-right font-bold text-amber-400 text-sm">
                    ₹{item.price}
                  </td>

                  <td className="p-3.5">
                    <select
                      value={item.availability}
                      onChange={(e) => handleAvailabilityChange(item._id, e.target.value)}
                      className={`text-xs font-semibold rounded-lg px-2.5 py-1 border focus:outline-none ${
                        item.availability === 'available'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : item.availability === 'sold_out'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : 'bg-stone-800 text-stone-400 border-stone-700'
                      }`}
                    >
                      <option value="available" className="bg-stone-900 text-stone-100">● Available</option>
                      <option value="temporarily_unavailable" className="bg-stone-900 text-stone-100">○ Unavailable</option>
                      <option value="sold_out" className="bg-stone-900 text-stone-100">✕ Sold Out</option>
                    </select>
                  </td>

                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition"
                      title="Edit dish"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="p-1.5 bg-stone-800 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 rounded-lg transition"
                      title="Archive dish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create / Edit Dish Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <h3 className="text-base font-bold text-stone-100">
                  {editingItem ? 'Edit Culinary Dish' : 'Add New Artisan Dish'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Dish Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g., Smoked Nilgiri Lamb Shank Korma"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Category *</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                      required
                    >
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Price (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="E.g., 490"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Culinary Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Describe textures, heritage cooking technique, and aromatics..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Image URL (High-Res Food Photo)</label>
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Dietary Label</label>
                    <select
                      value={dietary}
                      onChange={(e) => setDietary(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200"
                    >
                      <option value="veg">Vegetarian</option>
                      <option value="non-veg">Non-Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="gluten-free">Gluten-Free</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Spice Level</label>
                    <select
                      value={spiceLevel}
                      onChange={(e) => setSpiceLevel(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200"
                    >
                      <option value="none">None</option>
                      <option value="mild">Mild</option>
                      <option value="medium">Medium</option>
                      <option value="spicy">Spicy</option>
                      <option value="extra-spicy">Extra-Spicy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Prep Time (mins)</label>
                    <input
                      type="number"
                      value={preparationTimeMinutes}
                      onChange={(e) => setPreparationTimeMinutes(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="chefSpecial"
                    checked={isChefSpecial}
                    onChange={(e) => setIsChefSpecial(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="chefSpecial" className="text-stone-300 font-medium cursor-pointer">
                    Feature on Homepage as Chef Sanjeev's Tasting Special
                  </label>
                </div>

                <div className="flex gap-2 pt-3 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingItem ? 'Update Dish' : 'Create Dish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
