import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running database migrations...\n');

    // Read all SQL files from the sql directory
    const sqlDir = path.join(__dirname, '../../sql');
    const sqlFiles = fs.readdirSync(sqlDir)
      .filter(file => {
        // Skip template/example files
        if (file.includes('superadmin') && !file.includes('role')) return false;
        return file.endsWith('.sql');
      })
      .sort(); // Run in alphabetical order

    for (const file of sqlFiles) {
      const filePath = path.join(sqlDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      try {
        await client.query(sql);
        console.log(`✅ ${file}`);
      } catch (error: any) {
        // If error is about column already existing, that's fine
        if (error.message.includes('already exists') || error.code === '42701') {
          console.log(`⏭️  ${file} (already applied)`);
        } else if (error.message.includes('does not exist')) {
          console.log(`⏭️  ${file} (table doesn't exist yet)`);
        } else {
          console.error(`❌ ${file}`);
          console.error(`   Error: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Migration process complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
