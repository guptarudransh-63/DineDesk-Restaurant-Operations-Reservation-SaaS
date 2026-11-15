import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  FileText,
} from 'lucide-react';
import api from '../services/api';
import GSTInvoiceModal from '../components/GSTInvoiceModal';

export default function BillingPOS() {
  const [activeTab, setActiveTab] = useState('unpaid'); // 'unpaid' or 'history'
  const [orders, setOrders] = useState([]);
  const [paymentsHistory, setPaymentsHistory] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Discount adjustment state
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [discountPercentInput, setDiscountPercentInput] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  // Payment tender state
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [transactionRef, setTransactionRef] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Invoice modal
  const [invoiceData, setInvoiceData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrdersAndPayments = async () => {
    try {
      setLoading(true);
      const [ordersRes, paymentsRes] = await Promise.all([
        api.get('/orders', { params: { paymentStatus: 'unpaid' } }),
        api.get('/payments'),
      ]);

      setOrders(ordersRes.data.data);
      setPaymentsHistory(paymentsRes.data.data);

      if (ordersRes.data.data.length > 0 && !selectedOrder) {
        setSelectedOrder(ordersRes.data.data[0]);
      }
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndPayments();
  }, []);

  // Apply discount to selected order
  const handleApplyDiscount = async () => {
    if (!selectedOrder) return;
    setIsApplyingDiscount(true);
    try {
      const res = await api.post(`/orders/${selectedOrder._id}/apply-discount`, {
        discountCode: discountCodeInput || undefined,
        discountPercent: discountPercentInput || undefined,
      });
      setSelectedOrder(res.data.data);
      setOrders((prev) =>
        prev.map((o) => (o._id === selectedOrder._id ? res.data.data : o))
      );
      setDiscountCodeInput('');
      setDiscountPercentInput('');
      alert('Discount applied and taxes recalculated!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply discount.');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  // Process payment and generate invoice
  const handleSettleBill = async () => {
    if (!selectedOrder) return;
    setIsProcessingPayment(true);
    try {
      const res = await api.post('/payments', {
        orderId: selectedOrder._id,
        amount: selectedOrder.finalTotal,
        paymentMethod,
        transactionReference: transactionRef || undefined,
      });

      // Show official invoice modal
      setInvoiceData(res.data.data);

      // Refresh list
      fetchOrdersAndPayments();
      setSelectedOrder(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Payment processing failed.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Re-open past invoice
  const handleViewInvoice = async (invoiceNumber) => {
    try {
      const res = await api.get(`/payments/invoice/${invoiceNumber}`);
      setInvoiceData(res.data.data);
    } catch (err) {
      alert('Failed to retrieve invoice details.');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.tableNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Top Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-600 text-stone-100 shadow-md shadow-purple-600/20">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-stone-100">
              Billing Terminal & POS Checkout
            </h1>
            <p className="text-xs text-stone-400">
              Calculate GST taxes, apply authorized discounts, accept tenders, and generate tax receipts
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('unpaid')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'unpaid'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            Pending Settle ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'history'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            Settled Invoices ({paymentsHistory.length})
          </button>
          <button
            onClick={fetchOrdersAndPayments}
            className="p-2 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-300 transition"
            title="Refresh Billing Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === 'unpaid' ? (
        /* Split Layout: Left Orders Queue (40%), Right Checkout & Tender (60%) */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Pending Orders Queue */}
          <div className="w-full lg:w-96 border-r border-stone-800 flex flex-col bg-stone-900/60 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-stone-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter Table, Order #, Guest..."
                  className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="p-3 flex-1 overflow-y-auto space-y-2">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500">
                  No unpaid orders pending billing.
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrder?._id === order._id;
                  return (
                    <div
                      key={order._id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-md shadow-amber-500/5'
                          : 'bg-stone-900/80 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-stone-100 text-sm">
                          {order.orderType === 'dine_in'
                            ? `Table ${order.tableNumber}`
                            : 'Takeaway Order'}
                        </span>
                        <span className="font-bold text-amber-400 text-sm">₹{order.finalTotal}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-stone-400">
                        <span className="font-mono text-[11px]">{order.orderNumber}</span>
                        <span>{order.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2 pt-2 border-t border-stone-800/60">
                        <span>{order.items?.length || 0} items</span>
                        <span className="capitalize">{order.orderStatus}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Bill Review, Discount & Payment Tender */}
          <div className="flex-1 p-6 overflow-y-auto bg-stone-950 flex flex-col justify-between">
            {selectedOrder ? (
              <div className="max-w-2xl mx-auto w-full space-y-6">
                {/* Header Bill Snapshot */}
                <div className="p-5 bg-stone-900 rounded-2xl border border-stone-800 flex items-center justify-between shadow-lg">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {selectedOrder.orderNumber}
                    </span>
                    <h2 className="text-xl font-bold font-display text-stone-100 mt-0.5">
                      {selectedOrder.orderType === 'dine_in'
                        ? `Table ${selectedOrder.tableNumber}`
                        : 'Takeaway Customer'}
                    </h2>
                    <p className="text-xs text-stone-400">
                      Customer: <strong className="text-stone-200">{selectedOrder.customerName}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-stone-500 block uppercase">Net Payable</span>
                    <span className="text-2xl font-bold text-amber-400">₹{selectedOrder.finalTotal}</span>
                  </div>
                </div>

                {/* Ordered Items Table */}
                <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
                  <div className="p-3.5 bg-stone-950 border-b border-stone-800 font-bold text-xs uppercase tracking-wider text-stone-300">
                    Itemized Order Breakdown
                  </div>
                  <div className="divide-y divide-stone-800/80 max-h-56 overflow-y-auto text-xs">
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-stone-200">{item.name}</p>
                          <p className="text-[11px] text-stone-500">
                            ₹{item.unitPrice} × {item.quantity}
                            {item.customizations?.length > 0 &&
                              ` (${item.customizations.map((c) => c.optionName).join(', ')})`}
                          </p>
                        </div>
                        <span className="font-bold text-stone-200">₹{item.itemTotal}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Apply Discount Section */}
                <div className="p-4 bg-stone-900 rounded-2xl border border-stone-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                      Apply Promo or Authorized Staff Discount
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Quick percentage buttons */}
                    {[5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setDiscountPercentInput(pct);
                          setDiscountCodeInput(`STAFF_${pct}PCT`);
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                          discountPercentInput === pct
                            ? 'bg-amber-500 border-amber-500 text-stone-950'
                            : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {pct}% OFF
                      </button>
                    ))}

                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={discountCodeInput}
                        onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                        placeholder="Voucher (e.g. WELCOME10)"
                        className="flex-1 bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 uppercase focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={handleApplyDiscount}
                        disabled={isApplyingDiscount}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold transition"
                      >
                        {isApplyingDiscount ? '...' : 'Apply'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tax Breakdown & Total Summary */}
                <div className="p-4 bg-stone-900 rounded-2xl border border-stone-800 space-y-1.5 text-xs text-stone-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{selectedOrder.subtotal}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({selectedOrder.discountCode || 'Promo'})</span>
                      <span>-₹{selectedOrder.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Central GST (CGST @ 2.5%)</span>
                    <span>₹{selectedOrder.cgstAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>State GST (SGST @ 2.5%)</span>
                    <span>₹{selectedOrder.sgstAmount}</span>
                  </div>
                  <div className="pt-2 border-t border-stone-800 flex justify-between font-bold text-base text-stone-100">
                    <span>Final Settlement Amount</span>
                    <span className="text-amber-400">₹{selectedOrder.finalTotal}</span>
                  </div>
                </div>

                {/* Tender Method Selection */}
                <div className="p-5 bg-stone-900 rounded-2xl border border-stone-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                    Payment Tender Method
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'upi', label: 'UPI QR', icon: QrCode },
                      { id: 'card', label: 'Card Swipe', icon: CreditCard },
                      { id: 'cash', label: 'Cash Tender', icon: Banknote },
                      { id: 'online', label: 'Razorpay Mock', icon: CreditCard },
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSel = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                            isSel
                              ? 'bg-amber-500/10 border-amber-500 text-amber-200 font-bold'
                              : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-amber-500" />
                          <span className="text-xs">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1 font-medium">
                      Transaction / Reference Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="E.g., UPI-984210 or POS-Approval-Code"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    onClick={handleSettleBill}
                    disabled={isProcessingPayment}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-stone-950 font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>
                      {isProcessingPayment
                        ? 'Settling & Generating Receipt...'
                        : `Settle ₹${selectedOrder.finalTotal} & Print GST Tax Invoice`}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-8 text-xs text-stone-500">
                Select an unpaid order from the left queue to review bill and process payment.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History Tab: Past Paid Invoices */
        <div className="p-6 max-w-6xl mx-auto w-full space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950 text-stone-400 border-b border-stone-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Order Ref</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5 text-right">Amount Paid</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {paymentsHistory.map((p) => (
                  <tr key={p._id} className="hover:bg-stone-800/40 transition">
                    <td className="p-3.5 font-bold font-mono text-amber-400">{p.invoiceNumber}</td>
                    <td className="p-3.5 text-stone-300">
                      {new Date(p.paymentDate || p.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 font-mono text-stone-400">{p.orderNumber}</td>
                    <td className="p-3.5 text-stone-200">{p.customerName || 'Walk-in'}</td>
                    <td className="p-3.5 uppercase font-semibold text-stone-300">{p.paymentMethod}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-400">₹{p.amount}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleViewInvoice(p.invoiceNumber)}
                        className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium transition inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3 text-amber-400" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official GST Invoice Modal */}
      <GSTInvoiceModal
        isOpen={!!invoiceData}
        onClose={() => setInvoiceData(null)}
        data={invoiceData}
      />
    </div>
  );
}
