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

## 🛠️ TECHNOLOGY STACK & VERSIONS

### Backend
All backend components run as a local Python process. No external servers are required.

| Component | Technology | Version Used |
|---|---|---|
| Language | Python | 3.14.x (minimum: 3.9+) |
| Web Framework | Flask | 3.1.3 |
| CORS Middleware | Flask-CORS | 6.0.5 |
| Database | SQLite (embedded) | Python `sqlite3` stdlib — no separate install needed |
| Excel Processing | openpyxl | 3.1.5 |
| Password Hashing | SHA-256 | Python `hashlib` stdlib |
| Auth Tokens | UUID-based in-memory store | custom (`modules/auth.py`) |
| AI / Analytics | Rule-based + statistical engine | custom (`modules/ai_engine.py`) — no ML libraries |

### Frontend
All frontend components run in the browser via a local development server. No deployment is needed for demo use.

| Component | Technology | Version Used |
|---|---|---|
| Language | JavaScript (ES2022+) | — |
| UI Framework | React | 19.2.7 |
| Router | React Router DOM | 7.18.0 |
| Charts | Chart.js | 4.5.1 |
| Chart React Wrapper | react-chartjs-2 | 5.3.1 |
| HTTP Client | Axios | 1.18.0 |
| Build Toolchain | Create React App (react-scripts) | 5.0.1 |
| Runtime | Node.js | 24.x (minimum: 18+) |
| Package Manager | npm | 11.x (minimum: 9+) |

---

## 🔐 AUTHENTICATION & USER MANAGEMENT

### Login / Logout
- Store owners must be able to:
  - Log in securely
  - Log out

### Demo Credentials
Pre-create login credentials:

1. Mr. A. Sharma
   - Email: `sharma@abc.com`
   - Password: `sharma123`
   - Owns: ABC Store, MNO Motors

2. Mrs. S. Mukherjee
   - Email: `mukherjee@xyz.com`
   - Password: `mukh123`
   - Owns: XYZ Electronics

Provide these credentials clearly in README for demo.
The README must also include a **Registration Guide** section that:
- Documents the registration steps for new users
- Includes a **demo record table** (example: Owner Name, Email, Password, Store) that mirrors the pre-seeded owner sections, so a demo presenter can note down new user credentials
- Advises users to note their credentials since the login page does not display them

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

- **Password Policy (enforced on both frontend and backend):**
  - Minimum **8 characters**
  - At least **1 uppercase** letter
  - At least **1 lowercase** letter
  - At least **1 number**
  - At least **1 special character** (e.g. `@`, `#`, `!`, `$`)
  - Client-side live feedback shown while typing; Register button disabled until policy is met
  - Server-side validation also enforces the same policy and returns an error if violated

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
- AI must generate insights per store. But in AI Insights tab, as stated above, can put all the recommendations owner-wise, combined of all stores per Owner.
- No cross-store mixing of patterns otherwise

### Insights Only When Sales History Exists (CRITICAL)
- **For new stores (or any store with no sales data), the AI engine must return NO business insights**
- Showing grocery, beverage, Onam, or any other generic insight to a Sports retailer or any newly registered store is incorrect behaviour
- The engine must check whether the store has at least one completed order before generating any insight
- If no orders exist, return a single informational message: *"No sales history yet — upload your historical data via Settings → Upload Excel to unlock AI insights"*
- Festival and weather insights must be **filtered against the store's actual product categories** — do not surface a "cold beverages" weather alert for a store that sells motorbikes
- The AI agent reads **both products AND order history** to generate context-accurate insights:
  - Products define what categories the store sells
  - Order history drives seasonal patterns, demand spikes, and loss estimates
  - Without both, no pattern-based insights should be generated

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

### Sidebar Navigation Tabs
- **Dashboard** — Sales performance and inventory health
- **Inventory** — Stock levels, reorder suggestions, and stock management
- **AI Insights** — Combined AI insights across all stores owned by the user, with per-store filter (replaces the former separate "Store Insights(AI)" and "All Insights" tabs)
- **Settings** — Manage stores, products, and data uploads
- **Contact RetailAI** — Support contact information (email: support@RetailAI.com, phone: 9876543210)

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
  - A **Download Template** button provides the pre-formatted .xlsx file named **"RetailAI Template.xlsx"** (fixed name, not store-specific)
  - The template contains 3 sheets:
    1. **Products** — with required columns marked with `*` (red star in header); contains exactly **one example data row** (not more)
    2. **Sales History** — order-level historical sales rows; contains exactly **one example data row**
    3. **Instructions** — step-by-step guidance for filling the template
  - Example row in the template uses a generic sports product ("Football Size 5") so it is not misleading to non-sports stores
  - Required fields are visually highlighted (blue background in example rows)
  - On upload: new products are created; existing product quantities are updated; sales history rows are inserted
  - Upload result shows: products added, products updated, sales imported, rows skipped, and any row-level warnings

### Pre-built Demo Data File — Sports Retail
- A pre-built Excel file **"RetailAI template Sports.xlsx"** is provided in the workspace root (`SALES_MNGR/`) for demo purposes
- This file is **not inserted into the database automatically** — it must be uploaded by an owner through the portal (Settings → Upload Excel)
- **Products sheet** contains 38 sports products across 12 categories: Football, Cricket, Hockey, Badminton, Tennis, Table Tennis, Chess, Carom, Yoga, Swimming, Cycling, Jogging
- **Sales History sheet** contains generated realistic sales data from **April 2024 to current date**, with seasonal demand patterns per sport
- This file is intended for demo use with the Sports retail store owner registration scenario

---

## 🎨 UI REQUIREMENTS

- Clean, modern, lightweight
- Chart.js for visualization
- Fast loading
- Simple navigation:
  - Dashboard
  - Inventory
  - AI Insights
  - Settings
  - Contact RetailAI
  - Login
- **Login page must NOT display demo credentials** — credentials are documented in README only
- **Login and Register pages must display the RetailAI logo** at the top of the card, styled consistently with the sidebar logo (same "Retail" + blue "AI" branding, adjusted to an appropriate size for the auth card)
- Monthly order/revenue charts:
  - **Historical chart** — shows last 2 Financial Years window (Apr 2024 → Mar 2026), always fixed
  - **Current FY chart** — shows the current Financial Year (Apr of current FY start → current real calendar month), based on actual system date
  - In all graphs, **only odd-numbered month names are shown on the X-axis** (Jan, Mar, May, Jul, Sep, Nov) — even-numbered months (Feb, Apr, Jun, Aug, Oct, Dec) have no label but their data bars/points are still fully visible
  - This reduces clutter without losing any data
  - Chart height set to 240px to accommodate rotated tick labels
- **Last Refresh Timestamp** displayed in the top-right corner of the UI (inside every sidebar-adjacent area):
  - Shows "Last refreshed: DD MMM YYYY, HH:MM:SS" format
  - Updated whenever any Owner changes data (inventory, adds product, adds store, uploads Excel)
  - Updated whenever an Owner logs in
  - Stored in localStorage and visible across all tabs
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

---

## 📘 PROJECT DOCUMENTATION FILES

The following documentation files must be maintained alongside the codebase:

### IMPLEMENTATION_GUIDE.md
- A comprehensive manual document (`retail_ai_app/IMPLEMENTATION_GUIDE.md`) must be created and maintained
- It must cover the full manual step-by-step implementation process including:
  - Technology stack with exact versions (backend and frontend separately)
  - Prerequisites and installation instructions for Python, Node.js, npm, and Git
  - Complete folder structure with description of every file
  - Backend setup: virtual environment, pip install, seed_data.py, starting Flask
  - Frontend setup: npm install, npm start
  - How to run both servers simultaneously
  - How authentication works (token flow, password policy, in-memory sessions)
  - How the AI engine works (guard logic, insight categories, category filtering)
  - Excel upload feature details (template, upload handler, sports demo file)
  - How to add new owners and stores via the UI
  - How to reset the database
  - How to build for production
  - Common errors and their fixes
  - File-by-file code reference for all backend and frontend files

### README.md
- The README must include a **"Download from GitHub & Run"** section with:
  - `git clone <giturl>/<repository>.git` command (placeholders for actual URL and repo name)
  - Step-by-step instructions: clone → pip install → seed DB → start backend → npm install → npm start
  - Demo credentials table
  - Reference link to `IMPLEMENTATION_GUIDE.md` for full setup details
- The existing Quick Start section is retained for users who already have the repo locally
