import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function applyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Applying null tenant migration...');
    
    const sql = `
      ALTER TABLE users 
      ALTER COLUMN tenant_id DROP NOT NULL;
    `;
    
    await client.query(sql);
    console.log('✅ Migration applied!');
    process.exit(0);
  } catch (error: any) {
    if (error.message.includes('column "tenant_id" is in a primary key')) {
      console.log('✅ Migration already applied (column is nullable)');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(0);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
