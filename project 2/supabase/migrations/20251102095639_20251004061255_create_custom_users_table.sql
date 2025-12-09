/*
  # Système d'authentification par username

  1. Nouvelle Table
    - `users` (Utilisateurs)
      - `id` (uuid, clé primaire)
      - `username` (text, unique) - Nom d'utilisateur
      - `password_hash` (text) - Hash du mot de passe
      - `created_at` (timestamptz) - Date de création

  2. Sécurité
    - Activation de RLS sur la table users
    - Policy pour permettre l'insertion publique (création de compte)
    - Policy pour permettre la lecture publique (connexion)
    - Extension pgcrypto pour le hashing des mots de passe

  3. Fonction d'authentification
    - Fonction pour vérifier username/password

  4. Données initiales
    - Création du compte admin avec mot de passe "admin"
*/

-- Activer l'extension pour le hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table pour les utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index pour optimiser les recherches par username
CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);

-- Activer RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre la lecture publique (nécessaire pour la connexion)
CREATE POLICY "Anyone can read users for authentication"
  ON users FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy pour permettre l'insertion publique (création de compte)
CREATE POLICY "Anyone can create user account"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Fonction pour créer un utilisateur avec mot de passe hashé
CREATE OR REPLACE FUNCTION create_user(p_username text, p_password text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  INSERT INTO users (username, password_hash)
  VALUES (p_username, crypt(p_password, gen_salt('bf')))
  RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$;

-- Fonction pour vérifier les credentials
CREATE OR REPLACE FUNCTION verify_user(p_username text, p_password text)
RETURNS TABLE(user_id uuid, username text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username
  FROM users u
  WHERE u.username = p_username
    AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$;

-- Créer le compte admin par défaut
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin') THEN
    PERFORM create_user('admin', 'admin');
  END IF;
END $$;
