import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Add column first
  await conn.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS jobToken VARCHAR(64) AFTER id");
  console.log('✅ Added jobToken column');
  
  // Then add unique constraint
  await conn.execute("ALTER TABLE jobs ADD UNIQUE KEY jobs_jobToken_unique (jobToken)");
  console.log('✅ Added unique constraint on jobToken');
} catch (error) {
  if (error.code === 'ER_DUP_KEYNAME') {
    console.log('⏭️  Unique constraint already exists');
  } else {
    console.error('❌', error.message);
  }
} finally {
  await conn.end();
}
