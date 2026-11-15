import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Check, Clock, CreditCard, Banknote, QrCode } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    orderType,
    setOrderType,
    pickupTime,
    setPickupTime,
    discountCode,
    discountPercent,
    applyPromo,
    removePromo,
    getCalculations,
  } = useCartStore();

  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checkout form fields
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [tableNumber, setTableNumber] = useState('');

  if (!isOpen) return null;

  const { subtotal, discountAmount, cgst, sgst, taxTotal, total, itemCount } = getCalculations();

  const handleApplyPromo = () => {
    if (!promoInput) return;
    const res = applyPromo(promoInput);
    setPromoMessage(res);
    setTimeout(() => setPromoMessage(null), 4000);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!customerName || !customerPhone) {
      alert('Please provide your name and phone number for the order.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        orderType,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          quantity: i.quantity,
          customizations: i.customizations,
          specialInstructions: i.specialInstructions,
        })),
        customerName,
        customerPhone,
        customerEmail,
        pickupTime: orderType === 'takeaway' ? pickupTime : null,
        paymentMethod,
        discountPercent,
      };

      const res = await api.post('/orders', payload);
      const createdOrder = res.data.data;

      clearCart();
      setIsCheckingOut(false);
      closeCart();

      // Navigate to live tracking page
      navigate(`/orders/track/${createdOrder._id || createdOrder.orderNumber}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-stone-900 border-l border-stone-800 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/90">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-stone-100">Your Dining Order</h2>
              <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center text-stone-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-stone-200">Your basket is empty</h3>
                <p className="text-xs text-stone-500 max-w-xs">
                  Explore our artisanal menu and discover handcrafted appetizers, curries, and sourdough pizzas.
                </p>
                <button
                  onClick={() => {
                    closeCart();
                    navigate('/menu');
                  }}
                  className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs transition"
                >
                  Browse Menu
                </button>
              </div>
            ) : isCheckingOut ? (
              /* Checkout Details Form */
              <form onSubmit={handlePlaceOrder} className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <h3 className="text-sm font-semibold text-stone-100">Contact & Pickup Details</h3>
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="text-xs text-amber-400 hover:underline"
                  >
                    ← Review Items
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="E.g., Ananya Iyer"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Phone Number (for order SMS) *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="E.g., +91 98450 12345"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Email Address (for receipt)</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="E.g., ananya@example.com"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-stone-400 mb-1.5 font-medium">Payment Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'upi', label: 'UPI / QR Scan', icon: QrCode },
                        { id: 'card', label: 'Debit / Credit Card', icon: CreditCard },
                        { id: 'cash', label: 'Cash on Counter', icon: Banknote },
                        { id: 'online', label: 'Razorpay Gateway', icon: CreditCard },
                      ].map((pm) => {
                        const Icon = pm.icon;
                        const isSelected = paymentMethod === pm.id;
                        return (
                          <button
                            type="button"
                            key={pm.id}
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-500 text-amber-200 font-medium'
                                : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                            }`}
                          >
                            <Icon className="w-4 h-4 text-amber-500" />
                            <span className="text-xs">{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Final Bill Summary in checkout */}
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-400">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({discountPercent}%)</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-400">
                    <span>GST (CGST 2.5% + SGST 2.5%)</span>
                    <span>₹{taxTotal}</span>
                  </div>
                  <div className="pt-2 border-t border-stone-800 flex justify-between font-bold text-sm text-stone-100">
                    <span>Final Amount</span>
                    <span className="text-amber-400">₹{total}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/10 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    'Submitting to Kitchen...'
                  ) : (
                    <>
                      <span>Confirm & Place Order (₹{total})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Item List Review View */
              <>
                {/* Order Type Toggle */}
                <div className="grid grid-cols-2 p-1 bg-stone-950 rounded-xl border border-stone-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setOrderType('takeaway')}
                    className={`py-2 rounded-lg transition ${
                      orderType === 'takeaway'
                        ? 'bg-amber-500 text-stone-950 shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Takeaway / Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('dine_in')}
                    className={`py-2 rounded-lg transition ${
                      orderType === 'dine_in'
                        ? 'bg-amber-500 text-stone-950 shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Dine-In at Table
                  </button>
                </div>

                {orderType === 'takeaway' && (
                  <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-stone-300">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> Pickup Timing
                    </label>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="ASAP (~20 mins)">⚡ Express ASAP (~20 mins)</option>
                      <option value="In 30 minutes">In 30 minutes</option>
                      <option value="In 45 minutes">In 45 minutes</option>
                      <option value="In 1 hour">In 1 hour</option>
                      <option value="Today Evening (7:30 PM)">Today Evening (7:30 PM)</option>
                      <option value="Today Dinner (8:30 PM)">Today Dinner (8:30 PM)</option>
                    </select>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 flex gap-3 text-xs"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-lg object-cover shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-stone-100 truncate">{item.name}</h4>
                          <span className="font-bold text-amber-400 ml-2 shrink-0">₹{item.itemTotal}</span>
                        </div>

                        {/* Customizations tags */}
                        {item.customizations && item.customizations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.customizations.map((c, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded"
                              >
                                {c.optionName} {c.extraPrice > 0 && `(+₹${c.extraPrice})`}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.specialInstructions && (
                          <p className="text-[10px] text-stone-500 italic mt-0.5">
                            Note: {item.specialInstructions}
                          </p>
                        )}

                        {/* Quantity and Remove */}
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-800/50">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-stone-200">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(index)}
                            className="text-stone-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code Input */}
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold text-stone-200">Have a Dining Promo Code?</span>
                  </div>

                  {discountCode ? (
                    <div className="flex items-center justify-between p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 font-medium">
                      <span>✓ Applied: {discountCode} ({discountPercent}% OFF)</span>
                      <button
                        onClick={removePromo}
                        className="text-stone-400 hover:text-stone-200 underline text-[11px]"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="Try: WELCOME10 or CHEF15"
                        className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 uppercase placeholder-stone-600 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium transition"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {promoMessage && (
                    <p
                      className={`text-[11px] ${
                        promoMessage.success ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {promoMessage.message}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer Totals & Checkout Button */}
          {items.length > 0 && !isCheckingOut && (
            <div className="p-4 border-t border-stone-800 bg-stone-950 space-y-3">
              <div className="space-y-1 text-xs text-stone-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Promo Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>CGST (2.5%) + SGST (2.5%)</span>
                  <span>₹{taxTotal}</span>
                </div>
                <div className="pt-2 border-t border-stone-800/80 flex justify-between font-bold text-sm text-stone-100">
                  <span>Grand Total</span>
                  <span className="text-amber-400">₹{total}</span>
                </div>
              </div>

              <button
                onClick={() => setIsCheckingOut(true)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
