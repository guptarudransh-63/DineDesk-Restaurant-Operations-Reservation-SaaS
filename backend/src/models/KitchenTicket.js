import mongoose from 'mongoose';

const kitchenItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
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
  customizations: [
    {
      groupName: String,
      optionName: String,
    },
  ],
  specialInstructions: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served', 'cancelled'],
    default: 'pending',
  },
});

const kitchenTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    orderType: {
      type: String,
      enum: ['dine_in', 'takeaway', 'pickup'],
      required: true,
    },
    tableNumber: {
      type: String,
      default: 'Takeaway',
    },
    round: {
      type: Number,
      default: 1,
    },
    items: [kitchenItemSchema],
    status: {
      type: String,
      enum: ['new', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'new',
    },
    priority: {
      type: String,
      enum: ['normal', 'rush'],
      default: 'normal',
    },
    notes: {
      type: String,
      default: '',
    },
    preparationStartTime: {
      type: Date,
      default: null,
    },
    completedTime: {
      type: Date,
      default: null,
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

kitchenTicketSchema.index({ status: 1, createdAt: 1 });

export const KitchenTicket = mongoose.model('KitchenTicket', kitchenTicketSchema);
