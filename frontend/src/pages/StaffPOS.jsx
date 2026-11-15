import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  Plus,
  Minus,
  Trash2,
  Send,
  Receipt,
  Search,
  Sparkles,
  Clock,
  Flame,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import ItemCustomizationModal from '../components/ItemCustomizationModal';

export default function StaffPOS() {
  const [searchParams, setSearchParams] = useSearchParams();
  const preselectedTableId = searchParams.get('tableId');
  const navigate = useNavigate();

  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Local POS cart for the table
  const [posCart, setPosCart] = useState([]);
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [notification, setNotification] = useState(null);

  // Load tables and menu
  useEffect(() => {
    const loadData = async () => {
      try {
        const [tablesRes, catRes, menuRes] = await Promise.all([
          api.get('/tables'),
          api.get('/menu/categories'),
          api.get('/menu'),
        ]);

        setTables(tablesRes.data.data);
        setCategories(catRes.data.data);
        setMenuItems(menuRes.data.data);

        if (preselectedTableId) {
          const match = tablesRes.data.data.find((t) => t._id === preselectedTableId);
          if (match) setSelectedTable(match);
        } else if (tablesRes.data.data.length > 0) {
          // Default to first occupied or available table
          const occupied = tablesRes.data.data.find((t) => t.status === 'occupied') || tablesRes.data.data[0];
          setSelectedTable(occupied);
        }
      } catch (err) {
        console.error('POS load data error:', err);
      }
    };
    loadData();
  }, [preselectedTableId]);

  const showNotify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Add item to local POS cart
  const handleAddItemToPOS = (item) => {
    if (item.customizationGroups && item.customizationGroups.length > 0) {
      setSelectedItemForModal(item);
      return;
    }

    setPosCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item._id && !i.customizations?.length);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item._id && !i.customizations?.length
            ? { ...i, quantity: i.quantity + 1, itemTotal: (i.quantity + 1) * i.unitPrice }
            : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item._id,
          name: item.name,
          quantity: 1,
          unitPrice: item.price,
          customizations: [],
          specialInstructions: '',
          itemTotal: item.price,
        },
      ];
    });
  };

  const handleCustomModalAdd = (item, customizations, instructions, qty) => {
    const extrasTotal = (customizations || []).reduce((sum, c) => sum + (c.extraPrice || 0), 0);
    const unitPrice = item.price + extrasTotal;
    const itemTotal = unitPrice * qty;

    setPosCart((prev) => [
      ...prev,
      {
        menuItemId: item._id,
        name: item.name,
        quantity: qty,
        unitPrice,
        customizations: customizations || [],
        specialInstructions: instructions || '',
        itemTotal,
      },
    ]);
  };

  const updatePosQty = (idx, delta) => {
    setPosCart((prev) => {
      const updated = [...prev];
      const newQty = updated[idx].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== idx);
      }
      updated[idx].quantity = newQty;
      updated[idx].itemTotal = updated[idx].unitPrice * newQty;
      return updated;
    });
  };

  const removePosItem = (idx) => {
    setPosCart((prev) => prev.filter((_, i) => i !== idx));
  };

  // Calculations for current POS batch
  const batchSubtotal = posCart.reduce((sum, i) => sum + i.itemTotal, 0);
  const batchTax = Math.round(batchSubtotal * 0.05 * 100) / 100;
  const batchTotal = batchSubtotal + batchTax;

  // Active existing order on this table
  const activeOrder = selectedTable?.activeOrder || selectedTable?.activeSession?.activeOrders?.[0];

  // Submit items to Kitchen
  const handleSendToKitchen = async () => {
    if (!selectedTable) {
      alert('Please select a table first.');
      return;
    }

    if (posCart.length === 0) {
      alert('Please add at least one item to submit to the kitchen.');
      return;
    }

    setSubmittingOrder(true);
    try {
      if (activeOrder && activeOrder.orderStatus !== 'completed' && activeOrder.orderStatus !== 'cancelled') {
        // Round 2+ addition to existing table order
        await api.post(`/orders/${activeOrder._id}/add-items`, {
          items: posCart,
          specialInstructions: `POS Addition for Table ${selectedTable.tableNumber}`,
        });
        showNotify(`Round items sent to kitchen for Table ${selectedTable.tableNumber}!`);
      } else {
        // New order for this table
        await api.post('/orders', {
          orderType: 'dine_in',
          tableId: selectedTable._id,
          customerName: selectedTable.activeSession?.customerName || `Table ${selectedTable.tableNumber} Guest`,
          items: posCart,
        });
        showNotify(`New order sent to kitchen for Table ${selectedTable.tableNumber}!`);
      }

      setPosCart([]);

      // Refresh table state
      const refreshed = await api.get('/tables');
      setTables(refreshed.data.data);
      const match = refreshed.data.data.find((t) => t._id === selectedTable._id);
      if (match) setSelectedTable(match);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit order to kitchen.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleRequestBill = async () => {
    if (!activeOrder) return;
    try {
      await api.post(`/orders/${activeOrder._id}/request-bill`);
      showNotify(`Bill requested for Table ${selectedTable.tableNumber}!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request bill.');
    }
  };

  const filteredMenuItems = menuItems.filter((item) => {
    const matchCat = !selectedCategory || item.category?.slug === selectedCategory;
    const matchSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Top POS Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-stone-950 font-bold">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-stone-100">
              Waiter / Captain POS Terminal
            </h1>
            <p className="text-xs text-stone-400">
              High-speed table ordering with multi-round kitchen dispatch
            </p>
          </div>
        </div>

        {/* Quick Table Switcher Bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 font-semibold hidden md:inline">Select Table:</span>
          <select
            value={selectedTable?._id || ''}
            onChange={(e) => {
              const match = tables.find((t) => t._id === e.target.value);
              if (match) setSelectedTable(match);
            }}
            className="bg-stone-950 border border-stone-800 text-amber-400 font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            {tables.map((t) => (
              <option key={t._id} value={t._id}>
                {t.tableNumber} ({t.section}) - {t.status.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {notification && (
        <div
          className={`px-4 py-2 text-xs font-semibold text-center ${
            notification.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border-b border-rose-500/30'
          }`}
        >
          {notification.msg}
        </div>
      )}

      {/* Main Split Layout: Left Menu Catalog (65%), Right Live Table Bill & Batch (35%) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Menu Catalog */}
        <div className="flex-1 flex flex-col border-r border-stone-800 overflow-hidden bg-stone-950">
          {/* Catalog Controls */}
          <div className="p-4 border-b border-stone-800 bg-stone-900/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu dishes..."
                className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                  !selectedCategory
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                    selectedCategory === c.slug
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {c.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Dishes Quick Grid */}
          <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredMenuItems.map((item) => {
              const isAvailable = item.availability === 'available';

              return (
                <button
                  key={item._id}
                  disabled={!isAvailable}
                  onClick={() => handleAddItemToPOS(item)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition duration-150 h-32 relative overflow-hidden group ${
                    isAvailable
                      ? 'bg-stone-900 border-stone-800 hover:border-amber-500/60 hover:bg-stone-800/80 shadow-md'
                      : 'bg-stone-900/40 border-stone-900 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`w-2.5 h-2.5 rounded-full border ${
                          item.dietary === 'veg'
                            ? 'border-emerald-500 bg-emerald-500'
                            : item.dietary === 'vegan'
                            ? 'border-teal-500 bg-teal-500'
                            : 'border-rose-500 bg-rose-500'
                        }`}
                      />
                      <span className="text-xs font-bold text-amber-400">₹{item.price}</span>
                    </div>
                    <h4 className="font-semibold text-stone-200 text-xs line-clamp-2 group-hover:text-amber-300">
                      {item.name}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-800/60">
                    <span>{item.category?.name?.slice(0, 12)}</span>
                    <span className="text-amber-400 font-bold group-hover:translate-x-0.5 transition">
                      + Add
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Table Session & Live Order Dispatch (35%) */}
        <div className="w-full lg:w-96 bg-stone-900 flex flex-col shrink-0 border-l border-stone-800">
          {/* Table Header */}
          <div className="p-4 border-b border-stone-800 bg-stone-950/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Active Dining Session
                </span>
                <h3 className="text-lg font-bold font-display text-stone-100">
                  Table {selectedTable?.tableNumber || '—'}
                </h3>
                <p className="text-xs text-stone-400">
                  {selectedTable?.section} • Guest: <strong className="text-stone-200">{selectedTable?.activeSession?.customerName || 'Walk-in'}</strong>
                </p>
              </div>

              {activeOrder && (
                <div className="text-right">
                  <span className="text-[10px] uppercase text-stone-500 block">Total Bill</span>
                  <span className="text-lg font-bold text-amber-400">₹{activeOrder.finalTotal}</span>
                </div>
              )}
            </div>
          </div>

          {/* Current Batch of Items to Send to Kitchen */}
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {/* New Batch for Kitchen */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-400">
                <span>Items To Dispatch (Round {activeOrder ? (activeOrder.currentRound || 1) + 1 : 1})</span>
                <span className="text-stone-500 text-[11px] font-normal">{posCart.length} items</span>
              </div>

              {posCart.length === 0 ? (
                <div className="p-6 bg-stone-950 rounded-xl border border-dashed border-stone-800 text-center text-xs text-stone-500">
                  Tap dishes from the left catalog to add to this round.
                </div>
              ) : (
                <div className="space-y-2">
                  {posCart.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold text-stone-200 truncate">{item.name}</p>
                        {item.customizations?.length > 0 && (
                          <p className="text-[10px] text-stone-400">
                            {item.customizations.map((c) => c.optionName).join(', ')}
                          </p>
                        )}
                        <p className="text-amber-400 font-bold mt-0.5">₹{item.itemTotal}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updatePosQty(idx, -1)}
                          className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-stone-100">{item.quantity}</span>
                        <button
                          onClick={() => updatePosQty(idx, 1)}
                          className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removePosItem(idx)}
                          className="p-1 text-stone-500 hover:text-rose-400 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Previously ordered items on table */}
            {activeOrder && activeOrder.items?.length > 0 && (
              <div className="pt-3 border-t border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-400">
                  <span>Already Ordered / In Kitchen</span>
                  <span className="text-[11px] text-stone-500">Order {activeOrder.orderNumber}</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {activeOrder.items.map((item, i) => (
                    <div
                      key={i}
                      className="p-2 bg-stone-950/60 rounded-lg border border-stone-800/60 flex items-center justify-between text-[11px] text-stone-400"
                    >
                      <span className="truncate">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-stone-300 font-medium">₹{item.itemTotal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions & Dispatch Button */}
          <div className="p-4 border-t border-stone-800 bg-stone-950 space-y-3 shrink-0">
            <div className="space-y-1 text-xs text-stone-400">
              <div className="flex justify-between">
                <span>New Batch Subtotal</span>
                <span>₹{batchSubtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>₹{batchTax}</span>
              </div>
              <div className="pt-1 border-t border-stone-800 flex justify-between font-bold text-sm text-stone-100">
                <span>Batch Total</span>
                <span className="text-amber-400">₹{batchTotal}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleRequestBill}
                disabled={!activeOrder}
                className="py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-xl text-xs transition disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>Request Bill</span>
              </button>

              <button
                onClick={handleSendToKitchen}
                disabled={submittingOrder || posCart.length === 0}
                className="py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold rounded-xl text-xs transition disabled:opacity-40 shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingOrder ? 'Dispatching...' : 'Send to Kitchen'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Item Customization Modal */}
      {selectedItemForModal && (
        <ItemCustomizationModal
          item={selectedItemForModal}
          isOpen={!!selectedItemForModal}
          onClose={() => setSelectedItemForModal(null)}
          onAdd={handleCustomModalAdd}
        />
      )}
    </div>
  );
}
