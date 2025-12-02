import mysql from 'mysql2/promise';
import { randomBytes } from 'crypto';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Generate token like the backend does
const engineerToken = randomBytes(32).toString('hex');

const [result] = await connection.execute(`
  INSERT INTO jobs (
    jobToken, customerName, customerEmail, customerPhone,
    serviceType, description, estimatedDuration,
    siteAddress, city, country, postalCode, siteLatitude, siteLongitude,
    scheduledDateTime, calculatedPrice, currency, isOutOfHours,
    status, engineerToken, customerId
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`, [
  'test-' + Date.now(),
  'Test Customer',
  'test@customer.com',
  '+1234567890',
  'L1 Test Engineer',
  'Test job to verify token system',
  120,
  '123 Test St',
  'Test City',
  'US',
  '12345',
  '37.7749',
  '-122.4194',
  new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' '),
  100.00,
  'USD',
  0,
  'pending_supplier_acceptance',
  engineerToken,
  1
]);

const jobId = result.insertId;

console.log(JSON.stringify({
  jobId,
  engineerToken,
  engineerLink: `https://3000-iv7gpjx7torbvnwkmof4q-462fc49f.manusvm.computer/engineer/job/${engineerToken}`
}, null, 2));

await connection.end();
