import { Reservation } from '../models/Reservation.js';
import { RestaurantTable } from '../models/RestaurantTable.js';
import { Restaurant } from '../models/Restaurant.js';
import { emitEvent } from '../config/socket.js';
import { AuditLog } from '../models/AuditLog.js';

// Helper to calculate available slots for a given date and party size
export const checkAvailability = async (req, res, next) => {
  try {
    const { date, partySize } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Please provide a date (YYYY-MM-DD).' });
    }

    const guests = Number(partySize) || 2;
    const restaurant = (await Restaurant.findOne()) || {
      openingHours: { weekdayOpen: '11:30', weekdayClose: '23:30' },
      reservationDurationMinutes: 90,
      slotIntervalMinutes: 30,
    };

    // Find all active tables capable of seating this party size
    const suitableTables = await RestaurantTable.find({
      capacity: { $gte: guests },
      status: { $ne: 'out_of_service' },
    });

    if (suitableTables.length === 0) {
      return res.status(200).json({
        success: true,
        available: false,
        message: `No tables available that can accommodate ${guests} guests. Please call the restaurant directly.`,
        slots: [],
      });
    }

    // Generate daily time slots (e.g. 12:00 to 22:30 in 30-min steps)
    const slots = [];
    const startHour = 12;
    const endHour = 22;

    for (let h = startHour; h <= endHour; h++) {
      for (let m of [0, 30]) {
        if (h === endHour && m > 30) continue;
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }

    // Fetch existing reservations for this date that are not cancelled
    const existingReservations = await Reservation.find({
      date,
      status: { $in: ['pending', 'confirmed', 'seated'] },
    });

    // Check slot availability
    const slotAvailability = slots.map((slot) => {
      // Find tables already booked for this slot or overlapping within 90 minutes
      const [slotH, slotM] = slot.split(':').map(Number);
      const slotMinutes = slotH * 60 + slotM;

      const bookedTableIds = new Set();

      existingReservations.forEach((resv) => {
        const [resH, resM] = resv.timeSlot.split(':').map(Number);
        const resMinutes = resH * 60 + resM;
        // Check overlap within 90 minutes
        if (Math.abs(slotMinutes - resMinutes) < 90 && resv.table) {
          bookedTableIds.add(resv.table.toString());
        }
      });

      const freeTables = suitableTables.filter(
        (t) => !bookedTableIds.has(t._id.toString())
      );

      return {
        time: slot,
        available: freeTables.length > 0,
        availableTablesCount: freeTables.length,
      };
    });

    res.status(200).json({
      success: true,
      date,
      partySize: guests,
      totalSuitableTables: suitableTables.length,
      slots: slotAvailability,
    });
  } catch (error) {
    next(error);
  }
};

export const createReservation = async (req, res, next) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      date,
      timeSlot,
      partySize,
      specialRequests,
      occasion,
    } = req.body;

    if (!customerName || !customerPhone || !customerEmail || !date || !timeSlot || !partySize) {
      return res.status(400).json({ success: false, message: 'Please fill in all required reservation fields.' });
    }

    const guests = Number(partySize);

    // Find suitable tables
    const suitableTables = await RestaurantTable.find({
      capacity: { $gte: guests },
      status: { $ne: 'out_of_service' },
    }).sort({ capacity: 1 }); // Prefer smallest suitable table

    if (suitableTables.length === 0) {
      return res.status(400).json({
        success: false,
        message: `We cannot accommodate a party size of ${guests} online. Please contact restaurant directly.`,
      });
    }

    // Check existing reservations around that time
    const [reqH, reqM] = timeSlot.split(':').map(Number);
    const reqMinutes = reqH * 60 + reqM;

    const existingResvs = await Reservation.find({
      date,
      status: { $in: ['pending', 'confirmed', 'seated'] },
    });

    const bookedTableIds = new Set();
    existingResvs.forEach((r) => {
      const [rH, rM] = r.timeSlot.split(':').map(Number);
      const rMinutes = rH * 60 + rM;
      if (Math.abs(reqMinutes - rMinutes) < 90 && r.table) {
        bookedTableIds.add(r.table.toString());
      }
    });

    const availableTable = suitableTables.find((t) => !bookedTableIds.has(t._id.toString()));

    if (!availableTable) {
      return res.status(400).json({
        success: false,
        message: `Unfortunately, all tables are fully booked for ${guests} guests at ${timeSlot} on ${date}. Please try an alternate time slot.`,
      });
    }

    // Generate unique readable booking reference
    const bookingReference = `RES-${Math.floor(1000 + Math.random() * 9000)}`;

    const reservation = await Reservation.create({
      bookingReference,
      customer: req.user?._id || null,
      customerName,
      customerPhone,
      customerEmail: customerEmail.toLowerCase(),
      date,
      timeSlot,
      partySize: guests,
      table: availableTable._id,
      specialRequests: specialRequests || '',
      occasion: occasion || 'casual',
      status: 'confirmed',
      activityHistory: [
        {
          status: 'confirmed',
          updatedBy: req.user?.name || customerName,
          note: `Booking confirmed for Table ${availableTable.tableNumber}`,
        },
      ],
    });

    const populated = await Reservation.findById(reservation._id).populate('table', 'tableNumber capacity section');

    emitEvent('reservation:created', populated);

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || customerName,
      action: 'CREATE_RESERVATION',
      entityType: 'reservation',
      entityId: reservation._id.toString(),
      details: { bookingReference, date, timeSlot, partySize: guests, table: availableTable.tableNumber },
    });

    res.status(201).json({
      success: true,
      message: 'Reservation confirmed successfully!',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const getReservations = async (req, res, next) => {
  try {
    const { date, status, search } = req.query;
    const filter = {};

    if (date) filter.date = date;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { bookingReference: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const reservations = await Reservation.find(filter)
      .populate('table', 'tableNumber capacity section')
      .sort({ date: 1, timeSlot: 1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({
      $or: [{ customer: req.user._id }, { customerEmail: req.user.email.toLowerCase() }],
    })
      .populate('table', 'tableNumber capacity section')
      .sort({ date: -1, timeSlot: -1 });

    res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

export const getReservationByRefOrId = async (req, res, next) => {
  try {
    const query = req.params.idOrRef;
    let reservation = null;

    if (query.toUpperCase().startsWith('RES-')) {
      reservation = await Reservation.findOne({ bookingReference: query.toUpperCase() }).populate('table');
    } else {
      reservation = await Reservation.findById(query).populate('table');
    }

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    res.status(200).json({ success: true, data: reservation });
  } catch (error) {
    next(error);
  }
};

export const updateReservationStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid reservation status.' });
    }

    const reservation = await Reservation.findById(req.params.id).populate('table');
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    reservation.status = status;
    reservation.activityHistory.push({
      status,
      updatedBy: req.user?.name || 'Staff',
      note: note || `Status updated to ${status}`,
    });

    await reservation.save();

    emitEvent('reservation:updated', reservation);

    res.status(200).json({ success: true, data: reservation });
  } catch (error) {
    next(error);
  }
};

export const cancelReservation = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const query = req.params.idOrRef;

    let reservation = null;
    if (query.toUpperCase().startsWith('RES-')) {
      reservation = await Reservation.findOne({ bookingReference: query.toUpperCase() });
    } else {
      reservation = await Reservation.findById(query);
    }

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    if (reservation.status === 'completed' || reservation.status === 'seated') {
      return res.status(400).json({ success: false, message: `Cannot cancel a reservation that is already ${reservation.status}.` });
    }

    reservation.status = 'cancelled';
    reservation.cancellationReason = reason || 'Cancelled by user/guest';
    reservation.activityHistory.push({
      status: 'cancelled',
      updatedBy: req.user?.name || reservation.customerName,
      note: reason || 'Reservation cancelled',
    });

    await reservation.save();

    emitEvent('reservation:updated', reservation);

    res.status(200).json({ success: true, message: 'Reservation cancelled successfully.', data: reservation });
  } catch (error) {
    next(error);
  }
};
