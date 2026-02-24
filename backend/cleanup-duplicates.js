import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'stokvel_db'
});

// Delete duplicate stokvels (keep 1-3, delete 4-6)
const [result] = await conn.query('DELETE FROM stokvels WHERE id IN (4, 5, 6)');
console.log('✅ Deleted', result.affectedRows, 'duplicate stokvels');

const [remaining] = await conn.query('SELECT id, name FROM stokvels ORDER BY id');
console.log('✅ Remaining unique stokvels:');
remaining.forEach(s => console.log(`  - ID ${s.id}: ${s.name}`));

await conn.end();
