import { MenuCategory } from '../models/MenuCategory.js';
import { MenuItem } from '../models/MenuItem.js';
import { emitEvent } from '../config/socket.js';
import { AuditLog } from '../models/AuditLog.js';

export const getMenu = async (req, res, next) => {
  try {
    const { category, dietary, availability, search, chefSpecial } = req.query;

    const filter = { isActive: true };

    if (category) {
      const catDoc = await MenuCategory.findOne({ slug: category });
      if (catDoc) {
        filter.category = catDoc._id;
      }
    }

    if (dietary) {
      filter.dietary = dietary;
    }

    if (availability) {
      filter.availability = availability;
    }

    if (chefSpecial === 'true') {
      filter.isChefSpecial = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await MenuItem.find(filter)
      .populate('category', 'name slug displayOrder')
      .sort({ price: 1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await MenuCategory.find({ isActive: true }).sort({ displayOrder: 1 });
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const getItemById = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate('category');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (req, res, next) => {
  try {
    const {
      name,
      description,
      categoryId,
      price,
      image,
      dietary,
      spiceLevel,
      isChefSpecial,
      preparationTimeMinutes,
      availability,
      customizationGroups,
    } = req.body;

    if (!name || !categoryId || price === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide name, categoryId, and price.' });
    }

    const item = await MenuItem.create({
      name,
      description,
      category: categoryId,
      price: Number(price),
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      dietary: dietary || 'veg',
      spiceLevel: spiceLevel || 'medium',
      isChefSpecial: !!isChefSpecial,
      preparationTimeMinutes: Number(preparationTimeMinutes) || 15,
      availability: availability || 'available',
      customizationGroups: customizationGroups || [],
    });

    const populated = await MenuItem.findById(item._id).populate('category');

    emitEvent('menu:item:created', populated);

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Staff',
      action: 'CREATE_MENU_ITEM',
      entityType: 'menu_item',
      entityId: item._id.toString(),
      details: { name: item.name, price: item.price },
    });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    emitEvent('menu:item:updated', item);

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;
    if (!['available', 'temporarily_unavailable', 'sold_out'].includes(availability)) {
      return res.status(400).json({ success: false, message: 'Invalid availability status.' });
    }

    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { availability },
      { new: true }
    ).populate('category');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    emitEvent('menu:availability:changed', {
      itemId: item._id,
      name: item.name,
      availability: item.availability,
    });

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    emitEvent('menu:item:archived', { itemId: item._id });

    res.status(200).json({ success: true, message: 'Menu item archived successfully' });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, displayOrder, icon } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const category = await MenuCategory.create({
      name,
      slug: generatedSlug,
      description: description || '',
      displayOrder: displayOrder || 0,
      icon: icon || 'Utensils',
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};
