import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PasswordRecovery } from './PasswordRecovery';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoSrc, setLogoSrc] = useState('/images/logo.svg');
  const { signIn, signUp } = useAuth();

  useEffect(() => {
    const savedLogo = localStorage.getItem('customLogo');
    if (savedLogo) {
      setLogoSrc(savedLogo);
    }
  }, []);

  if (showRecovery) {
    return <PasswordRecovery onBack={() => setShowRecovery(false)} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = isSignUp
        ? await signUp(username, password)
        : await signIn(username, password);

      if (error) {
        setError(error);
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <img
            src={logoSrc}
            alt="Logo"
            className="h-24 w-24 object-contain"
            onError={() => setLogoSrc('/images/logo.svg')}
          />
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Dashboard Cuve
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Education For Madagascar
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Nom d'utilisateur
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="admin"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Chargement...' : isSignUp ? 'Créer un compte' : 'Se connecter'}
          </button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-blue-600 text-sm hover:underline"
          >
            {isSignUp ? 'Déjà un compte ? Se connecter' : 'Créer un nouveau compte'}
          </button>

          {!isSignUp && (
            <button
              type="button"
              onClick={() => setShowRecovery(true)}
              className="w-full text-gray-600 text-sm hover:underline"
            >
              Mot de passe oublié ?
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
