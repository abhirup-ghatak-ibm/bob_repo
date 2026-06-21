# RetailAI — Multi-Store Retail Intelligence Platform

A complete **demo web application** for a multi-store retail system with AI-driven demand forecasting and supply optimization.  
Runs entirely **offline on a single machine** — no cloud, no external APIs.

---

## 🏬 Stores & Ownership

| Store Name       | Type         | Owner               | Email                  |
|------------------|--------------|---------------------|------------------------|
| ABC Store        | General      | Mr. A. Sharma       | sharma@abc.com         |
| MNO Motors       | Automotive   | Mr. A. Sharma       | sharma@abc.com         |
| XYZ Electronics  | Electronics  | Mrs. S. Mukherjee   | mukherjee@xyz.com      |

---

## 🔑 Demo Credentials

| Owner              | Email                   | Password   | Stores Accessible                |
|--------------------|-------------------------|------------|----------------------------------|
| Mr. A. Sharma      | sharma@abc.com          | sharma123  | ABC Store, MNO Motors            |
| Mrs. S. Mukherjee  | mukherjee@xyz.com       | mukh123    | XYZ Electronics                  |

---

## ⚡ Quick Start

### Prerequisites
- Python 3.9+ (`python --version`)
- Node.js 18+ (`node --version`)
- npm 9+ (`npm --version`)

---

### Step 1 — Set Up the Backend

```bash
# Navigate to backend folder
cd retail_ai_app/backend

# Install Python dependencies
pip install flask flask-cors

# Seed the database (2 years of realistic data)
python seed_data.py

# Start the Flask API server
python app.py
```

The backend starts at: **http://localhost:5000**

---

### Step 2 — Set Up the Frontend (new terminal)

```bash
# Navigate to frontend folder
cd retail_ai_app/frontend

# Install dependencies (first time only)
npm install

# Start the React dev server
npm start
```

The app opens at: **http://localhost:3000**

---

## 🗂️ Folder Structure

```
retail_ai_app/
├── backend/
│   ├── app.py              ← Flask API server (main entry)
│   ├── models.py           ← SQLite schema + DB helper
│   ├── seed_data.py        ← Data generator (run once)
│   ├── retail_ai.db        ← SQLite database (auto-created)
│   ├── requirements.txt
│   └── modules/
│       ├── ai_engine.py    ← AI/analytics + recommendations engine
│       └── auth.py         ← Auth (token management, password hashing)
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js           ← Root router
        ├── index.js
        ├── index.css        ← Global styles
        ├── api.js           ← Axios API client
        ├── context/
        │   └── AuthContext.js  ← Auth state + store switching
        ├── components/
        │   ├── Sidebar.js   ← Navigation + store selector
        │   └── UI.js        ← Reusable components
        └── pages/
            ├── AuthPages.js     ← Login + Register
            ├── DashboardPage.js ← Charts + KPIs
            ├── InventoryPage.js ← Inventory health table
            ├── AllRecsPage.js   ← AI Insights (combined, with store filter)
            ├── SettingsPage.js  ← Stores, products, Excel upload
            └── ContactPage.js   ← Contact RetailAI support
```

---

## 🔀 Multi-Store Switching

**For Mr. A. Sharma (owns ABC Store + MNO Motors):**

1. Log in with `sharma@abc.com` / `sharma123`
2. The sidebar shows a **store selector dropdown** listing both stores
3. Select either **ABC Store** or **MNO Motors** to switch context
4. All pages (Dashboard, Inventory) update for the selected store
5. Navigate to **AI Insights** to see combined AI recommendations for BOTH stores, with a store filter to drill into one at a time

**For Mrs. S. Mukherjee (owns XYZ Electronics only):**

1. Log in with `mukherjee@xyz.com` / `mukh123`
2. The sidebar shows only **XYZ Electronics** (no switching needed)
3. All data is scoped to XYZ Electronics

---

## 📝 Registration Guide

New owners can register at **http://localhost:3000/register**.

### Steps:
1. Enter **Owner Name**, **Email**, **Password**
2. Add one or more stores — each needs a **Store Name** and **Type** (General / Electronics / Automotive / Other)
3. Click **Register** — you'll be logged in automatically and land on the Dashboard

### After registration:
- Your stores start with an **empty inventory**
- Go to **Settings → Add Product** to add products manually
- Or use **Settings → Upload Excel** to bulk-import products and sales history via the provided template
- You can add more stores at any time via **Settings → Add New Store**

### Newly registered user demo record (example):
Once you register, your entry looks like this in the system:

| Field       | Value (example)             |
|-------------|-----------------------------|
| Owner Name  | Your Name                   |
| Email       | yourname@example.com        |
| Password    | yourpassword                |
| Store(s)    | Your Store Name (type)      |

> 💡 **Tip for demos:** After registering, note down the credentials above — they won't appear anywhere in the UI (by design). Use them to log in again or share with demo audiences.

---

## 🤖 AI Features

The AI engine runs entirely **locally** without any external APIs:

### What it detects:
- **Seasonal spikes** — e.g., cold beverages surge in summer
- **Weather impact** — rainy weather reduces footfall → overstock risk
- **Festival demand** — Diwali, Christmas, Holi demand spikes per store type
- **Stockout losses** — estimated weekly revenue loss per stockout product
- **Overstock alerts** — holding cost calculations, perishable spoilage risk
- **Automotive cycles** — Q4 vehicle demand surges
- **Electronics lifecycle** — festive season 2-3x smartphone/TV spikes

### Demo Scenarios Active in Data:
| Scenario | Store | Status |
|---|---|---|
| Summer beverages sold out | ABC Store | 🔴 Stockout active |
| Festival electronics shortage | XYZ Electronics | 🔴 Stockout + Low stock |
| Overstock perishable (Ice Cream) | ABC Store | 🟡 Overstock |
| Overstock spare parts | MNO Motors | 🟡 Overstock |
| Vehicle demand surge (SUV) | MNO Motors | 🔴 Stockout |
| Rain → low footfall risk | All stores | 🤖 AI alert |
| Pre-Diwali demand multipliers | All stores | 🤖 AI alert |

---

## 🗃️ Database

- Engine: **SQLite** (embedded, no installation needed)
- File: `backend/retail_ai.db`
- Data: **2 years** (2023–2024) of daily sales, inventory, weather, festivals
- Orders generated: **~41,000+** across 3 stores

### Reset database:
```bash
cd retail_ai_app/backend
python seed_data.py
```

---

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/register` | Register new owner |
| GET | `/api/stores` | List owner's stores |
| POST | `/api/stores` | Add new store |
| GET | `/api/stores/:id/dashboard` | Dashboard summary |
| GET | `/api/stores/:id/inventory` | Inventory status |
| GET | `/api/stores/:id/insights` | AI recommendations (per store) |
| GET | `/api/stores/:id/sales/monthly` | Monthly sales |
| GET | `/api/stores/:id/sales/category` | Category sales |
| GET | `/api/stores/:id/sales/stockout-losses` | Stockout loss estimates |
| GET | `/api/owner/all-recommendations` | All insights across all stores |
| POST | `/api/stores/:id/products` | Add product |
| PUT | `/api/stores/:id/products/:pid` | Update product/inventory |
| DELETE | `/api/stores/:id/products/:pid` | Delete product |

---

## 📋 Notes

- All sessions are **in-memory** (restart Flask = logout all users, this is intentional for demo)
- Password hashing uses **SHA-256** (suitable for demo; use bcrypt in production)
- CORS is open for `localhost:3000`
- Data isolation is enforced at the API level — every query filters by `store_id` and validates owner ownership

---

*Made with IBM Bob*
