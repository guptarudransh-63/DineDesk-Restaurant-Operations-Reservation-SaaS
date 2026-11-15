import { Payment } from '../models/Payment.js';
import { Order } from '../models/Order.js';
import { RestaurantTable } from '../models/RestaurantTable.js';
import { TableSession } from '../models/TableSession.js';
import { Restaurant } from '../models/Restaurant.js';
import { emitEvent } from '../config/socket.js';
import { AuditLog } from '../models/AuditLog.js';

export const processPayment = async (req, res, next) => {
  try {
    const { orderId, amount, paymentMethod, transactionReference } = req.body;

    if (!orderId || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Order ID and payment method are required.' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'This order is already fully paid.' });
    }

    const paidAmount = Number(amount) || order.finalTotal;

    // Generate unique invoice number: INV-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const count = await Payment.countDocuments();
    const invoiceNumber = `INV-${currentYear}-${(count + 1).toString().padStart(4, '0')}`;

    const payment = await Payment.create({
      order: order._id,
      orderNumber: order.orderNumber,
      invoiceNumber,
      amount: paidAmount,
      paymentMethod,
      transactionReference: transactionReference || `${paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`,
      status: 'paid',
      taxDetails: {
        cgst: order.cgstAmount,
        sgst: order.sgstAmount,
        totalTax: order.taxAmount,
      },
      customerName: order.customerName,
      recordedBy: req.user?._id || null,
      paymentDate: new Date(),
    });

    order.paymentStatus = 'paid';
    order.paymentMethod = paymentMethod;
    if (order.orderStatus !== 'cancelled') {
      order.orderStatus = 'completed';
    }
    await order.save();

    // If dine-in, close the table session and mark table for cleaning
    if (order.table) {
      const table = await RestaurantTable.findById(order.table);
      if (table) {
        if (table.activeSession) {
          await TableSession.findByIdAndUpdate(table.activeSession, {
            status: 'closed',
            endTime: new Date(),
          });
        }
        table.status = 'cleaning';
        table.activeSession = null;
        table.activeOrder = null;
        await table.save();

        const populatedTable = await RestaurantTable.findById(table._id);
        emitEvent('table:status:updated', populatedTable);
      }
    }

    emitEvent('order:updated', order);
    emitEvent('payment:recorded', payment);

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Cashier',
      action: 'PROCESS_PAYMENT',
      entityType: 'payment',
      entityId: payment._id.toString(),
      details: { invoiceNumber, amount: paidAmount, method: paymentMethod, orderNumber: order.orderNumber },
    });

    const restaurant = await Restaurant.findOne();

    res.status(201).json({
      success: true,
      message: 'Payment recorded and invoice generated successfully!',
      data: {
        payment,
        order,
        restaurant,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const { paymentMethod, status, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const payments = await Payment.find(filter)
      .populate('order')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoice = async (req, res, next) => {
  try {
    const invoiceNumber = req.params.invoiceNumber.toUpperCase();
    const payment = await Payment.findOne({ invoiceNumber }).populate({
      path: 'order',
      populate: { path: 'table' },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const restaurant = await Restaurant.findOne();

    res.status(200).json({
      success: true,
      data: {
        payment,
        order: payment.order,
        restaurant,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refundPayment = async (req, res, next) => {
  try {
    const { refundReason, refundAmount } = req.body;
    const payment = await Payment.findById(req.params.id).populate('order');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (payment.status === 'refunded') {
      return res.status(400).json({ success: false, message: 'This payment has already been refunded.' });
    }

    payment.status = 'refunded';
    payment.refundReason = refundReason || 'Customer requested refund';
    payment.refundAmount = Number(refundAmount) || payment.amount;
    await payment.save();

    if (payment.order) {
      await Order.findByIdAndUpdate(payment.order._id, {
        paymentStatus: 'refunded',
      });
    }

    emitEvent('payment:refunded', payment);

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Manager',
      action: 'REFUND_PAYMENT',
      entityType: 'payment',
      entityId: payment._id.toString(),
      details: { invoiceNumber: payment.invoiceNumber, amount: payment.refundAmount, reason: payment.refundReason },
    });

    res.status(200).json({ success: true, message: 'Payment refunded successfully.', data: payment });
  } catch (error) {
    next(error);
  }
};
