# Debugging: "Objects Failed to Load"

## Quick Diagnosis Checklist

### ✅ Step 1: Verify Database Migration

```bash
# Navigate to backend
cd backend

# Check if migration is applied
npm run migrate:status

# If migration shows as "pending", apply it:
npm run migrate:up
```

Expected output:
```
✓ 20260415100000_create_objects_and_object_tasks.up.sql
```

If not present, the tables don't exist. Run the migration immediately.

---

### ✅ Step 2: Check Backend is Running

```bash
cd backend
npm run dev

# Should show:
# Server listening at http://127.0.0.1:3000
```

Keep this terminal open and look for errors when testing.

---

### ✅ Step 3: Test API Directly

#### A. Get Your Auth Token

1. Open **DevTools** (F12) in browser
2. Go to **Console** tab
3. Paste:
```javascript
console.log(JSON.parse(localStorage.getItem('auth') || '{}').accessToken)
```
4. Copy the token (should be a long JWT string starting with `eyJ`)

#### B. Test the Endpoint

Open a new terminal and run:

```bash
# Replace YOUR_TOKEN with the token from above
TOKEN="YOUR_TOKEN"

curl -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/v1/objects?page=1&limit=20 \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "data": [],
    "total": 0,
    "page": 1,
    "limit": 20
  }
}
```

**If you get:**
- `401 Unauthorized` → Token is invalid or expired
- `403 Forbidden` → User doesn't have ADMIN/MANAGER/EMPLOYEE role
- `500 Internal Server Error` → Check backend logs for the exact error
- `404 Not Found` → Route isn't registered

---

### ✅ Step 4: Check Browser Console

1. Open **DevTools** (F12)
2. Go to **Console** tab
3. Reload the Objects page
4. Look for errors like:
   - "Failed to load objects: ..."
   - Network errors
   - JWT validation errors

---

### ✅ Step 5: Check Network Tab

1. Open **DevTools** (F12)
2. Go to **Network** tab
3. Reload the Objects page
4. Look for request to `/api/v1/objects`
5. Click on it and check:
   - **Status Code**: Should be 200
   - **Response**: Should show JSON with `data` array
   - **Headers**: Should show `Authorization: Bearer ...`

---

## Common Issues & Solutions

### Issue 1: "Migration Not Applied"

**Symptom:** 
- SQL error in backend logs
- Error mentions "objects" table doesn't exist

**Solution:**
```bash
cd backend
npm run migrate:up
```

Then reload the frontend.

---

### Issue 2: "401 Unauthorized"

**Symptom:**
- API returns 401
- Token in localStorage might be expired

**Solution:**
```bash
# In browser Console:
# 1. Force logout
localStorage.removeItem('auth')
localStorage.removeItem('refresh_token')

# 2. Reload page
# 3. Log in again
```

---

### Issue 3: "403 Forbidden"

**Symptom:**
- User can access other pages but not Objects

**Reason:**
- Objects page requires `ADMIN`, `MANAGER`, or `EMPLOYEE` role
- Check if current user has one of these roles

**Solution:**
```bash
# In browser Console:
# Check your user role
console.log(JSON.parse(localStorage.getItem('auth') || '{}').user)
```

If role is not set correctly, check the backend user creation logic.

---

### Issue 4: "Empty Objects List"

**Symptom:**
- API returns 200 with empty data array
- No error message

**Reason:**
- Database is empty (no objects created yet)
- This is normal behavior

**Solution:**
- Click "Create Object" button to add your first object

---

### Issue 5: "CORS Error"

**Symptom:**
- Browser console shows CORS error
- Network tab shows "failed" without a response

**Reason:**
- Backend CORS settings might not include frontend domain

**Solution:**

Check `backend/src/app.ts`:
```typescript
// Should have CORS enabled for localhost:5173
await app.register(cors, {
  origin: true, // Allow all origins in development
});
```

---

## Detailed Error Mapping

### Error: `Table "public.objects" does not exist`

**Cause:** Migration hasn't been applied

**Fix:**
```bash
cd backend
npm run migrate:up
```

---

### Error: `column "tenant_id" does not exist`

**Cause:** Incorrect migration or partial schema

**Fix:**
```bash
cd backend
# Reset all migrations (CAUTION: deletes all data)
npm run migrate:down

# Reapply all migrations
npm run migrate:up
```

---

### Error: `Invalid JWT token`

**Cause:** Auth token is malformed or expired

**Fix:**
1. Clear auth from localStorage
2. Log in again
3. Verify token is set correctly

---

### Error: `User role must be ADMIN, MANAGER, or EMPLOYEE`

**Cause:** User has wrong role

**Fix:**
1. Check user creation logic in backend
2. Verify role is set when user registers
3. Check `users` table in database:

```sql
-- In Supabase SQL Editor
SELECT id, email, role, system_role FROM users LIMIT 5;
```

---

## Step-by-Step Test Procedure

### Test 1: Create an Object

```bash
TOKEN="YOUR_TOKEN"

curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Object",
    "description": "A test object",
    "object_type": "equipment",
    "status": "active"
  }' \
  http://localhost:3000/api/v1/objects
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "xxx",
    "name": "Test Object",
    "object_type": "equipment",
    "status": "active",
    "created_at": "2024-...",
    ...
  }
}
```

If successful, refresh the Objects page - the new object should appear.

---

### Test 2: List Objects

```bash
TOKEN="YOUR_TOKEN"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/objects?page=1&limit=20
```

Should return:
```json
{
  "success": true,
  "data": {
    "data": [...objects],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

---

### Test 3: Filter by Type

```bash
TOKEN="YOUR_TOKEN"

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/objects?page=1&limit=20&object_type=equipment"
```

Should return only equipment type objects.

---

## Backend Logs to Check

When running `npm run dev` in backend terminal, look for:

### Success Logs
```
[INFO] Creating object
[INFO] Listing objects
[INFO] Getting object
```

### Error Logs
```
[ERROR] Failed to create object: ...
[ERROR] Database error: table "objects" does not exist
[ERROR] User not authenticated
```

---

## Frontend Console Logs

The improved error handling logs errors to console:

```javascript
// Open Console (F12)
// Look for:

// Success
"Fetching objects completed successfully"

// Error
"Error fetching objects: Failed to load objects: Request failed with status code 500"
```

---

## Database Verification

### Check if Tables Exist

In Supabase SQL Editor:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Should include:
- `objects`
- `object_tasks`
- `object_audit_logs`
- `object_task_dependencies`

### Check Object Count

```sql
SELECT COUNT(*) as object_count FROM objects;
```

### View Objects

```sql
SELECT id, name, object_type, status, created_at FROM objects LIMIT 10;
```

---

## Quick Recovery Procedure

If objects still won't load after checking everything:

### 1. Clear Cache
```bash
# Terminal in frontend directory
npm run dev

# Browser: Ctrl+Shift+Delete, clear "All time"
```

### 2. Rebuild Backend Database

```bash
cd backend

# Get fresh migration state
npm run migrate:status

# If any migrations are pending:
npm run migrate:up

# Verify tables exist (SQL editor)
```

### 3. Test API Again

```bash
# Get fresh token by logging in again
# Test with curl as shown above
```

### 4. Check Frontend Error Message

- The improved error handling now shows:
  - "Failed to load objects: {specific error message}"
  - This message will tell you exactly what's wrong

---

## Success Indicators

When objects are loading correctly:

1. ✅ Objects page loads without error
2. ✅ "Loading..." skeleton appears briefly
3. ✅ List of objects displays (even if empty initially)
4. ✅ Search and filter work
5. ✅ Clicking object card shows details
6. ✅ Create button opens form
7. ✅ No console errors

---

## Next Steps

1. **Apply migration** (if not done): `npm run migrate:up`
2. **Check backend logs** while reloading Objects page
3. **Test API with curl** using your token
4. **Check browser console** for error details
5. **Read error message** - it now tells you exactly what's wrong

The improved error handling should make it much easier to identify and fix the issue! 🚀
