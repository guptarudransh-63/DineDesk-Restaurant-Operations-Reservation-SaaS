import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: 'DineDesk Grand Bistro',
    },
    tagline: {
      type: String,
      default: 'Artisan Dining & Culinary Excellence',
    },
    description: {
      type: String,
      default: 'Where classic hospitality meets modern culinary flair. Hand-crafted flavours, organic ingredients, and curated beverages in an enchanting setting.',
    },
    address: {
      street: { type: String, default: '42 Heritage Boulevard, Indiranagar' },
      city: { type: String, default: 'Bengaluru' },
      state: { type: String, default: 'Karnataka' },
      postalCode: { type: String, default: '560038' },
      country: { type: String, default: 'India' },
    },
    phone: {
      type: String,
      default: '+91 80 4910 8899',
    },
    email: {
      type: String,
      default: 'reservations@dinedesk.com',
    },
    openingHours: {
      weekdayOpen: { type: String, default: '11:30' },
      weekdayClose: { type: String, default: '23:30' },
      weekendOpen: { type: String, default: '11:00' },
      weekendClose: { type: String, default: '00:30' },
    },
    taxSettings: {
      gstin: { type: String, default: '29AABCB1234F1Z8' },
      cgstRate: { type: Number, default: 2.5 }, // 2.5% CGST
      sgstRate: { type: Number, default: 2.5 }, // 2.5% SGST
      serviceChargeRate: { type: Number, default: 0 },
      isTaxInclusive: { type: Boolean, default: false },
    },
    currency: {
      code: { type: String, default: 'INR' },
      symbol: { type: String, default: '₹' },
    },
    reservationDurationMinutes: {
      type: Number,
      default: 90,
    },
    slotIntervalMinutes: {
      type: Number,
      default: 30,
    },
  },
  { timestamps: true }
);

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
