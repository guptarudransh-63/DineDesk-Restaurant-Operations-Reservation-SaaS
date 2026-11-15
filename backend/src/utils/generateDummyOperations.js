import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { RestaurantTable } from '../models/RestaurantTable.js';
import { TableSession } from '../models/TableSession.js';
import { Order } from '../models/Order.js';
import { KitchenTicket } from '../models/KitchenTicket.js';
import { Payment } from '../models/Payment.js';
import { Reservation } from '../models/Reservation.js';
import { MenuItem } from '../models/MenuItem.js';
import { AuditLog } from '../models/AuditLog.js';

export const generateDummyOperations = async (opts = {}) => {
  console.log('--- Generating Comprehensive DineDesk Dummy Operations Data ---');

  // Load existing entities if not provided
  const users = opts.users || (await User.find());
  const menuItems = opts.menuItems || (await MenuItem.find());
  const tables = opts.tables || (await RestaurantTable.find());

  if (!users.length || !menuItems.length || !tables.length) {
    throw new Error('Base users, menu items, or tables not found in database. Seed base data first.');
  }

  const tableMap = {};
  tables.forEach((t) => {
    tableMap[t.tableNumber] = t;
  });

  const waiterUser = users.find((u) => u.role === 'waiter') || users[0];
  const chefUser = users.find((u) => u.role === 'kitchen') || users[0];
  const cashierUser = users.find((u) => u.role === 'cashier') || users[0];
  const managerUser = users.find((u) => u.role === 'manager') || users[0];
  const customerUser = users.find((u) => u.email === 'customer@dinedesk.com') || users.find((u) => u.role === 'customer') || users[0];
  const vikramUser = users.find((u) => u.email === 'vikram@example.com') || customerUser;

  const findItem = (query) => {
    return menuItems.find((m) => m.name.toLowerCase().includes(query.toLowerCase())) || menuItems[0];
  };

  const now = new Date();

  // -------------------------------------------------------------
  // 1. ACTIVE FLOOR SESSIONS & DINE-IN ORDERS
  // -------------------------------------------------------------

  // A) Table T-03: Occupied, 3 guests, 35 mins elapsed, order preparing
  const t03 = tableMap['T-03'];
  let session03, order03, ticket01;
  if (t03) {
    session03 = await TableSession.create({
      table: t03._id,
      tableNumber: 'T-03',
      guestCount: 3,
      customerName: 'Ananya Iyer',
      startTime: new Date(now.getTime() - 35 * 60 * 1000),
      status: 'active',
      openedBy: waiterUser._id,
      serverStaff: waiterUser._id,
      notes: 'Anniversary celebration lunch',
    });

    const bChicken = findItem('Butter Chicken');
    const bruschetta = findItem('Bruschetta');
    const dalMakhani = findItem('Dal Makhani');
    const fizz = findItem('Grapefruit Fizz') || findItem('Fizz') || menuItems[1];

    const items03 = [
      {
        menuItemId: bruschetta._id,
        name: bruschetta.name,
        quantity: 1,
        unitPrice: bruschetta.price,
        customizations: [],
        specialInstructions: 'Crispy bread please',
        itemTotal: bruschetta.price,
        status: 'ready',
        round: 1,
      },
      {
        menuItemId: bChicken._id,
        name: bChicken.name,
        quantity: 1,
        unitPrice: bChicken.price,
        customizations: [{ groupName: 'Spice Level', optionName: 'Medium Zest', extraPrice: 0 }],
        specialInstructions: 'Extra gravy on side',
        itemTotal: bChicken.price,
        status: 'preparing',
        round: 1,
      },
      {
        menuItemId: dalMakhani._id,
        name: dalMakhani.name,
        quantity: 1,
        unitPrice: dalMakhani.price,
        customizations: [],
        specialInstructions: '',
        itemTotal: dalMakhani.price,
        status: 'preparing',
        round: 1,
      },
      {
        menuItemId: fizz._id,
        name: fizz.name,
        quantity: 2,
        unitPrice: fizz.price,
        customizations: [],
        specialInstructions: 'Less ice please',
        itemTotal: fizz.price * 2,
        status: 'served',
        round: 1,
      },
    ];

    const sub03 = items03.reduce((sum, i) => sum + i.itemTotal, 0);
    const cgst03 = Math.round(sub03 * 0.025 * 100) / 100;
    const sgst03 = cgst03;
    const total03 = sub03 + cgst03 + sgst03;

    order03 = await Order.create({
      orderNumber: 'ORD-2026-0001',
      orderType: 'dine_in',
      table: t03._id,
      tableNumber: 'T-03',
      tableSession: session03._id,
      customer: customerUser._id,
      customerName: 'Ananya Iyer',
      customerPhone: '+91 98450 11006',
      customerEmail: 'customer@dinedesk.com',
      items: items03,
      subtotal: sub03,
      discountAmount: 0,
      cgstAmount: cgst03,
      sgstAmount: sgst03,
      taxAmount: cgst03 + sgst03,
      finalTotal: total03,
      paymentStatus: 'unpaid',
      orderStatus: 'preparing',
      paymentMethod: 'pending',
      serverStaff: waiterUser._id,
      createdAt: new Date(now.getTime() - 33 * 60 * 1000),
    });

    session03.activeOrders = [order03._id];
    await session03.save();

    t03.status = 'occupied';
    t03.activeSession = session03._id;
    t03.activeOrder = order03._id;
    await t03.save();

    ticket01 = await KitchenTicket.create({
      ticketNumber: 'K-001',
      order: order03._id,
      orderNumber: order03.orderNumber,
      orderType: 'dine_in',
      tableNumber: 'T-03',
      round: 1,
      items: items03.map((item) => ({
        itemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        customizations: item.customizations,
        specialInstructions: item.specialInstructions,
        status: item.status,
      })),
      status: 'preparing',
      priority: 'normal',
      preparationStartTime: new Date(now.getTime() - 25 * 60 * 1000),
      notes: 'Customer anniversary lunch',
      handledBy: chefUser._id,
      createdAt: new Date(now.getTime() - 32 * 60 * 1000),
    });
  }

  // B) Table T-05: Occupied, 5 guests, 55 mins elapsed, Multi-Round Order (Round 2 Desserts Preparing)
  const t05 = tableMap['T-05'];
  let session05, order05, ticket02;
  if (t05) {
    session05 = await TableSession.create({
      table: t05._id,
      tableNumber: 'T-05',
      guestCount: 5,
      customerName: 'Vikram Sengupta',
      startTime: new Date(now.getTime() - 55 * 60 * 1000),
      status: 'active',
      openedBy: waiterUser._id,
      serverStaff: waiterUser._id,
      notes: 'Family gathering celebration',
    });

    const lambShank = findItem('Lamb Shank') || findItem('Mutton') || menuItems[2];
    const biryani = findItem('Biryani') || menuItems[3];
    const chocolate = findItem('Chocolate') || findItem('Fondant') || menuItems[4];
    const kulfi = findItem('Kulfi') || findItem('Dessert') || menuItems[5];
    const cocktail = findItem('Martini') || findItem('Fashioned') || menuItems[6];

    const items05 = [
      // Round 1 items (already served)
      {
        menuItemId: lambShank._id,
        name: lambShank.name,
        quantity: 2,
        unitPrice: lambShank.price,
        customizations: [],
        specialInstructions: 'Medium spicy',
        itemTotal: lambShank.price * 2,
        status: 'served',
        round: 1,
      },
      {
        menuItemId: biryani._id,
        name: biryani.name,
        quantity: 2,
        unitPrice: biryani.price,
        customizations: [],
        specialInstructions: 'Extra salan & raita',
        itemTotal: biryani.price * 2,
        status: 'served',
        round: 1,
      },
      // Round 2 items (currently preparing)
      {
        menuItemId: chocolate._id,
        name: chocolate.name,
        quantity: 2,
        unitPrice: chocolate.price,
        customizations: [],
        specialInstructions: 'Warm with vanilla gelato',
        itemTotal: chocolate.price * 2,
        status: 'preparing',
        round: 2,
      },
      {
        menuItemId: kulfi._id,
        name: kulfi.name,
        quantity: 2,
        unitPrice: kulfi.price,
        customizations: [],
        specialInstructions: '',
        itemTotal: kulfi.price * 2,
        status: 'preparing',
        round: 2,
      },
      {
        menuItemId: cocktail._id,
        name: cocktail.name,
        quantity: 2,
        unitPrice: cocktail.price,
        customizations: [],
        specialInstructions: 'Chilled glasses',
        itemTotal: cocktail.price * 2,
        status: 'preparing',
        round: 2,
      },
    ];

    const sub05 = items05.reduce((sum, i) => sum + i.itemTotal, 0);
    const cgst05 = Math.round(sub05 * 0.025 * 100) / 100;
    const sgst05 = cgst05;
    const total05 = sub05 + cgst05 + sgst05;

    order05 = await Order.create({
      orderNumber: 'ORD-2026-0007',
      orderType: 'dine_in',
      table: t05._id,
      tableNumber: 'T-05',
      tableSession: session05._id,
      customer: vikramUser._id,
      customerName: 'Vikram Sengupta',
      customerPhone: '+91 98450 11007',
      customerEmail: 'vikram@example.com',
      items: items05,
      subtotal: sub05,
      discountAmount: 0,
      cgstAmount: cgst05,
      sgstAmount: sgst05,
      taxAmount: cgst05 + sgst05,
      finalTotal: total05,
      paymentStatus: 'unpaid',
      orderStatus: 'preparing',
      paymentMethod: 'pending',
      serverStaff: waiterUser._id,
      createdAt: new Date(now.getTime() - 52 * 60 * 1000),
    });

    session05.activeOrders = [order05._id];
    await session05.save();

    t05.status = 'occupied';
    t05.activeSession = session05._id;
    t05.activeOrder = order05._id;
    await t05.save();

    ticket02 = await KitchenTicket.create({
      ticketNumber: 'K-002',
      order: order05._id,
      orderNumber: order05.orderNumber,
      orderType: 'dine_in',
      tableNumber: 'T-05',
      round: 2,
      items: items05.filter((i) => i.round === 2).map((item) => ({
        itemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        customizations: item.customizations,
        specialInstructions: item.specialInstructions,
        status: item.status,
      })),
      status: 'preparing',
      priority: 'normal',
      preparationStartTime: new Date(now.getTime() - 15 * 60 * 1000),
      notes: 'Dessert & drinks round - please serve together with warm plates',
      handledBy: chefUser._id,
      createdAt: new Date(now.getTime() - 18 * 60 * 1000),
    });
  }

  // C) Table TR-02: Terrace, Occupied, 3 guests, session status 'bill_requested' (Ready for Billing POS settlement!)
  const tr02 = tableMap['TR-02'];
  let sessionTR02, orderTR02;
  if (tr02) {
    sessionTR02 = await TableSession.create({
      table: tr02._id,
      tableNumber: 'TR-02',
      guestCount: 3,
      customerName: 'Pooja Hegde',
      startTime: new Date(now.getTime() - 70 * 60 * 1000),
      status: 'bill_requested',
      openedBy: waiterUser._id,
      serverStaff: waiterUser._id,
      notes: 'Terrace garden dinner - bill requested',
    });

    const pasta = findItem('Tagliatelle') || findItem('Pasta') || menuItems[7];
    const pizza = findItem('Pizza') || findItem('Margherita') || menuItems[8];
    const drink = findItem('Bellini') || findItem('Beverage') || menuItems[9];

    const itemsTR02 = [
      {
        menuItemId: pasta._id,
        name: pasta.name,
        quantity: 2,
        unitPrice: pasta.price,
        customizations: [],
        specialInstructions: 'Al dente',
        itemTotal: pasta.price * 2,
        status: 'served',
        round: 1,
      },
      {
        menuItemId: pizza._id,
        name: pizza.name,
        quantity: 1,
        unitPrice: pizza.price,
        customizations: [],
        specialInstructions: 'Crispy crust',
        itemTotal: pizza.price,
        status: 'served',
        round: 1,
      },
      {
        menuItemId: drink._id,
        name: drink.name,
        quantity: 3,
        unitPrice: drink.price,
        customizations: [],
        specialInstructions: '',
        itemTotal: drink.price * 3,
        status: 'served',
        round: 1,
      },
    ];

    const subTR02 = itemsTR02.reduce((sum, i) => sum + i.itemTotal, 0);
    const cgstTR02 = Math.round(subTR02 * 0.025 * 100) / 100;
    const sgstTR02 = cgstTR02;
    const totalTR02 = subTR02 + cgstTR02 + sgstTR02;

    orderTR02 = await Order.create({
      orderNumber: 'ORD-2026-0008',
      orderType: 'dine_in',
      table: tr02._id,
      tableNumber: 'TR-02',
      tableSession: sessionTR02._id,
      customer: null,
      customerName: 'Pooja Hegde',
      customerPhone: '+91 98920 33441',
      items: itemsTR02,
      subtotal: subTR02,
      discountAmount: 0,
      cgstAmount: cgstTR02,
      sgstAmount: sgstTR02,
      taxAmount: cgstTR02 + sgstTR02,
      finalTotal: totalTR02,
      paymentStatus: 'unpaid',
      orderStatus: 'ready',
      paymentMethod: 'pending',
      serverStaff: waiterUser._id,
      createdAt: new Date(now.getTime() - 65 * 60 * 1000),
    });

    sessionTR02.activeOrders = [orderTR02._id];
    await sessionTR02.save();

    tr02.status = 'occupied';
    tr02.activeSession = sessionTR02._id;
    tr02.activeOrder = orderTR02._id;
    await tr02.save();
  }

  // D) Table BAR-02: Bar Lounge, Occupied, 2 guests, Drinks & Snacks Ready
  const bar02 = tableMap['BAR-02'];
  let sessionBar02, orderBar02, ticket03;
  if (bar02) {
    sessionBar02 = await TableSession.create({
      table: bar02._id,
      tableNumber: 'BAR-02',
      guestCount: 2,
      customerName: 'Karan Malhotra',
      startTime: new Date(now.getTime() - 20 * 60 * 1000),
      status: 'active',
      openedBy: waiterUser._id,
      serverStaff: waiterUser._id,
      notes: 'Bar guests - quick bites',
    });

    const calamari = findItem('Calamari') || findItem('Prawns') || menuItems[10];
    const cocktailBar = findItem('Negroni') || findItem('Cocktail') || menuItems[11];

    const itemsBar02 = [
      {
        menuItemId: calamari._id,
        name: calamari.name,
        quantity: 1,
        unitPrice: calamari.price,
        customizations: [],
        specialInstructions: 'Extra spicy dip',
        itemTotal: calamari.price,
        status: 'ready',
        round: 1,
      },
      {
        menuItemId: cocktailBar._id,
        name: cocktailBar.name,
        quantity: 2,
        unitPrice: cocktailBar.price,
        customizations: [],
        specialInstructions: 'On the rocks',
        itemTotal: cocktailBar.price * 2,
        status: 'ready',
        round: 1,
      },
    ];

    const subBar02 = itemsBar02.reduce((sum, i) => sum + i.itemTotal, 0);
    const cgstBar02 = Math.round(subBar02 * 0.025 * 100) / 100;
    const sgstBar02 = cgstBar02;
    const totalBar02 = subBar02 + cgstBar02 + sgstBar02;

    orderBar02 = await Order.create({
      orderNumber: 'ORD-2026-0009',
      orderType: 'dine_in',
      table: bar02._id,
      tableNumber: 'BAR-02',
      tableSession: sessionBar02._id,
      customer: null,
      customerName: 'Karan Malhotra',
      customerPhone: '+91 98200 44556',
      items: itemsBar02,
      subtotal: subBar02,
      discountAmount: 0,
      cgstAmount: cgstBar02,
      sgstAmount: sgstBar02,
      taxAmount: cgstBar02 + sgstBar02,
      finalTotal: totalBar02,
      paymentStatus: 'unpaid',
      orderStatus: 'ready',
      paymentMethod: 'pending',
      serverStaff: waiterUser._id,
      createdAt: new Date(now.getTime() - 18 * 60 * 1000),
    });

    sessionBar02.activeOrders = [orderBar02._id];
    await sessionBar02.save();

    bar02.status = 'occupied';
    bar02.activeSession = sessionBar02._id;
    bar02.activeOrder = orderBar02._id;
    await bar02.save();

    ticket03 = await KitchenTicket.create({
      ticketNumber: 'K-003',
      order: orderBar02._id,
      orderNumber: orderBar02.orderNumber,
      orderType: 'dine_in',
      tableNumber: 'BAR-02',
      round: 1,
      items: itemsBar02.map((item) => ({
        itemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        customizations: item.customizations,
        specialInstructions: item.specialInstructions,
        status: 'ready',
      })),
      status: 'ready',
      priority: 'rush',
      preparationStartTime: new Date(now.getTime() - 15 * 60 * 1000),
      notes: 'VIP Bar guests - rush order',
      handledBy: chefUser._id,
      createdAt: new Date(now.getTime() - 17 * 60 * 1000),
    });
  }

  // E) Set specific floor table states:
  // T-01: 'cleaning' (guest just checked out)
  if (tableMap['T-01']) {
    tableMap['T-01'].status = 'cleaning';
    tableMap['T-01'].activeSession = null;
    tableMap['T-01'].activeOrder = null;
    await tableMap['T-01'].save();
  }

  // TR-01: 'reserved' (for tonight's anniversary reservation)
  if (tableMap['TR-01']) {
    tableMap['TR-01'].status = 'reserved';
    await tableMap['TR-01'].save();
  }

  // PDR-01: 'reserved' (for tomorrow's corporate board lunch)
  if (tableMap['PDR-01']) {
    tableMap['PDR-01'].status = 'reserved';
    await tableMap['PDR-01'].save();
  }

  // -------------------------------------------------------------
  // 2. ACTIVE TAKEAWAY / ONLINE ORDERS & KITCHEN TICKETS
  // -------------------------------------------------------------

  // A) Takeaway Order Preparing (In 20 mins)
  const paneerTikka = findItem('Paneer') || menuItems[12];
  const dMakhani = findItem('Dal Makhani') || menuItems[13];
  const items10 = [
    {
      menuItemId: paneerTikka._id,
      name: paneerTikka.name,
      quantity: 1,
      unitPrice: paneerTikka.price,
      customizations: [],
      specialInstructions: 'Extra spicy mint chutney',
      itemTotal: paneerTikka.price,
      status: 'preparing',
      round: 1,
    },
    {
      menuItemId: dMakhani._id,
      name: dMakhani.name,
      quantity: 1,
      unitPrice: dMakhani.price,
      customizations: [],
      specialInstructions: '',
      itemTotal: dMakhani.price,
      status: 'preparing',
      round: 1,
    },
  ];
  const sub10 = items10.reduce((sum, i) => sum + i.itemTotal, 0);
  const cgst10 = Math.round(sub10 * 0.025 * 100) / 100;
  const sgst10 = cgst10;
  const total10 = sub10 + cgst10 + sgst10;

  const order10 = await Order.create({
    orderNumber: 'ORD-2026-0010',
    orderType: 'takeaway',
    tableNumber: null,
    customer: null,
    customerName: 'Aarav Mehta',
    customerPhone: '+91 98331 22334',
    customerEmail: 'aarav@example.com',
    pickupTime: 'In 20 mins',
    items: items10,
    subtotal: sub10,
    discountAmount: 0,
    cgstAmount: cgst10,
    sgstAmount: sgst10,
    taxAmount: cgst10 + sgst10,
    finalTotal: total10,
    paymentStatus: 'paid',
    orderStatus: 'preparing',
    paymentMethod: 'upi',
    specialInstructions: 'Pack with eco cutlery and napkins',
    createdAt: new Date(now.getTime() - 14 * 60 * 1000),
  });

  await KitchenTicket.create({
    ticketNumber: 'K-004',
    order: order10._id,
    orderNumber: order10.orderNumber,
    orderType: 'takeaway',
    tableNumber: 'Takeaway',
    round: 1,
    items: items10.map((item) => ({
      itemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      customizations: item.customizations,
      specialInstructions: item.specialInstructions,
      status: 'preparing',
    })),
    status: 'preparing',
    priority: 'normal',
    preparationStartTime: new Date(now.getTime() - 10 * 60 * 1000),
    notes: 'Pack with extra mint chutney and eco cutlery set',
    handledBy: chefUser._id,
    createdAt: new Date(now.getTime() - 12 * 60 * 1000),
  });

  // B) Takeaway Order Ready for Pickup Counter
  const pizzaItem = findItem('Formaggi') || findItem('Pizza') || menuItems[14];
  const dessertItem = findItem('Tiramisu') || findItem('Tart') || menuItems[15];
  const items11 = [
    {
      menuItemId: pizzaItem._id,
      name: pizzaItem.name,
      quantity: 1,
      unitPrice: pizzaItem.price,
      customizations: [],
      specialInstructions: 'Extra crispy base',
      itemTotal: pizzaItem.price,
      status: 'ready',
      round: 1,
    },
    {
      menuItemId: dessertItem._id,
      name: dessertItem.name,
      quantity: 1,
      unitPrice: dessertItem.price,
      customizations: [],
      specialInstructions: '',
      itemTotal: dessertItem.price,
      status: 'ready',
      round: 1,
    },
  ];
  const sub11 = items11.reduce((sum, i) => sum + i.itemTotal, 0);
  const cgst11 = Math.round(sub11 * 0.025 * 100) / 100;
  const sgst11 = cgst11;
  const total11 = sub11 + cgst11 + sgst11;

  const order11 = await Order.create({
    orderNumber: 'ORD-2026-0011',
    orderType: 'takeaway',
    tableNumber: null,
    customer: null,
    customerName: 'Sneha Reddy',
    customerPhone: '+91 97410 88776',
    customerEmail: 'sneha.reddy@gmail.com',
    pickupTime: 'ASAP',
    items: items11,
    subtotal: sub11,
    discountAmount: 0,
    cgstAmount: cgst11,
    sgstAmount: sgst11,
    taxAmount: cgst11 + sgst11,
    finalTotal: total11,
    paymentStatus: 'paid',
    orderStatus: 'ready',
    paymentMethod: 'card',
    specialInstructions: 'Call on arrival at curb',
    createdAt: new Date(now.getTime() - 25 * 60 * 1000),
  });

  await KitchenTicket.create({
    ticketNumber: 'K-005',
    order: order11._id,
    orderNumber: order11.orderNumber,
    orderType: 'takeaway',
    tableNumber: 'Takeaway',
    round: 1,
    items: items11.map((item) => ({
      itemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      customizations: item.customizations,
      specialInstructions: item.specialInstructions,
      status: 'ready',
    })),
    status: 'ready',
    priority: 'rush',
    preparationStartTime: new Date(now.getTime() - 20 * 60 * 1000),
    completedTime: new Date(now.getTime() - 3 * 60 * 1000),
    notes: 'Order ready on takeaway shelf B-2',
    handledBy: chefUser._id,
    createdAt: new Date(now.getTime() - 24 * 60 * 1000),
  });

  // C) Takeaway Order Placed (Brand new in Kitchen queue)
  const bassItem = findItem('Sea Bass') || findItem('Fish') || menuItems[16];
  const prawnItem = findItem('Prawns') || menuItems[17];
  const items12 = [
    {
      menuItemId: bassItem._id,
      name: bassItem.name,
      quantity: 1,
      unitPrice: bassItem.price,
      customizations: [],
      specialInstructions: '',
      itemTotal: bassItem.price,
      status: 'pending',
      round: 1,
    },
    {
      menuItemId: prawnItem._id,
      name: prawnItem.name,
      quantity: 1,
      unitPrice: prawnItem.price,
      customizations: [],
      specialInstructions: 'Mild spice',
      itemTotal: prawnItem.price,
      status: 'pending',
      round: 1,
    },
  ];
  const sub12 = items12.reduce((sum, i) => sum + i.itemTotal, 0);
  const cgst12 = Math.round(sub12 * 0.025 * 100) / 100;
  const sgst12 = cgst12;
  const total12 = sub12 + cgst12 + sgst12;

  const order12 = await Order.create({
    orderNumber: 'ORD-2026-0012',
    orderType: 'takeaway',
    tableNumber: null,
    customer: customerUser._id,
    customerName: 'Ananya Iyer',
    customerPhone: '+91 98450 11006',
    customerEmail: 'customer@dinedesk.com',
    pickupTime: 'In 35 mins',
    items: items12,
    subtotal: sub12,
    discountAmount: 0,
    cgstAmount: cgst12,
    sgstAmount: sgst12,
    taxAmount: cgst12 + sgst12,
    finalTotal: total12,
    paymentStatus: 'paid',
    orderStatus: 'placed',
    paymentMethod: 'online',
    specialInstructions: 'Customer portal online takeaway',
    createdAt: new Date(now.getTime() - 4 * 60 * 1000),
  });

  await KitchenTicket.create({
    ticketNumber: 'K-006',
    order: order12._id,
    orderNumber: order12.orderNumber,
    orderType: 'takeaway',
    tableNumber: 'Takeaway',
    round: 1,
    items: items12.map((item) => ({
      itemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      customizations: item.customizations,
      specialInstructions: item.specialInstructions,
      status: 'pending',
    })),
    status: 'new',
    priority: 'normal',
    notes: 'Online customer portal order placed just now',
    createdAt: new Date(now.getTime() - 3 * 60 * 1000),
  });

  // -------------------------------------------------------------
  // 3. HISTORICAL COMPLETED ORDERS & PAYMENTS (Last 30 Days)
  // Generates 40+ realistic orders across all 30 days for Recharts Analytics!
  // -------------------------------------------------------------

  const customerPool = [
    { name: 'Vikram Sengupta', phone: '+91 98450 11007', email: 'vikram@example.com', user: vikramUser },
    { name: 'Dr. Meera Nambiar', phone: '+91 98800 33221', email: 'meera.nambiar@hospital.org', user: null },
    { name: 'Kunal Singhania', phone: '+91 98221 44889', email: 'kunal@singhania.com', user: null },
    { name: 'Aditya Roy', phone: '+91 98330 99112', email: 'aditya.roy@gmail.com', user: null },
    { name: 'Sneha Kapoor', phone: '+91 98450 33221', email: 'sneha.kapoor@gmail.com', user: null },
    { name: 'Ananya Iyer', phone: '+91 98450 11006', email: 'customer@dinedesk.com', user: customerUser },
    { name: 'Rohan Deshmukh', phone: '+91 98112 34567', email: 'rohan.deshmukh@gmail.com', user: null },
    { name: 'Sanjay Godbole', phone: '+91 98220 99887', email: 'sanjay@techcorp.in', user: null },
    { name: 'Pooja Hegde', phone: '+91 98920 33441', email: 'pooja.hegde@gmail.com', user: null },
    { name: 'Arjun Kapoor', phone: '+91 98711 00223', email: 'arjun.kapoor@gmail.com', user: null },
    { name: 'Tarun Chawla', phone: '+91 98200 11445', email: 'tarun.c@gmail.com', user: null },
    { name: 'Neha Verma', phone: '+91 98440 22331', email: 'neha.verma@techcorp.in', user: null },
  ];

  const tableList = ['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'TR-01', 'TR-02', 'TR-03', 'PDR-01', 'BAR-01', 'BAR-02', 'BAR-03'];
  const methods = ['upi', 'card', 'upi', 'card', 'cash', 'online'];
  const orderTypes = ['dine_in', 'dine_in', 'dine_in', 'takeaway', 'takeaway', 'pickup'];

  let orderSeq = 15;
  const createdCompletedOrders = [];

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    // 1 to 2 orders per day
    const ordersPerDay = dayOffset % 3 === 0 ? 2 : 1;

    for (let oIdx = 0; oIdx < ordersPerDay; oIdx++) {
      orderSeq++;
      const orderNumber = `ORD-2026-${orderSeq.toString().padStart(4, '0')}`;
      const cust = customerPool[(dayOffset * 3 + oIdx) % customerPool.length];
      const method = methods[(dayOffset + oIdx) % methods.length];
      const type = orderTypes[(dayOffset * 2 + oIdx) % orderTypes.length];
      const tNum = type === 'dine_in' ? tableList[(dayOffset + oIdx) % tableList.length] : null;

      // Select 2-4 menu items
      const numItems = 2 + ((dayOffset + oIdx) % 3);
      const chosenItems = [];
      for (let k = 0; k < numItems; k++) {
        const item = menuItems[(dayOffset * 3 + oIdx * 2 + k) % menuItems.length];
        const qty = (k % 2 === 0) ? 1 : 2;
        chosenItems.push({
          menuItemId: item._id,
          name: item.name,
          quantity: qty,
          unitPrice: item.price,
          customizations: [],
          specialInstructions: '',
          itemTotal: item.price * qty,
          status: 'served',
          round: 1,
        });
      }

      const subtotal = chosenItems.reduce((acc, i) => acc + i.itemTotal, 0);
      const cgst = Math.round(subtotal * 0.025 * 100) / 100;
      const sgst = cgst;
      const total = subtotal + cgst + sgst;

      // Realistic hour: lunch (12:30-14:45) or dinner (19:30-22:30)
      const isLunch = (dayOffset + oIdx) % 2 === 0;
      const hour = isLunch ? 12 + ((oIdx * 37) % 3) : 19 + ((oIdx * 41) % 4);
      const minute = ((dayOffset * 17 + oIdx * 23) % 50);

      const orderDate = new Date(now);
      orderDate.setDate(orderDate.getDate() - dayOffset);
      orderDate.setHours(hour, minute, 0, 0);

      const completedOrder = await Order.create({
        orderNumber,
        orderType: type,
        tableNumber: tNum,
        customer: cust.user?._id || null,
        customerName: cust.name,
        customerPhone: cust.phone,
        customerEmail: cust.email,
        items: chosenItems,
        subtotal,
        discountAmount: 0,
        cgstAmount: cgst,
        sgstAmount: sgst,
        taxAmount: cgst + sgst,
        finalTotal: total,
        paymentStatus: 'paid',
        orderStatus: 'completed',
        paymentMethod: method,
        serverStaff: waiterUser._id,
        createdAt: orderDate,
        updatedAt: new Date(orderDate.getTime() + 45 * 60 * 1000),
      });

      // Matching Payment document
      await Payment.create({
        order: completedOrder._id,
        orderNumber: completedOrder.orderNumber,
        invoiceNumber: `INV-2026-${(orderSeq - 10).toString().padStart(4, '0')}`,
        amount: total,
        paymentMethod: method,
        transactionReference: `${method.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'paid',
        taxDetails: {
          cgst,
          sgst,
          totalTax: cgst + sgst,
        },
        recordedBy: cashierUser._id,
        customerName: cust.name,
        paymentDate: new Date(orderDate.getTime() + 40 * 60 * 1000),
        createdAt: orderDate,
        updatedAt: orderDate,
      });

      createdCompletedOrders.push(completedOrder);
    }
  }

  console.log(`Seeded ${createdCompletedOrders.length} historical completed orders with GST invoices.`);

  // -------------------------------------------------------------
  // 4. RESERVATIONS (Past, Today Lunch & Dinner, Tomorrow, Future)
  // -------------------------------------------------------------

  const formatDate = (d) => d.toISOString().slice(0, 10);
  const todayStr = formatDate(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);

  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = formatDate(dayAfter);

  const inThreeDays = new Date(now);
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  const inThreeDaysStr = formatDate(inThreeDays);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = formatDate(twoDaysAgo);

  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = formatDate(threeDaysAgo);

  const reservationsData = [
    // Today's lunch (already completed)
    {
      bookingReference: 'RES-3341',
      customer: null,
      customerName: 'Neha Verma',
      customerPhone: '+91 98440 22331',
      customerEmail: 'neha.verma@techcorp.in',
      date: todayStr,
      timeSlot: '12:30',
      partySize: 2,
      table: tableMap['T-02']?._id,
      specialRequests: 'Quiet window table for business lunch',
      occasion: 'business',
      status: 'completed',
      activityHistory: [
        { status: 'confirmed', timestamp: new Date(now.getTime() - 5 * 3600000), updatedBy: 'System', note: 'Online reservation confirmed' },
        { status: 'seated', timestamp: new Date(now.getTime() - 3 * 3600000), updatedBy: 'Rohan Verma', note: 'Guests seated' },
        { status: 'completed', timestamp: new Date(now.getTime() - 1.5 * 3600000), updatedBy: 'Rohan Verma', note: 'Dining completed' },
      ],
    },
    {
      bookingReference: 'RES-3390',
      customer: null,
      customerName: 'Harish Rao',
      customerPhone: '+91 98231 44556',
      customerEmail: 'harish.rao@yahoo.co.in',
      date: todayStr,
      timeSlot: '13:45',
      partySize: 5,
      table: tableMap['T-06']?._id,
      specialRequests: 'Elderly guest in wheelchair, easily accessible table please',
      occasion: 'birthday',
      status: 'completed',
      activityHistory: [
        { status: 'confirmed', timestamp: new Date(now.getTime() - 6 * 3600000), updatedBy: 'System', note: 'Phone booking confirmed' },
        { status: 'completed', timestamp: new Date(now.getTime() - 1 * 3600000), updatedBy: 'Priya Mehta', note: 'Completed' },
      ],
    },

    // Today's dinner (upcoming / confirmed)
    {
      bookingReference: 'RES-4821',
      customer: customerUser?._id,
      customerName: 'Ananya Iyer',
      customerPhone: '+91 98450 11006',
      customerEmail: 'customer@dinedesk.com',
      date: todayStr,
      timeSlot: '19:30',
      partySize: 2,
      table: tableMap['TR-01']?._id,
      specialRequests: 'Candlelight setting by the terrace flowers please',
      occasion: 'anniversary',
      status: 'confirmed',
      activityHistory: [{ status: 'confirmed', timestamp: new Date(now.getTime() - 4 * 3600000), updatedBy: 'System', note: 'Online reservation confirmed' }],
    },
    {
      bookingReference: 'RES-5290',
      customer: null,
      customerName: 'Rohan Deshmukh',
      customerPhone: '+91 98112 34567',
      customerEmail: 'rohan.deshmukh@gmail.com',
      date: todayStr,
      timeSlot: '20:30',
      partySize: 4,
      table: tableMap['T-04']?._id,
      specialRequests: 'High chair needed for child',
      occasion: 'birthday',
      status: 'confirmed',
      activityHistory: [{ status: 'confirmed', timestamp: new Date(now.getTime() - 2 * 3600000), updatedBy: 'System', note: 'Online reservation confirmed' }],
    },
    {
      bookingReference: 'RES-6102',
      customer: null,
      customerName: 'Rahul Bajaj',
      customerPhone: '+91 98330 77112',
      customerEmail: 'rahul.bajaj@outlook.com',
      date: todayStr,
      timeSlot: '21:15',
      partySize: 3,
      table: tableMap['BAR-03']?._id,
      specialRequests: 'Cocktail tasting table near bar',
      occasion: 'none',
      status: 'confirmed',
      activityHistory: [{ status: 'confirmed', timestamp: new Date(now.getTime() - 1 * 3600000), updatedBy: 'System', note: 'Direct booking' }],
    },

    // Tomorrow
    {
      bookingReference: 'RES-7714',
      customer: null,
      customerName: 'Sanjay Godbole',
      customerPhone: '+91 98220 99887',
      customerEmail: 'sanjay@techcorp.in',
      date: tomorrowStr,
      timeSlot: '13:00',
      partySize: 8,
      table: tableMap['PDR-01']?._id,
      specialRequests: 'Board directors lunch meeting, quiet ambient room',
      occasion: 'business',
      status: 'confirmed',
      activityHistory: [{ status: 'confirmed', timestamp: new Date(), updatedBy: 'Priya Mehta', note: 'Reserved via concierge' }],
    },
    {
      bookingReference: 'RES-8120',
      customer: null,
      customerName: 'Pooja Hegde',
      customerPhone: '+91 98920 33441',
      customerEmail: 'pooja.hegde@gmail.com',
      date: tomorrowStr,
      timeSlot: '19:45',
      partySize: 4,
      table: tableMap['TR-03']?._id,
      specialRequests: 'Terrace garden view table',
      occasion: 'anniversary',
      status: 'confirmed',
      activityHistory: [{ status: 'confirmed', timestamp: new Date(), updatedBy: 'System', note: 'Online reservation confirmed' }],
    },
    {
      bookingReference: 'RES-8455',
      customer: null,
      customerName: 'Arjun Kapoor',
      customerPhone: '+91 98711 00223',
      customerEmail: 'arjun.kapoor@gmail.com',
      date: tomorrowStr,
      timeSlot: '20:30',
      partySize: 2,
      table: tableMap['T-03']?._id,
      specialRequests: 'Corner booth for date night',
      occasion: 'date',
      status: 'confirmed',
      activityHistory: [{ status: 'confirmed', timestamp: new Date(), updatedBy: 'System', note: 'Online reservation confirmed' }],
    },

    // In 2 & 3 Days
    {
      bookingReference: 'RES-9011',
      customer: null,
      customerName: 'Infosys Leadership Team',
      customerPhone: '+91 98450 99112',
      customerEmail: 'events@infosys.com',
      date: dayAfterStr,
      timeSlot: '13:30',
      partySize: 12,
      table: tableMap['PDR-02']?._id,
      specialRequests: 'Private lunch set menu for senior leadership team',
      occasion: 'business',
      status: 'confirmed',
      activityHistory: [{ status: 'confirmed', timestamp: new Date(), updatedBy: 'Priya Mehta', note: 'Corporate event booking' }],
    },
    {
      bookingReference: 'RES-9233',
      customer: null,
      customerName: 'Tarun Chawla',
      customerPhone: '+91 98200 11445',
      customerEmail: 'tarun.c@gmail.com',
      date: inThreeDaysStr,
      timeSlot: '20:00',
      partySize: 4,
      table: tableMap['TR-02']?._id,
      specialRequests: 'Champagne bucket on arrival',
      occasion: 'birthday',
      status: 'confirmed',
      activityHistory: [{ status: 'confirmed', timestamp: new Date(), updatedBy: 'System', note: 'Online reservation' }],
    },

    // Past reservations
    {
      bookingReference: 'RES-2201',
      customer: vikramUser?._id,
      customerName: 'Vikram Sengupta',
      customerPhone: '+91 98450 11007',
      customerEmail: 'vikram@example.com',
      date: yesterdayStr,
      timeSlot: '20:00',
      partySize: 5,
      table: tableMap['T-05']?._id,
      specialRequests: 'Family get-together dinner',
      occasion: 'anniversary',
      status: 'completed',
      activityHistory: [
        { status: 'confirmed', timestamp: new Date(now.getTime() - 28 * 3600000), updatedBy: 'System', note: 'Online reservation confirmed' },
        { status: 'seated', timestamp: new Date(now.getTime() - 25 * 3600000), updatedBy: 'Rohan Verma', note: 'Seated' },
        { status: 'completed', timestamp: new Date(now.getTime() - 23 * 3600000), updatedBy: 'Rohan Verma', note: 'Completed' },
      ],
    },
    {
      bookingReference: 'RES-2180',
      customer: null,
      customerName: 'Amit Patel',
      customerPhone: '+91 98199 44321',
      customerEmail: 'amit.patel@gmail.com',
      date: yesterdayStr,
      timeSlot: '19:30',
      partySize: 2,
      table: tableMap['T-01']?._id,
      specialRequests: 'Table near entrance',
      occasion: 'none',
      status: 'cancelled',
      activityHistory: [
        { status: 'confirmed', timestamp: new Date(now.getTime() - 30 * 3600000), updatedBy: 'System', note: 'Online booking' },
        { status: 'cancelled', timestamp: new Date(now.getTime() - 26 * 3600000), updatedBy: 'Priya Mehta', note: 'Guest called to cancel: Flight delayed' },
      ],
    },
    {
      bookingReference: 'RES-1950',
      customer: null,
      customerName: 'Dr. Meera Nambiar',
      customerPhone: '+91 98800 33221',
      customerEmail: 'meera.nambiar@hospital.org',
      date: twoDaysAgoStr,
      timeSlot: '13:00',
      partySize: 2,
      table: tableMap['TR-01']?._id,
      specialRequests: 'Doctor lunch break, speedy service requested',
      occasion: 'none',
      status: 'completed',
      activityHistory: [
        { status: 'confirmed', timestamp: new Date(now.getTime() - 52 * 3600000), updatedBy: 'System', note: 'Confirmed' },
        { status: 'completed', timestamp: new Date(now.getTime() - 49 * 3600000), updatedBy: 'Priya Mehta', note: 'Completed' },
      ],
    },
    {
      bookingReference: 'RES-1840',
      customer: null,
      customerName: 'Siddharth Roy',
      customerPhone: '+91 98210 66554',
      customerEmail: 'siddharth@venturecap.in',
      date: threeDaysAgoStr,
      timeSlot: '20:30',
      partySize: 8,
      table: tableMap['PDR-01']?._id,
      specialRequests: 'Private investor dinner',
      occasion: 'business',
      status: 'completed',
      activityHistory: [
        { status: 'confirmed', timestamp: new Date(now.getTime() - 76 * 3600000), updatedBy: 'Priya Mehta', note: 'Concierge booking' },
        { status: 'completed', timestamp: new Date(now.getTime() - 72 * 3600000), updatedBy: 'Priya Mehta', note: 'Completed' },
      ],
    },
  ];

  await Reservation.insertMany(reservationsData);
  console.log(`Seeded ${reservationsData.length} diverse reservations.`);

  // -------------------------------------------------------------
  // 5. AUDIT LOGS
  // -------------------------------------------------------------

  const auditLogsData = [
    {
      actor: waiterUser?._id,
      actorName: 'Rohan Verma',
      action: 'TABLE_SEATED',
      entityType: 'table',
      entityId: 'T-03',
      details: { guestCount: 3, customerName: 'Ananya Iyer', section: 'Main Dining' },
      timestamp: new Date(now.getTime() - 35 * 60 * 1000),
    },
    {
      actor: waiterUser?._id,
      actorName: 'Rohan Verma',
      action: 'ORDER_PLACED',
      entityType: 'order',
      entityId: 'ORD-2026-0001',
      details: { tableNumber: 'T-03', itemsCount: 4, round: 1, total: 1449 },
      timestamp: new Date(now.getTime() - 33 * 60 * 1000),
    },
    {
      actor: chefUser?._id,
      actorName: 'Chef Sanjeev',
      action: 'KITCHEN_TICKET_STARTED',
      entityType: 'kitchen_ticket',
      entityId: 'K-001',
      details: { ticketNumber: 'K-001', tableNumber: 'T-03', status: 'preparing' },
      timestamp: new Date(now.getTime() - 25 * 60 * 1000),
    },
    {
      actor: waiterUser?._id,
      actorName: 'Rohan Verma',
      action: 'TABLE_SEATED',
      entityType: 'table',
      entityId: 'T-05',
      details: { guestCount: 5, customerName: 'Vikram Sengupta', section: 'Main Dining' },
      timestamp: new Date(now.getTime() - 55 * 60 * 1000),
    },
    {
      actor: waiterUser?._id,
      actorName: 'Rohan Verma',
      action: 'ORDER_ROUND_ADDED',
      entityType: 'order',
      entityId: 'ORD-2026-0007',
      details: { tableNumber: 'T-05', round: 2, items: 'Desserts & Cocktails' },
      timestamp: new Date(now.getTime() - 18 * 60 * 1000),
    },
    {
      actor: waiterUser?._id,
      actorName: 'Rohan Verma',
      action: 'BILL_REQUESTED',
      entityType: 'table',
      entityId: 'TR-02',
      details: { tableNumber: 'TR-02', customerName: 'Pooja Hegde', finalTotal: 2289 },
      timestamp: new Date(now.getTime() - 12 * 60 * 1000),
    },
    {
      actor: chefUser?._id,
      actorName: 'Chef Sanjeev',
      action: 'KITCHEN_TICKET_READY',
      entityType: 'kitchen_ticket',
      entityId: 'K-003',
      details: { ticketNumber: 'K-003', tableNumber: 'BAR-02', status: 'ready', priority: 'rush' },
      timestamp: new Date(now.getTime() - 8 * 60 * 1000),
    },
    {
      actor: cashierUser?._id,
      actorName: 'Aakash Kapoor',
      action: 'PAYMENT_COLLECTED',
      entityType: 'payment',
      entityId: 'INV-2026-0002',
      details: { invoiceNumber: 'INV-2026-0002', amount: 2572.5, method: 'card', customer: 'Vikram Sengupta' },
      timestamp: new Date(now.getTime() - 2 * 3600000),
    },
    {
      actor: managerUser?._id,
      actorName: 'Priya Mehta',
      action: 'RESERVATION_CONFIRMED',
      entityType: 'reservation',
      entityId: 'RES-7714',
      details: { bookingReference: 'RES-7714', guest: 'Sanjay Godbole', partySize: 8, table: 'PDR-01' },
      timestamp: new Date(now.getTime() - 4 * 3600000),
    },
    {
      actor: waiterUser?._id,
      actorName: 'Rohan Verma',
      action: 'TABLE_STATUS_CHANGED',
      entityType: 'table',
      entityId: 'T-01',
      details: { previousStatus: 'occupied', newStatus: 'cleaning' },
      timestamp: new Date(now.getTime() - 10 * 60 * 1000),
    },
    {
      actor: chefUser?._id,
      actorName: 'Chef Sanjeev',
      action: 'TAKEAWAY_ORDER_READY',
      entityType: 'order',
      entityId: 'ORD-2026-0011',
      details: { customerName: 'Sneha Reddy', pickupCounter: 'Shelf B-2' },
      timestamp: new Date(now.getTime() - 5 * 60 * 1000),
    },
    {
      actor: customerUser?._id,
      actorName: 'Ananya Iyer',
      action: 'ONLINE_ORDER_PLACED',
      entityType: 'order',
      entityId: 'ORD-2026-0012',
      details: { orderType: 'takeaway', total: 1496 },
      timestamp: new Date(now.getTime() - 4 * 60 * 1000),
    },
  ];

  await AuditLog.insertMany(auditLogsData);
  console.log(`Seeded ${auditLogsData.length} realistic audit logs.`);

  console.log('--- Dummy Operations Data Generation Completed Successfully! ---');
  return {
    activeTables: ['T-03', 'T-05', 'TR-02', 'BAR-02', 'T-01', 'TR-01', 'PDR-01'],
    ordersCount: createdCompletedOrders.length + 6,
    ticketsCount: 6,
    reservationsCount: reservationsData.length,
    auditLogsCount: auditLogsData.length,
  };
};
