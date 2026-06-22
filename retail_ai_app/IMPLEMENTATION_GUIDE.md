# RetailAI — Implementation Guide

A complete step-by-step manual for setting up, running, and understanding the RetailAI project from scratch on a single local machine.

---

## 📋 Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Prerequisites — Install Before You Start](#2-prerequisites--install-before-you-start)
3. [Project Folder Structure](#3-project-folder-structure)
4. [Backend Setup (Flask + SQLite)](#4-backend-setup-flask--sqlite)
5. [Frontend Setup (React)](#5-frontend-setup-react)
6. [Running the Application](#6-running-the-application)
7. [Seeding the Database](#7-seeding-the-database)
8. [How the Authentication Works](#8-how-the-authentication-works)
9. [How the AI Engine Works](#9-how-the-ai-engine-works)
10. [Excel Upload Feature](#10-excel-upload-feature)
11. [Adding a New Owner / Store via UI](#11-adding-a-new-owner--store-via-ui)
12. [Resetting the Database](#12-resetting-the-database)
13. [Building for Production (Frontend)](#13-building-for-production-frontend)
14. [Common Errors & Fixes](#14-common-errors--fixes)
15. [File-by-File Code Reference](#15-file-by-file-code-reference)

---

## 1. Technology Stack

### Backend
| Component | Technology | Version |
|---|---|---|
| Language | Python | 3.14.x (3.9+ required) |
| Web Framework | Flask | 3.1.3 |
| CORS Handling | Flask-CORS | 6.0.5 |
| Database | SQLite (embedded) | via Python `sqlite3` stdlib |
| Excel Processing | openpyxl | 3.1.5 |
| Password Hashing | SHA-256 | via Python `hashlib` stdlib |
| Auth Tokens | UUID-based in-memory tokens | custom (`modules/auth.py`) |

### Frontend
| Component | Technology | Version |
|---|---|---|
| Language | JavaScript (ES2022+) | — |
| UI Framework | React | 19.2.7 |
| Router | React Router DOM | 7.18.0 |
| Charts | Chart.js + react-chartjs-2 | 4.5.1 / 5.3.1 |
| HTTP Client | Axios | 1.18.0 |
| Build Tool | Create React App (react-scripts) | 5.0.1 |
| Runtime | Node.js | 24.x (18+ required) |
| Package Manager | npm | 11.x (9+ required) |

---

## 2. Prerequisites — Install Before You Start

### 2.1 Python

Download from **https://python.org/downloads** (version 3.9 or higher).

During installation on Windows:
- ✅ Check **"Add Python to PATH"**
- ✅ Check **"Install pip"**

Verify:
```bash
python --version
pip --version
```

### 2.2 Node.js & npm

Download from **https://nodejs.org** — choose the **LTS version** (18.x or higher).  
npm is bundled with Node.js automatically.

Verify:
```bash
node --version
npm --version
```

### 2.3 Git (optional — needed for cloning from GitHub)

Download from **https://git-scm.com/downloads**

Verify:
```bash
git --version
```

---

## 3. Project Folder Structure

```
Sales_Mngr/                          ← Workspace root
├── RetailAI template Sports.xlsx    ← Pre-built Sports demo data file
├── retail_ai_app/
│   ├── README.md                    ← Quick-start guide + demo credentials
│   ├── IMPLEMENTATION_GUIDE.md      ← This file
│   ├── Used_prompt.md               ← Full AI prompt used to build this project
│   ├── backend/
│   │   ├── app.py                   ← Flask API server — all routes defined here
│   │   ├── models.py                ← SQLite schema creation + get_db() helper
│   │   ├── seed_data.py             ← Populates DB with 3 years of demo data
│   │   ├── retail_ai.db             ← SQLite database file (auto-created by seed_data.py)
│   │   ├── requirements.txt         ← Python package list
│   │   └── modules/
│   │       ├── __init__.py
│   │       ├── ai_engine.py         ← All AI logic — insights, seasonal patterns, recommendations
│   │       └── auth.py              ← Token creation/validation, password hashing
│   └── frontend/
│       ├── package.json             ← npm dependencies
│       ├── public/
│       │   └── index.html
│       └── src/
│           ├── App.js               ← Root router + layout
│           ├── index.js             ← React entry point
│           ├── index.css            ← All global styles
│           ├── api.js               ← Axios API client (all backend calls)
│           ├── context/
│           │   └── AuthContext.js   ← Global auth state, refresh timestamp, store switching
│           ├── components/
│           │   ├── Sidebar.js       ← Left navigation, store selector, refresh timestamp
│           │   └── UI.js            ← Reusable: StatCard, Spinner, InsightCard, ProgressBar
│           └── pages/
│               ├── AuthPages.js     ← Login + Register (with password policy validation)
│               ├── DashboardPage.js ← Charts (current FY + historical FY), KPI cards, GST
│               ├── InventoryPage.js ← Inventory table, inline qty adjuster, reorder suggestions
│               ├── AllRecsPage.js   ← AI Insights — combined across all stores + store filter
│               ├── SettingsPage.js  ← Add Store, Add Product, Delete Product, Excel upload
│               └── ContactPage.js  ← Contact RetailAI support info
```

---

## 4. Backend Setup (Flask + SQLite)

### Step 1 — Navigate to backend directory

```bash
cd retail_ai_app/backend
```

### Step 2 — (Recommended) Create a Python virtual environment

```bash
# Create virtual environment
python -m venv venv

# Activate it — Windows
venv\Scripts\activate

# Activate it — macOS / Linux
source venv/bin/activate
```

> You will see `(venv)` in your terminal prompt when it is active.  
> To deactivate later: `deactivate`

### Step 3 — Install Python dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `flask` — web framework
- `flask-cors` — allows the React frontend (port 3000) to call the Flask backend (port 5000)
- `openpyxl` — for Excel template generation and upload parsing

Or install manually:
```bash
pip install flask flask-cors openpyxl
```

### Step 4 — Seed the database

```bash
python seed_data.py
```

This creates `retail_ai.db` and populates it with:
- 2 demo owners (A. Sharma, S. Mukherjee)
- 3 demo stores (ABC Store, XYZ Electronics, MNO Motors)
- ~50 products across all stores
- ~41,000+ orders from Jan 2023 to Mar 2026
- Weather history and festival calendar data

> ⚠️ **Run seed_data.py only once**. Running it again will duplicate data unless you delete `retail_ai.db` first.

### Step 5 — Start the Flask server

```bash
python app.py
```

The backend API starts at: **http://localhost:5000**

You should see:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

> Keep this terminal open. The backend must be running before you use the app.

---

## 5. Frontend Setup (React)

Open a **new terminal** (keep the backend terminal running).

### Step 1 — Navigate to frontend directory

```bash
cd retail_ai_app/frontend
```

### Step 2 — Install npm dependencies

```bash
npm install
```

This downloads all packages listed in `package.json` into `node_modules/`.  
Only needed the first time (or after `node_modules` is deleted).

> This may take 1–3 minutes on first run.

### Step 3 — Start the React development server

```bash
npm start
```

The app opens automatically at: **http://localhost:3000**

> Keep this terminal open. The frontend must be running to use the app.

---

## 6. Running the Application

You need **two terminals running at the same time**:

| Terminal | Command | URL |
|---|---|---|
| Terminal 1 — Backend | `cd retail_ai_app/backend && python app.py` | http://localhost:5000 |
| Terminal 2 — Frontend | `cd retail_ai_app/frontend && npm start` | http://localhost:3000 |

Open your browser and go to **http://localhost:3000**.

### Demo Login Credentials

| Owner | Email | Password | Stores |
|---|---|---|---|
| Mr. A. Sharma | sharma@abc.com | sharma123 | ABC Store, MNO Motors |
| Mrs. S. Mukherjee | mukherjee@xyz.com | mukh123 | XYZ Electronics |

> 🔒 Passwords are not shown on the login page by design. Refer to this guide for demo credentials.

---

## 7. Seeding the Database

The `seed_data.py` script does the following in order:

1. Calls `init_db()` from `models.py` — creates all tables if they don't exist
2. Inserts the 2 demo owners with hashed passwords
3. Creates 3 stores linked to the correct owners
4. Inserts products for each store (ABC: ~17 products, XYZ: ~10, MNO: ~10)
5. Inserts customers (50 per store)
6. Generates ~3 years of randomised daily orders with realistic seasonal patterns
7. Inserts weather history and festival calendar data

**To re-seed from scratch:**
```bash
cd retail_ai_app/backend
del retail_ai.db          # Windows
rm retail_ai.db           # macOS/Linux
python seed_data.py
```

---

## 8. How the Authentication Works

Authentication is implemented in `modules/auth.py` using a simple in-memory token store.

### Flow:
1. **Register** (`POST /api/auth/register`) — owner name, email, password + store list  
   - Password is validated for strength (min 8 chars, uppercase, lowercase, digit, special char)  
   - Password is SHA-256 hashed before storage  
   - Owner and stores are written to SQLite  
   - A UUID token is returned  

2. **Login** (`POST /api/auth/login`) — email + password  
   - Password hash is compared  
   - A UUID token is created, stored in an in-memory dict with owner_id  
   - Token returned to frontend, stored in `localStorage`  

3. **All protected API calls** — `Authorization: Bearer <token>` header  
   - `_get_owner_id()` extracts and validates the token on every protected route  

4. **Logout** (`POST /api/auth/logout`) — token is removed from the in-memory store

> ⚠️ **In-memory tokens**: All sessions are lost when Flask restarts. This is intentional for demo use.

---

## 9. How the AI Engine Works

All AI logic lives in `modules/ai_engine.py`. It is a **rule-based + statistical** engine — no ML models or external APIs.

### Guard: No Sales History → No Insights
If a store has zero completed orders, `generate_recommendations()` returns a single informational card: *"Upload your historical data to unlock AI insights."* This prevents meaningless generic insights for new stores.

### Insight Categories Generated:
| Category | Logic |
|---|---|
| Seasonal demand spike | Category sales grouped by month; months >130% of average flagged as spikes |
| Low demand period | Months <70% of average flagged as slumps |
| Stockout loss estimate | Stockout products × avg 30-day daily sales × 7 × unit price |
| Overstock alert | Inventory >90% of max capacity; holding cost = excess × cost × 2% |
| Festival opportunity | Upcoming festivals (next 90 days) × store type impact map × store's own categories only |
| Weather impact | Dominant weather condition (last 30 days) × category impact map × store's own categories only |
| Store-type specific | Automotive Q4 surge (Oct–Dec), Electronics festive spike (Oct–Dec) |

### Category Filtering:
All festival and weather insights are filtered against `_store_product_categories()` — so a sports store will never see a "cold beverages" weather alert.

---

## 10. Excel Upload Feature

### Downloading the Template
In the app: **Settings → Download Excel Template**  
File name: **`RetailAI Template.xlsx`**  
Contains 3 sheets: Products, Sales History, Instructions.  
Each sheet has exactly **1 example row** (not multiple) to avoid confusion.

### Uploading Data
In the app: **Settings → drag-and-drop or browse `.xlsx` file**

The upload handler (`POST /api/stores/:id/upload/data`) does:
1. Reads the **Products** sheet — creates new products or updates existing ones by name match
2. Reads the **Sales History** sheet — creates orders and order_items rows linked to matched products
3. Returns a summary: products added, updated, sales imported, rows skipped, warnings

### Sports Demo File
A pre-built demo file **`RetailAI template Sports.xlsx`** is in the workspace root (`Sales_Mngr/`).  
It contains 38 sports products and ~7,400+ sales rows from Apr 2024 to present.  
Upload it via Settings after registering a Sports retail store to instantly unlock AI insights.

---

## 11. Adding a New Owner / Store via UI

### New Owner Registration:
1. Go to **http://localhost:3000/register**
2. Fill: Owner Name, Email, Password (must meet policy), Store Name + Type
3. Click **Register** — logged in automatically, empty inventory

### Adding Another Store (existing owner):
1. Log in → **Settings** (sidebar)
2. Click **+ Add New Store** → enter name and type
3. Store is created immediately; switch to it using the sidebar dropdown

### Password Policy:
- Minimum **8 characters**
- At least **1 uppercase**, **1 lowercase**, **1 number**, **1 special character** (e.g. `@`, `#`, `!`)
- Validated on both frontend (live feedback) and backend (400 error)

---

## 12. Resetting the Database

To completely reset all data back to the demo state:

```bash
cd retail_ai_app/backend

# Step 1: Delete the existing database
del retail_ai.db          # Windows
rm retail_ai.db           # macOS/Linux

# Step 2: Re-run the seed script
python seed_data.py
```

This restores:
- Mr. A. Sharma (`sharma@abc.com` / `sharma123`) with ABC Store + MNO Motors
- Mrs. S. Mukherjee (`mukherjee@xyz.com` / `mukh123`) with XYZ Electronics
- All ~41,000+ demo orders and inventory

> Restart the Flask server after resetting the DB.

---

## 13. Building for Production (Frontend)

To create an optimised production build of the React frontend:

```bash
cd retail_ai_app/frontend
npm run build
```

Output is written to `frontend/build/`.  
This can be served by any static file server or by Flask itself by serving the `build/` folder.

To serve using Flask (optional):
```python
# Add to app.py
from flask import send_from_directory

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path and os.path.exists(os.path.join('frontend/build', path)):
        return send_from_directory('frontend/build', path)
    return send_from_directory('frontend/build', 'index.html')
```

---

## 14. Common Errors & Fixes

| Error | Likely Cause | Fix |
|---|---|---|
| `ModuleNotFoundError: flask` | Flask not installed | `pip install flask flask-cors openpyxl` |
| `Address already in use :5000` | Flask already running | Kill the existing process or use `python app.py --port 5001` |
| `npm: command not found` | Node.js not installed | Install Node.js from nodejs.org |
| `Cannot GET /api/...` in browser | Frontend calling wrong URL | Check `api.js` baseURL is `http://localhost:5000/api` |
| `CORS error` in browser console | Flask not running or CORS not configured | Ensure Flask is running; `flask-cors` is installed |
| `retail_ai.db not found` | seed_data.py not run | `cd backend && python seed_data.py` |
| `openpyxl not installed` | Missing package | `pip install openpyxl` |
| `Login with sharma@demo.com fails` | Old email — was updated | Use `sharma@abc.com` or re-seed the DB |
| Token expired / `Unauthorized 401` | Flask was restarted | Log in again in the browser |
| `npm install` fails | Old Node.js version | Upgrade to Node.js 18+ |
| Blank white screen after `npm start` | JS build error | Check browser console; run `npm install` again |

---

## 15. File-by-File Code Reference

### Backend

| File | Purpose |
|---|---|
| `app.py` | All Flask routes — auth, stores, products, dashboard, sales, insights, Excel upload/download |
| `models.py` | `init_db()` creates all tables; `get_db()` returns a connected SQLite connection |
| `seed_data.py` | Generates 3 years of demo data for all 3 stores |
| `modules/auth.py` | `hash_password()`, `verify_password()`, `create_token()`, `validate_token()`, `revoke_token()` |
| `modules/ai_engine.py` | `AIEngine` class — `generate_recommendations()`, `monthly_sales()`, `inventory_status()`, `stockout_losses()`, seasonal patterns, festival and weather impact |
| `retail_ai.db` | SQLite database — auto-created by `seed_data.py` |
| `requirements.txt` | Python packages: flask, flask-cors, openpyxl |

### Frontend

| File | Purpose |
|---|---|
| `App.js` | BrowserRouter + route definitions; renders Sidebar + page routes |
| `index.css` | All CSS — layout, sidebar, cards, tables, badges, auth forms, charts |
| `api.js` | Axios instance with base URL + auth token interceptor; exports all API call functions |
| `context/AuthContext.js` | `AuthProvider` — owner, stores, activeStore, lastRefresh state; login/logout/switchStore/touchRefresh |
| `components/Sidebar.js` | Left nav, store selector, last refresh timestamp display, logout button |
| `components/UI.js` | `StatCard`, `Spinner`, `Badge`, `StoreTypeBadge`, `ProgressBar`, `InsightCard` |
| `pages/AuthPages.js` | Login page + Register page; password policy validation; RetailAI logo |
| `pages/DashboardPage.js` | Current FY chart + Historical FY chart; GST cards; stat cards; category doughnut |
| `pages/InventoryPage.js` | Inventory table with inline `QtyAdjuster`; reorder suggestions table |
| `pages/AllRecsPage.js` | AI Insights — combined across all stores; priority + type + store filters |
| `pages/SettingsPage.js` | Add Store modal; Add Product modal (type-aware placeholders); Delete Product; Excel upload |
| `pages/ContactPage.js` | Support email and phone number display |

---

*Made with IBM Bob*
