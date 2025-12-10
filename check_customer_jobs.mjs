import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Get customer user ID
const [customers] = await connection.query(
  'SELECT id, email, accountType FROM users WHERE email = ?',
  ['12@customer.com']
);

if (customers.length === 0) {
  console.log('❌ Customer not found');
} else {
  const customer = customers[0];
  console.log('✅ Customer found:', customer.email, '(ID:', customer.id + ')');
  
  // Get jobs for this customer
  const [jobs] = await connection.query(
    'SELECT id, serviceType, status, assignedSupplierId, engineerName, engineerEmail, siteAddress, scheduledDateTime, calculatedPrice FROM jobs WHERE customerEmail = ? OR customerId = ?',
    [customer.email, customer.id]
  );
  
  console.log(`\n📋 Total jobs: ${jobs.length}\n`);
  
  jobs.forEach(job => {
    console.log(`Job #${job.id}:`);
    console.log(`  Service: ${job.serviceType}`);
    console.log(`  Status: ${job.status}`);
    console.log(`  Location: ${job.siteAddress || 'N/A'}`);
    console.log(`  Scheduled: ${job.scheduledDateTime || 'N/A'}`);
    console.log(`  Price: $${job.calculatedPrice ? (job.calculatedPrice / 100).toFixed(2) : 'N/A'}`);
    console.log(`  Assigned Supplier ID: ${job.assignedSupplierId || 'Not assigned'}`);
    console.log(`  Engineer: ${job.engineerName || 'Not assigned'}`);
    console.log(`  Engineer Email: ${job.engineerEmail || 'N/A'}`);
    console.log('');
  });
}

await connection.end();
