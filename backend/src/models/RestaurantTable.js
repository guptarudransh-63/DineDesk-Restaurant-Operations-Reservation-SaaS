import mongoose from 'mongoose';

const restaurantTableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    section: {
      type: String,
      enum: ['Main Dining', 'Terrace', 'Private Dining', 'Bar Lounge'],
      default: 'Main Dining',
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'occupied', 'cleaning', 'out_of_service'],
      default: 'available',
    },
    activeSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TableSession',
      default: null,
    },
    activeOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    locationCoordinates: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const RestaurantTable = mongoose.model('RestaurantTable', restaurantTableSchema);
