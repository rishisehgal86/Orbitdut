import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { suppliers, supplierUsers } from './drizzle/schema.js';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get the user ID for supplier@test.com
const [users] = await connection.execute(
  'SELECT id FROM users WHERE email = ?',
  ['supplier@test.com']
);

if (users.length === 0) {
  console.log('User not found');
  process.exit(1);
}

const userId = users[0].id;
console.log('Found user ID:', userId);

// Create supplier profile
const result = await db.insert(suppliers).values({
  companyName: 'Test Engineering Co',
  contactEmail: 'supplier@test.com',
  contactPhone: '+1234567890',
  country: 'US',
  verificationStatus: 'verified',
  isActive: 1,
});

const supplierId = Number(result.insertId);
console.log('Created supplier ID:', supplierId);

// Link user to supplier
await db.insert(supplierUsers).values({
  userId,
  supplierId,
  role: 'owner',
});

console.log('Supplier profile created successfully!');
await connection.end();
