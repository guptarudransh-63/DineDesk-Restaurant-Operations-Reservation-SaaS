import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    date: {
      type: String, // YYYY-MM-DD format for exact matching without timezone drift
      required: true,
    },
    timeSlot: {
      type: String, // e.g. "19:00"
      required: true,
    },
    partySize: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RestaurantTable',
      default: null,
    },
    specialRequests: {
      type: String,
      default: '',
    },
    occasion: {
      type: String,
      enum: ['casual', 'birthday', 'anniversary', 'date', 'business', 'celebration', 'other'],
      default: 'casual',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'],
      default: 'confirmed',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    activityHistory: [
      {
        status: String,
        updatedBy: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

reservationSchema.index({ date: 1, timeSlot: 1, status: 1 });
reservationSchema.index({ customerPhone: 1, customerEmail: 1 });

export const Reservation = mongoose.model('Reservation', reservationSchema);
