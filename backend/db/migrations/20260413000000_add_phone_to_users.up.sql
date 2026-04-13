-- Add phone field to users for employee identification (spec: phone is the unique identifier for employees)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_description VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone_lookup ON users (phone);
