import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Check 12@supplier.com user
const [users] = await connection.query(
  'SELECT id, email, accountType FROM users WHERE email = ?',
  ['12@supplier.com']
);

if (users.length === 0) {
  console.log('❌ User 12@supplier.com not found');
} else {
  const user = users[0];
  console.log('✅ User found:', user.email, '(User ID:', user.id + ')');
  
  // Check supplier linkage
  const [linkage] = await connection.query(
    'SELECT supplierId FROM supplierUsers WHERE userId = ?',
    [user.id]
  );
  
  if (linkage.length === 0) {
    console.log('❌ NOT linked to any supplier');
    console.log('\nNeed to link this user to Supplier ID 270001');
  } else {
    console.log('✅ Linked to Supplier ID:', linkage[0].supplierId);
    
    // Check jobs for this supplier
    const [jobs] = await connection.query(
      'SELECT id, serviceType, status FROM jobs WHERE assignedSupplierId = ?',
      [linkage[0].supplierId]
    );
    console.log(`\nJobs for Supplier ${linkage[0].supplierId}: ${jobs.length}`);
  }
}

// Check what Supplier ID 270001 is
const [supplier] = await connection.query(
  'SELECT id, companyName FROM suppliers WHERE id = ?',
  [270001]
);

if (supplier.length > 0) {
  console.log('\n📌 Supplier ID 270001:', supplier[0].companyName);
  
  // Check who is linked to this supplier
  const [linkedUsers] = await connection.query(
    'SELECT u.id, u.email FROM supplierUsers su JOIN users u ON su.userId = u.id WHERE su.supplierId = ?',
    [270001]
  );
  
  console.log('Users linked to this supplier:');
  linkedUsers.forEach(u => console.log(`  - ${u.email} (User ID: ${u.id})`));
}

await connection.end();
