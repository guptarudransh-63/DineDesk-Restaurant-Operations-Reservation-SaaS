import React from 'react';
import { X, Printer, CheckCircle, Download, FileText } from 'lucide-react';

export default function GSTInvoiceModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const { payment, order, restaurant } = data;
  const rest = restaurant || {
    name: 'DineDesk Grand Bistro',
    tagline: 'Artisan Dining & Culinary Excellence',
    address: { street: '42 Heritage Boulevard, Indiranagar', city: 'Bengaluru', postalCode: '560038' },
    phone: '+91 80 4910 8899',
    taxSettings: { gstin: '29AABCB1234F1Z8', cgstRate: 2.5, sgstRate: 2.5 },
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Control Bar (Screen only) */}
        <div className="p-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-stone-100">Official GST Tax Receipt</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg text-xs transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-8 bg-stone-900 text-stone-100 overflow-y-auto space-y-6 text-xs print:p-0 print:bg-white print:text-black">
          {/* Restaurant Header */}
          <div className="text-center border-b border-stone-800 pb-5 print:border-gray-300">
            <h1 className="text-2xl font-bold font-display tracking-tight text-amber-400 print:text-black">
              {rest.name}
            </h1>
            <p className="text-[11px] text-stone-400 print:text-gray-600 italic mt-0.5">{rest.tagline}</p>
            <p className="text-[11px] text-stone-400 print:text-gray-600 mt-1">
              {rest.address?.street}, {rest.address?.city} - {rest.address?.postalCode}
            </p>
            <p className="text-[11px] text-stone-400 print:text-gray-600">
              Tel: {rest.phone} | GSTIN: <strong className="text-stone-200 print:text-black">{rest.taxSettings?.gstin}</strong>
            </p>
          </div>

          {/* Invoice Meta Grid */}
          <div className="grid grid-cols-2 gap-4 bg-stone-950/60 p-4 rounded-xl border border-stone-800 print:bg-gray-50 print:border-gray-200">
            <div>
              <p className="text-stone-400 print:text-gray-500">Invoice No:</p>
              <p className="font-bold text-stone-200 print:text-black text-sm">{payment.invoiceNumber}</p>
              <p className="text-stone-400 print:text-gray-500 mt-2">Date & Time:</p>
              <p className="text-stone-300 print:text-black">
                {new Date(payment.paymentDate || payment.createdAt).toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-stone-400 print:text-gray-500">Order Ref:</p>
              <p className="font-semibold text-stone-200 print:text-black">{order?.orderNumber || payment.orderNumber}</p>
              <p className="text-stone-400 print:text-gray-500 mt-2">Order Type & Table:</p>
              <p className="text-stone-300 print:text-black capitalize">
                {order?.orderType === 'dine_in' ? `Dine-In (${order.tableNumber || 'Table'})` : 'Takeaway / Pickup'}
              </p>
            </div>
          </div>

          {/* Customer & Staff Info */}
          <div className="flex justify-between px-1 text-stone-400 print:text-gray-600 text-[11px]">
            <span>Guest Name: <strong className="text-stone-200 print:text-black">{payment.customerName || order?.customerName || 'Walk-in Guest'}</strong></span>
            <span>Payment Mode: <strong className="text-amber-400 print:text-black uppercase">{payment.paymentMethod}</strong></span>
          </div>

          {/* Items Table */}
          <div className="border border-stone-800 rounded-xl overflow-hidden print:border-gray-300">
            <table className="w-full text-left">
              <thead className="bg-stone-950 print:bg-gray-100 text-[11px] text-stone-400 print:text-gray-700 uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Item Description</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Price</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 print:divide-gray-200">
                {order?.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-stone-800/30 print:hover:bg-transparent">
                    <td className="p-2.5">
                      <p className="font-medium text-stone-200 print:text-black">{item.name}</p>
                      {item.customizations?.length > 0 && (
                        <p className="text-[10px] text-stone-500 print:text-gray-500">
                          {item.customizations.map((c) => c.optionName).join(', ')}
                        </p>
                      )}
                    </td>
                    <td className="p-2.5 text-center text-stone-300 print:text-black">{item.quantity}</td>
                    <td className="p-2.5 text-right text-stone-400 print:text-gray-600">₹{item.unitPrice}</td>
                    <td className="p-2.5 text-right font-semibold text-stone-200 print:text-black">₹{item.itemTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bill Calculation Summary */}
          <div className="space-y-1.5 pt-2 border-t border-stone-800 print:border-gray-300 text-xs">
            <div className="flex justify-between text-stone-400 print:text-gray-600">
              <span>Item Subtotal</span>
              <span>₹{order?.subtotal || payment.amount}</span>
            </div>
            {order?.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 print:text-green-700">
                <span>Discount ({order.discountCode || 'Promo'})</span>
                <span>-₹{order.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-400 print:text-gray-600">
              <span>CGST (2.5%)</span>
              <span>₹{payment.taxDetails?.cgst || order?.cgstAmount || 0}</span>
            </div>
            <div className="flex justify-between text-stone-400 print:text-gray-600">
              <span>SGST (2.5%)</span>
              <span>₹{payment.taxDetails?.sgst || order?.sgstAmount || 0}</span>
            </div>
            <div className="pt-2 border-t border-stone-800 print:border-gray-300 flex justify-between font-bold text-base text-stone-100 print:text-black">
              <span>Total Amount Paid</span>
              <span className="text-amber-400 print:text-black">₹{payment.amount}</span>
            </div>
          </div>

          {/* Transaction Note */}
          <div className="p-3 bg-stone-950/80 rounded-lg border border-stone-800/80 print:bg-gray-50 print:border-gray-200 text-center space-y-1">
            <p className="text-[11px] text-stone-400 print:text-gray-600">
              Transaction Ref: <code className="text-stone-300 print:text-black">{payment.transactionReference}</code>
            </p>
            <p className="text-[11px] text-emerald-400 print:text-green-700 flex items-center justify-center gap-1 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" /> Payment Received In Full
            </p>
            <p className="text-[10px] text-stone-500 print:text-gray-500">
              Thank you for dining with DineDesk Grand Bistro. We look forward to welcoming you again!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
