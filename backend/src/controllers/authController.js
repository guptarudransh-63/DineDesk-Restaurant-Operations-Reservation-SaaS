import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'dinedesk_super_secret_jwt_key_2026', {
    expiresIn: '30d',
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Only allow setting staff roles if requester is admin; otherwise default to customer
    let assignedRole = 'customer';
    if (role && ['admin', 'manager', 'waiter', 'kitchen', 'cashier'].includes(role)) {
      if (req.user && req.user.role === 'admin') {
        assignedRole = role;
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: assignedRole,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact manager.' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDemoUsers = async (req, res, next) => {
  try {
    const demoAccounts = [
      { role: 'admin', name: 'Rajesh Sharma (Admin)', email: 'admin@dinedesk.com', password: 'password123', description: 'Full access to Settings, Menu, Staff, Reports & Floor' },
      { role: 'manager', name: 'Priya Mehta (Manager)', email: 'manager@dinedesk.com', password: 'password123', description: 'Floor management, Reservations, Orders & Menu' },
      { role: 'waiter', name: 'Rohan Verma (Captain/Waiter)', email: 'waiter@dinedesk.com', password: 'password123', description: 'Table seating, Dine-in ordering & Bill requests' },
      { role: 'kitchen', name: 'Chef Sanjeev (Head Chef)', email: 'chef@dinedesk.com', password: 'password123', description: 'Kitchen Display System (KDS), Ticket prep status' },
      { role: 'cashier', name: 'Aakash Kapoor (Cashier)', email: 'cashier@dinedesk.com', password: 'password123', description: 'Billing checkout, Split bills, GST receipts, Payments' },
      { role: 'customer', name: 'Ananya Iyer (Food Lover)', email: 'customer@dinedesk.com', password: 'password123', description: 'Menu browsing, Online takeaway checkout & Table reservation' },
    ];
    res.status(200).json({ success: true, demoAccounts });
  } catch (error) {
    next(error);
  }
};
