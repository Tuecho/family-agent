import { useState, useEffect } from 'react';
import { Users, Shield, Trash2, Lock, Unlock, Key, Check, X, Loader2, AlertTriangle } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface User {
  id: number;
  username: string;
  is_admin: number;
  status: string;
  created_at: string;
}

export function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/auth/admin/users`, { headers });
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const handleBlock = async (user: User) => {
    const blocked = user.status !== 'blocked';
    const action = blocked ? 'bloquear' : 'desbloquear';
    if (!window.confirm(`¿${action === 'bloquear' ? 'Bloquear' : 'Desbloquear'} a ${user.username}?`)) return;

    setActionLoading(user.id);
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/auth/admin/user/${user.id}/block`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ blocked })
      });
      fetchUsers();
    } catch (error) {
      console.error('Error blocking user:', error);
    }
    setActionLoading(null);
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`¿Eliminar definitivamente a ${user.username}?\n\nEsta acción eliminará todos sus datos y no se puede deshacer.`)) return;
    if (!window.confirm(`¿Estás seguro? Esta acción es IRREVERSIBLE.`)) return;

    setActionLoading(user.id);
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/auth/admin/user/${user.id}`, {
        method: 'DELETE',
        headers
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
    setActionLoading(null);
  };

  const handleRoleChange = async (user: User) => {
    if (user.is_admin && users.filter(u => u.is_admin).length <= 1) {
      alert('No puedes quitar el último administrador');
      return;
    }
    const newRole = user.is_admin ? 'quitarle el rol de admin' : 'hacerle admin';
    if (!window.confirm(`¿${newRole.charAt(0).toUpperCase() + newRole.slice(1)} a ${user.username}?`)) return;

    setActionLoading(user.id);
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const response = await fetch(`${API_URL}/api/auth/admin/user/${user.id}/role`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ is_admin: !user.is_admin })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Error al cambiar rol');
      }
      fetchUsers();
    } catch (error) {
      console.error('Error changing role:', error);
    }
    setActionLoading(null);
  };

  const handleChangePassword = async () => {
    if (!showPasswordModal || !newPassword.trim()) {
      setPasswordError('Ingresa una contraseña');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const response = await fetch(`${API_URL}/api/auth/admin/user/${showPasswordModal.id}/password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ new_password: newPassword })
      });
      const data = await response.json();
      if (data.success) {
        setShowPasswordModal(null);
        setNewPassword('');
        setPasswordError('');
      } else {
        setPasswordError(data.error || 'Error');
      }
    } catch (error) {
      setPasswordError('Error de conexión');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Activo</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Pendiente</span>;
      case 'blocked':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Bloqueado</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Rechazado</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="text-primary" size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Administración de Usuarios</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-gray-600">
            <Users size={18} />
            <span className="font-medium">{users.length} usuarios registrados</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registrado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium text-sm">
                          {user.username[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-800">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_admin ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 flex items-center gap-1 w-fit">
                        <Shield size={12} />
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Usuario</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('es')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleBlock(user)}
                        disabled={actionLoading === user.id || user.is_admin}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                          user.status === 'blocked'
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-orange-600 hover:bg-orange-50'
                        }`}
                        title={user.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                      >
                        {actionLoading === user.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : user.status === 'blocked' ? (
                          <Unlock size={16} />
                        ) : (
                          <Lock size={16} />
                        )}
                      </button>

                      <button
                        onClick={() => handleRoleChange(user)}
                        disabled={actionLoading === user.id || (user.is_admin && users.filter(u => u.is_admin).length <= 1)}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                          user.is_admin
                            ? 'text-purple-600 hover:bg-purple-50'
                            : 'text-gray-400 hover:bg-purple-50 hover:text-purple-600'
                        }`}
                        title={user.is_admin ? 'Quitar admin' : 'Hacer admin'}
                      >
                        {actionLoading === user.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Shield size={16} />
                        )}
                      </button>

                      <button
                        onClick={() => setShowPasswordModal(user)}
                        disabled={actionLoading === user.id}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Cambiar contraseña"
                      >
                        <Key size={16} />
                      </button>

                      {!user.is_admin && (
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={actionLoading === user.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar usuario"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No hay usuarios registrados
          </div>
        )}
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Key className="text-blue-500" size={20} />
                Cambiar contraseña
              </h3>
              <button onClick={() => { setShowPasswordModal(null); setNewPassword(''); setPasswordError(''); }}>
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Nueva contraseña para <strong>{showPasswordModal.username}</strong>
            </p>

            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
              placeholder="Nueva contraseña (mín. 4 caracteres)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
              autoFocus
            />

            {passwordError && (
              <p className="text-red-500 text-sm mb-4 flex items-center gap-1">
                <AlertTriangle size={14} />
                {passwordError}
              </p>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 flex items-start gap-2">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                El usuario deberá usar esta nueva contraseña para iniciar sesión.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowPasswordModal(null); setNewPassword(''); setPasswordError(''); }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
