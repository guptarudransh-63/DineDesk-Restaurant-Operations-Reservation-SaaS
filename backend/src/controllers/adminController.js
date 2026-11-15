import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Reservation } from '../models/Reservation.js';
import { RestaurantTable } from '../models/RestaurantTable.js';
import { KitchenTicket } from '../models/KitchenTicket.js';
import { User } from '../models/User.js';
import { Restaurant } from '../models/Restaurant.js';
import { AuditLog } from '../models/AuditLog.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Paid orders count and revenue
    const paidOrders = await Order.find({ paymentStatus: 'paid' });
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.finalTotal || 0), 0);
    const totalOrdersCount = await Order.countDocuments();
    const avgOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;

    // Dine-in vs Takeaway revenue
    const dineInRevenue = paidOrders
      .filter((o) => o.orderType === 'dine_in')
      .reduce((sum, o) => sum + (o.finalTotal || 0), 0);
    const takeawayRevenue = paidOrders
      .filter((o) => o.orderType !== 'dine_in')
      .reduce((sum, o) => sum + (o.finalTotal || 0), 0);

    // Active orders & kitchen tickets
    const activeOrdersCount = await Order.countDocuments({
      orderStatus: { $in: ['placed', 'accepted', 'preparing', 'ready'] },
    });
    const pendingKitchenTickets = await KitchenTicket.countDocuments({
      status: { $in: ['new', 'accepted', 'preparing'] },
    });

    // Reservations
    const totalReservations = await Reservation.countDocuments();
    const todayReservations = await Reservation.countDocuments({
      createdAt: { $gte: today },
    });

    // Tables
    const totalTables = await RestaurantTable.countDocuments();
    const occupiedTables = await RestaurantTable.countDocuments({ status: 'occupied' });
    const reservedTables = await RestaurantTable.countDocuments({ status: 'reserved' });

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrdersCount,
        avgOrderValue,
        dineInRevenue,
        takeawayRevenue,
        activeOrdersCount,
        pendingKitchenTickets,
        totalReservations,
        todayReservations,
        tables: {
          total: totalTables,
          occupied: occupiedTables,
          reserved: reservedTables,
          available: totalTables - (occupiedTables + reservedTables),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;

    let days = 30;
    if (range === 'today') days = 1;
    else if (range === '7d') days = 7;
    else if (range === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Fetch valid paid orders in date range
    const orders = await Order.find({
      createdAt: { $gte: startDate },
      paymentStatus: 'paid',
    }).populate('items.menuItemId', 'category name');

    // 1. Revenue & Orders Over Time (group by date)
    const dailyMap = {};
    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(5, 10); // MM-DD
      dailyMap[key] = { date: key, revenue: 0, orders: 0, dineIn: 0, takeaway: 0 };
    }

    orders.forEach((o) => {
      const key = new Date(o.createdAt).toISOString().slice(5, 10);
      if (dailyMap[key]) {
        dailyMap[key].revenue += Math.round(o.finalTotal);
        dailyMap[key].orders += 1;
        if (o.orderType === 'dine_in') {
          dailyMap[key].dineIn += Math.round(o.finalTotal);
        } else {
          dailyMap[key].takeaway += Math.round(o.finalTotal);
        }
      }
    });

    const revenueOverTime = Object.values(dailyMap);

    // 2. Orders by Type
    const typeCounts = { dine_in: 0, takeaway: 0, pickup: 0 };
    orders.forEach((o) => {
      typeCounts[o.orderType] = (typeCounts[o.orderType] || 0) + 1;
    });
    const ordersByType = [
      { name: 'Dine-In', value: typeCounts.dine_in || 0, color: '#f59e0b' },
      { name: 'Takeaway', value: typeCounts.takeaway || 0, color: '#10b981' },
      { name: 'Curbside Pickup', value: typeCounts.pickup || 0, color: '#6366f1' },
    ];

    // 3. Top Selling Dishes
    const itemMap = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemMap[item.name].quantity += item.quantity;
        itemMap[item.name].revenue += item.itemTotal;
      });
    });

    const topSellingDishes = Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 7);

    // 4. Payment Method Breakdown
    const paymentMethodsMap = { cash: 0, upi: 0, card: 0, online: 0 };
    orders.forEach((o) => {
      const method = o.paymentMethod || 'cash';
      paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + Math.round(o.finalTotal);
    });
    const paymentDistribution = [
      { name: 'UPI', value: paymentMethodsMap.upi || 0, color: '#10b981' },
      { name: 'Credit / Debit Card', value: paymentMethodsMap.card || 0, color: '#3b82f6' },
      { name: 'Cash', value: paymentMethodsMap.cash || 0, color: '#f59e0b' },
      { name: 'Online Portal', value: paymentMethodsMap.online || 0, color: '#8b5cf6' },
    ];

    // 5. Hourly Ordering Distribution
    const hourlyMap = {};
    for (let h = 11; h <= 23; h++) {
      const label = `${h}:00`;
      hourlyMap[label] = { hour: label, count: 0 };
    }
    orders.forEach((o) => {
      const hour = new Date(o.createdAt).getHours();
      const label = `${hour}:00`;
      if (hourlyMap[label]) {
        hourlyMap[label].count += 1;
      }
    });
    const peakHours = Object.values(hourlyMap);

    res.status(200).json({
      success: true,
      range,
      totalOrdersInRange: orders.length,
      revenueOverTime,
      ordersByType,
      topSellingDishes,
      paymentDistribution,
      peakHours,
    });
  } catch (error) {
    next(error);
  }
};

export const getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({
      role: { $in: ['admin', 'manager', 'waiter', 'kitchen', 'cashier'] },
    }).select('-password').sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: staff.length, data: staff });
  } catch (error) {
    next(error);
  }
};

export const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, password, and role.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      phone: phone || '',
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateStaffStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (req, res, next) => {
  try {
    let restaurant = await Restaurant.findOne();
    if (!restaurant) {
      restaurant = await Restaurant.create({});
    }
    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    let restaurant = await Restaurant.findOne();
    if (!restaurant) {
      restaurant = await Restaurant.create(req.body);
    } else {
      Object.assign(restaurant, req.body);
      await restaurant.save();
    }
    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};
