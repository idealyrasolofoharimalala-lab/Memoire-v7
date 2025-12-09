/*
  # Fix Security Issues

  1. Remove unused indexes on users table (username_idx, recovery_token_idx)
  2. Remove duplicate unique constraints (numeric_id_key variants - keeping pkey as primary)
  3. Add RLS policies for daily_consumption table
  4. Fix function search_path to be immutable (security enhancement)

  ## Changes:
  - Drop unused users indexes
  - Drop duplicate numeric_id_key constraints (keep primary key constraints)
  - Create RLS policies for daily_consumption table (authenticated users can read)
  - Set search_path to empty for all custom functions
*/

-- Drop unused indexes
DROP INDEX IF EXISTS public.users_username_idx;
DROP INDEX IF EXISTS public.users_recovery_token_idx;

-- Drop duplicate numeric_id_key constraints (keep the pkey constraints)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_numeric_id_key;
ALTER TABLE public.atmospheric_conditions DROP CONSTRAINT IF EXISTS atmospheric_conditions_numeric_id_key;
ALTER TABLE public.water_levels DROP CONSTRAINT IF EXISTS water_levels_numeric_id_key;

-- Add RLS policies for daily_consumption table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_consumption'
    AND policyname = 'Authenticated users can read daily consumption'
  ) THEN
    CREATE POLICY "Authenticated users can read daily consumption"
      ON public.daily_consumption
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_consumption'
    AND policyname = 'System can manage daily consumption'
  ) THEN
    CREATE POLICY "System can manage daily consumption"
      ON public.daily_consumption
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Fix search_path for custom functions to be immutable
ALTER FUNCTION public.change_password(uuid, text) SET search_path = '';
ALTER FUNCTION public.delete_user(uuid) SET search_path = '';
ALTER FUNCTION public.calculate_water_consumption() SET search_path = '';
ALTER FUNCTION public.generate_recovery_token(uuid) SET search_path = '';
ALTER FUNCTION public.verify_recovery_token(text) SET search_path = '';
ALTER FUNCTION public.reset_password_with_token(text, text) SET search_path = '';
ALTER FUNCTION public.create_user(text, text) SET search_path = '';
ALTER FUNCTION public.verify_user(text, text) SET search_path = '';
