-- Add referral support
ALTER TABLE users ADD COLUMN referral_code TEXT;
ALTER TABLE users ADD COLUMN referred_by TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
-- Populate existing users with random codes
UPDATE users SET referral_code = lower(hex(randomblob(4))) WHERE referral_code IS NULL;
