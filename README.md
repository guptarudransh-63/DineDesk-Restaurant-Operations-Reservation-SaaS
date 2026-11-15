# DineDesk — Restaurant Management, Table Reservations, Kitchen Operations & Billing SaaS

**DineDesk** is an enterprise-grade restaurant operations platform designed to digitize dining experiences, from customer-facing table reservations and online takeaway ordering to floor seating, dine-in POS terminals, real-time Kitchen Display Systems (KDS), GST-compliant billing, and executive analytics.

---

## 🌟 Key Application Experiences

### 1. 🍽️ Customer Portal
- **Culinary Landing Page:** Atmospheric hero banner, restaurant philosophy, chef's tasting specials, and interactive hours/location details.
- **Dynamic Menu:** Categorized catalog (Starters, Gourmet Mains, Biryani & Rice Bowls, Wood-fired Pizza & Pasta, Artisan Desserts, Craft Beverages) dynamically fetched from MongoDB with dietary filters (`veg`, `non-veg`, `vegan`), spice meters, and live availability status.
- **Item Customizations:** Portion size selectors, gourmet add-ons (Truffle oil, Burrata float), and special kitchen instructions.
- **Real-Time Table Reservations:** Automated capacity calculation engine that checks table availability across time slots, prevents double bookings, respects restaurant opening hours, and issues instant booking references (e.g. `RES-4821`).
- **Takeaway Checkout & Cart:** Slide-over cart, express pickup timing (ASAP, 30m, 45m, 1h), promo code engine (`WELCOME10`, `CHEF15`, `VIP20`), GST tax calculation (CGST 2.5% + SGST 2.5%), and tender selection.
- **Live Order Tracker:** Visual 5-stage progress tracker (`Placed` → `Accepted` → `Preparing` → `Ready` → `Completed`) updated in real-time via Socket.io.
- **Customer Dashboard:** Order history with 1-click reorder and reservation cancellation.

### 2. 🛎️ Staff & Captain Interface
- **Visual Table Floor Overview:** Real-time color-coded table layout (Available, Reserved, Occupied, Cleaning, Out of Service) across 4 restaurant sections: Main Dining, Terrace, Private Dining (PDR), and Bar Lounge.
- **Table Session Lifecycle:** Seat walk-ins, assign reservations, track elapsed dining time in minutes, request bills, and close tables.
- **Dine-In POS Ordering:** Fast table-side POS ordering terminal. Supports multi-round ordering (Round 2, Round 3 additions) without altering previous rounds or historical bills.

### 3. 👨‍🍳 Real-Time Kitchen Display System (KDS)
- **Ticket Cards Grid:** Card-based tickets with table number, order type, elapsed color-coded timers (Green < 10m, Amber 10–20m, Red > 20m), round indicators, and special chef notes.
- **Interactive Item Checkboxes:** Kitchen staff can tap individual dishes to transition from `pending` → `preparing` → `ready`.
- **Workflow Transitions:** One-click ticket actions: "Accept Order", "Start Prep", "Mark Entire Ticket Ready", "Serve / Complete".
- **Instant Synchronization:** Driven by Socket.io room broadcasts so captain POS and customer order trackers update without page reloads.

### 4. 💳 Billing & POS Checkout
- **Bill Review & Settle:** Review table items, apply authorized discount vouchers or custom percentages (5%, 10%, 15%, 20%), calculate composite GST taxes, and tender payment (Cash, UPI QR, Credit/Debit Card, Razorpay Gateway).
- **Official GST Tax Invoices:** Generates verifiable tax invoices with GSTIN (`29AABCB1234F1Z8`), itemized breakdowns, CGST/SGST details, and built-in print/PDF functionality.
- **Automated Floor Clearing:** Settling a table's bill automatically closes the dining session and transitions the table to `cleaning` status.

### 5. 👑 Admin Dashboard & Executive Analytics
- **Live Database KPIs:** Real-time revenue (excluding cancelled orders), total orders, average order value (AOV), dine-in vs takeaway split, table occupancy, and kitchen queues.
- **Recharts Visualizations:** Revenue trends over time, orders by type, top-selling dishes by volume, and payment method distribution.
- **Menu Management CRUD:** Add new dishes, adjust prices, edit recipes, and toggle real-time availability (`available`, `temporarily_unavailable`, `sold_out`).
- **Reservation Directory:** Filter by date and status, mark guests seated, completed, or no-show.
- **Staff Roles & Access:** Manage staff accounts (Admin, Manager, Waiter, Kitchen, Cashier).
- **Restaurant Settings:** Configure GSTIN, tax rates, operating shifts, and table reservation buffers.

---

## 🔑 Pre-Seeded Demo Accounts (1-Click Switcher)

DineDesk includes a **One-Click Role Switcher** modal directly in the navigation bar. You can switch personas instantly without entering passwords:

| Role | Name | Email | Password | Primary Experience |
|---|---|---|---|---|
| **Admin** | Rajesh Sharma | `admin@dinedesk.com` | `password123` | Full Analytics, Menu CRUD, Staff, Settings |
| **Manager** | Priya Mehta | `manager@dinedesk.com` | `password123` | Floor Management, Reservations, Orders |
| **Waiter** | Rohan Verma | `waiter@dinedesk.com` | `password123` | Table Seating, Dine-in POS Ordering |
| **Kitchen Chef** | Chef Sanjeev | `chef@dinedesk.com` | `password123` | Real-time Kitchen Display System (KDS) |
| **Cashier** | Aakash Kapoor | `cashier@dinedesk.com` | `password123` | Billing Checkout, Split Bills, GST Invoices |
| **Customer** | Ananya Iyer | `customer@dinedesk.com` | `password123` | Menu Ordering, Takeaway, Table Booking |

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Zustand, Axios, Recharts, React Router v7.
- **Backend:** Node.js (ES Modules), Express.js, Socket.io, Mongoose, JWT, bcryptjs.
- **Database:** MongoDB (with automatic fallback to embedded `mongodb-memory-server` if local MongoDB is not running).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)
- MongoDB (Optional: the backend automatically uses embedded MongoDB if no daemon is running on port 27017).

### 2. Installation
```bash
# Clone the repository and enter the directory
cd "restuarant system"

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Start the Application

In **Terminal 1** (Backend Server):
```bash
cd backend
npm start
# Runs on http://localhost:5050
```

In **Terminal 2** (Frontend Client):
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173 (or next free port)
```

The database seeds automatically on the first boot with 35+ gourmet menu items across 7 categories, tables across 4 sections, active floor dining sessions & multi-round orders, real-time Kitchen tickets, takeaway queues, 40+ historical completed orders with GST invoices across 30 days for rich analytics charts, 14 diverse reservations (past, today lunch/dinner, tomorrow, and future), and system audit logs.

### 4. Seeding & Dummy Data Utilities

- `npm run seed` — Seed initial data (skips if data exists)
- `npm run seed:force` — Force reset and seed fresh comprehensive dummy dataset
- `npm run seed:append` — Append rich operational dummy data (active sessions, KDS tickets, historical orders, reservations, audit logs) without wiping existing users or menu items
- Or run directly: `node backend/src/utils/addDummyData.js`

---

## 📡 REST API Endpoints Overview

- `POST /api/auth/login` — Sign in and issue JWT token
- `GET /api/auth/demo-users` — Retrieve pre-seeded test accounts
- `GET /api/menu` — Dynamic catalog with dietary and category filters
- `PATCH /api/menu/items/:id/availability` — Toggle item availability
- `GET /api/reservations/availability` — Real-time table capacity engine
- `POST /api/reservations` — Confirm table reservation
- `GET /api/tables` — Floor tables with active sessions
- `POST /api/tables/:id/seat` — Seat walk-in or reserved guests
- `POST /api/orders` — Create dine-in or takeaway order
- `POST /api/orders/:id/add-items` — Dispatch Round 2+ to kitchen
- `GET /api/kitchen/tickets` — Active KDS preparation tickets
- `PATCH /api/kitchen/tickets/:id/status` — Advance preparation state
- `POST /api/payments` — Settle order bill and generate GST invoice
- `GET /api/payments/invoice/:invoiceNumber` — Fetch printable tax invoice
- `GET /api/admin/dashboard` — Live executive metrics
- `GET /api/admin/analytics` — Recharts chart dataset
