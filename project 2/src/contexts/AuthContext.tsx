import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface CustomUser {
  id: string;
  username: string;
  is_admin: boolean;
  dark_mode: boolean;
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signUp: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  toggleDarkMode: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase
        .rpc('verify_user', {
          p_username: username,
          p_password: password
        })
        .maybeSingle();

      if (error || !data) {
        return { error: 'Nom d\'utilisateur ou mot de passe incorrect' };
      }

      const { data: userDetails } = await supabase
        .from('users')
        .select('id, username, is_admin, dark_mode')
        .eq('id', data.user_id)
        .single();

      const userData = {
        id: data.user_id,
        username: data.username,
        is_admin: userDetails?.is_admin || false,
        dark_mode: userDetails?.dark_mode || false
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { error: null };
    } catch (err) {
      return { error: 'Une erreur est survenue' };
    }
  };

  const signUp = async (username: string, password: string) => {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        return { error: 'Ce nom d\'utilisateur existe déjà' };
      }

      const { data, error } = await supabase
        .rpc('create_user', {
          p_username: username,
          p_password: password
        })
        .single();

      if (error || !data) {
        return { error: 'Erreur lors de la création du compte' };
      }

      const userData = {
        id: data,
        username: username,
        is_admin: false,
        dark_mode: false
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { error: null };
    } catch (err) {
      return { error: 'Une erreur est survenue' };
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const toggleDarkMode = async () => {
    if (!user) return;

    const newDarkMode = !user.dark_mode;

    await supabase
      .from('users')
      .update({ dark_mode: newDarkMode })
      .eq('id', user.id);

    const updatedUser = { ...user, dark_mode: newDarkMode };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, toggleDarkMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
