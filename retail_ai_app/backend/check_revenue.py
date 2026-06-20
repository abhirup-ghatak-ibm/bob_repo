from models import get_db
db = get_db()

for store_id, store_name in [(1,'ABC Store'),(2,'XYZ Electronics'),(3,'MNO Motors')]:
    row = db.execute('SELECT SUM(total_amount) as total FROM orders WHERE store_id=? AND status="completed"',
                     (store_id,)).fetchone()
    total = row['total'] or 0
    print(f'\n{store_name} total revenue: Rs{total/10000000:.2f}Cr')

    rows = db.execute(
        'SELECT strftime("%Y",order_date) yr, strftime("%m",order_date) mo, SUM(total_amount) rev '
        'FROM orders WHERE store_id=? AND status="completed" GROUP BY yr,mo ORDER BY yr,mo',
        (store_id,)
    ).fetchall()

    fy_rev = {}
    for r in rows:
        yr=int(r['yr']); mo=int(r['mo'])
        fy_start = yr if mo >= 4 else yr - 1
        key = f'FY {fy_start}-{str(fy_start+1)[-2:]}'
        fy_rev[key] = fy_rev.get(key,0) + r['rev']

    fy_total = 0
    for k,v in sorted(fy_rev.items()):
        print(f'  {k}: Rs{v/10000000:.2f}Cr')
        fy_total += v
    print(f'  FY-sum cross-check: Rs{fy_total/10000000:.2f}Cr')

db.close()
