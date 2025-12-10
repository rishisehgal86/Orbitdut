import mysql from 'mysql2/promise';

async function query() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Quick query - just get supplier ID
    const [rows] = await connection.execute(
      'SELECT su.supplierId FROM users u JOIN supplierUsers su ON u.id = su.userId WHERE u.email = ? LIMIT 1',
      ['12@supplier.com']
    );
    
    if (rows.length > 0) {
      const supplierId = rows[0].supplierId;
      console.log(supplierId);
      
      // Update job
      await connection.execute(
        'UPDATE jobs SET assignedSupplierId = ? WHERE id = ?',
        [supplierId, 90001]
      );
      console.log('UPDATED');
    } else {
      console.log('NOT_FOUND');
    }
  } finally {
    await connection.end();
  }
}

query().catch(console.error);
