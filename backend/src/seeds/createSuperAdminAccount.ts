import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createSuperAdminAccount() {
  const client = await pool.connect();
  
  try {
    console.log('🔐 Setting up dedicated super admin account...\n');

    const superAdminId = crypto.randomUUID();
    const email = 'superadmin@vanta.com';
    const firstName = 'Super';
    const lastName = 'Admin';
    const password = 'SuperAdmin@2026!'; // Secure password
    const role = 'ADMIN'; // Use ADMIN role, distinguished by is_super_admin flag

    // Hash the password using bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if super admin already exists
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      console.log('⚠️  Super admin already exists! Updating password...\n');
      const user = existing.rows[0];
      
      // Update password for existing user
      await client.query(
        'UPDATE users SET password_hash = $1, is_super_admin = true WHERE id = $2',
        [passwordHash, user.id]
      );
      
      console.log('✅ Super admin password updated!');
    } else {

      // Create super admin user WITHOUT tenant_id (super admins are system-wide)
      await client.query(
        `INSERT INTO users 
          (id, email, password_hash, first_name, last_name, role, is_super_admin, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [superAdminId, email, passwordHash, firstName, lastName, role, true, true]
      );

      console.log('✅ Super admin account created successfully!');
    }

    console.log('\n📋 Super Admin Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🌐 After Login:');
    console.log('  → Navigate to /superadmin');
    console.log('  → You\'ll see the super admin dashboard');
    console.log('  → Manage all tenants and plans');
    
    console.log('\n📝 Important:');
    console.log('  ⚠️  Change this password after first login!');
    console.log('  ⚠️  Store credentials securely in your password manager');
    console.log('  ⚠️  This account has SYSTEM-WIDE admin privileges');

    console.log('\n✨ Features:');
    console.log('  ✓ View all tenants across the platform');
    console.log('  ✓ Upgrade/downgrade tenant plans');
    console.log('  ✓ Manage tenant subscriptions');
    console.log('  ✓ View system-wide analytics');
    console.log('  ✓ Manage other super admins');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin account:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createSuperAdminAccount();
