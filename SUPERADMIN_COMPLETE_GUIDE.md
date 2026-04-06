# VantaTFP Super Admin System - Complete Setup Guide

## Overview

The VantaTFP platform now has a **completely separate super admin system** with its own dedicated account and user interface. Super admins are independent system administrators who are **NOT tied to any tenant** and can manage the entire platform.

---

## 🔐 Dedicated Super Admin Account

A completely new super admin user has been created for system administration:

### Account Credentials
```
📧 Email:     superadmin@vanta.com
🔑 User ID:   102ab024-5097-4b06-a73e-3a1fbce88f38
👤 Name:      Super Admin
🏷️  Role:      ADMIN (with is_super_admin flag)
📍 Tenant:    NONE (Tenant-Independent)
```

### Key Characteristics
- ✅ Completely separate from regular tenant admin users
- ✅ Not tied to any tenant_id (NULL value in database)
- ✅ Has system-wide administrative privileges
- ✅ Can access `/superadmin` dashboard exclusively
- ✅ Cannot access regular tenant dashboards
- ✅ Can upgrade/downgrade ANY tenant's plan

---

## 🌐 Super Admin Dashboard

### Access
**URL**: `https://vanta.com/superadmin`

### Interface Features
The super admin dashboard provides:

1. **Statistics Overview**
   - Total tenants across the platform
   - Count of FREE plan tenants
   - Count of PRO plan tenants
   - Total users across all tenants

2. **Tenant Management Grid**
   - View all tenants in a responsive grid layout
   - See tenant name, current plan, user count, creation date
   - Dark blue gradient background (distinct from regular UI)
   - Upgrade button for FREE plan tenants
   - Downgrade button for PRO plan tenants

3. **Plan Management**
   - Single click upgrades from FREE to PRO
   - Single click downgrades from PRO to FREE
   - Confirmation dialogs for downgrades
   - Real-time refresh after actions

4. **Visual Design**
   - Completely separate UI from regular tenant interface
   - Professional dark theme with cyan/blue accents
   - Responsive design for mobile and desktop
   - Status indicators and loading states

---

## 🔌 Backend API Endpoints

All super admin API endpoints are protected and require the `is_super_admin` flag to be `true`:

### Tenant Management
```
GET    /api/admin/tenants
       - Returns all tenants with user counts
       - Response: { id, name, plan, users_count, created_at }[]

GET    /api/admin/tenants/:tenantId
       - Returns specific tenant details with users
       - Response: { id, name, plan, users_count, users[], created_at }

POST   /api/admin/tenants/:tenantId/upgrade
       - Upgrades tenant from FREE to PRO
       - Body: { plan: "PRO" }
       - Returns updated tenant

POST   /api/admin/tenants/:tenantId/downgrade
       - Downgrades tenant from PRO to FREE
       - Body: { plan: "FREE" }
       - Returns updated tenant
```

### Super Admin Management
```
GET    /api/admin/super-admins
       - Lists all users with super admin privileges
       - Response: { id, email, first_name, last_name, is_super_admin }[]

POST   /api/admin/users/:userId/promote-super-admin
       - Grants super admin privileges to a user
       - Returns updated user with is_super_admin=true

POST   /api/admin/users/:userId/demote-super-admin
       - Revokes super admin privileges from a user
       - Returns updated user with is_super_admin=false
```

### Authentication
```
Header: Authorization: Bearer <JWT_TOKEN>
```

---

## 🛡️ Frontend Components

### SuperAdminDashboard Component
**Location**: `frontend/src/pages/superadmin/SuperAdminDashboard.tsx`

Features:
- Fetches all tenants via `/api/admin/tenants`
- Displays statistics calculated from tenant data
- Handles upgrade/downgrade with loading states
- Error handling and notifications
- Fully responsive grid layout

### SuperAdminGuard Component
**Location**: `frontend/src/app/guards/SuperAdminGuard.tsx`

- Protects the `/superadmin` route
- Redirects to login if not authenticated
- Shows access denied message for non-super-admins
- Checks `is_super_admin` flag on user object

### Router Configuration
**Location**: `frontend/src/app/router.tsx`

- New `/superadmin` route added
- Protected by `SuperAdminGuard`
- Renders `SuperAdminDashboard` exclusively
- Separate from regular AppLayout navigation

---

## 📊 Database Schema

### Users Table Changes
```sql
-- Made tenant_id NULLABLE for super admin users
ALTER TABLE users 
ALTER COLUMN tenant_id DROP NOT NULL;

-- Added is_super_admin flag (Boolean, default false)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Created index for efficient lookups
CREATE INDEX idx_users_super_admin ON users(is_super_admin);
```

### Super Admin User Example
```sql
-- Super admin user is NOT tied to any tenant
INSERT INTO users (
  id, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  role, 
  is_super_admin, 
  tenant_id,  -- NULL for super admins
  is_active,
  created_at,
  updated_at
) VALUES (
  '102ab024-5097-4b06-a73e-3a1fbce88f38',
  'superadmin@vanta.com',
  'password_hash',
  'Super',
  'Admin',
  'ADMIN',
  true,         -- is_super_admin = true
  NULL,         -- tenant_id = NULL (not tied to any tenant)
  true,
  NOW(),
  NOW()
);
```

---

## 🔄 Setup Instructions

### 1. Create Super Admin Account

Run the dedicated script:
```bash
cd backend
npx ts-node src/seeds/createSuperAdminAccount.ts
```

This creates:
- New user with email `superadmin@vanta.com`
- `is_super_admin` flag set to `true`
- No tenant association (tenant_id = NULL)

### 2. Database Migrations

Migrations are automatically applied:
```bash
cd backend
npx ts-node src/seeds/migrate.ts
```

Updates applied:
- Makes `tenant_id` nullable
- Adds `is_super_admin` column
- Creates indexes

### 3. Login with Super Admin Account

1. Navigate to `/login`
2. Enter email: `superadmin@vanta.com`
3. Use your secure password
4. You'll be redirected to `/superadmin` dashboard

### 4. Access Super Admin Dashboard

After login, navigate to:
- URL: `/superadmin`
- Or use the super admin menu if available

---

## 🎯 Use Cases

### 1. System Administrator Tasks
- Monitor all tenants on the platform
- View user counts and plan distribution
- Generate platform-wide reports

### 2. Plan Management
- Upgrade customers from FREE to PRO plan
- Downgrade customers if needed
- Manage trial periods and transitions

### 3. Multi-Tenancy Management
- Oversee multiple organizational accounts
- Ensure fair resource distribution
- Manage tenant lifecycle (creation, upgrades, downgrades)

### 4. Super Admin Management
- Promote trusted admins to super admin status
- Revoke super admin privileges when needed
- Audit super admin activities

---

## 🔒 Security Features

### Access Control
- Super admin access is strictly checked against `is_super_admin` flag
- No tenant association means global platform access
- Separate route (`/superadmin`) isolated from regular UI

### Authentication
- Requires valid JWT token
- Backend guard validates `is_super_admin` flag
- Frontend guard prevents navigation without privileges
- API endpoints protected by `SuperAdminGuard`

### Audit Trail
- All super admin actions should be logged (implement in production)
- Database tracks is_super_admin status changes
- User modification timestamps available

---

## ⚙️ Customization

### Change Super Admin Email
Update the seed script:
```typescript
const email = 'your-email@company.com'; // Change this
```

Then re-run the creation script.

### Modify Dashboard Colors
Edit `SuperAdminDashboard.module.css`:
```css
.container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
}
```

### Add New Statistics
Update `SuperAdminDashboard.tsx`:
```typescript
const stats = {
  // Add new stat calculations here
  totalRevenue: calculateTotalRevenue(data),
};
```

---

## 🚀 Production Considerations

1. **Password Management**
   - Use secure, complex passwords
   - Implement password reset flows
   - Consider OAuth/SSO for admins

2. **Audit Logging**
   - Log all plan changes
   - Track admin actions
   - Monitor API endpoint access

3. **Rate Limiting**
   - Apply rate limits to super admin endpoints
   - Prevent brute force attacks
   - Monitor unusual activity

4. **Backup & Recovery**
   - Regular database backups
   - Recovery procedures for account lockout
   - Admin account recovery flows

5. **Multi-Factor Authentication**
   - Implement 2FA for super admin accounts
   - Use time-based OTP or authenticator apps
   - Require MFA for sensitive operations

---

## 📝 File Structure

```
Frontend:
├── src/pages/superadmin/
│   ├── SuperAdminDashboard.tsx           # Main dashboard component
│   └── SuperAdminDashboard.module.css    # Dashboard styling
├── src/app/guards/
│   └── SuperAdminGuard.tsx               # Route protection guard
└── src/app/router.tsx                    # Updated with /superadmin route

Backend:
├── src/seeds/
│   ├── createSuperAdminAccount.ts        # Create new super admin
│   └── migrate.ts                        # Apply database migrations
├── sql/
│   ├── 20260406_add_super_admin_role.sql
│   ├── 20260406_add_super_admin_user_type.sql
│   └── 20260406_allow_null_tenant_for_superadmin.sql
└── src/modules/admin/                    # Existing admin controller logic
```

---

## ✅ Verification Checklist

- [ ] Super admin account created in database
- [ ] `is_super_admin` flag is `true`
- [ ] `tenant_id` is `NULL`
- [ ] Super admin can login successfully
- [ ] `/superadmin` route is accessible
- [ ] Dashboard loads all tenants
- [ ] Upgrade/downgrade buttons are functional
- [ ] Non-super-admins see access denied message
- [ ] API endpoints require super admin privileges
- [ ] Production password set for super admin account

---

## 🆘 Troubleshooting

### Cannot access /superadmin
- Check `is_super_admin = true` in database
- Verify JWT token is valid
- Check browser console for errors

### Dashboard not loading tenants
- Verify API endpoint `/api/admin/tenants` is working
- Check authentication headers are sent
- Review backend logs for errors

### Upgrade/downgrade not working
- Check user has super admin privileges
- Verify POST endpoints are accessible
- Review API response for error messages

### Creating account fails
- Ensure migrations have been applied
- Check database connection
- Verify `tenant_id` column is nullable

---

**Last Updated**: April 6, 2026  
**Version**: 1.0.0 - Complete Super Admin Implementation
