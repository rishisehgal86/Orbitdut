import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await connection.execute("SELECT id, serviceType, status, engineerToken IS NOT NULL as hasToken, engineerName, engineerEmail FROM jobs ORDER BY id");
console.log(JSON.stringify(rows, null, 2));

await connection.end();
