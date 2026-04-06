# Create Super Admin Account

## Quick Start

Run this command from the `backend` directory:

```bash
# Using npx
npx ts-node src/seeds/createSuperAdmin.ts

# Or if ts-node is installed globally
ts-node src/seeds/createSuperAdmin.ts
```

## Login Credentials

After running the seed script, you'll get:

```
Email:    superadmin@vanta.com
Password: SuperAdmin123!
```

## What You Can Do

As a super admin, you can:

1. **View all tenants** - See every tenant in the system
2. **Manage tenant plans** - Upgrade tenants from FREE to PRO
3. **Downgrade plans** - Move tenants back to FREE plan
4. **View tenant details** - See user counts and creation dates
5. **Manage administrators** - Promote/demote other super admins

## Access the Admin Panel

1. Login with the credentials above
2. Navigate to `/admin` (or it will automatically show in settings if you're a super admin)
3. You'll see a grid of all tenants with upgrade/downgrade buttons

## Admin API Endpoints

Once logged in, you can access these endpoints:

```
GET    /api/admin/tenants                              - List all tenants
GET    /api/admin/tenants/:tenantId                   - Get tenant details
POST   /api/admin/tenants/:tenantId/upgrade           - Upgrade to PRO
POST   /api/admin/tenants/:tenantId/downgrade         - Downgrade to FREE
GET    /api/admin/super-admins                        - List all super admins
POST   /api/admin/users/:userId/promote-super-admin   - Make someone super admin
POST   /api/admin/users/:userId/demote-super-admin    - Remove super admin status
```

## Add to package.json (Optional)

You can add a script to `backend/package.json` for easier access:

```json
{
  "scripts": {
    "seed:superadmin": "ts-node src/seeds/createSuperAdmin.ts"
  }
}
```

Then run:
```bash
npm run seed:superadmin
```

## Reset Super Admin

To remove super admin status:

```bash
# Using API
curl -X POST http://localhost:3000/api/admin/users/{USER_ID}/demote-super-admin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Or via database
UPDATE users SET is_super_admin = false WHERE email = 'superadmin@vanta.com';
```
