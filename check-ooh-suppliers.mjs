import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { suppliers } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const oohSuppliers = await db.select({
  id: suppliers.id,
  companyName: suppliers.companyName,
  city: suppliers.city,
  offersOutOfHours: suppliers.offersOutOfHours,
  isVerified: suppliers.isVerified,
  isActive: suppliers.isActive
}).from(suppliers).where(eq(suppliers.offersOutOfHours, 1));

console.log('Suppliers with OOH enabled:', oohSuppliers.length);
oohSuppliers.forEach(s => {
  console.log(`- ${s.companyName} (${s.city}) - Verified: ${s.isVerified}, Active: ${s.isActive}`);
});

await connection.end();
