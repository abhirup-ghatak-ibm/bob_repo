from models import get_db
db = get_db()
owners = db.execute('SELECT id, name, email FROM owners ORDER BY id').fetchall()
print('Current owners in DB:')
for o in owners:
    print('  id=%d  name=%s  email=%s' % (o['id'], o['name'], o['email']))
db.close()
