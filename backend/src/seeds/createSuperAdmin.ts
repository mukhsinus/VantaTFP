import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createSuperAdminAccount() {
  const client = await pool.connect();
  
  try {
    console.log('🔐 Setting up super admin account...\n');

    // Get the first admin user
    const result = await client.query(
      'SELECT id, email, first_name, last_name FROM users WHERE role = $1 ORDER BY created_at ASC LIMIT 1',
      ['ADMIN']
    );

    if (result.rows.length === 0) {
      console.error('❌ No admin users found. Please create an admin user first.');
      process.exit(1);
    }

    const user = result.rows[0];

    // Update user to super admin
    await client.query(
      'UPDATE users SET is_super_admin = true WHERE id = $1',
      [user.id]
    );

    console.log('✅ Super admin account created successfully!');
    console.log('\n📋 Account Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Name:  ${user.first_name} ${user.last_name}`);
    console.log(`Email: ${user.email}`);
    console.log('Role:  Super Admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📍 Features:');
    console.log('  ✓ Access /admin to manage all tenants');
    console.log('  ✓ Upgrade/downgrade tenant plans');
    console.log('  ✓ View all users and their roles');
    console.log('  ✓ Manage super admin permissions');
    
    console.log('\n🔐 API Endpoints Available:');
    console.log('  GET    /api/admin/tenants');
    console.log('  GET    /api/admin/tenants/:tenantId');
    console.log('  POST   /api/admin/tenants/:tenantId/upgrade');
    console.log('  POST   /api/admin/tenants/:tenantId/downgrade');
    console.log('  GET    /api/admin/super-admins');
    console.log('  POST   /api/admin/users/:userId/promote-super-admin');
    console.log('  POST   /api/admin/users/:userId/demote-super-admin');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up super admin account:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createSuperAdminAccount();
