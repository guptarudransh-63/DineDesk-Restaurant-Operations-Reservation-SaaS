import { KitchenTicket } from '../models/KitchenTicket.js';
import { Order } from '../models/Order.js';
import { emitEvent } from '../config/socket.js';
import { AuditLog } from '../models/AuditLog.js';

export const getKitchenTickets = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    } else {
      // By default show active tickets (not completed or cancelled)
      filter.status = { $in: ['new', 'accepted', 'preparing', 'ready'] };
    }

    const tickets = await KitchenTicket.find(filter)
      .populate('order', 'orderNumber orderType tableNumber pickupTime specialInstructions')
      .sort({ createdAt: 1 }); // Oldest first to honor order sequence

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicketStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket status.' });
    }

    const ticket = await KitchenTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Kitchen ticket not found.' });
    }

    ticket.status = status;
    ticket.handledBy = req.user?._id || ticket.handledBy;

    if (status === 'preparing' && !ticket.preparationStartTime) {
      ticket.preparationStartTime = new Date();
    } else if (status === 'ready' || status === 'completed') {
      ticket.completedTime = new Date();
      // If entire ticket is marked ready, mark all non-cancelled items ready as well
      if (status === 'ready') {
        ticket.items.forEach((item) => {
          if (item.status !== 'cancelled') item.status = 'ready';
        });
      }
    }

    await ticket.save();

    // Also sync the parent Order status
    if (ticket.order) {
      let mappedOrderStatus = null;
      if (status === 'accepted') mappedOrderStatus = 'accepted';
      else if (status === 'preparing') mappedOrderStatus = 'preparing';
      else if (status === 'ready') mappedOrderStatus = 'ready';
      else if (status === 'completed') mappedOrderStatus = 'completed';

      if (mappedOrderStatus) {
        await Order.findByIdAndUpdate(ticket.order, { orderStatus: mappedOrderStatus });
        emitEvent('order:updated', { _id: ticket.order, orderStatus: mappedOrderStatus });
        emitEvent(`order:${ticket.order}`, { orderStatus: mappedOrderStatus });
      }
    }

    emitEvent('kitchen:ticket:updated', ticket, 'kitchen');
    emitEvent('kitchen:ticket:updated', ticket); // Broadcast to staff too

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Chef',
      action: 'UPDATE_KITCHEN_TICKET',
      entityType: 'kitchen_ticket',
      entityId: ticket._id.toString(),
      details: { ticketNumber: ticket.ticketNumber, status },
    });

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

export const updateTicketItemStatus = async (req, res, next) => {
  try {
    const { itemIndex } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'ready', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid item status.' });
    }

    const ticket = await KitchenTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Kitchen ticket not found.' });
    }

    const idx = parseInt(itemIndex, 10);
    if (idx < 0 || idx >= ticket.items.length) {
      return res.status(400).json({ success: false, message: 'Item index out of bounds.' });
    }

    ticket.items[idx].status = status;

    // Check if all items in ticket are now ready
    const allReady = ticket.items.every(
      (item) => item.status === 'ready' || item.status === 'cancelled'
    );
    if (allReady && ticket.status !== 'ready') {
      ticket.status = 'ready';
      ticket.completedTime = new Date();
      if (ticket.order) {
        await Order.findByIdAndUpdate(ticket.order, { orderStatus: 'ready' });
        emitEvent('order:updated', { _id: ticket.order, orderStatus: 'ready' });
        emitEvent(`order:${ticket.order}`, { orderStatus: 'ready' });
      }
    } else if (status === 'preparing' && ticket.status === 'new') {
      ticket.status = 'preparing';
      ticket.preparationStartTime = new Date();
    }

    await ticket.save();

    emitEvent('kitchen:ticket:updated', ticket, 'kitchen');
    emitEvent('kitchen:ticket:updated', ticket);

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};
