/*
  # Add water consumption and rain recovery tracking

  1. New Columns in water_levels table
    - `water_consumed_liters` (numeric): Amount of water consumed since last reading
    - `rain_recovered_liters` (numeric): Amount of rainwater recovered (when volume increased)
  
  2. Changes
    - Add two new columns to track consumption and rainwater recovery
    - Default values are 0 for new entries
    - These will be calculated automatically by a trigger

  3. Security
    - Existing RLS policies remain in effect
*/

ALTER TABLE IF EXISTS water_levels
ADD COLUMN IF NOT EXISTS water_consumed_liters numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rain_recovered_liters numeric DEFAULT 0;
