import { useState, useEffect } from 'react';
import { Users, Plus, Key, Trash2, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  username: string;
  is_admin: boolean;
  created_at: string;
}

export function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, is_admin, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showMessage('error', 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUsername || !newPassword) {
      showMessage('error', 'Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('error', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 4) {
      showMessage('error', 'Le mot de passe doit contenir au moins 4 caractères');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('create_user', {
        p_username: newUsername,
        p_password: newPassword
      });

      if (error) throw error;

      showMessage('success', 'Utilisateur créé avec succès');
      setNewUsername('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCreateModal(false);
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.message.includes('duplicate')) {
        showMessage('error', 'Ce nom d\'utilisateur existe déjà');
      } else {
        showMessage('error', 'Erreur lors de la création de l\'utilisateur');
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !newPassword) {
      showMessage('error', 'Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('error', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 4) {
      showMessage('error', 'Le mot de passe doit contenir au moins 4 caractères');
      return;
    }

    try {
      const { error } = await supabase.rpc('change_password', {
        p_user_id: selectedUser.id,
        p_new_password: newPassword
      });

      if (error) throw error;

      showMessage('success', 'Mot de passe modifié avec succès');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error changing password:', error);
      showMessage('error', 'Erreur lors du changement de mot de passe');
    }
  };

  const handleToggleAdmin = async (user: User) => {
    if (user.username === 'admin') {
      showMessage('error', 'Impossible de modifier les droits du compte admin principal');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !user.is_admin })
        .eq('id', user.id);

      if (error) throw error;

      showMessage('success', `Droits ${!user.is_admin ? 'administrateur accordés' : 'administrateur retirés'}`);
      loadUsers();
    } catch (error) {
      console.error('Error toggling admin:', error);
      showMessage('error', 'Erreur lors de la modification des droits');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.username === 'admin') {
      showMessage('error', 'Impossible de supprimer le compte admin');
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.username}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase.rpc('delete_user', {
        p_user_id: user.id
      });

      if (error) throw error;

      showMessage('success', 'Utilisateur supprimé avec succès');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showMessage('error', 'Erreur lors de la suppression de l\'utilisateur');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des utilisateurs</h2>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <Plus className="w-5 h-5" />
            Nouvel utilisateur
          </button>
        </div>

        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 dark:text-white">{user.username}</p>
                  {user.is_admin && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Créé le {new Date(user.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {user.username !== 'admin' && (
                  <button
                    onClick={() => handleToggleAdmin(user)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium ${
                      user.is_admin
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    {user.is_admin ? 'Retirer admin' : 'Rendre admin'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowPasswordModal(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition text-sm font-medium"
                >
                  <Key className="w-4 h-4" />
                  Mot de passe
                </button>
                {user.username !== 'admin' && (
                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Créer un utilisateur</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Entrez le nom d'utilisateur"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Entrez le mot de passe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirmez le mot de passe"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewUsername('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Changer le mot de passe - {selectedUser.username}
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Entrez le nouveau mot de passe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirmez le nouveau mot de passe"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUser(null);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
                >
                  Modifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
