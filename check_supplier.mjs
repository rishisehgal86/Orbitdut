import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Check if user exists
const [users] = await connection.query(
  'SELECT id, email, accountType, passwordHash FROM users WHERE email = ?',
  ['testsupplier@example.com']
);

if (users.length === 0) {
  console.log('❌ Test supplier account does NOT exist');
} else {
  const user = users[0];
  console.log('✅ Test supplier account exists');
  console.log('User ID:', user.id);
  console.log('Account Type:', user.accountType);
  
  // Convert Buffer to string if needed
  const passwordHash = user.passwordHash instanceof Buffer 
    ? user.passwordHash.toString('utf-8') 
    : user.passwordHash;
  
  // Test password
  try {
    const isValid = await bcrypt.compare('password123', passwordHash);
    console.log('Password valid:', isValid ? '✅ YES' : '❌ NO - needs reset');
  } catch (err) {
    console.log('❌ Password check failed:', err.message);
  }
  
  // Check supplier linkage
  const [linkage] = await connection.query(
    'SELECT su.supplierId, s.companyName FROM supplierUsers su JOIN suppliers s ON su.supplierId = s.id WHERE su.userId = ?',
    [user.id]
  );
  
  if (linkage.length > 0) {
    console.log('✅ Linked to supplier:', linkage[0].companyName, '(ID:', linkage[0].supplierId + ')');
    
    // Check for jobs assigned to this supplier
    const [jobs] = await connection.query(
      'SELECT id, serviceType, status, customerEmail FROM jobs WHERE assignedSupplierId = ?',
      [linkage[0].supplierId]
    );
    console.log(`\n📋 Jobs assigned to this supplier: ${jobs.length}`);
    jobs.forEach(job => {
      console.log(`  - Job #${job.id}: ${job.serviceType} (${job.status}) - Customer: ${job.customerEmail}`);
    });
  } else {
    console.log('❌ NOT linked to any supplier company');
  }
}

await connection.end();
