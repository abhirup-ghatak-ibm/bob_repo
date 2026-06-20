import sys
sys.path.insert(0, '.')
sys.path.insert(0, 'modules')
from modules.ai_engine import AIEngine

stores_test = [(1,'ABC Store'),(2,'XYZ Electronics'),(3,'MNO Motors')]
for store_id, store_name in stores_test:
    e = AIEngine(store_id)
    recs = e.generate_recommendations()
    inv  = e.inventory_status()
    stockouts = [i for i in inv if i['status']=='stockout']
    overstock = [i for i in inv if i['status']=='overstock']
    print(f'{store_name}: {len(recs)} recs | {len(stockouts)} stockouts | {len(overstock)} overstock')
    if recs:
        top = recs[0]
        print(f"  Top rec: [{top['priority'].upper()}] {top['title']}")
    e.close()
print("All AI checks PASSED")
