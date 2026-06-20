from models import get_db
from datetime import date

GST_RATE = 0.18
db = get_db()

rows = db.execute("""
    SELECT strftime('%Y', order_date) AS yr,
           strftime('%m', order_date) AS mo,
           SUM(total_amount) AS revenue
    FROM orders
    WHERE store_id = 1 AND status = 'completed'
    GROUP BY yr, mo ORDER BY yr, mo
""").fetchall()
db.close()

fy_revenue = {}
for r in rows:
    yr = int(r["yr"]); mo = int(r["mo"])
    fy_start = yr if mo >= 4 else yr - 1
    key = f"FY {fy_start}-{str(fy_start+1)[-2:]}"
    fy_revenue[key] = fy_revenue.get(key, 0.0) + r["revenue"]

today = date.today()
cur_fy_start = today.year if today.month >= 4 else today.year - 1
cur_fy_key   = f"FY {cur_fy_start}-{str(cur_fy_start+1)[-2:]}"

print("GST Summary for ABC Store (store_id=1):")
for fy_key, rev in sorted(fy_revenue.items()):
    is_cur = fy_key == cur_fy_key
    tag = " (YTD - CURRENT)" if is_cur else ""
    print(f"  {fy_key}{tag}: Revenue=Rs{rev/100000:.1f}L  GST=Rs{rev*GST_RATE/100000:.1f}L")
