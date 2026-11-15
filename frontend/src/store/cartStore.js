import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: JSON.parse(localStorage.getItem('dinedesk_cart') || '[]'),
  isOpen: false,
  orderType: 'takeaway', // 'takeaway' or 'dine_in'
  tableId: null,
  tableNumber: null,
  pickupTime: 'ASAP (~20 mins)',
  specialInstructions: '',
  discountCode: '',
  discountPercent: 0,

  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  setOrderType: (orderType) => set({ orderType }),
  setTable: (tableId, tableNumber) => set({ tableId, tableNumber }),
  setPickupTime: (pickupTime) => set({ pickupTime }),
  setSpecialInstructions: (specialInstructions) => set({ specialInstructions }),

  addItem: (menuItem, customizations = [], instructions = '', quantity = 1) => {
    const currentItems = get().items;
    
    // Calculate customization price
    const extrasTotal = customizations.reduce((sum, c) => sum + (c.extraPrice || 0), 0);
    const unitPrice = menuItem.price + extrasTotal;
    const itemTotal = unitPrice * quantity;

    // Check if identical item with same customizations and notes exists
    const customKey = JSON.stringify(customizations.map(c => `${c.groupName}:${c.optionName}`).sort());
    const existingIndex = currentItems.findIndex(
      (i) => i.menuItemId === menuItem._id && 
             JSON.stringify((i.customizations || []).map(c => `${c.groupName}:${c.optionName}`).sort()) === customKey &&
             i.specialInstructions === instructions
    );

    let updated;
    if (existingIndex > -1) {
      updated = [...currentItems];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + quantity;
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        itemTotal: existing.unitPrice * newQty,
      };
    } else {
      updated = [
        ...currentItems,
        {
          menuItemId: menuItem._id,
          name: menuItem.name,
          image: menuItem.image,
          unitPrice,
          quantity,
          customizations,
          specialInstructions: instructions,
          itemTotal,
        },
      ];
    }

    localStorage.setItem('dinedesk_cart', JSON.stringify(updated));
    set({ items: updated, isOpen: true });
  },

  updateQuantity: (index, quantity) => {
    const current = get().items;
    if (quantity <= 0) {
      get().removeItem(index);
      return;
    }
    const updated = [...current];
    updated[index].quantity = quantity;
    updated[index].itemTotal = updated[index].unitPrice * quantity;
    localStorage.setItem('dinedesk_cart', JSON.stringify(updated));
    set({ items: updated });
  },

  removeItem: (index) => {
    const updated = get().items.filter((_, idx) => idx !== index);
    localStorage.setItem('dinedesk_cart', JSON.stringify(updated));
    set({ items: updated });
  },

  clearCart: () => {
    localStorage.removeItem('dinedesk_cart');
    set({
      items: [],
      discountCode: '',
      discountPercent: 0,
      specialInstructions: '',
    });
  },

  applyPromo: (code) => {
    const upper = (code || '').toUpperCase().trim();
    if (upper === 'WELCOME10') {
      set({ discountCode: 'WELCOME10', discountPercent: 10 });
      return { success: true, message: '10% Welcome discount applied!' };
    }
    if (upper === 'CHEF15') {
      set({ discountCode: 'CHEF15', discountPercent: 15 });
      return { success: true, message: '15% Chef Tasting promo applied!' };
    }
    if (upper === 'VIP20') {
      set({ discountCode: 'VIP20', discountPercent: 20 });
      return { success: true, message: '20% VIP Dining discount applied!' };
    }
    return { success: false, message: 'Invalid promo code. Try WELCOME10 or CHEF15.' };
  },

  removePromo: () => {
    set({ discountCode: '', discountPercent: 0 });
  },

  getCalculations: () => {
    const { items, discountPercent } = get();
    const subtotal = items.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
    const discountAmount = discountPercent > 0 ? Math.round((subtotal * discountPercent) / 100) : 0;
    const taxable = Math.max(0, subtotal - discountAmount);
    const cgst = Math.round((taxable * 0.025) * 100) / 100;
    const sgst = Math.round((taxable * 0.025) * 100) / 100;
    const taxTotal = cgst + sgst;
    const total = Math.round((taxable + taxTotal) * 100) / 100;

    return {
      subtotal,
      discountAmount,
      taxable,
      cgst,
      sgst,
      taxTotal,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  },
}));
