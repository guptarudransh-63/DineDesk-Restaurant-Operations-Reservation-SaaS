import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Flame, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export default function ItemCustomizationModal({ item, isOpen, onClose }) {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState([]);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setInstructions('');

      // Auto-select defaults from customization groups
      const defaults = [];
      if (item.customizationGroups && item.customizationGroups.length > 0) {
        item.customizationGroups.forEach((grp) => {
          const defaultOpt = grp.options?.find((o) => o.isDefault) || (grp.isRequired && grp.options?.[0]);
          if (defaultOpt) {
            defaults.push({
              groupName: grp.name,
              optionName: defaultOpt.name,
              extraPrice: defaultOpt.extraPrice || 0,
            });
          }
        });
      }
      setSelectedCustomizations(defaults);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSingleSelect = (groupName, option) => {
    setSelectedCustomizations((prev) => {
      const filtered = prev.filter((c) => c.groupName !== groupName);
      return [
        ...filtered,
        {
          groupName,
          optionName: option.name,
          extraPrice: option.extraPrice || 0,
        },
      ];
    });
  };

  const handleMultiSelect = (groupName, option, maxSelect = 3) => {
    setSelectedCustomizations((prev) => {
      const isSelected = prev.some((c) => c.groupName === groupName && c.optionName === option.name);
      if (isSelected) {
        return prev.filter((c) => !(c.groupName === groupName && c.optionName === option.name));
      } else {
        const groupSelected = prev.filter((c) => c.groupName === groupName);
        if (groupSelected.length >= maxSelect) {
          return prev; // Reached max
        }
        return [
          ...prev,
          {
            groupName,
            optionName: option.name,
            extraPrice: option.extraPrice || 0,
          },
        ];
      }
    });
  };

  const extraPricesSum = selectedCustomizations.reduce((sum, c) => sum + (c.extraPrice || 0), 0);
  const unitPrice = item.price + extraPricesSum;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addItem(item, selectedCustomizations, instructions, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Image */}
        <div className="relative h-48 w-full bg-stone-950 overflow-hidden shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover brightness-95"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-black/40" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-stone-900/80 hover:bg-stone-800 text-stone-200 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-block w-3 h-3 rounded-full border ${
                    item.dietary === 'veg'
                      ? 'border-emerald-500 bg-emerald-500/30'
                      : item.dietary === 'vegan'
                      ? 'border-teal-500 bg-teal-500/30'
                      : 'border-rose-500 bg-rose-500/30'
                  }`}
                />
                <span className="text-xs uppercase tracking-wider text-stone-300 font-semibold">{item.dietary}</span>
                {item.isChefSpecial && (
                  <span className="flex items-center gap-1 text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-medium">
                    <Sparkles className="w-3 h-3" /> Chef Special
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white font-display leading-tight">{item.name}</h3>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-amber-400">₹{item.price}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-stone-200 flex-1">
          <p className="text-xs text-stone-400 leading-relaxed">{item.description}</p>

          <div className="flex items-center gap-4 text-xs text-stone-400 pb-3 border-b border-stone-800">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-500" /> ~{item.preparationTimeMinutes || 15} mins prep
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" /> {item.spiceLevel || 'medium'} spice
            </span>
          </div>

          {/* Customization Groups */}
          {item.customizationGroups && item.customizationGroups.length > 0 && (
            <div className="space-y-4">
              {item.customizationGroups.map((group) => {
                const isSingle = group.maxSelect === 1;
                return (
                  <div key={group.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
                        {group.name}
                        {group.isRequired && <span className="text-amber-500 ml-1">*</span>}
                      </h4>
                      <span className="text-[11px] text-stone-500">
                        {isSingle ? 'Choose 1' : `Choose up to ${group.maxSelect}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      {group.options.map((opt) => {
                        const isSelected = selectedCustomizations.some(
                          (c) => c.groupName === group.name && c.optionName === opt.name
                        );

                        return (
                          <button
                            key={opt.name}
                            type="button"
                            onClick={() =>
                              isSingle
                                ? handleSingleSelect(group.name, opt)
                                : handleMultiSelect(group.name, opt, group.maxSelect)
                            }
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-500/60 text-amber-200 font-medium'
                                : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:bg-stone-800'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={`w-3.5 h-3.5 rounded-${isSingle ? 'full' : 'sm'} border flex items-center justify-center ${
                                  isSelected ? 'border-amber-500 bg-amber-500' : 'border-stone-600'
                                }`}
                              >
                                {isSelected && <span className="w-1.5 h-1.5 bg-stone-950 rounded-full" />}
                              </span>
                              {opt.name}
                            </span>
                            <span className="text-stone-400">
                              {opt.extraPrice > 0 ? `+₹${opt.extraPrice}` : 'Included'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Kitchen Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
              Special Kitchen Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="E.g., Less spicy, no coriander, dressing on the side..."
              rows={2}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/80 shrink-0 flex items-center justify-between gap-3">
          {/* Quantity Controls */}
          <div className="flex items-center border border-stone-800 bg-stone-900 rounded-lg overflow-hidden">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="p-2 text-stone-400 hover:text-stone-100 disabled:opacity-40 transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-semibold text-stone-200">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="p-2 text-stone-400 hover:text-stone-100 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-between px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/10"
          >
            <span>Add to Order</span>
            <span>₹{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
