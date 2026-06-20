"""
Delete all owners that are NOT A. Sharma (sharma@demo.com) or S. Mukherjee (mukherjee@demo.com),
along with all their associated data (stores, products, inventory, orders, customers, etc.)
"""
from models import get_db

KEEP_EMAILS = {'sharma@demo.com', 'mukherjee@demo.com'}

def delete_extra_owners():
    db = get_db()

    # Find owners to delete
    all_owners = db.execute('SELECT id, name, email FROM owners ORDER BY id').fetchall()
    to_delete  = [o for o in all_owners if o['email'].lower() not in KEEP_EMAILS]

    if not to_delete:
        print('No extra owners found. Only demo owners exist.')
        db.close()
        return

    print('Owners to delete:')
    for o in to_delete:
        print('  id=%d  name=%s  email=%s' % (o['id'], o['name'], o['email']))

    for owner in to_delete:
        owner_id = owner['id']
        name     = owner['name']

        # Get all stores owned by this owner
        stores = db.execute(
            'SELECT id FROM stores WHERE owner_id=?', (owner_id,)
        ).fetchall()
        store_ids = [s['id'] for s in stores]

        for sid in store_ids:
            # Get all products in this store
            products = db.execute(
                'SELECT id FROM products WHERE store_id=?', (sid,)
            ).fetchall()
            product_ids = [p['id'] for p in products]

            # Get all orders in this store
            orders = db.execute(
                'SELECT id FROM orders WHERE store_id=?', (sid,)
            ).fetchall()
            order_ids = [r['id'] for r in orders]

            # Delete order_items for these orders
            if order_ids:
                db.execute(
                    'DELETE FROM order_items WHERE order_id IN (%s)' %
                    ','.join('?' * len(order_ids)),
                    order_ids
                )
                print('  Deleted %d order_items for store %d' % (
                    len(order_ids), sid))

            # Delete orders
            deleted = db.execute(
                'DELETE FROM orders WHERE store_id=?', (sid,)
            ).rowcount
            print('  Deleted %d orders for store %d' % (deleted, sid))

            # Delete inventory
            db.execute('DELETE FROM inventory WHERE store_id=?', (sid,))

            # Delete products
            db.execute('DELETE FROM products WHERE store_id=?', (sid,))

            # Delete customers
            db.execute('DELETE FROM customers WHERE store_id=?', (sid,))

            # Delete suppliers
            db.execute('DELETE FROM suppliers WHERE store_id=?', (sid,))

            # Delete demand_signals
            db.execute('DELETE FROM demand_signals WHERE store_id=?', (sid,))

        # Delete stores
        db.execute('DELETE FROM stores WHERE owner_id=?', (owner_id,))

        # Delete owner
        db.execute('DELETE FROM owners WHERE id=?', (owner_id,))

        db.commit()
        print('Deleted owner: %s (%s) and all their data.' % (name, owner['email']))

    # Final state
    print()
    print('Remaining owners:')
    remaining = db.execute('SELECT id, name, email FROM owners ORDER BY id').fetchall()
    for o in remaining:
        stores = db.execute('SELECT name FROM stores WHERE owner_id=?', (o['id'],)).fetchall()
        store_names = ', '.join(s['name'] for s in stores)
        print('  id=%d  %s (%s)  stores: %s' % (o['id'], o['name'], o['email'], store_names))

    db.close()
    print()
    print('Done.')

if __name__ == '__main__':
    delete_extra_owners()
