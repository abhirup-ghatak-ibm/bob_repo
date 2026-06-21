"""
AI/Analytics Engine - Local rule-based + statistical demand forecasting.
No external APIs. Generates store-specific insights and recommendations.

IMPORTANT: For stores with no sales history, no AI insights are generated.
Insights are produced only when the store has actual sales data (from seed or
uploaded Excel). Products alone (without orders) are not sufficient to trigger
recommendations — the engine reads both products and order history.
"""
import sqlite3
from datetime import datetime, date, timedelta
import statistics
from models import get_db


# ─────────────────────────────────────────────────────────────────────────────
# Helper utilities
# ─────────────────────────────────────────────────────────────────────────────

def _month_name(m: int) -> str:
    return ["Jan","Feb","Mar","Apr","May","Jun",
            "Jul","Aug","Sep","Oct","Nov","Dec"][m - 1]


def _season(month: int) -> str:
    if month in (3, 4, 5):   return "spring"
    if month in (6, 7, 8):   return "summer"
    if month in (9, 10, 11): return "autumn"
    return "winter"


FESTIVAL_IMPACT = {
    "Diwali":      {"electronics": 2.5, "general": 2.0, "automotive": 1.8, "all": 2.0},
    "Holi":        {"general": 1.6, "all": 1.4},
    "Eid":         {"general": 1.5, "all": 1.3},
    "Christmas":   {"electronics": 2.0, "general": 1.8, "all": 1.6},
    "Navratri":    {"general": 1.4, "all": 1.2},
    "Durga Puja":  {"general": 1.5, "electronics": 1.4, "all": 1.3},
    "Onam":        {"general": 1.4, "automotive": 1.3, "all": 1.2},
    "New Year":    {"electronics": 1.6, "general": 1.4, "automotive": 1.3, "all": 1.3},
}

WEATHER_IMPACT = {
    "hot":    {"beverages": 2.2, "dairy": 0.7, "frozen": 1.8, "electronics": 0.9, "vehicles": 0.9},
    "rainy":  {"beverages": 0.6, "grocery": 0.7, "electronics": 0.8, "vehicles": 0.7, "general": 0.7},
    "cold":   {"beverages": 0.5, "dairy": 1.3, "grocery": 1.2, "vehicles": 0.8, "general": 1.1},
    "sunny":  {"beverages": 1.4, "general": 1.2, "vehicles": 1.2, "electronics": 1.1},
    "normal": {},
}


# ─────────────────────────────────────────────────────────────────────────────
# Core AI Engine
# ─────────────────────────────────────────────────────────────────────────────

class AIEngine:
    def __init__(self, store_id: int):
        self.store_id = store_id
        self.db = get_db()
        self._store = self._load_store()

    def _load_store(self):
        row = self.db.execute(
            "SELECT * FROM stores WHERE id = ?", (self.store_id,)
        ).fetchone()
        return dict(row) if row else {}

    def _store_type(self) -> str:
        return self._store.get("store_type", "general")

    def _has_sales_history(self) -> bool:
        """Return True only if this store has at least one completed order."""
        row = self.db.execute(
            "SELECT COUNT(*) AS cnt FROM orders WHERE store_id = ? AND status = 'completed'",
            (self.store_id,)
        ).fetchone()
        return (row["cnt"] if row else 0) > 0

    def _store_product_categories(self) -> set:
        """Return the set of product categories that exist in this store's inventory."""
        rows = self.db.execute(
            "SELECT DISTINCT p.category FROM products p WHERE p.store_id = ?",
            (self.store_id,)
        ).fetchall()
        return {r["category"].lower() for r in rows}

    # ── Monthly sales aggregation ──────────────────────────────────────────

    def monthly_sales(self):
        rows = self.db.execute("""
            SELECT strftime('%Y', order_date) AS yr,
                   strftime('%m', order_date) AS mo,
                   SUM(total_amount) AS revenue,
                   COUNT(*) AS orders
            FROM orders
            WHERE store_id = ? AND status = 'completed'
            GROUP BY yr, mo
            ORDER BY yr, mo
        """, (self.store_id,)).fetchall()
        return [dict(r) for r in rows]

    def category_sales(self):
        rows = self.db.execute("""
            SELECT p.category,
                   strftime('%Y', o.order_date) AS yr,
                   strftime('%m', o.order_date) AS mo,
                   SUM(oi.quantity * oi.unit_price) AS revenue,
                   SUM(oi.quantity) AS units
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE o.store_id = ? AND o.status = 'completed'
            GROUP BY p.category, yr, mo
            ORDER BY yr, mo, p.category
        """, (self.store_id,)).fetchall()
        return [dict(r) for r in rows]

    # ── Inventory analysis ─────────────────────────────────────────────────

    def inventory_status(self):
        rows = self.db.execute("""
            SELECT p.id, p.name, p.category, p.is_perishable,
                   p.unit_price, p.cost_price,
                   i.quantity, i.reorder_level, i.max_capacity
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            WHERE i.store_id = ?
        """, (self.store_id,)).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            if d["quantity"] <= 0:
                d["status"] = "stockout"
            elif d["quantity"] <= d["reorder_level"]:
                d["status"] = "low"
            elif d["quantity"] >= d["max_capacity"] * 0.9:
                d["status"] = "overstock"
            else:
                d["status"] = "normal"
            result.append(d)
        return result

    # ── Stockout detection → revenue loss estimate ─────────────────────────

    def stockout_losses(self):
        """Estimate lost revenue from stockout days.
        Only meaningful when there is sales history to derive average daily qty.
        """
        if not self._has_sales_history():
            return []
        rows = self.db.execute("""
            SELECT p.id, p.name, p.category, p.unit_price,
                   i.quantity, i.reorder_level
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            WHERE i.store_id = ? AND i.quantity = 0
        """, (self.store_id,)).fetchall()
        losses = []
        for r in rows:
            avg = self.db.execute("""
                SELECT AVG(oi.quantity) AS avg_daily
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE o.store_id = ? AND oi.product_id = ?
                  AND o.order_date >= date('now','-30 days')
            """, (self.store_id, r["id"])).fetchone()
            daily_qty = (avg["avg_daily"] or 2)
            est_loss = daily_qty * 7 * r["unit_price"]
            losses.append({
                "product": r["name"],
                "category": r["category"],
                "estimated_weekly_loss": round(est_loss, 2),
            })
        return losses

    # ── Seasonal pattern detection ─────────────────────────────────────────

    def seasonal_patterns(self):
        """Only computed when sales history exists."""
        if not self._has_sales_history():
            return {}
        cat_sales = self.category_sales()
        by_cat = {}
        for row in cat_sales:
            cat = row["category"]
            mo = int(row["mo"])
            if cat not in by_cat:
                by_cat[cat] = {}
            if mo not in by_cat[cat]:
                by_cat[cat][mo] = []
            by_cat[cat][mo].append(row["revenue"])

        patterns = {}
        for cat, monthly in by_cat.items():
            avg_by_month = {m: statistics.mean(v) for m, v in monthly.items() if v}
            if not avg_by_month:
                continue
            overall_avg = statistics.mean(avg_by_month.values())
            if overall_avg == 0:
                continue
            spikes = {m: v for m, v in avg_by_month.items() if v > overall_avg * 1.3}
            slumps = {m: v for m, v in avg_by_month.items() if v < overall_avg * 0.7}
            patterns[cat] = {
                "avg_by_month": avg_by_month,
                "overall_avg": overall_avg,
                "spike_months": spikes,
                "slump_months": slumps,
            }
        return patterns

    # ── Festival impact analysis ───────────────────────────────────────────

    def festival_opportunities(self):
        """Festival insights are only shown when the store has sales history
        AND the impacted category matches a category the store actually sells.
        """
        if not self._has_sales_history():
            return []
        store_type = self._store_type()
        store_categories = self._store_product_categories()
        upcoming = self.db.execute("""
            SELECT festival_name, festival_date, impact_category, demand_multiplier
            FROM festival_calendar
            WHERE festival_date >= date('now')
              AND festival_date <= date('now', '+90 days')
            ORDER BY festival_date
        """).fetchall()
        opps = []
        for f in upcoming:
            impact_map = FESTIVAL_IMPACT.get(f["festival_name"], {})
            multiplier = impact_map.get(store_type, impact_map.get("all", 1.0))
            if multiplier <= 1.1:
                continue
            # Only surface the festival insight if the impacted category
            # exists among the store's own product categories
            impact_cat = (f["impact_category"] or "").lower()
            if impact_cat and impact_cat not in store_categories:
                continue
            opps.append({
                "festival": f["festival_name"],
                "date": f["festival_date"],
                "multiplier": multiplier,
                "impact_category": f["impact_category"],
            })
        return opps

    # ── Weather impact ────────────────────────────────────────────────────

    def weather_impact_summary(self):
        """Weather impact is only relevant when there is sales history
        and the affected categories match products the store actually sells.
        """
        if not self._has_sales_history():
            return {"dominant_condition": "normal", "impacts": {}}
        recent_weather = self.db.execute("""
            SELECT condition, COUNT(*) AS cnt
            FROM weather_history
            WHERE record_date >= date('now','-30 days')
            GROUP BY condition
            ORDER BY cnt DESC
        """).fetchall()
        if not recent_weather:
            return {"dominant_condition": "normal", "impacts": {}}
        dominant = recent_weather[0]["condition"]
        raw_impacts = WEATHER_IMPACT.get(dominant, {})
        # Filter to only categories the store actually sells
        store_categories = self._store_product_categories()
        filtered = {cat: factor for cat, factor in raw_impacts.items()
                    if cat in store_categories}
        return {"dominant_condition": dominant, "impacts": filtered}

    # ── Overstock detection ───────────────────────────────────────────────

    def overstock_alerts(self):
        inv = self.inventory_status()
        alerts = []
        for item in inv:
            if item["status"] == "overstock":
                excess = item["quantity"] - item["max_capacity"] * 0.7
                holding_cost = excess * item["cost_price"] * 0.02
                alerts.append({
                    "product": item["name"],
                    "category": item["category"],
                    "current_qty": item["quantity"],
                    "max_capacity": item["max_capacity"],
                    "excess_units": int(excess),
                    "estimated_holding_cost_weekly": round(holding_cost, 2),
                    "is_perishable": bool(item["is_perishable"]),
                })
        return alerts

    # ── Master recommendations generator ─────────────────────────────────

    def generate_recommendations(self):
        store_name = self._store.get("name", "Store")
        store_type = self._store_type()
        today = date.today()
        current_month = today.month
        season = _season(current_month)

        # ── Guard: no sales history → no insights ────────────────────────
        if not self._has_sales_history():
            return [{
                "type": "opportunity",
                "priority": "low",
                "title": "No Sales History Yet",
                "message": (
                    f"{store_name} has no sales history yet. "
                    f"Upload your historical sales data via Settings → Upload Excel "
                    f"to enable AI-driven demand forecasting, seasonal insights, "
                    f"festival alerts, and stockout loss estimates."
                ),
                "store": store_name,
                "category": "",
                "timeline": "Upload data to unlock insights",
            }]

        recs = []

        # 1. Seasonal recommendations (based on actual sales history)
        patterns = self.seasonal_patterns()
        for cat, data in patterns.items():
            for mo, rev in data["spike_months"].items():
                if abs(mo - current_month) <= 2:
                    recs.append({
                        "type": "opportunity",
                        "priority": "high",
                        "title": f"Seasonal Demand Spike — {cat.title()}",
                        "message": (
                            f"Historical data shows {cat} sales in {store_name} spike "
                            f"~{round((rev/data['overall_avg']-1)*100)}% in {_month_name(mo)}. "
                            f"Consider increasing stock now."
                        ),
                        "store": store_name,
                        "category": cat,
                        "timeline": f"{_month_name(mo)} (upcoming)",
                    })

            for mo, rev in data["slump_months"].items():
                if abs(mo - current_month) <= 1:
                    recs.append({
                        "type": "risk",
                        "priority": "medium",
                        "title": f"Low Demand Period — {cat.title()}",
                        "message": (
                            f"{cat.title()} typically underperforms in {_month_name(mo)} "
                            f"at {store_name}. Reduce reorder quantities to avoid overstock."
                        ),
                        "store": store_name,
                        "category": cat,
                        "timeline": _month_name(mo),
                    })

        # 2. Stockout losses (requires sales history — already guarded above)
        for loss in self.stockout_losses():
            recs.append({
                "type": "loss",
                "priority": "critical",
                "title": f"Stock-Out Detected — {loss['product']}",
                "message": (
                    f"'{loss['product']}' is out of stock at {store_name}. "
                    f"Estimated revenue loss: ₹{loss['estimated_weekly_loss']:,.0f}/week. "
                    f"Immediate restock recommended."
                ),
                "store": store_name,
                "category": loss["category"],
                "estimated_loss": loss["estimated_weekly_loss"],
                "timeline": "Immediate",
            })

        # 3. Overstock alerts (inventory-based, but only surfaced with history)
        for alert in self.overstock_alerts():
            msg = (
                f"'{alert['product']}' is overstocked at {store_name} "
                f"({alert['current_qty']} units vs max {alert['max_capacity']}). "
                f"Holding cost ~₹{alert['estimated_holding_cost_weekly']:,.0f}/week."
            )
            if alert["is_perishable"]:
                msg += " PERISHABLE — risk of spoilage loss."
            recs.append({
                "type": "risk",
                "priority": "high" if alert["is_perishable"] else "medium",
                "title": f"Overstock Alert — {alert['product']}",
                "message": msg,
                "store": store_name,
                "category": alert["category"],
                "timeline": "This week",
            })

        # 4. Festival opportunities (filtered to store's own categories)
        for opp in self.festival_opportunities():
            recs.append({
                "type": "opportunity",
                "priority": "high",
                "title": f"Festival Demand — {opp['festival']}",
                "message": (
                    f"{opp['festival']} is approaching ({opp['date']}). "
                    f"Demand for {opp['impact_category']} products expected to be "
                    f"~{opp['multiplier']}x normal at {store_name}. "
                    f"Pre-stock inventory now."
                ),
                "store": store_name,
                "category": opp["impact_category"],
                "timeline": opp["date"],
            })

        # 5. Weather-based (filtered to store's own categories)
        weather = self.weather_impact_summary()
        condition = weather["dominant_condition"]
        for cat, factor in weather["impacts"].items():
            if factor > 1.2:
                recs.append({
                    "type": "opportunity",
                    "priority": "medium",
                    "title": f"Weather Opportunity — {cat.title()} ({condition.title()} Season)",
                    "message": (
                        f"Recent {condition} weather boosts demand for {cat} by ~{round((factor-1)*100)}% "
                        f"at {store_name}. Consider increasing stock."
                    ),
                    "store": store_name,
                    "category": cat,
                    "timeline": "Next 2 weeks",
                })
            elif factor < 0.8:
                recs.append({
                    "type": "risk",
                    "priority": "low",
                    "title": f"Weather Warning — {cat.title()} ({condition.title()} Weather)",
                    "message": (
                        f"{condition.title()} weather reduces {cat} demand by ~{round((1-factor)*100)}% "
                        f"at {store_name}. Reduce procurement temporarily."
                    ),
                    "store": store_name,
                    "category": cat,
                    "timeline": "Next 2 weeks",
                })

        # 6. Store-type specific (only for known store types with history)
        if store_type == "automotive":
            if current_month in (9, 10, 11):
                recs.append({
                    "type": "opportunity",
                    "priority": "high",
                    "title": "Festive Season Vehicle Demand Surge",
                    "message": (
                        f"Q4 festive season historically drives 40–60% higher vehicle inquiries "
                        f"at {store_name}. Ensure display inventory and financing options are ready."
                    ),
                    "store": store_name,
                    "category": "vehicles",
                    "timeline": "Oct–Dec",
                })
        if store_type == "electronics":
            if current_month in (10, 11, 12):
                recs.append({
                    "type": "opportunity",
                    "priority": "high",
                    "title": "Electronics Festive Demand Cycle",
                    "message": (
                        f"Smartphones, TVs, and laptops see 2–3x demand spikes during Oct–Dec at "
                        f"{store_name}. Stock up 6–8 weeks before Diwali/Christmas."
                    ),
                    "store": store_name,
                    "category": "electronics",
                    "timeline": "Oct–Dec",
                })

        # Sort by priority
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        recs.sort(key=lambda x: priority_order.get(x.get("priority", "low"), 3))
        return recs

    def dashboard_summary(self):
        monthly = self.monthly_sales()
        inv = self.inventory_status()
        stockouts = [i for i in inv if i["status"] == "stockout"]
        overstock = [i for i in inv if i["status"] == "overstock"]
        low_stock = [i for i in inv if i["status"] == "low"]
        total_revenue = sum(r["revenue"] for r in monthly)
        recent = monthly[-3:] if len(monthly) >= 3 else monthly
        recent_revenue = sum(r["revenue"] for r in recent)

        return {
            "store": self._store,
            "total_revenue_2yr": round(total_revenue, 2),
            "recent_3mo_revenue": round(recent_revenue, 2),
            "total_orders": sum(r["orders"] for r in monthly),
            "inventory": {
                "total_products": len(inv),
                "stockouts": len(stockouts),
                "overstock": len(overstock),
                "low_stock": len(low_stock),
            },
            "monthly_sales": monthly,
        }

    def close(self):
        self.db.close()
