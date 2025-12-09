/*
  # Create trigger for automatic consumption and rain calculation

  1. Functions
    - `calculate_water_consumption()`: Compares previous volume with current volume
      - If volume decreased: consumption = previous - current
      - If volume increased: rain recovered = current - previous
  
  2. Triggers
    - Trigger fires before insert on water_levels table
    - Automatically calculates consumption and rain recovery
    - Updates the new columns with calculated values

  3. Logic
    - Gets the most recent previous record
    - Calculates the difference
    - Assigns to correct column based on direction
*/

CREATE OR REPLACE FUNCTION calculate_water_consumption()
RETURNS TRIGGER AS $$
DECLARE
  v_previous_volume numeric;
  v_difference numeric;
BEGIN
  SELECT volume_liters INTO v_previous_volume
  FROM water_levels
  WHERE numeric_id < NEW.numeric_id
  ORDER BY numeric_id DESC
  LIMIT 1;

  IF v_previous_volume IS NOT NULL THEN
    v_difference := v_previous_volume - NEW.volume_liters;
    
    IF v_difference > 0 THEN
      NEW.water_consumed_liters := v_difference;
      NEW.rain_recovered_liters := 0;
    ELSIF v_difference < 0 THEN
      NEW.water_consumed_liters := 0;
      NEW.rain_recovered_liters := ABS(v_difference);
    ELSE
      NEW.water_consumed_liters := 0;
      NEW.rain_recovered_liters := 0;
    END IF;
  ELSE
    NEW.water_consumed_liters := 0;
    NEW.rain_recovered_liters := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS water_consumption_trigger ON water_levels;

CREATE TRIGGER water_consumption_trigger
BEFORE INSERT ON water_levels
FOR EACH ROW
EXECUTE FUNCTION calculate_water_consumption();
