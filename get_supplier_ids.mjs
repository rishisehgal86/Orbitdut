import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Get 12@supplier.com's supplier ID
const [supplier] = await connection.execute(
  'SELECT su.supplierId FROM users u JOIN supplierUsers su ON u.id = su.userId WHERE u.email = ?',
  ['12@supplier.com']
);

console.log('12@supplier.com Supplier ID:', supplier[0]?.supplierId || 'NOT FOUND');

// Get job assignments
const [jobs] = await connection.execute(
  'SELECT id, assignedSupplierId FROM jobs WHERE id IN (?, ?)',
  [30001, 90001]
);

jobs.forEach(job => {
  console.log(`Job ${job.id} assigned to Supplier ID:`, job.assignedSupplierId || 'NULL');
});

await connection.end();
