import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { KeyRound, ArrowLeft } from 'lucide-react';

interface PasswordRecoveryProps {
  onBack: () => void;
}

export function PasswordRecovery({ onBack }: PasswordRecoveryProps) {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { data: user } = await supabase
        .from('users')
        .select('id, email')
        .eq('username', username)
        .maybeSingle();

      if (!user) {
        setError('Nom d\'utilisateur non trouvé');
        setLoading(false);
        return;
      }

      if (!user.email) {
        setError('Aucun email associé à ce compte. Contactez un administrateur.');
        setLoading(false);
        return;
      }

      const { data: generatedToken } = await supabase
        .rpc('generate_recovery_token', { user_id: user.id })
        .single();

      if (generatedToken) {
        setToken(generatedToken);
        setStep('reset');
        setMessage(`Token de récupération généré. Copiez-le et conservez-le en sécurité: ${generatedToken}`);
      }
    } catch (err) {
      setError('Erreur lors de la génération du token');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const { data: verified } = await supabase
        .rpc('verify_recovery_token', { token })
        .maybeSingle();

      if (!verified || !verified.is_valid) {
        setError('Token invalide ou expiré');
        setLoading(false);
        return;
      }

      const { data: hashData } = await supabase
        .rpc('hash_password', { password: newPassword })
        .single();

      if (!hashData) {
        setError('Erreur lors du hashage du mot de passe');
        setLoading(false);
        return;
      }

      const { data: resetSuccess } = await supabase
        .rpc('reset_password_with_token', {
          token,
          new_password_hash: hashData
        })
        .single();

      if (resetSuccess) {
        setMessage('Mot de passe réinitialisé avec succès !');
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setError('Échec de la réinitialisation du mot de passe');
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
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Récupération de mot de passe
        </h1>
        <p className="text-center text-gray-600 mb-8 text-sm">
          {step === 'request'
            ? 'Entrez votre nom d\'utilisateur pour générer un token'
            : 'Entrez votre token et votre nouveau mot de passe'}
        </p>

        {step === 'request' ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
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
                placeholder="Votre nom d'utilisateur"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm break-all">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Génération...' : 'Générer le token'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                Token de récupération
              </label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono text-sm"
                placeholder="Collez votre token ici"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </button>

            <button
              type="button"
              onClick={() => setStep('request')}
              className="w-full text-blue-600 text-sm hover:underline"
            >
              Générer un nouveau token
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
