/*
  # Création du schéma de monitoring d'eau - IDs numériques

  ## Nouvelles Tables

  ### 1. water_levels
    - `id` (integer, clé primaire auto-incrémentée)
    - `timestamp` (timestamptz, horodatage avec fuseau horaire Madagascar)
    - `volume_m3` (decimal, volume en mètres cubes)
    - `volume_liters` (decimal, volume en litres)

  ### 2. atmospheric_conditions
    - `id` (integer, clé primaire auto-incrémentée)
    - `timestamp` (timestamptz, horodatage avec fuseau horaire Madagascar)
    - `temperature` (decimal, température en Celsius)
    - `humidity` (decimal, humidité en pourcentage)

  ### 3. Sécurité
    - Activation de RLS sur toutes les tables
    - Politiques permettant la lecture et l'insertion publiques (cas d'usage éducatif)

  ### 4. Index
    - Index sur timestamp pour optimiser les requêtes de tri
*/

-- Créer la table water_levels avec ID numérique
CREATE TABLE IF NOT EXISTS water_levels (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Indian/Antananarivo'),
  volume_m3 DECIMAL(10, 3) NOT NULL,
  volume_liters DECIMAL(10, 2) NOT NULL
);

-- Créer la table atmospheric_conditions avec ID numérique
CREATE TABLE IF NOT EXISTS atmospheric_conditions (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Indian/Antananarivo'),
  temperature DECIMAL(5, 2) NOT NULL,
  humidity DECIMAL(5, 2) NOT NULL
);

-- Créer des index pour les timestamps
CREATE INDEX IF NOT EXISTS idx_water_levels_timestamp ON water_levels(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_atmospheric_conditions_timestamp ON atmospheric_conditions(timestamp DESC);

-- Activer RLS
ALTER TABLE water_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE atmospheric_conditions ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Permettre lecture publique water_levels" ON water_levels;
DROP POLICY IF EXISTS "Permettre insertion publique water_levels" ON water_levels;
DROP POLICY IF EXISTS "Permettre lecture publique atmospheric_conditions" ON atmospheric_conditions;
DROP POLICY IF EXISTS "Permettre insertion publique atmospheric_conditions" ON atmospheric_conditions;

-- Créer les politiques RLS (lecture publique pour ce cas d'usage éducatif)
CREATE POLICY "Permettre lecture publique water_levels"
  ON water_levels
  FOR SELECT
  USING (true);

CREATE POLICY "Permettre insertion publique water_levels"
  ON water_levels
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permettre lecture publique atmospheric_conditions"
  ON atmospheric_conditions
  FOR SELECT
  USING (true);

CREATE POLICY "Permettre insertion publique atmospheric_conditions"
  ON atmospheric_conditions
  FOR INSERT
  WITH CHECK (true);
