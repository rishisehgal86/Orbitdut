import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { suppliers } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Find a supplier in Mountain View and enable OOH
const mountainViewSuppliers = await db.select().from(suppliers).where(eq(suppliers.city, 'Mountain View')).limit(1);

if (mountainViewSuppliers.length > 0) {
  const supplier = mountainViewSuppliers[0];
  console.log('Found supplier:', supplier.companyName);
  
  await db.update(suppliers)
    .set({ offersOutOfHours: true })
    .where(eq(suppliers.id, supplier.id));
  
  console.log('✓ Enabled OOH for supplier:', supplier.companyName);
} else {
  console.log('No suppliers found in Mountain View');
}

await connection.end();
