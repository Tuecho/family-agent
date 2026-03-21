import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, User, UserPlus, X, Check, Clock, Shield } from 'lucide-react';

const STORAGE_KEY = 'family_agent_auth';
const API_URL = import.meta.env.VITE_API_URL || '';

interface AuthUser {
  id: number;
  username: string;
  is_admin: number;
  status: string;
  created_at: string;
}

export function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const resp = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || 'Credenciales incorrectas');
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
        authenticated: true, 
        username: username.trim(),
        password: password,
        isAdmin: data.isAdmin,
        userId: data.userId 
      }));
      onLogin();
    } catch {
      setError('Error de conexión con la API');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (username.trim().length < 3) {
      setError('El usuario debe tener al menos 3 caracteres');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || 'No se pudo crear el usuario');
        return;
      }
      setSuccess('Usuario creado. Espera aprobación del administrador.');
      setTimeout(() => {
        setShowRegister(false);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch {
      setError('Error de conexión con la API');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-primary" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Family Agent</h1>
          <p className="text-gray-500 mt-2">
            {showRegister ? 'Crea tu usuario' : 'Introduce tus credenciales'}
          </p>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-2">
            <Check size={18} />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {showRegister ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="usuario"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={18} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Crear usuario
            </button>

            <button
              type="button"
              onClick={() => {
                setShowRegister(false);
                setError('');
                setSuccess('');
              }}
              className="w-full text-gray-500 py-2 hover:text-gray-700 transition-colors text-sm"
            >
              Volver al login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="usuario"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={18} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Entrar
            </button>

            <button
              type="button"
              onClick={() => {
                setShowRegister(true);
                setError('');
                setSuccess('');
                setUsername('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="w-full border border-primary text-primary py-3 rounded-lg hover:bg-primary/10 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <UserPlus size={18} />
              Crear nuevo usuario
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function AdminUsers() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const { username, password } = JSON.parse(stored);

    try {
      const resp = await fetch(`${API_URL}/api/auth/admin/users`, {
        headers: { username, password }
      });
      if (!resp.ok) {
        setError('No tienes permisos de administrador');
        return;
      }
      const data = await resp.json();
      setUsers(data);
    } catch {
      setError('Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (id: number) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const { username, password } = JSON.parse(stored);

    try {
      await fetch(`${API_URL}/api/auth/admin/approve/${id}`, {
        method: 'POST',
        headers: { username, password }
      });
      fetchUsers();
    } catch {
      setError('Error aprobando usuario');
    }
  };

  const handleReject = async (id: number) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const { username, password } = JSON.parse(stored);

    try {
      await fetch(`${API_URL}/api/auth/admin/reject/${id}`, {
        method: 'POST',
        headers: { username, password }
      });
      fetchUsers();
    } catch {
      setError('Error rechazando usuario');
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Cargando...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Shield className="text-primary" />
        Gestión de Usuarios
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Usuario</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Fecha</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    {user.username}
                    {user.is_admin === 1 && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">Admin</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {user.status === 'approved' && (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <Check size={14} /> Aprobado
                    </span>
                  )}
                  {user.status === 'pending' && (
                    <span className="flex items-center gap-1 text-yellow-600 text-sm">
                      <Clock size={14} /> Pendiente
                    </span>
                  )}
                  {user.status === 'rejected' && (
                    <span className="flex items-center gap-1 text-red-600 text-sm">
                      <X size={14} /> Rechazado
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('es-ES')}
                </td>
                <td className="px-4 py-3 text-right">
                  {user.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        title="Aprobar"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleReject(user.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Rechazar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No hay usuarios registrados
          </div>
        )}
      </div>
    </div>
  );
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return !!parsed.authenticated;
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return !!parsed.isAdmin;
  });

  const login = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setIsAdmin(!!parsed.isAdmin);
    }
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ authenticated: false, isAdmin: false }));
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  const getAuth = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { username: parsed.username, password: parsed.password };
    }
    return null;
  };

  return { isAuthenticated, isAdmin, login, logout, getAuth };
}
