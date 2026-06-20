from models import get_db
db = get_db()
rows = db.execute("SELECT strftime('%Y',order_date) yr, strftime('%m',order_date) mo, COUNT(*) c FROM orders GROUP BY yr,mo ORDER BY yr,mo").fetchall()
print("Available months in orders:")
for r in rows:
    print(f"  {r['yr']}-{r['mo']}  ({r['c']} orders)")
db.close()
