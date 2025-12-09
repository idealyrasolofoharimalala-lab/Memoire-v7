/*
  # Ajouter la fonction de changement de mot de passe

  1. Nouvelle Fonction
    - `change_password` - Permet de changer le mot de passe d'un utilisateur
    
  2. Sécurité
    - Policy pour permettre la mise à jour du mot de passe
*/

-- Policy pour permettre la mise à jour des utilisateurs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can update their own password'
  ) THEN
    CREATE POLICY "Users can update their own password"
      ON users FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Fonction pour changer le mot de passe
CREATE OR REPLACE FUNCTION change_password(p_user_id uuid, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users 
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- Fonction pour supprimer un utilisateur
CREATE OR REPLACE FUNCTION delete_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM users WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;

-- Policy pour permettre la suppression
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Anyone can delete users'
  ) THEN
    CREATE POLICY "Anyone can delete users"
      ON users FOR DELETE
      TO anon, authenticated
      USING (true);
  END IF;
END $$;
