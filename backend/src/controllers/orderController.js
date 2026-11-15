import { Order } from '../models/Order.js';
import { MenuItem } from '../models/MenuItem.js';
import { RestaurantTable } from '../models/RestaurantTable.js';
import { TableSession } from '../models/TableSession.js';
import { KitchenTicket } from '../models/KitchenTicket.js';
import { Restaurant } from '../models/Restaurant.js';
import { emitEvent } from '../config/socket.js';
import { AuditLog } from '../models/AuditLog.js';

// Helper to compute tax and totals using configured restaurant GST rates
const calculateOrderTotals = async (items, discountPercent = 0) => {
  const restaurant = (await Restaurant.findOne()) || {
    taxSettings: { cgstRate: 2.5, sgstRate: 2.5 },
  };

  const cgstRate = restaurant.taxSettings?.cgstRate ?? 2.5;
  const sgstRate = restaurant.taxSettings?.sgstRate ?? 2.5;

  const subtotal = items.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
  const discountAmount = discountPercent > 0 ? (subtotal * discountPercent) / 100 : 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const cgstAmount = Math.round(((taxableAmount * cgstRate) / 100) * 100) / 100;
  const sgstAmount = Math.round(((taxableAmount * sgstRate) / 100) * 100) / 100;
  const taxAmount = cgstAmount + sgstAmount;
  const finalTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return { subtotal, discountAmount, discountPercent, cgstAmount, sgstAmount, taxAmount, finalTotal };
};

export const createOrder = async (req, res, next) => {
  try {
    const {
      orderType,
      tableId,
      items: rawItems,
      customerName,
      customerPhone,
      customerEmail,
      pickupTime,
      specialInstructions,
      paymentMethod,
      discountPercent,
    } = req.body;

    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
    }

    // Process and validate items against DB prices and availability
    const processedItems = [];
    for (const raw of rawItems) {
      const dbItem = await MenuItem.findById(raw.menuItemId);
      if (!dbItem || !dbItem.isActive) {
        return res.status(400).json({ success: false, message: `Menu item ${raw.name || raw.menuItemId} is not available.` });
      }

      if (dbItem.availability === 'sold_out') {
        return res.status(400).json({ success: false, message: `Dish "${dbItem.name}" is sold out.` });
      }

      const quantity = Math.max(1, Number(raw.quantity) || 1);
      const unitPrice = dbItem.price;

      // Calculate customization extra prices
      let extrasTotal = 0;
      const validCustomizations = (raw.customizations || []).map((c) => {
        const extraPrice = Number(c.extraPrice) || 0;
        extrasTotal += extraPrice;
        return {
          groupName: c.groupName || '',
          optionName: c.optionName || '',
          extraPrice,
        };
      });

      const singleItemPrice = unitPrice + extrasTotal;
      const itemTotal = singleItemPrice * quantity;

      processedItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        quantity,
        unitPrice,
        customizations: validCustomizations,
        specialInstructions: raw.specialInstructions || '',
        itemTotal,
        status: 'pending',
        round: 1,
      });
    }

    // Compute bill totals
    const totals = await calculateOrderTotals(processedItems, Number(discountPercent) || 0);

    // Generate unique order number: ORD-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const count = await Order.countDocuments();
    const orderNumber = `ORD-${currentYear}-${(count + 1).toString().padStart(4, '0')}`;

    let table = null;
    let tableSession = null;
    let tableNumber = null;

    if (orderType === 'dine_in') {
      if (!tableId) {
        return res.status(400).json({ success: false, message: 'Table is required for Dine-in orders.' });
      }

      table = await RestaurantTable.findById(tableId).populate('activeSession');
      if (!table) {
        return res.status(404).json({ success: false, message: 'Table not found.' });
      }

      tableNumber = table.tableNumber;

      // If table does not have an active session, start one
      if (!table.activeSession) {
        tableSession = await TableSession.create({
          table: table._id,
          tableNumber: table.tableNumber,
          guestCount: table.capacity,
          customerName: customerName || 'Dine-In Guest',
          startTime: new Date(),
          status: 'active',
          openedBy: req.user?._id || null,
        });
        table.activeSession = tableSession._id;
        table.status = 'occupied';
      } else {
        tableSession = table.activeSession;
      }
    }

    const order = await Order.create({
      orderNumber,
      orderType: orderType || 'dine_in',
      table: table ? table._id : null,
      tableNumber,
      tableSession: tableSession ? tableSession._id : null,
      customer: req.user?._id || null,
      customerName: customerName || req.user?.name || (orderType === 'dine_in' ? 'Table ' + tableNumber : 'Takeaway Guest'),
      customerPhone: customerPhone || req.user?.phone || '',
      customerEmail: customerEmail || req.user?.email || '',
      items: processedItems,
      ...totals,
      paymentStatus: 'unpaid',
      orderStatus: 'placed',
      paymentMethod: paymentMethod || 'pending',
      pickupTime: pickupTime || 'ASAP (~20 mins)',
      specialInstructions: specialInstructions || '',
      serverStaff: req.user?._id || null,
      currentRound: 1,
    });

    // Update table active references
    if (table) {
      table.activeOrder = order._id;
      await table.save();

      if (tableSession) {
        await TableSession.findByIdAndUpdate(tableSession._id, {
          $addToSet: { activeOrders: order._id },
        });
      }
    }

    // Create Kitchen Ticket for this order
    const ticketCount = await KitchenTicket.countDocuments();
    const ticketNumber = `K-${(ticketCount + 1).toString().padStart(3, '0')}`;

    const kitchenTicket = await KitchenTicket.create({
      ticketNumber,
      order: order._id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      tableNumber: tableNumber || 'Takeaway',
      round: 1,
      items: processedItems.map((item, idx) => ({
        itemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        customizations: item.customizations,
        specialInstructions: item.specialInstructions,
        status: 'pending',
      })),
      status: 'new',
      priority: 'normal',
      notes: specialInstructions || '',
    });

    // Real-time broadcasts
    emitEvent('order:created', order);
    emitEvent('kitchen:ticket:new', kitchenTicket, 'kitchen');
    emitEvent('kitchen:ticket:new', kitchenTicket); // Also broadcast to staff

    if (table) {
      const updatedTable = await RestaurantTable.findById(table._id)
        .populate('activeSession')
        .populate('activeOrder');
      emitEvent('table:status:updated', updatedTable);
    }

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || customerName || 'Guest',
      action: 'CREATE_ORDER',
      entityType: 'order',
      entityId: order._id.toString(),
      details: { orderNumber, type: order.orderType, total: order.finalTotal, tableNumber },
    });

    res.status(201).json({
      success: true,
      message: 'Order created and sent to kitchen!',
      data: order,
      kitchenTicket,
    });
  } catch (error) {
    next(error);
  }
};

export const addItemsToOrder = async (req, res, next) => {
  try {
    const { items: newRawItems, specialInstructions } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (['completed', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: `Cannot add items to a ${order.orderStatus} order.` });
    }

    const nextRound = (order.currentRound || 1) + 1;
    const newProcessedItems = [];

    for (const raw of newRawItems) {
      const dbItem = await MenuItem.findById(raw.menuItemId);
      if (!dbItem || !dbItem.isActive) {
        return res.status(400).json({ success: false, message: `Dish "${raw.name}" not found.` });
      }

      const quantity = Math.max(1, Number(raw.quantity) || 1);
      const unitPrice = dbItem.price;

      let extrasTotal = 0;
      const validCustomizations = (raw.customizations || []).map((c) => {
        const extraPrice = Number(c.extraPrice) || 0;
        extrasTotal += extraPrice;
        return {
          groupName: c.groupName || '',
          optionName: c.optionName || '',
          extraPrice,
        };
      });

      const singleItemPrice = unitPrice + extrasTotal;
      const itemTotal = singleItemPrice * quantity;

      newProcessedItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        quantity,
        unitPrice,
        customizations: validCustomizations,
        specialInstructions: raw.specialInstructions || '',
        itemTotal,
        status: 'pending',
        round: nextRound,
      });
    }

    // Append to existing items
    order.items.push(...newProcessedItems);
    order.currentRound = nextRound;

    // Recalculate bill
    const totals = await calculateOrderTotals(order.items, order.discountPercent);
    Object.assign(order, totals);
    await order.save();

    // Create a new Kitchen Ticket specifically for Round N additions
    const ticketCount = await KitchenTicket.countDocuments();
    const ticketNumber = `K-${(ticketCount + 1).toString().padStart(3, '0')}`;

    const kitchenTicket = await KitchenTicket.create({
      ticketNumber,
      order: order._id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      tableNumber: order.tableNumber || 'Takeaway',
      round: nextRound,
      items: newProcessedItems.map((item) => ({
        itemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        customizations: item.customizations,
        specialInstructions: item.specialInstructions,
        status: 'pending',
      })),
      status: 'new',
      priority: 'rush', // Add-on rounds are prioritized
      notes: specialInstructions || `Add-on Round ${nextRound}`,
    });

    emitEvent('order:updated', order);
    emitEvent('kitchen:ticket:new', kitchenTicket, 'kitchen');
    emitEvent('kitchen:ticket:new', kitchenTicket);

    res.status(200).json({
      success: true,
      message: `Round ${nextRound} items submitted to kitchen!`,
      data: order,
      kitchenTicket,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const { orderType, orderStatus, paymentStatus, search, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (orderType) filter.orderType = orderType;
    if (orderStatus) filter.orderStatus = orderStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { tableNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const orders = await Order.find(filter)
      .populate('table', 'tableNumber section capacity')
      .populate('tableSession')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      $or: [{ customer: req.user._id }, { customerEmail: req.user.email.toLowerCase() }],
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const query = req.params.id;
    let order = null;

    if (query.toUpperCase().startsWith('ORD-')) {
      order = await Order.findOne({ orderNumber: query.toUpperCase() })
        .populate('table')
        .populate('tableSession');
    } else {
      order = await Order.findById(query)
        .populate('table')
        .populate('tableSession');
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, notes } = req.body;
    const validStatuses = ['placed', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.orderStatus = orderStatus;
    if (orderStatus === 'cancelled' && notes) {
      order.cancelledReason = notes;
    }
    await order.save();

    emitEvent('order:updated', order);
    emitEvent(`order:${order._id}`, { orderStatus, order });

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const applyDiscount = async (req, res, next) => {
  try {
    const { discountCode, discountPercent } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    let percent = Number(discountPercent) || 0;
    let code = discountCode || 'MANUAL_DISCOUNT';

    if (discountCode) {
      const codeUpper = discountCode.toUpperCase().trim();
      if (codeUpper === 'WELCOME10') percent = 10;
      else if (codeUpper === 'CHEF15') percent = 15;
      else if (codeUpper === 'VIP20') percent = 20;
      else if (codeUpper === 'FESTIVE25') percent = 25;
      else if (!discountPercent) {
        return res.status(400).json({ success: false, message: 'Invalid promo code. Try WELCOME10 or CHEF15.' });
      }
      code = codeUpper;
    }

    const totals = await calculateOrderTotals(order.items, percent);
    order.discountCode = code;
    Object.assign(order, totals);
    await order.save();

    emitEvent('order:updated', order);

    res.status(200).json({
      success: true,
      message: `${percent}% discount applied!`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const requestBill = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('table');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.tableSession) {
      await TableSession.findByIdAndUpdate(order.tableSession, {
        status: 'bill_requested',
      });
    }

    emitEvent('order:bill_requested', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      total: order.finalTotal,
    });

    res.status(200).json({ success: true, message: 'Bill requested for table.', data: order });
  } catch (error) {
    next(error);
  }
};
