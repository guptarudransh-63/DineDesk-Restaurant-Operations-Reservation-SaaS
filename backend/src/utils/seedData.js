import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Restaurant } from '../models/Restaurant.js';
import { MenuCategory } from '../models/MenuCategory.js';
import { MenuItem } from '../models/MenuItem.js';
import { RestaurantTable } from '../models/RestaurantTable.js';
import { Reservation } from '../models/Reservation.js';
import { TableSession } from '../models/TableSession.js';
import { Order } from '../models/Order.js';
import { KitchenTicket } from '../models/KitchenTicket.js';
import { Payment } from '../models/Payment.js';
import { AuditLog } from '../models/AuditLog.js';
import { generateDummyOperations } from './generateDummyOperations.js';

export const seedDatabase = async ({ force = false } = {}) => {
  try {
    console.log('--- Starting DineDesk Database Seeding ---');

    const shouldForce =
      force ||
      process.argv.includes('--force') ||
      process.argv.includes('-f') ||
      process.env.FORCE_SEED === 'true';

    // Check if data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0 && !shouldForce) {
      console.log('Database already has data. Skipping full reset. (Run with --force or npm run seed:force to overwrite, or npm run seed:append to add more dummy data)');
      return;
    }

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Restaurant.deleteMany({}),
      MenuCategory.deleteMany({}),
      MenuItem.deleteMany({}),
      RestaurantTable.deleteMany({}),
      Reservation.deleteMany({}),
      TableSession.deleteMany({}),
      Order.deleteMany({}),
      KitchenTicket.deleteMany({}),
      Payment.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    // 1. Restaurant Details
    const restaurant = await Restaurant.create({
      name: 'DineDesk Grand Bistro',
      tagline: 'Artisan Dining & Culinary Excellence',
      description: 'An elevated dining destination crafting artisanal culinary wonders with sustainable local produce, heritage spices, and warm hospitality.',
      address: {
        street: '42 Heritage Boulevard, 100 Feet Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        country: 'India',
      },
      phone: '+91 80 4910 8899',
      email: 'concierge@dinedesk.com',
      openingHours: {
        weekdayOpen: '11:30',
        weekdayClose: '23:30',
        weekendOpen: '11:00',
        weekendClose: '00:30',
      },
      taxSettings: {
        gstin: '29AABCB1234F1Z8',
        cgstRate: 2.5,
        sgstRate: 2.5,
        serviceChargeRate: 0,
        isTaxInclusive: false,
      },
      currency: {
        code: 'INR',
        symbol: '₹',
      },
      reservationDurationMinutes: 90,
      slotIntervalMinutes: 30,
    });

    // 2. Users (all roles with password123)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = await User.insertMany([
      { name: 'Rajesh Sharma', email: 'admin@dinedesk.com', password: hashedPassword, role: 'admin', phone: '+91 98450 11001' },
      { name: 'Priya Mehta', email: 'manager@dinedesk.com', password: hashedPassword, role: 'manager', phone: '+91 98450 11002' },
      { name: 'Chef Sanjeev', email: 'chef@dinedesk.com', password: hashedPassword, role: 'kitchen', phone: '+91 98450 11003' },
      { name: 'Rohan Verma', email: 'waiter@dinedesk.com', password: hashedPassword, role: 'waiter', phone: '+91 98450 11004' },
      { name: 'Kavita Nair', email: 'kavita@dinedesk.com', password: hashedPassword, role: 'waiter', phone: '+91 98450 11008' },
      { name: 'Aakash Kapoor', email: 'cashier@dinedesk.com', password: hashedPassword, role: 'cashier', phone: '+91 98450 11005' },
      { name: 'Ananya Iyer', email: 'customer@dinedesk.com', password: hashedPassword, role: 'customer', phone: '+91 98450 11006' },
      { name: 'Vikram Sengupta', email: 'vikram@example.com', password: hashedPassword, role: 'customer', phone: '+91 98450 11007' },
      { name: 'Aarav Mehta', email: 'aarav@example.com', password: hashedPassword, role: 'customer', phone: '+91 98331 22334' },
      { name: 'Sneha Reddy', email: 'sneha.reddy@gmail.com', password: hashedPassword, role: 'customer', phone: '+91 97410 88776' },
    ]);

    const [adminUser, managerUser, chefUser, waiterUser, kavitaUser, cashierUser, customerUser, vikramUser, aaravUser, snehaUser] = users;

    // 3. Menu Categories
    const categoriesData = [
      { name: 'Appetizers & Starters', slug: 'starters', description: 'Crisp, fiery and delicate bites to ignite your palate', displayOrder: 1, icon: 'Flame' },
      { name: 'Main Course Gourmet', slug: 'main-course', description: 'Signature heritage curries, clay-pot braises and European classics', displayOrder: 2, icon: 'Soup' },
      { name: 'Biryani & Rice Bowls', slug: 'biryani-rice', description: 'Slow-cooked Dum biryanis, aromatic saffron basmati and wok tosses', displayOrder: 3, icon: 'Wheat' },
      { name: 'Wood-fired Pizza & Pasta', slug: 'pizza-pasta', description: '48-hour fermented sourdough pizzas and handmade bronze-cut pastas', displayOrder: 4, icon: 'Pizza' },
      { name: 'Artisan Desserts', slug: 'desserts', description: 'Decadent confections, warm puddings and signature churned gelatos', displayOrder: 5, icon: 'Cake' },
      { name: 'Craft Beverages & Cocktails', slug: 'beverages', description: 'Cold-pressed botanical sodas, iced coffees and artisanal mocktails', displayOrder: 6, icon: 'Coffee' },
      { name: "Chef's Tasting Specials", slug: 'specials', description: 'Limited-edition seasonal creations curated by Chef Sanjeev', displayOrder: 7, icon: 'Sparkles' },
    ];

    const categories = await MenuCategory.insertMany(categoriesData);
    const catMap = {};
    categories.forEach((c) => { catMap[c.slug] = c._id; });

    // 4. Menu Items (35+ diverse items with high-res images and customizations)
    const portionCustomization = {
      name: 'Portion Size',
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
      options: [
        { name: 'Regular Portion', extraPrice: 0, isDefault: true },
        { name: 'Large Sharing Platter', extraPrice: 160 },
      ],
    };

    const cheeseCustomization = {
      name: 'Gourmet Add-ons',
      isRequired: false,
      minSelect: 0,
      maxSelect: 2,
      options: [
        { name: 'Truffle Oil Drizzle', extraPrice: 85 },
        { name: 'Aged Burrata Float', extraPrice: 140 },
        { name: 'Smoked Crispy Garlic', extraPrice: 40 },
      ],
    };

    const spiceCustomization = {
      name: 'Spice Level',
      isRequired: false,
      minSelect: 0,
      maxSelect: 1,
      options: [
        { name: 'Mild & Fragrant', extraPrice: 0, isDefault: true },
        { name: 'Medium Zest', extraPrice: 0 },
        { name: 'Fiery Chef Heat', extraPrice: 0 },
      ],
    };

    const menuItemsData = [
      // Starters
      {
        name: 'Truffle Mushroom Bruschetta',
        description: 'Charred artisan sourdough crowned with wild forest mushrooms, thyme butter and shaved black truffle pecorino.',
        category: catMap['starters'],
        price: 360,
        image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=800&q=80',
        dietary: 'veg',
        spiceLevel: 'mild',
        isChefSpecial: true,
        preparationTimeMinutes: 12,
        availability: 'available',
        customizationGroups: [cheeseCustomization],
      },
      {
        name: 'Zaatar Spiced Paneer Tikka',
        description: 'Tandoor-charred malai paneer cubes marinated in Middle-Eastern herbs, smoked bell peppers and mint labneh dip.',
        category: catMap['starters'],
        price: 390,
        image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
        dietary: 'veg',
        spiceLevel: 'medium',
        isChefSpecial: false,
        preparationTimeMinutes: 15,
        availability: 'available',
        customizationGroups: [portionCustomization, spiceCustomization],
      },
      {
        name: 'Coastal Karwari Calamari',
        description: 'Semolina-crusted golden baby squids tossed with crushed curry leaves, kokum zest and dry byadgi chillies.',
        category: catMap['starters'],
        price: 480,
        image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
        dietary: 'non-veg',
        spiceLevel: 'spicy',
        isChefSpecial: true,
        preparationTimeMinutes: 14,
        availability: 'available',
        customizationGroups: [spiceCustomization],
      },
      {
        name: 'Smoked Butter Garlic Prawns',
        description: 'Tiger prawns simmered in emulsion of clarified butter, roasted shallots, cilantro stems and white wine splash.',
        category: catMap['starters'],
        price: 540,
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
        dietary: 'non-veg',
        spiceLevel: 'medium',
        isChefSpecial: false,
        preparationTimeMinutes: 15,
        availability: 'available',
        customizationGroups: [portionCustomization],
      },
      {
        name: 'Avocado Tartare & Beetroot Crisp',
        description: 'Hass avocado tartare with Persian lime, capers, toasted pine nuts and house-baked dehydrated lotus chips.',
        category: catMap['starters'],
        price: 380,
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        dietary: 'vegan',
        spiceLevel: 'mild',
        isChefSpecial: false,
        preparationTimeMinutes: 10,
        availability: 'available',
        customizationGroups: [],
      },

      // Mains
      {
        name: 'Old Delhi Velvet Butter Chicken',
        description: 'Slow-charred succulent chicken morsels bathed in an unctuous silk gravy of vine tomatoes, cashew cream and fenugreek.',
        category: catMap['main-course'],
        price: 490,
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
        dietary: 'non-veg',
        spiceLevel: 'medium',
        isChefSpecial: true,
        preparationTimeMinutes: 20,
        availability: 'available',
        customizationGroups: [portionCustomization, spiceCustomization],
      },
      {
        name: 'Dal Makhani Bukhara Reserva',
        description: 'Slow-simmered black urad lentils braised for 36 hours over tandoor embers with organic butter and dairy cream.',
        category: catMap['main-course'],
        price: 380,
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
        dietary: 'veg',
        spiceLevel: 'mild',
        isChefSpecial: true,
        preparationTimeMinutes: 15,
        availability: 'available',
        customizationGroups: [portionCustomization],
      },
      {
        name: 'Smoked Nilgiri Lamb Shank Korma',
        description: 'Prime mutton shank braised until fork-tender in an aromatic broth of toasted coconut, coriander and stone-ground spices.',
        category: catMap['main-course'],
        price: 680,
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        dietary: 'non-veg',
        spiceLevel: 'spicy',
        isChefSpecial: true,
        preparationTimeMinutes: 25,
        availability: 'available',
        customizationGroups: [spiceCustomization],
      },
      {
        name: 'Wild Morel & Kofta Lababdar',
        description: 'Stuffed cottage cheese dumplings with Himalayan morel mince resting on roasted tomato and melon seed velouté.',
        category: catMap['main-course'],
        price: 460,
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
        dietary: 'veg',
        spiceLevel: 'medium',
        isChefSpecial: false,
        preparationTimeMinutes: 18,
        availability: 'available',
        customizationGroups: [portionCustomization],
      },

      // Biryani & Rice
      {
        name: 'Royal Awadhi Dum Mutton Biryani',
        description: 'Fragrant long-grain aged basmati layered with tender baby goat, ittar essence, brown onions and saffron milk.',
        category: catMap['biryani-rice'],
        price: 580,
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
        dietary: 'non-veg',
        spiceLevel: 'medium',
        isChefSpecial: true,
        preparationTimeMinutes: 22,
        availability: 'available',
        customizationGroups: [portionCustomization, spiceCustomization],
      },
      {
        name: 'Jackfruit & Morel Dum Biryani',
        description: 'Raw kathal and Himalayan morels slow-steamed under dough seal with royal cloves, cardamom and mint leaves.',
        category: catMap['biryani-rice'],
        price: 440,
        image: 'https://images.unsplash.com/photo-1642821373181-696a54913e9a?auto=format&fit=crop&w=800&q=80',
        dietary: 'veg',
        spiceLevel: 'mild',
        isChefSpecial: false,
        preparationTimeMinutes: 18,
        availability: 'available',
        customizationGroups: [portionCustomization],
      },
      {
        name: 'Truffle Wild Mushroom Pulao',
        description: 'Fragrant Dehradun basmati tossed with charred shimeji, portobello, roasted pine nuts and white truffle essence.',
        category: catMap['biryani-rice'],
        price: 420,
        image: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80',
        dietary: 'veg',
        spiceLevel: 'mild',
        isChefSpecial: false,
        preparationTimeMinutes: 16,
        availability: 'available',
        customizationGroups: [],
      },

      // Pizza & Pasta
      {
        name: 'Burrata & San Marzano Wood-Fired Pizza',
        description: '48-hour fermented Neapolitan dough with crushed San Marzano DOP, fresh basil, garlic oil and centered creamy burrata.',
        category: catMap['pizza-pasta'],
        price: 590,
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
        dietary: 'veg',
        spiceLevel: 'mild',
        isChefSpecial: true,
        preparationTimeMinutes: 18,
        availability: 'available',
        customizationGroups: [cheeseCustomization],
      },
      {
        name: 'Smoked Pepperoni & Hot Honey Pizza',
        description: 'Handmade sourdough crust with artisanal pork pepperoni, smoked mozzarella and Calabrian hot honey drizzle.',
        category: catMap['pizza-pasta'],
        price: 640,
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
        dietary: 'non-veg',
        spiceLevel: 'medium',
        isChefSpecial: true,
        preparationTimeMinutes: 18,
        availability: 'available',
        customizationGroups: [cheeseCustomization],
      },
      {
        name: 'Handmade Wild Truffle Fettuccine',
        description: 'Bronze-die egg pasta tossed in emulsion of Normandy butter, Parmigiano Reggiano 24-month and autumn black truffles.',
        category: catMap['pizza-pasta'],
        price: 560,
        image: 'https://images.unsplash.com/photo-1621996346565-e3d5d62817d1?auto=format&fit=crop&w=800&q=80',
        dietary: 'veg',
        spiceLevel: 'none',
        isChefSpecial: false,
        preparationTimeMinutes: 16,
        availability: 'available',
        customizationGroups: [cheeseCustomization],
      },
      {
        name: 'Braised Duck Ragu Pappardelle',
        description: 'Slow-cooked duck leg ragu braised with Chianti wine, rosemary, juniper berries and topped with pecorino flakes.',
        category: catMap['pizza-pasta'],
        price: 620,
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
        dietary: 'non-veg',
        spiceLevel: 'mild',
        isChefSpecial: true,
        preparationTimeMinutes: 20,
        availability: 'available',
        customizationGroups: [],
      },

      // Desserts
      {
        name: 'Smoked Belgian Dark Chocolate Dome',
        description: '70% Valrhona dark chocolate dome melted table-side with hot spiced salted caramel, roasted hazelnut feuilletine.',
        category: catMap['desserts'],
        price: 390,
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
        dietary: 'veg',
        spiceLevel: 'none',
        isChefSpecial: true,
        preparationTimeMinutes: 12,
        availability: 'available',
        customizationGroups: [],
      },
      {
        name: 'Kashmiri Saffron & Pistachio Tres Leches',
        description: 'Spongy saffron Genoise soaked in condensed almond-cardamom milk, whipped mascarpone and gold leaf garnish.',
        category: catMap['desserts'],
        price: 340,
        image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
        dietary: 'veg',
        spiceLevel: 'none',
        isChefSpecial: false,
        preparationTimeMinutes: 10,
        availability: 'available',
        customizationGroups: [],
      },
      {
        name: 'Artisanal Baklava Ice Cream Sandwich',
        description: 'Crisp pistachio phyllo pastry sandwiching Turkish mastic and rosewater gelato with crushed dried rose petals.',
        category: catMap['desserts'],
        price: 360,
        image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=800&q=80',
        dietary: 'veg',
        spiceLevel: 'none',
        isChefSpecial: false,
        preparationTimeMinutes: 8,
        availability: 'available',
        customizationGroups: [],
      },

      // Beverages
      {
        name: 'Smoked Rosemary Grapefruit Fizz',
        description: 'Charred fresh rosemary, ruby red grapefruit juice, elderflower cordial, sparkling spring water and pink salt rim.',
        category: catMap['beverages'],
        price: 240,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
        dietary: 'vegan',
        spiceLevel: 'none',
        isChefSpecial: true,
        preparationTimeMinutes: 6,
        availability: 'available',
        customizationGroups: [],
      },
      {
        name: 'Cold-Brew Passionfruit Tonic',
        description: 'Single-estate Chikmagalur Arabica cold brew poured over clarified passion fruit nectar and Mediterranean tonic.',
        category: catMap['beverages'],
        price: 260,
        image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
        dietary: 'vegan',
        spiceLevel: 'none',
        isChefSpecial: false,
        preparationTimeMinutes: 5,
        availability: 'available',
        customizationGroups: [],
      },
      {
        name: 'Spiced Kokum & Ginger Cooler',
        description: 'Coastal kokum extract infused with roasted cumin, young ginger muddle, fresh mint and carbonated mineral water.',
        category: catMap['beverages'],
        price: 210,
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
        dietary: 'vegan',
        spiceLevel: 'mild',
        isChefSpecial: false,
        preparationTimeMinutes: 5,
        availability: 'available',
        customizationGroups: [],
      },

      // Specials
      {
        name: 'Pan-Seared Chilean Sea Bass',
        description: 'Wild sea bass on saffron cauliflower silk, blanched asparagus spears, caper-dill butter and caviar crown.',
        category: catMap['specials'],
        price: 890,
        image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
        dietary: 'non-veg',
        spiceLevel: 'mild',
        isChefSpecial: true,
        preparationTimeMinutes: 24,
        availability: 'available',
        customizationGroups: [],
      },
      {
        name: 'A5 Wagyu & Ghee-Roast Brioche',
        description: 'Tender sliced Wagyu beef tossed in Kundapur ghee-roast spice reduction served on butter toasted Japanese milk bread.',
        category: catMap['specials'],
        price: 940,
        image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
        dietary: 'non-veg',
        spiceLevel: 'medium',
        isChefSpecial: true,
        preparationTimeMinutes: 20,
        availability: 'available',
        customizationGroups: [],
      },
    ];

    const menuItems = await MenuItem.insertMany(menuItemsData);
    console.log(`Seeded ${menuItems.length} gourmet menu items.`);

    // 5. Restaurant Tables (across 4 sections)
    const tablesData = [
      // Main Dining
      { tableNumber: 'T-01', capacity: 2, section: 'Main Dining', status: 'available', locationCoordinates: { x: 10, y: 15 } },
      { tableNumber: 'T-02', capacity: 2, section: 'Main Dining', status: 'available', locationCoordinates: { x: 30, y: 15 } },
      { tableNumber: 'T-03', capacity: 4, section: 'Main Dining', status: 'available', locationCoordinates: { x: 50, y: 15 } },
      { tableNumber: 'T-04', capacity: 4, section: 'Main Dining', status: 'available', locationCoordinates: { x: 70, y: 15 } },
      { tableNumber: 'T-05', capacity: 6, section: 'Main Dining', status: 'available', locationCoordinates: { x: 10, y: 45 } },
      { tableNumber: 'T-06', capacity: 6, section: 'Main Dining', status: 'available', locationCoordinates: { x: 40, y: 45 } },

      // Terrace / Alfresco
      { tableNumber: 'TR-01', capacity: 2, section: 'Terrace', status: 'available', locationCoordinates: { x: 75, y: 45 } },
      { tableNumber: 'TR-02', capacity: 4, section: 'Terrace', status: 'available', locationCoordinates: { x: 10, y: 75 } },
      { tableNumber: 'TR-03', capacity: 4, section: 'Terrace', status: 'available', locationCoordinates: { x: 35, y: 75 } },

      // Private Dining Room (PDR)
      { tableNumber: 'PDR-01', capacity: 8, section: 'Private Dining', status: 'available', locationCoordinates: { x: 65, y: 75 } },
      { tableNumber: 'PDR-02', capacity: 12, section: 'Private Dining', status: 'available', locationCoordinates: { x: 85, y: 75 } },

      // Bar Lounge
      { tableNumber: 'BAR-01', capacity: 2, section: 'Bar Lounge', status: 'available', locationCoordinates: { x: 10, y: 90 } },
      { tableNumber: 'BAR-02', capacity: 2, section: 'Bar Lounge', status: 'available', locationCoordinates: { x: 25, y: 90 } },
      { tableNumber: 'BAR-03', capacity: 4, section: 'Bar Lounge', status: 'available', locationCoordinates: { x: 50, y: 90 } },
    ];

    const tables = await RestaurantTable.insertMany(tablesData);
    const tableMap = {};
    tables.forEach((t) => { tableMap[t.tableNumber] = t; });

    // 6. Comprehensive Operations Dummy Data (Active sessions, tickets, takeaways, 40+ historical orders & payments, reservations, audit logs)
    await generateDummyOperations({ users, menuItems, tables });

    console.log('--- DineDesk Database Seeded Successfully! ---');
  } catch (error) {
    console.error('Seed Database Error:', error);
  }
};

export const appendDummyData = async () => {
  return generateDummyOperations();
};

// If run directly via node CLI
if (process.argv[1]?.endsWith('seedData.js')) {
  import('../config/db.js').then(async ({ connectDB, closeDB }) => {
    await connectDB();
    if (process.argv.includes('--append') || process.argv.includes('-a')) {
      await generateDummyOperations();
    } else {
      const force = process.argv.includes('--force') || process.argv.includes('-f');
      await seedDatabase({ force });
    }
    await closeDB();
    process.exit(0);
  });
}

