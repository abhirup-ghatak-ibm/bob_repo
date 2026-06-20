"""
Sample data generator — 2 years of realistic data for all 3 demo stores.
Run once to populate the database.
"""
import sqlite3
import random
import hashlib
from datetime import date, timedelta
from models import get_db, init_db

random.seed(42)


def hash_password(pwd: str) -> str:
    return hashlib.sha256(pwd.encode()).hexdigest()


# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────

OWNERS = [
    {"name": "A. Sharma", "email": "sharma@demo.com", "password": "sharma123"},
    {"name": "S. Mukherjee", "email": "mukherjee@demo.com", "password": "mukh123"},
]

STORES = [
    {"name": "ABC Store", "store_type": "general", "owner_email": "sharma@demo.com"},
    {"name": "XYZ Electronics", "store_type": "electronics", "owner_email": "mukherjee@demo.com"},
    {"name": "MNO Motors", "store_type": "automotive", "owner_email": "sharma@demo.com"},
]

ABC_PRODUCTS = [
    ("Cold Beverages",    "beverages",  "drinks",  "Coca-Cola",    "500ml",   50,   30, 1),
    ("Mineral Water",     "beverages",  "drinks",  "Bisleri",      "1L",      20,   12, 0),
    ("Energy Drink",      "beverages",  "drinks",  "Red Bull",     "250ml",   120,  80, 0),
    ("Fresh Milk",        "dairy",      "milk",    "Amul",         "1L",      65,   50, 1),
    ("Butter",            "dairy",      "fats",    "Amul",         "500g",    270, 200, 1),
    ("Cheese",            "dairy",      "milk",    "Britannia",    "200g",    180, 130, 1),
    ("Rice",              "grocery",    "grains",  "India Gate",   "5kg",     350, 270, 0),
    ("Wheat Flour",       "grocery",    "grains",  "Ashirvad",     "5kg",     250, 190, 0),
    ("Cooking Oil",       "grocery",    "oils",    "Fortune",      "1L",      150, 110, 0),
    ("Biscuits",          "snacks",     "baked",   "Parle-G",      "400g",    40,   25, 0),
    ("Chips",             "snacks",     "fried",   "Lays",         "80g",     30,   18, 0),
    ("Noodles",           "snacks",     "instant", "Maggi",        "70g",     15,   10, 0),
    ("Shampoo",           "personal",   "hair",    "Head&Shoulders","200ml",  220, 160, 0),
    ("Soap",              "personal",   "body",    "Lux",          "100g",    50,   35, 0),
    ("Toothpaste",        "personal",   "oral",    "Colgate",      "150g",    80,   55, 0),
    ("Frozen Peas",       "frozen",     "veg",     "McCain",       "500g",    90,   65, 1),
    ("Ice Cream",         "frozen",     "dessert", "Amul",         "500ml",   150, 100, 1),
]

XYZ_PRODUCTS = [
    ("Smartphone Budget",  "smartphones","budget",  "Redmi",       "Note 13",  12000, 9500, 0),
    ("Smartphone Mid",     "smartphones","mid",     "Samsung",     "A55",      28000,22000, 0),
    ("Smartphone Premium", "smartphones","premium", "Apple",       "iPhone 15",80000,68000, 0),
    ("Smart TV 32",        "televisions","small",   "LG",          "32inch",   18000,14000, 0),
    ("Smart TV 55",        "televisions","large",   "Sony",        "55inch",   55000,44000, 0),
    ("Laptop Basic",       "laptops",    "budget",  "Lenovo",      "IdeaPad",  35000,28000, 0),
    ("Laptop Pro",         "laptops",    "premium", "Dell",        "XPS 13",   90000,75000, 0),
    ("Wireless Earbuds",   "accessories","audio",   "boAt",        "Airdopes", 2500,  1800, 0),
    ("Bluetooth Speaker",  "accessories","audio",   "JBL",         "Clip 4",   4500,  3200, 0),
    ("Gaming Console",     "gaming",     "console", "Sony",        "PS5",      55000,48000, 0),
    ("Tablet",             "tablets",    "mid",     "Samsung",     "Tab A9",   22000,17500, 0),
    ("Smart Watch",        "wearables",  "mid",     "boAt",        "Storm Pro", 3500, 2600, 0),
    ("WiFi Router",        "networking", "home",    "TP-Link",     "AX1800",   4000,  3000, 0),
    ("Power Bank",         "accessories","power",   "Anker",       "20000mAh", 2000,  1400, 0),
    ("DSLR Camera",        "cameras",    "dslr",    "Canon",       "EOS 200D", 45000,38000, 0),
]

MNO_PRODUCTS = [
    ("Hatchback Petrol",   "vehicles",  "hatchback","Maruti",     "Swift",    600000,520000, 0),
    ("Sedan Petrol",       "vehicles",  "sedan",    "Honda",      "City",     1200000,1050000,0),
    ("SUV Compact",        "vehicles",  "suv",      "Hyundai",    "Creta",    1500000,1300000,0),
    ("SUV Premium",        "vehicles",  "suv",      "Toyota",     "Fortuner", 3200000,2900000,0),
    ("Electric Hatchback", "vehicles",  "ev",       "Tata",       "Nexon EV",1500000,1350000,0),
    ("Electric Sedan",     "vehicles",  "ev",       "Hyundai",    "Ioniq 5",  4500000,4100000,0),
    ("Pickup Truck",       "vehicles",  "truck",    "Isuzu",      "D-Max",    1800000,1600000,0),
    ("Car Battery",        "spares",    "electrical","Exide",     "65Ah",      8000,  5500, 0),
    ("Alloy Wheels Set",   "spares",    "wheels",   "OEM",        "17inch",   35000, 27000, 0),
    ("Engine Oil 5L",      "spares",    "lubricant","Castrol",    "GTX 20W50",1800,   1200, 0),
    ("Brake Pads Set",     "spares",    "brakes",   "Brembo",     "Front",     3500,  2500, 0),
    ("Dashcam",            "accessories","camera",  "Vantrue",    "N4",        8000,  5800, 0),
]

FESTIVALS = [
    ("2023-03-07", "Holi",        "general",     1.6),
    ("2023-04-22", "Eid",         "general",     1.5),
    ("2023-10-02", "Navratri",    "general",     1.4),
    ("2023-10-24", "Diwali",      "all",         2.0),
    ("2023-12-25", "Christmas",   "electronics", 2.0),
    ("2023-01-01", "New Year",    "all",         1.4),
    ("2024-03-25", "Holi",        "general",     1.6),
    ("2024-04-10", "Eid",         "general",     1.5),
    ("2024-10-03", "Navratri",    "general",     1.4),
    ("2024-11-01", "Diwali",      "all",         2.0),
    ("2024-12-25", "Christmas",   "electronics", 2.0),
    ("2025-01-01", "New Year",    "all",         1.4),
    ("2025-03-14", "Holi",        "general",     1.6),
    ("2025-03-30", "Eid",         "general",     1.5),
    ("2025-10-01", "Navratri",    "general",     1.4),
    ("2025-10-20", "Diwali",      "all",         2.0),
    ("2025-12-25", "Christmas",   "electronics", 2.0),
    ("2026-01-01", "New Year",    "all",         1.4),
    ("2026-09-15", "Onam",        "general",     1.4),
    ("2026-10-01", "Durga Puja",  "general",     1.5),
    ("2026-10-20", "Diwali",      "all",         2.0),
    ("2026-12-25", "Christmas",   "electronics", 2.0),
]

WEATHER_PATTERNS = {
    1:  "cold", 2: "cold",  3: "normal", 4: "hot",
    5:  "hot",  6: "rainy", 7: "rainy",  8: "rainy",
    9:  "normal",10:"sunny",11:"sunny",  12:"cold",
}

# demand multipliers per category per weather condition (used in data gen)
WEATHER_DEMAND = {
    "hot":    {"beverages":2.2,"dairy":0.7,"frozen":1.8,"grocery":0.9,"snacks":1.1},
    "rainy":  {"beverages":0.6,"dairy":0.9,"frozen":0.8,"grocery":0.7,"snacks":1.2,
               "smartphones":0.8,"televisions":0.9,"laptops":0.9,"vehicles":0.7},
    "cold":   {"beverages":0.5,"dairy":1.3,"frozen":0.8,"grocery":1.2,"snacks":1.1,
               "vehicles":0.85},
    "sunny":  {"beverages":1.4,"dairy":1.0,"frozen":1.3,"grocery":1.1,"snacks":1.0,
               "vehicles":1.2,"smartphones":1.1},
    "normal": {},
}


def _festival_multiplier(d: date, store_type: str) -> float:
    ds = d.strftime("%Y-%m-%d")
    for f_date, f_name, f_cat, f_mul in FESTIVALS:
        # within 7 days before festival
        fd = date.fromisoformat(f_date)
        if 0 <= (fd - d).days <= 7:
            from modules.ai_engine import FESTIVAL_IMPACT
            impact = FESTIVAL_IMPACT.get(f_name, {})
            return impact.get(store_type, impact.get("all", 1.0))
    return 1.0


def _weather_mult(month: int, category: str) -> float:
    condition = WEATHER_PATTERNS.get(month, "normal")
    return WEATHER_DEMAND.get(condition, {}).get(category, 1.0)


def _generate_sales(conn, store_id: int, store_type: str, products: list,
                    product_ids: list, customer_ids: list,
                    start: date = None, end: date = None):
    """Generate daily sales data for the given date range."""
    if start is None: start = date(2023, 1, 1)
    if end   is None: end   = date(2026, 3, 31)
    cur = start

    # base daily orders per store type
    base_orders = {"general": 40, "electronics": 8, "automotive": 2}
    daily_base = base_orders.get(store_type, 10)

    while cur <= end:
        month = cur.month
        weather = WEATHER_PATTERNS.get(month, "normal")

        # weekend boost
        weekday = cur.weekday()
        day_mult = 1.3 if weekday >= 5 else 1.0

        # festival
        fest_mult = _festival_multiplier(cur, store_type)

        # base orders for this day
        n_orders = max(1, int(daily_base * day_mult * fest_mult * random.uniform(0.7, 1.3)))

        for _ in range(n_orders):
            customer_id = random.choice(customer_ids)
            items = random.sample(list(zip(products, product_ids)),
                                  k=random.randint(1, min(3, len(products))))
            total = 0.0
            order_items = []
            for prod, pid in items:
                cat = prod[1]
                cat_mult = _weather_mult(month, cat) * fest_mult
                if store_type == "automotive" and cat == "vehicles":
                    qty = 1
                elif store_type == "electronics":
                    qty = random.randint(1, 2)
                else:
                    qty = max(1, int(random.randint(1, 6) * cat_mult))

                price = prod[5]  # unit_price (index 5 in product tuple)
                order_items.append((pid, qty, price))
                total += qty * price

            oid = conn.execute(
                "INSERT INTO orders (store_id, customer_id, order_date, total_amount, status) "
                "VALUES (?,?,?,?,'completed')",
                (store_id, customer_id, cur.isoformat(), round(total, 2))
            ).lastrowid

            for pid, qty, price in order_items:
                conn.execute(
                    "INSERT INTO order_items (order_id, product_id, quantity, unit_price) "
                    "VALUES (?,?,?,?)",
                    (oid, pid, qty, price)
                )

        cur += timedelta(days=1)


def seed_database():
    init_db()
    conn = get_db()

    # clear existing demo data
    tables = ["order_items","orders","inventory","demand_signals",
              "customers","products","suppliers","stores","owners",
              "weather_history","festival_calendar"]
    for t in tables:
        conn.execute(f"DELETE FROM {t}")
    conn.execute("DELETE FROM sqlite_sequence WHERE name IN ({})".format(
        ",".join(f"'{t}'" for t in tables)))
    conn.commit()

    # ── Owners ────────────────────────────────────────────────────────────
    owner_ids = {}
    for o in OWNERS:
        oid = conn.execute(
            "INSERT INTO owners (name, email, password_hash) VALUES (?,?,?)",
            (o["name"], o["email"], hash_password(o["password"]))
        ).lastrowid
        owner_ids[o["email"]] = oid
    conn.commit()
    print("[Seed] Owners created.")

    # ── Stores ────────────────────────────────────────────────────────────
    store_ids = {}
    for s in STORES:
        sid = conn.execute(
            "INSERT INTO stores (name, store_type, owner_id) VALUES (?,?,?)",
            (s["name"], s["store_type"], owner_ids[s["owner_email"]])
        ).lastrowid
        store_ids[s["name"]] = sid
    conn.commit()
    print("[Seed] Stores created.")

    # ── Weather ───────────────────────────────────────────────────────────
    start = date(2023, 1, 1)
    cur   = start
    end   = date(2026, 12, 31)
    while cur <= end:
        base_cond = WEATHER_PATTERNS.get(cur.month, "normal")
        temp_map  = {"hot":36,"rainy":28,"cold":14,"sunny":30,"normal":24}
        temp = temp_map[base_cond] + random.uniform(-3, 3)
        try:
            conn.execute(
                "INSERT OR IGNORE INTO weather_history (record_date, condition, temperature) "
                "VALUES (?,?,?)", (cur.isoformat(), base_cond, round(temp, 1))
            )
        except Exception:
            pass
        cur += timedelta(days=1)
    conn.commit()
    print("[Seed] Weather history populated.")

    # ── Festivals ─────────────────────────────────────────────────────────
    for f in FESTIVALS:
        conn.execute(
            "INSERT INTO festival_calendar (festival_date, festival_name, impact_category, demand_multiplier) "
            "VALUES (?,?,?,?)", f
        )
    conn.commit()
    print("[Seed] Festival calendar populated.")

    # ── Products + Inventory + Sales ─────────────────────────────────────
    store_product_map = {
        "ABC Store":       ABC_PRODUCTS,
        "XYZ Electronics": XYZ_PRODUCTS,
        "MNO Motors":      MNO_PRODUCTS,
    }

    for store_name, products in store_product_map.items():
        sid = store_ids[store_name]
        store_type = [s["store_type"] for s in STORES if s["name"] == store_name][0]

        # Products
        # tuple: (name, category, subcategory, brand, variant, unit_price, cost_price, is_perishable)
        # index:   0      1         2            3      4        5           6            7
        pids = []
        for p in products:
            pid = conn.execute(
                "INSERT INTO products (store_id, name, category, subcategory, brand, variant, "
                "unit_price, cost_price, is_perishable) VALUES (?,?,?,?,?,?,?,?,?)",
                (sid, p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7])
            ).lastrowid
            pids.append(pid)
        conn.commit()

        # Customers
        cids = []
        for i in range(100):
            cid = conn.execute(
                "INSERT INTO customers (store_id, name, email) VALUES (?,?,?)",
                (sid, f"Customer_{store_name[:3]}_{i+1}",
                 f"cust{i+1}@{store_name.replace(' ','').lower()}.com")
            ).lastrowid
            cids.append(cid)
        conn.commit()

        # Inventory - with intentional demo scenarios
        inv_scenarios = {
            "ABC Store": {
                "Cold Beverages": (5, 30, 200),    # low stock (summer scenario)
                "Ice Cream":      (220, 20, 200),  # overstock perishable
                "Fresh Milk":     (0, 20, 150),    # stockout
            },
            "XYZ Electronics": {
                "Smartphone Budget":  (3, 10, 60),  # low stock pre-festival
                "Gaming Console":     (0, 5, 30),   # stockout
                "Smart TV 55":        (45, 5, 40),  # overstock
            },
            "MNO Motors": {
                "Hatchback Petrol":  (1, 3, 15),   # low stock
                "SUV Compact":       (0, 2, 10),   # stockout
                "Engine Oil 5L":     (350, 20, 200),# overstock
            },
        }
        scenarios = inv_scenarios.get(store_name, {})

        for p, pid in zip(products, pids):
            pname = p[0]
            if pname in scenarios:
                qty, reorder, maxcap = scenarios[pname]
            else:
                if store_type == "automotive" and p[1] == "vehicles":
                    qty     = random.randint(3, 12)
                    reorder = 2
                    maxcap  = 15
                elif store_type == "electronics":
                    qty     = random.randint(10, 50)
                    reorder = 5
                    maxcap  = 60
                else:
                    qty     = random.randint(30, 150)
                    reorder = 15
                    maxcap  = 200

            conn.execute(
                "INSERT OR IGNORE INTO inventory (store_id, product_id, quantity, reorder_level, max_capacity) "
                "VALUES (?,?,?,?,?)",
                (sid, pid, qty, reorder, maxcap)
            )
        conn.commit()

        # Sales data
        print(f"[Seed] Generating 2 years of sales for {store_name}...")
        _generate_sales(conn, sid, store_type, products, pids, cids)
        conn.commit()
        print(f"[Seed] Sales for {store_name} done.")

        # Suppliers
        supplier_cats = {
            "general":     ["beverages","dairy","grocery","snacks","personal","frozen"],
            "electronics": ["smartphones","televisions","laptops","accessories","gaming"],
            "automotive":  ["vehicles","spares","accessories"],
        }
        for cat in supplier_cats.get(store_type, ["general"]):
            conn.execute(
                "INSERT INTO suppliers (store_id, name, contact_email, product_category) VALUES (?,?,?,?)",
                (sid, f"{cat.title()} Supplier Co.", f"supply@{cat}.com", cat)
            )
        conn.commit()

        # Demand signals
        for year in [2023, 2024]:
            for month in range(1, 13):
                for cat in set(p[1] for p in products):
                    base_idx = 100.0
                    weather_mod = _weather_mult(month, cat)
                    seasonal_mod = random.uniform(0.8, 1.2)
                    idx = base_idx * weather_mod * seasonal_mod
                    conn.execute(
                        "INSERT INTO demand_signals (store_id, signal_month, signal_year, "
                        "product_category, demand_index) VALUES (?,?,?,?,?)",
                        (sid, month, year, cat, round(idx, 2))
                    )
        conn.commit()

    print("\n[Seed] Database fully populated with data through Mar 2026!")
    print("\n Demo Credentials:")
    print("   Mr. A. Sharma     | email: sharma@demo.com    | password: sharma123")
    print("   Mrs. S. Mukherjee | email: mukherjee@demo.com | password: mukh123")
    conn.close()


def extend_to_march_2026():
    """Append Jan 2025 – Mar 2026 sales to the existing DB without a full re-seed."""
    conn = get_db()
    ext_start = date(2025, 1, 1)
    ext_end   = date(2026, 3, 31)

    # Check if extension already done
    row = conn.execute(
        "SELECT COUNT(*) AS c FROM orders WHERE order_date >= ?", (ext_start.isoformat(),)
    ).fetchone()
    if row["c"] > 0:
        print(f"[Extend] Already have {row['c']} orders from Jan 2025+. Skipping.")
        conn.close()
        return

    stores_rows = conn.execute("SELECT id, name, store_type FROM stores").fetchall()
    store_product_map = {
        "ABC Store":       ABC_PRODUCTS,
        "XYZ Electronics": XYZ_PRODUCTS,
        "MNO Motors":      MNO_PRODUCTS,
    }

    for s in stores_rows:
        sid        = s["id"]
        sname      = s["name"]
        store_type = s["store_type"]
        products   = store_product_map.get(sname)
        if not products:
            continue

        # Get existing product IDs for this store
        prows = conn.execute(
            "SELECT id FROM products WHERE store_id = ? ORDER BY id", (sid,)
        ).fetchall()
        pids = [r["id"] for r in prows]

        # Get existing customer IDs
        crows = conn.execute(
            "SELECT id FROM customers WHERE store_id = ?", (sid,)
        ).fetchall()
        cids = [r["id"] for r in crows]

        if not pids or not cids:
            print(f"[Extend] No products/customers for {sname}, skipping.")
            continue

        print(f"[Extend] Appending Jan 2025 - Mar 2026 sales for {sname}...")
        _generate_sales(conn, sid, store_type, products, pids, cids,
                        start=ext_start, end=ext_end)
        conn.commit()
        print(f"[Extend] {sname} done.")

    # Extend demand signals for 2025
    for s in stores_rows:
        sid        = s["id"]
        sname      = s["name"]
        products   = store_product_map.get(sname, [])
        for year in [2025, 2026]:
            for month in range(1, 13 if year == 2025 else 4):
                for cat in set(p[1] for p in products):
                    existing = conn.execute(
                        "SELECT id FROM demand_signals WHERE store_id=? AND signal_year=? AND signal_month=? AND product_category=?",
                        (sid, year, month, cat)
                    ).fetchone()
                    if not existing:
                        idx = 100.0 * _weather_mult(month, cat) * random.uniform(0.8, 1.2)
                        conn.execute(
                            "INSERT INTO demand_signals (store_id, signal_month, signal_year, product_category, demand_index) VALUES (?,?,?,?,?)",
                            (sid, month, year, cat, round(idx, 2))
                        )
        conn.commit()

    print("[Extend] Sales extension to Mar 2026 complete.")
    conn.close()


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "extend":
        extend_to_march_2026()
    else:
        seed_database()
        extend_to_march_2026()
