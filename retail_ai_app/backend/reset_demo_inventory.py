"""
Reset demo inventory scenarios:
  - 2 products at STOCKOUT (qty=0) per store
  - 3 products at LOW STOCK (qty <= reorder_level) per store
  - Remaining products at normal levels
Run: python reset_demo_inventory.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from models import get_db

def reset():
    db = get_db()

    # For each store, pick the first products alphabetically and force scenarios
    STORE_SCENARIOS = {
        1: {   # ABC Store
            "stockout": [0, 0],                        # qty=0 for first 2 products
            "low":      [5, 8, 12],                    # qty ≤ reorder for next 3
        },
        2: {   # XYZ Electronics
            "stockout": [0, 0],
            "low":      [3, 7, 9],
        },
        3: {   # MNO Motors
            "stockout": [0, 0],
            "low":      [1, 2, 2],
        },
    }

    for store_id, scenarios in STORE_SCENARIOS.items():
        # Get products ordered by id
        products = db.execute(
            "SELECT p.id, p.name, i.reorder_level FROM products p "
            "JOIN inventory i ON i.product_id=p.id AND i.store_id=p.store_id "
            "WHERE p.store_id=? ORDER BY p.id",
            (store_id,)
        ).fetchall()

        if len(products) < 5:
            print(f"[Skip] Store {store_id} has only {len(products)} products, need >=5")
            continue

        # Set stockout products
        for idx, qty in enumerate(scenarios["stockout"]):
            pid = products[idx]["id"]
            pname = products[idx]["name"]
            db.execute(
                "UPDATE inventory SET quantity=? WHERE store_id=? AND product_id=?",
                (qty, store_id, pid)
            )
            print(f"  [Store {store_id}] STOCKOUT: '{pname}' qty={qty}")

        # Set low stock products (use reorder_level as ceiling, set qty below it)
        so_count = len(scenarios["stockout"])
        for j, qty in enumerate(scenarios["low"]):
            pidx = so_count + j
            pid   = products[pidx]["id"]
            pname = products[pidx]["name"]
            reorder = products[pidx]["reorder_level"]
            # Ensure qty is actually ≤ reorder_level (low stock condition)
            safe_qty = min(qty, max(1, reorder - 1))
            db.execute(
                "UPDATE inventory SET quantity=? WHERE store_id=? AND product_id=?",
                (safe_qty, store_id, pid)
            )
            print(f"  [Store {store_id}] LOW:     '{pname}' qty={safe_qty} (reorder={reorder})")

        # Set remaining products to normal (qty = 50% of max_capacity)
        for pidx in range(so_count + len(scenarios["low"]), len(products)):
            pid   = products[pidx]["id"]
            max_cap = db.execute(
                "SELECT max_capacity FROM inventory WHERE store_id=? AND product_id=?",
                (store_id, pid)
            ).fetchone()["max_capacity"]
            normal_qty = int(max_cap * 0.5)
            db.execute(
                "UPDATE inventory SET quantity=? WHERE store_id=? AND product_id=?",
                (normal_qty, store_id, pid)
            )

    db.commit()
    db.close()
    print("\nDemo inventory reset complete.")
    print("  Each store now has: 2 STOCKOUT  +  3 LOW STOCK  +  rest NORMAL")
    print("  Go to Inventory page and use +/- to adjust quantities.")
    print("  Then visit AI Insights to see how recommendations change.")

if __name__ == "__main__":
    reset()
