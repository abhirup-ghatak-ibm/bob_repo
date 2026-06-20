You are a full-stack software architect and AI engineer.

Build a complete DEMO web application for a multi-store retail system with AI-driven demand forecasting and supply optimization.

---

## 🎯 Objective
The application should simulate multiple stores, including:

1. ABC Store (general retail)
2. XYZ Electronics (electronics store)
3. MNO Motors (car dealership)

### Ownership Structure (IMPORTANT)
- ABC Store and MNO Motors are owned by the same person:
  → Mr. A. Sharma (single owner, multiple stores)

- XYZ Electronics is owned by:
  → Mrs. S. Mukherjee (only one store)

### Key Requirement
- The system must support **multi-store ownership per user**
- Mr. A. Sharma should be able to:
  - Log in once
  - Access BOTH ABC Store and MNO Motors
  - Switch between stores within the app

- Mrs. S. Mukherjee:
  - Has access ONLY to XYZ Electronics

### Data Isolation (CRITICAL)
- All data must remain strictly **store-specific**
- NO mixing of:
  - Sales data
  - AI insights
  - Inventory
- Each store must have completely **independent analytics and recommendations**

---

## 🧱 TECHNICAL CONSTRAINTS (IMPORTANT)
- The app must run on a SINGLE MACHINE (localhost)
- NO external services (no cloud DB, no APIs)
- Use EMBEDDED database (SQLite preferred)
- Backend: Python (Flask or FastAPI)
- Frontend: React
- Should run using simple commands like:
  - `python app.py` OR `npm start`

---

## 🔐 AUTHENTICATION & USER MANAGEMENT

### Login / Logout
- Store owners must be able to:
  - Log in securely
  - Log out

### Demo Credentials
Pre-create login credentials:

1. Mr. A. Sharma
   - Owns:
     - ABC Store
     - MNO Motors

2. Mrs. S. Mukherjee
   - Owns:
     - XYZ Electronics

Provide these credentials clearly in README for demo.

### Multi-Store Access
- If a user owns multiple stores:
  - Show store selection option in the sidebar
  - Allow switching between stores easily
- Ensure:
  - Switching updates all dashboards, reports, and AI insights dynamically
  - There is an "All Recommendations" tab (profile-wise) that shows combined recommendations for all stores owned by an owner
- The "Add Store" card in the All Recommendations tab must be functional — clicking it navigates to the Settings page
- A **Settings page** (accessible from the sidebar navigation for all users) must provide:
  - **Add Store** — any owner (existing or new) can register additional stores at any time
  - **Add Product** — any owner can add products to their active store's inventory; products are persisted in the database
  - **Upload Historical Data (Excel)** — see Excel Upload section below

### Registration Feature
- Allow new users to:
  - Register as store owners
  - Create one or more stores

- Registration must support:
  - Multiple stores per user
  - Future addition of new stores via the Settings page

- Required fields:
  - Owner Name
  - Store Name(s)
  - Email
  - Password (hashed)

- Newly registered users:
  - **Must start with an empty inventory** — no auto-seeded products
  - Can add products manually via Settings → Add Product
  - Can bulk-import products and sales history via Settings → Upload Excel
  - Can add additional stores later via Settings → Add Store

---

## 🗂️ DATABASE DESIGN

Use a structured relational schema including:

### Core Tables:
- Stores (linked to Owners, supports multiple stores per owner)
- Owners
- Products (category, subcategory, brand, variant)
- Customers

### Authentication Tables:
- Users (login credentials, hashed password, role)

### Sales Tables:
- Orders
- OrderItems
- Payments

### Inventory:
- Inventory (per store, per product)

### Supply Chain:
- Suppliers
- SupplyOrders
- SupplyOrderItems

### Analytics / Context Tables:
- WeatherHistory (date, condition, temperature)
- FestivalCalendar (date, festival name, category)
- DemandSignals (month, product category, demand index)

### Data Requirement
- Populate with **3+ years of realistic data** (Jan 2023 – Mar 2026)
- Ensure:
  - Each store has independent datasets
  - ABC, XYZ, and MNO Motors all have separate histories

---

## 📊 AI / ANALYTICS MODULE

Create a local AI agent (no external APIs) that:

### Detects Patterns:
- Seasonal spikes
- Weather impact
- Festival demand
- Electronics lifecycle trends
- Automotive demand cycles (for MNO Motors)

### Identifies Problems:
- Overstocking
- Understocking
- Lost sales due to stockouts
- Unsold perishable goods
- Missed opportunities due to demand spikes

### Store-Specific Insights
- AI must generate insights per store. But in All Recommendations tab, as stated above, can put all the recommendations owner-wise, combined of all stores per Owner.
- No cross-store mixing of patterns otherwise

---

## 🤖 AI SUGGESTIONS ENGINE

Generate insights like:

- "Increase cold beverage stock in ABC Store during summer"
- "Reduce dairy inventory during low-demand periods"
- "Increase electronics stock before festivals in XYZ Electronics"
- "Increase vehicle inventory before festive buying season in MNO Motors"
- "Stock-out detected → estimated revenue loss ₹X (store-specific)"

---

## 🌐 WEB APPLICATION FEATURES

### Dashboard
- Sales trends shown for current Financial Year window (Apr 2024 – Mar 2026)
- Revenue summary:
  - **All-Time Revenue** — total across all FYs in the DB (labelled clearly)
  - **Last 2 FYs Revenue** — sum of the previous 2 completed FYs (labelled with FY names)
  - These two figures can differ from each other; the difference is revenue from earlier or partial FYs
- Inventory health
- Missed sales
- **Current FY Revenue + GST highlight bar** — a dedicated prominently displayed section showing:
  - Current Financial Year label (e.g. "FY 2025-26 — Current FY (YTD)")
  - Revenue till date (current FY)
  - GST Paid till date (current FY, 18% of revenue)
  - Note: GST is calculated at a flat 18% on total revenue for demo purposes
- **Historical GST stat cards** showing:
  - GST paid (18% of revenue) for **only the last 2 completed Financial Years** (not all FYs combined)
  - Each card shows FY label, GST amount, and the FY revenue for that year
- All monetary amounts displayed in compact Indian notation (e.g. ₹210L, ₹3.2Cr)

### AI Insights Panel
- Store-specific recommendations
- Suggested timelines (weeks/months)
- Highlight:
  - Risks
  - Losses
  - Opportunities

### Inventory View
- Stock levels
- Reorder suggestions
- Overstock alerts

### Multi-Store Behavior
- Logged-in user sees ONLY their store(s)
- Multi-store owners can:
  - Switch between stores
- Single-store users see only one

### Settings Page (accessible to ALL owners via sidebar)
- **Add Store section**
  - Any owner can add a new store at any time from the Settings page
  - The "Add Store" card in the All Recommendations tab also links here
- **Add Product section**
  - Owner can add a product to the currently active store
  - Fields: Product Name *, Category *, Subcategory, Brand, Variant, Unit Price *, Cost Price *, Current Stock, Reorder Level, Max Capacity, Is Perishable
  - Added products are immediately persisted to the database and visible in Inventory
  - If the store has no products yet, an empty-state message guides the owner to add products or upload Excel
- **Upload Historical Data (Excel)**
  - Owners can upload historical data in a prescribed Excel format
  - A **Download Template** button provides the pre-formatted .xlsx file
  - The template contains 3 sheets:
    1. **Products** — with required columns marked with `*` (red star in header)
    2. **Sales History** — order-level historical sales rows
    3. **Instructions** — step-by-step guidance for filling the template
  - Required fields are visually highlighted (blue background in sample rows)
  - On upload: new products are created; existing product quantities are updated; sales history rows are inserted
  - Upload result shows: products added, products updated, sales imported, rows skipped, and any row-level warnings

---

## 🎨 UI REQUIREMENTS

- Clean, modern, lightweight
- Chart.js for visualization
- Fast loading
- Simple navigation:
  - Dashboard
  - Inventory
  - AI Insights
  - All Recs
  - Settings
  - Login
- **Login page must NOT display demo credentials** — credentials are documented in README only
- Monthly order/revenue charts show the Financial Year window (Apr 2024 → Mar 2026)
  - All 24 month labels visible with 45° rotation — no truncation
  - Chart height set to 240px to accommodate rotated tick labels
- Large monetary values use compact Indian notation: ₹5K, ₹31L, ₹210L, ₹3.2Cr

---

## 🧪 DEMO SCENARIOS

Simulate:

1. Summer → beverages sold out (ABC Store)
2. Festival → electronics shortage (XYZ Electronics)
3. Rain → low footfall → excess stock
4. Overstock perishables → loss
5. Demand spike → missed sales
6. Vehicle demand surge → MNO Motors stock shortage
7. Multi-store owner switching context (ABC ↔ MNO demo)

---

## 📦 FINAL DELIVERABLE

Generate:

1. Backend code
2. Frontend code
3. Embedded SQLite database
4. Sample data generator
5. AI logic module
6. Authentication system
7. README including:
   - How to run locally
   - Demo credentials
   - Store switching instructions
   - Registration guide

---

## ⚡ OUTPUT FORMAT

Provide:
- Folder structure
- Full source code
- Simple setup steps

---

## 🧠 IMPORTANT CONSTRAINTS

- Entire system runs OFFLINE
- No external APIs
- Lightweight but realistic
- Strong data isolation per store
- Save this prompt in a file called "Used_prompt" inside the app
