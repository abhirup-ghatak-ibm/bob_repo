# RetailAI — Multi-Store Retail Intelligence Platform

A complete **demo web application** for a multi-store retail system with AI-driven demand forecasting and supply optimization.  
Runs entirely **offline on a single machine** — no cloud, no external APIs.

---

## 🏬 Stores & Ownership

| Store Name       | Type         | Owner               | Email                  |
|------------------|--------------|---------------------|------------------------|
| ABC Store        | General      | Mr. A. Sharma       | sharma@demo.com        |
| MNO Motors       | Automotive   | Mr. A. Sharma       | sharma@demo.com        |
| XYZ Electronics  | Electronics  | Mrs. S. Mukherjee   | mukherjee@demo.com     |

---

## 🔑 Demo Credentials

| Owner              | Email                   | Password   | Stores Accessible                |
|--------------------|-------------------------|------------|----------------------------------|
| Mr. A. Sharma      | sharma@demo.com         | sharma123  | ABC Store, MNO Motors            |
| Mrs. S. Mukherjee  | mukherjee@demo.com      | mukh123    | XYZ Electronics                  |

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
            ├── InsightsPage.js  ← Per-store AI insights
            └── AllRecsPage.js   ← Combined owner recommendations
```

---

## 🔀 Multi-Store Switching

**For Mr. A. Sharma (owns ABC Store + MNO Motors):**

1. Log in with `sharma@demo.com` / `sharma123`
2. The sidebar shows a **store selector dropdown** listing both stores
3. Select either **ABC Store** or **MNO Motors** to switch context
4. All pages (Dashboard, Inventory, Insights) update for the selected store
5. Navigate to **All Recs** to see combined AI recommendations for BOTH stores

**For Mrs. S. Mukherjee (owns XYZ Electronics only):**

1. Log in with `mukherjee@demo.com` / `mukh123`
2. The sidebar shows only **XYZ Electronics** (no switching needed)
3. All data is scoped to XYZ Electronics

---

## 📝 Registration Guide

1. Visit **http://localhost:3000/register**
2. Enter Owner Name, Email, Password
3. Add one or more stores (each with a name and type: General / Electronics / Automotive)
4. Click **Register** — you'll be logged in automatically
5. The app initializes demo inventory and products for your stores

**Adding more stores after registration:**
- Use the **POST /api/stores** endpoint with your auth token
- Or contact the developer to add the UI feature

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
| GET | `/api/stores/:id/insights` | AI recommendations |
| GET | `/api/stores/:id/sales/monthly` | Monthly sales |
| GET | `/api/stores/:id/sales/category` | Category sales |
| GET | `/api/stores/:id/sales/stockout-losses` | Stockout loss estimates |
| GET | `/api/owner/all-recommendations` | All recs across all stores |

---

## 📋 Notes

- All sessions are **in-memory** (restart Flask = logout all users, this is intentional for demo)
- Password hashing uses **SHA-256** (suitable for demo; use bcrypt in production)
- CORS is open for `localhost:3000`
- Data isolation is enforced at the API level — every query filters by `store_id` and validates owner ownership

---

*Made with IBM Bob*
