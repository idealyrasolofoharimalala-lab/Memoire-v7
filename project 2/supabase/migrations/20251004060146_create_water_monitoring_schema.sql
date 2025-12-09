/*
  # Dashboard de Suivi de Cuve - Schema Initial

  1. Nouvelles Tables
    - `water_levels` (Niveaux d'eau)
      - `id` (uuid, clé primaire)
      - `timestamp` (timestamptz) - Horodatage de la mesure
      - `volume_m3` (numeric) - Volume en mètres cubes
      - `volume_liters` (numeric) - Volume en litres
      - `created_at` (timestamptz) - Date de création de l'enregistrement
    
    - `atmospheric_conditions` (Conditions atmosphériques)
      - `id` (uuid, clé primaire)
      - `timestamp` (timestamptz) - Horodatage de la mesure
      - `temperature` (numeric) - Température en degrés Celsius
      - `humidity` (numeric) - Humidité en pourcentage
      - `created_at` (timestamptz) - Date de création de l'enregistrement

  2. Sécurité
    - Activation de RLS sur toutes les tables
    - Policies pour utilisateurs authentifiés:
      - Lecture de toutes les données (SELECT)
      - Insertion de nouvelles données (INSERT) - pour l'Arduino via service role
    - Policy publique pour insertion (simulant l'Arduino)

  3. Index
    - Index sur les timestamps pour optimiser les requêtes de filtrage par date
    - Index sur created_at pour les tris chronologiques

  4. Notes Importantes
    - Les données Arduino seront insérées via la clé anon (avec policy publique) ou service role
    - Les utilisateurs authentifiés peuvent voir toutes les données
    - Les timestamps permettent le filtrage par période pour les statistiques
*/

-- Table pour les niveaux d'eau
CREATE TABLE IF NOT EXISTS water_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  volume_m3 numeric(10,3) NOT NULL,
  volume_liters numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table pour les conditions atmosphériques
CREATE TABLE IF NOT EXISTS atmospheric_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  temperature numeric(5,2) NOT NULL,
  humidity numeric(5,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances des requêtes par date
CREATE INDEX IF NOT EXISTS water_levels_timestamp_idx ON water_levels(timestamp DESC);
CREATE INDEX IF NOT EXISTS atmospheric_conditions_timestamp_idx ON atmospheric_conditions(timestamp DESC);

-- Activer RLS sur les tables
ALTER TABLE water_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE atmospheric_conditions ENABLE ROW LEVEL SECURITY;

-- Policies pour water_levels
CREATE POLICY "Authenticated users can read water levels"
  ON water_levels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow public insert for Arduino data"
  ON water_levels FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert water levels"
  ON water_levels FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies pour atmospheric_conditions
CREATE POLICY "Authenticated users can read atmospheric conditions"
  ON atmospheric_conditions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow public insert for Arduino data atmospheric"
  ON atmospheric_conditions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert atmospheric conditions"
  ON atmospheric_conditions FOR INSERT
  TO authenticated
  WITH CHECK (true);