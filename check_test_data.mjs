import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Check test supplier
const supplier = await connection.query(
  'SELECT u.id, u.email, u.accountType, su.supplierId FROM users u LEFT JOIN supplierUsers su ON u.id = su.userId WHERE u.email = ?',
  ['testsupplier@example.com']
);
console.log('Test Supplier:', JSON.stringify(supplier[0], null, 2));

// Check test customer
const customer = await connection.query(
  'SELECT id, email, accountType FROM users WHERE email = ?',
  ['12@customer.com']
);
console.log('\nTest Customer:', JSON.stringify(customer[0], null, 2));

// Check jobs for this customer
const jobs = await connection.query(
  'SELECT id, serviceType, status, assignedSupplierId, engineerName FROM jobs WHERE customerEmail = ?',
  ['12@customer.com']
);
console.log('\nCustomer Jobs:', JSON.stringify(jobs[0], null, 2));

await connection.end();
