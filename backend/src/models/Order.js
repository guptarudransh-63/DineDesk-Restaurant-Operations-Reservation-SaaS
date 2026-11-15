import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  customizations: [
    {
      groupName: String,
      optionName: String,
      extraPrice: { type: Number, default: 0 },
    },
  ],
  specialInstructions: {
    type: String,
    default: '',
  },
  itemTotal: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served', 'cancelled'],
    default: 'pending',
  },
  round: {
    type: Number,
    default: 1,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    orderType: {
      type: String,
      enum: ['dine_in', 'takeaway', 'pickup'],
      required: true,
      default: 'dine_in',
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RestaurantTable',
      default: null,
    },
    tableNumber: {
      type: String,
      default: null,
    },
    tableSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TableSession',
      default: null,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    customerName: {
      type: String,
      required: true,
      default: 'Guest',
    },
    customerPhone: {
      type: String,
      default: '',
    },
    customerEmail: {
      type: String,
      default: '',
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discountCode: {
      type: String,
      default: '',
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    cgstAmount: {
      type: Number,
      default: 0,
    },
    sgstAmount: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    finalTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid', 'refunded', 'cancelled'],
      default: 'unpaid',
    },
    orderStatus: {
      type: String,
      enum: ['placed', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'placed',
    },
    paymentMethod: {
      type: String,
      enum: ['pending', 'cash', 'upi', 'card', 'online'],
      default: 'pending',
    },
    pickupTime: {
      type: String,
      default: 'ASAP (~20 mins)',
    },
    specialInstructions: {
      type: String,
      default: '',
    },
    serverStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    currentRound: {
      type: Number,
      default: 1,
    },
    cancelledReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

orderSchema.index({ orderStatus: 1, paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
