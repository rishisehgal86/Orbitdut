import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await connection.execute("SELECT id, engineerToken, status, serviceType FROM jobs WHERE id = 90001");
console.log(JSON.stringify(rows, null, 2));

await connection.end();
