"""
Database models and schema initialization for Retail AI App.
Uses SQLite via sqlite3 directly (no ORM).
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "retail_ai.db")


def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")   # concurrent readers never block a writer
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()

    # --- Owners ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS owners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    # --- Stores ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        store_type TEXT NOT NULL,  -- 'general','electronics','automotive'
        owner_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES owners(id)
    )""")

    # --- Products ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        brand TEXT,
        variant TEXT,
        unit_price REAL NOT NULL,
        cost_price REAL NOT NULL,
        is_perishable INTEGER DEFAULT 0,
        FOREIGN KEY (store_id) REFERENCES stores(id)
    )""")

    # --- Customers ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        FOREIGN KEY (store_id) REFERENCES stores(id)
    )""")

    # --- Orders ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        customer_id INTEGER,
        order_date DATE NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'completed',
        FOREIGN KEY (store_id) REFERENCES stores(id)
    )""")

    # --- OrderItems ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )""")

    # --- Inventory ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        reorder_level INTEGER NOT NULL DEFAULT 10,
        max_capacity INTEGER NOT NULL DEFAULT 200,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(store_id, product_id),
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )""")

    # --- Suppliers ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        contact_email TEXT,
        product_category TEXT,
        FOREIGN KEY (store_id) REFERENCES stores(id)
    )""")

    # --- Weather History ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS weather_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_date DATE NOT NULL,
        condition TEXT NOT NULL,  -- 'sunny','rainy','cold','hot','normal'
        temperature REAL,
        UNIQUE(record_date)
    )""")

    # --- Festival Calendar ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS festival_calendar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        festival_date DATE NOT NULL,
        festival_name TEXT NOT NULL,
        impact_category TEXT,  -- 'electronics','general','automotive','all'
        demand_multiplier REAL DEFAULT 1.5
    )""")

    # --- Demand Signals ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS demand_signals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        signal_month INTEGER NOT NULL,
        signal_year INTEGER NOT NULL,
        product_category TEXT NOT NULL,
        demand_index REAL NOT NULL,
        FOREIGN KEY (store_id) REFERENCES stores(id)
    )""")

    conn.commit()
    conn.close()
    print("[DB] Schema initialized.")
