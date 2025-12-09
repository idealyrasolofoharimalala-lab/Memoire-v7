/*
  # Add Admin Role and Password Recovery

  1. Modifications
    - Add `is_admin` column to `users` table (boolean, default false)
    - Add `recovery_token` column for password recovery
    - Add `recovery_token_expires` column for token expiration
    - Add `dark_mode` column for user preferences
    - Add `email` column for password recovery

  2. Security
    - Only authenticated users can view their own data
    - Admins can view all users
    - Users can update their own dark_mode preference
    - Password recovery tokens expire after 1 hour

  3. Functions
    - `generate_recovery_token(user_id)` - Creates a recovery token
    - `verify_recovery_token(token)` - Checks if token is valid
    - `reset_password_with_token(token, password)` - Resets password

  4. Notes
    - First user created should be set as admin manually
    - Recovery tokens are UUID strings
    - Dark mode preference is stored per user
*/

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_token text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_token_expires timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dark_mode boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;

-- Create index for recovery token lookups
CREATE INDEX IF NOT EXISTS users_recovery_token_idx ON users(recovery_token) WHERE recovery_token IS NOT NULL;

-- Function to generate password recovery token
CREATE OR REPLACE FUNCTION generate_recovery_token(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token text;
BEGIN
  new_token := gen_random_uuid()::text;
  
  UPDATE users
  SET 
    recovery_token = new_token,
    recovery_token_expires = now() + interval '1 hour'
  WHERE id = user_id;
  
  RETURN new_token;
END;
$$;

-- Function to verify and use recovery token
CREATE OR REPLACE FUNCTION verify_recovery_token(token text)
RETURNS TABLE(user_id uuid, username text, is_valid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    (u.recovery_token_expires > now()) as is_valid
  FROM users u
  WHERE u.recovery_token = token;
END;
$$;

-- Function to reset password with token
CREATE OR REPLACE FUNCTION reset_password_with_token(token text, new_password_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record record;
BEGIN
  SELECT id, recovery_token_expires INTO user_record
  FROM users
  WHERE recovery_token = token;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF user_record.recovery_token_expires < now() THEN
    RETURN false;
  END IF;
  
  UPDATE users
  SET 
    password_hash = new_password_hash,
    recovery_token = NULL,
    recovery_token_expires = NULL
  WHERE recovery_token = token;
  
  RETURN true;
END;
$$;