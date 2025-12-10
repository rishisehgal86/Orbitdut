import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Check token BEFORE accepting
const [before] = await connection.execute('SELECT id, engineerToken, status FROM jobs WHERE id = 120002');
console.log('BEFORE acceptance:');
console.log(JSON.stringify(before, null, 2));

// Accept the job (simulate supplier acceptance)
await connection.execute(`
  UPDATE jobs 
  SET status = 'supplier_accepted', assignedSupplierId = 1, acceptedAt = NOW()
  WHERE id = 120002
`);

// Check token AFTER accepting
const [after] = await connection.execute('SELECT id, engineerToken, status FROM jobs WHERE id = 120002');
console.log('\nAFTER acceptance:');
console.log(JSON.stringify(after, null, 2));

// Verify token hasn't changed
if (before[0].engineerToken === after[0].engineerToken) {
  console.log('\n✅ SUCCESS: Token remained the same!');
  console.log(`\nTest link (should now show claim form):`);
  console.log(`https://3000-iv7gpjx7torbvnwkmof4q-462fc49f.manusvm.computer/engineer/job/${after[0].engineerToken}`);
} else {
  console.log('\n❌ FAIL: Token changed!');
}

await connection.end();
