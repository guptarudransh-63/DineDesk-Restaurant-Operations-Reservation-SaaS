import { RestaurantTable } from '../models/RestaurantTable.js';
import { TableSession } from '../models/TableSession.js';
import { Reservation } from '../models/Reservation.js';
import { Order } from '../models/Order.js';
import { emitEvent } from '../config/socket.js';
import { AuditLog } from '../models/AuditLog.js';

export const getTables = async (req, res, next) => {
  try {
    const { section, status } = req.query;
    const filter = {};
    if (section) filter.section = section;
    if (status) filter.status = status;

    const tables = await RestaurantTable.find(filter)
      .populate({
        path: 'activeSession',
        populate: [
          { path: 'activeOrders', select: 'orderNumber finalTotal paymentStatus orderStatus items' },
          { path: 'reservation', select: 'bookingReference customerName partySize date timeSlot' },
        ],
      })
      .populate('activeOrder', 'orderNumber finalTotal paymentStatus orderStatus items')
      .sort({ tableNumber: 1 });

    res.status(200).json({ success: true, count: tables.length, data: tables });
  } catch (error) {
    next(error);
  }
};

export const createTable = async (req, res, next) => {
  try {
    const { tableNumber, capacity, section, locationCoordinates } = req.body;
    if (!tableNumber || !capacity) {
      return res.status(400).json({ success: false, message: 'Table number and capacity are required.' });
    }

    const table = await RestaurantTable.create({
      tableNumber,
      capacity: Number(capacity),
      section: section || 'Main Dining',
      status: 'available',
      locationCoordinates: locationCoordinates || { x: 0, y: 0 },
    });

    emitEvent('table:status:updated', table);

    res.status(201).json({ success: true, data: table });
  } catch (error) {
    next(error);
  }
};

export const updateTableStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['available', 'reserved', 'occupied', 'cleaning', 'out_of_service'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid table status.' });
    }

    const table = await RestaurantTable.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found.' });
    }

    // If changing to available, clear active references
    if (status === 'available') {
      table.activeSession = null;
      table.activeOrder = null;
    }

    table.status = status;
    await table.save();

    const populated = await RestaurantTable.findById(table._id)
      .populate('activeSession')
      .populate('activeOrder');

    emitEvent('table:status:updated', populated);

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const seatGuests = async (req, res, next) => {
  try {
    const { reservationId, guestCount, customerName, notes } = req.body;
    const table = await RestaurantTable.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found.' });
    }

    if (table.status === 'occupied') {
      return res.status(400).json({ success: false, message: 'Table is already occupied.' });
    }

    const count = Number(guestCount) || table.capacity;

    // Create a new active TableSession
    const session = await TableSession.create({
      table: table._id,
      tableNumber: table.tableNumber,
      reservation: reservationId || null,
      guestCount: count,
      customerName: customerName || 'Walk-in Guest',
      startTime: new Date(),
      status: 'active',
      openedBy: req.user?._id || null,
      serverStaff: req.user?._id || null,
      notes: notes || '',
    });

    table.status = 'occupied';
    table.activeSession = session._id;
    await table.save();

    if (reservationId) {
      await Reservation.findByIdAndUpdate(reservationId, {
        status: 'seated',
        table: table._id,
        $push: {
          activityHistory: {
            status: 'seated',
            updatedBy: req.user?.name || 'Staff',
            note: `Seated at Table ${table.tableNumber}`,
          },
        },
      });
      emitEvent('reservation:updated', { reservationId, status: 'seated', tableNumber: table.tableNumber });
    }

    const populated = await RestaurantTable.findById(table._id).populate('activeSession');

    emitEvent('table:status:updated', populated);

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Staff',
      action: 'SEAT_TABLE',
      entityType: 'table',
      entityId: table._id.toString(),
      details: { tableNumber: table.tableNumber, guestCount: count, session: session._id },
    });

    res.status(200).json({ success: true, message: `Guests seated at Table ${table.tableNumber}`, data: populated });
  } catch (error) {
    next(error);
  }
};

export const closeTableSession = async (req, res, next) => {
  try {
    const { forceOverride } = req.body;
    const table = await RestaurantTable.findById(req.params.id).populate({
      path: 'activeSession',
      populate: { path: 'activeOrders' },
    });

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found.' });
    }

    if (!table.activeSession) {
      // Just set table to cleaning
      table.status = 'cleaning';
      await table.save();
      emitEvent('table:status:updated', table);
      return res.status(200).json({ success: true, data: table });
    }

    const session = table.activeSession;

    // Check if there are any unpaid active orders
    if (session.activeOrders && session.activeOrders.length > 0) {
      const unpaidOrders = session.activeOrders.filter(
        (o) => o.paymentStatus !== 'paid' && o.orderStatus !== 'cancelled'
      );

      if (unpaidOrders.length > 0 && !forceOverride) {
        return res.status(400).json({
          success: false,
          hasUnpaidBalance: true,
          message: `Cannot close table session: ${unpaidOrders.length} order(s) remain unpaid. Settle bill or request manager override.`,
          unpaidOrders: unpaidOrders.map((o) => ({
            id: o._id,
            orderNumber: o.orderNumber,
            total: o.finalTotal,
            status: o.paymentStatus,
          })),
        });
      }
    }

    // Close session
    session.status = 'closed';
    session.endTime = new Date();
    await session.save();

    // Mark table for cleaning
    table.status = 'cleaning';
    table.activeSession = null;
    table.activeOrder = null;
    await table.save();

    const updatedTable = await RestaurantTable.findById(table._id);

    emitEvent('table:status:updated', updatedTable);

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Staff',
      action: 'CLOSE_TABLE_SESSION',
      entityType: 'table',
      entityId: table._id.toString(),
      details: { tableNumber: table.tableNumber, sessionId: session._id, forced: !!forceOverride },
    });

    res.status(200).json({
      success: true,
      message: `Table ${table.tableNumber} session closed. Marked for cleaning.`,
      data: updatedTable,
    });
  } catch (error) {
    next(error);
  }
};

export const markTableCleaned = async (req, res, next) => {
  try {
    const table = await RestaurantTable.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found.' });
    }

    table.status = 'available';
    table.activeSession = null;
    table.activeOrder = null;
    await table.save();

    emitEvent('table:status:updated', table);

    res.status(200).json({ success: true, message: `Table ${table.tableNumber} is now available.`, data: table });
  } catch (error) {
    next(error);
  }
};
