import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Get 12@supplier.com's supplier ID
const [users] = await connection.query(
  'SELECT u.id, u.email, su.supplierId FROM users u JOIN supplierUsers su ON u.id = su.userId WHERE u.email = ?',
  ['12@supplier.com']
);

if (users.length === 0) {
  console.log('❌ Could not find supplier for 12@supplier.com');
} else {
  const correctSupplierId = users[0].supplierId;
  console.log('✅ Found 12@supplier.com linked to Supplier ID:', correctSupplierId);
  
  // Update Job #90001 to assign to correct supplier
  await connection.query(
    'UPDATE jobs SET assignedSupplierId = ?, status = ? WHERE id = ?',
    [correctSupplierId, 'assigned_to_supplier', 90001]
  );
  
  console.log('✅ Updated Job #90001 to assign to Supplier ID:', correctSupplierId);
  console.log('\nJob should now appear in 12@supplier.com dashboard!');
}

await connection.end();
