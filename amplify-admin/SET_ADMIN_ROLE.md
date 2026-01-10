# Fix 403 Admin Access Error

The "Admin access required" error occurs because your user account doesn't have the `admin` role in the Supabase profiles table.

## Solution: Set Your User as Admin

### Method 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to the **SQL Editor** (left sidebar)
4. Run this SQL command to set your user as admin:

```sql
-- Replace YOUR_USER_ID with your actual Supabase user ID
-- You can find your user ID in the Authentication section

UPDATE profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_ID';
```

**To find your User ID:**
- Go to **Authentication** → **Users** in Supabase Dashboard
- Click on your user
- Copy the **UID** (this is your user ID)

### Method 2: Using Supabase Table Editor

1. Go to your Supabase Dashboard
2. Navigate to **Table Editor**
3. Select the `profiles` table
4. Find the row with your user ID
5. Edit the `role` column and change it to `admin`
6. Save the changes

### Method 3: Set All Users as Admin (Development Only)

⚠️ **Warning**: Only use this for development/testing

```sql
-- Make ALL users admins (use with caution!)
UPDATE profiles
SET role = 'admin';
```

## Verify Admin Access

After updating your role:

1. **Sign out** from the admin panel
2. **Clear your browser cache** or open an incognito window
3. **Sign in again**
4. You should now have admin access

## Create Admin User Automatically (Optional)

You can create a trigger to automatically set the first user as admin:

```sql
-- Function to set first user as admin
CREATE OR REPLACE FUNCTION set_first_user_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user
  IF (SELECT COUNT(*) FROM profiles) = 0 THEN
    NEW.role = 'admin';
  ELSE
    NEW.role = 'user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run before inserting into profiles
CREATE TRIGGER before_insert_profile
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_first_user_as_admin();
```

## Troubleshooting

### Still getting 403 error?

1. **Check your token**: Make sure you're logged in with the correct account
2. **Verify the profiles table**: Ensure the `role` column exists and is set to `'admin'`
3. **Check backend logs**: Look at the Go backend console for detailed error messages
4. **Restart the backend**: Sometimes you need to restart the Go server after making database changes

### Check if admin middleware is working

Add this to your backend logs to see what's happening:

```bash
# In your terminal where the backend is running, you should see:
SupabaseAdminAuth: Admin access granted for user: <your-user-id>
```

If you see:
```bash
SupabaseAdminAuth: User <id> lacks admin role (role: user)
```

Then the role update didn't work - try the SQL command again.

## Quick SQL to Check Your Current Role

```sql
-- Check your current role
SELECT id, email, role, full_name
FROM profiles
WHERE id = 'YOUR_USER_ID';
```

Replace `YOUR_USER_ID` with your actual Supabase user ID.
