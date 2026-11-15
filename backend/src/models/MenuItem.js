import mongoose from 'mongoose';

const customizationOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  extraPrice: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false },
});

const customizationGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isRequired: { type: Boolean, default: false },
  minSelect: { type: Number, default: 0 },
  maxSelect: { type: Number, default: 1 },
  options: [customizationOptionSchema],
});

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuCategory',
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    },
    dietary: {
      type: String,
      enum: ['veg', 'non-veg', 'vegan', 'gluten-free'],
      default: 'veg',
    },
    spiceLevel: {
      type: String,
      enum: ['none', 'mild', 'medium', 'spicy', 'extra-spicy'],
      default: 'medium',
    },
    isChefSpecial: {
      type: Boolean,
      default: false,
    },
    preparationTimeMinutes: {
      type: Number,
      default: 15,
    },
    availability: {
      type: String,
      enum: ['available', 'temporarily_unavailable', 'sold_out'],
      default: 'available',
    },
    customizationGroups: [customizationGroupSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

menuItemSchema.index({ category: 1, availability: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
