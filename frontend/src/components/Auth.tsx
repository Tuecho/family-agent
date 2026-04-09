import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { Lock, Eye, EyeOff, User, UserPlus, X, Check, Clock, Shield, AlertCircle, Home } from 'lucide-react';

const STORAGE_KEY = 'family_agent_auth';
const API_URL = import.meta.env.VITE_API_URL || '';
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

interface AuthUser {
  id: number;
  username: string;
  is_admin: number;
  status: string;
  created_at: string;
}

const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Al menos 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Una mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Una minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Un número');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Un carácter especial (!@#$%^&*)');
  }
  
  return { valid: errors.length === 0, errors };
};

export function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [loginImage, setLoginImage] = useState('');
  const [showLock, setShowLock] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code'>('email');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/settings/login-image`)
      .then(res => res.json())
      .then(data => {
        setLoginImage(data.image || '');
        setShowLock(data.showLock !== false);
      })
      .catch(() => {});
  }, []);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setResetLoading(true);

    try {
      const resp = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      });
      const data = await resp.json();
      
      if (data.success) {
        if (data.debug && data.code) {
          setResetSuccess(`Código de prueba: ${data.code} (no se envió email, el usuario no tiene email configurado)`);
        } else {
          setResetSuccess('Si el usuario existe, recibirás un código de recuperación');
        }
        setResetStep('code');
      }
    } catch {
      setResetError('Error de conexión');
    }
    setResetLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    
    if (newPassword !== confirmNewPassword) {
      setResetError('Las contraseñas no coinciden');
      return;
    }

    const { valid, errors } = validatePassword(newPassword);
    if (!valid) {
      setResetError('La contraseña debe tener: ' + errors.join(', '));
      return;
    }

    setResetLoading(true);

    try {
      const resp = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          code: resetCode, 
          newPassword 
        })
      });
      const data = await resp.json();
      
      if (data.success) {
        setResetSuccess('¡Contraseña actualizada! Ya puedes iniciar sesión.');
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetStep('email');
          setResetCode('');
          setNewPassword('');
          setConfirmNewPassword('');
          setResetSuccess('');
          setPassword('');
        }, 2000);
      } else {
        setResetError(data.error || 'Error al restablecer contraseña');
      }
    } catch {
      setResetError('Error de conexión');
    }
    setResetLoading(false);
  };

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
      const lastActivity = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
        authenticated: true, 
        username: username.trim(),
        password: password,
        isAdmin: data.isAdmin,
        userId: data.userId,
        lastActivity 
      }));
      onLogin();
    } catch {
      setError('Error de conexión con la API');
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (showRegister) {
      const { errors } = validatePassword(value);
      setPasswordErrors(errors);
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

    const { valid, errors } = validatePassword(password);
    if (!valid) {
      setError('La contraseña debe tener: ' + errors.join(', '));
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
      setSuccess(data.message || 'Usuario creado correctamente.');
      setTimeout(() => {
        setShowRegister(false);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setPasswordErrors([]);
      }, 2000);
    } catch {
      setError('Error de conexión con la API');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 animate-mesh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-400/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-pink-400/30 rounded-full blur-3xl" />
      <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-purple-400/20 rounded-full blur-3xl" />

      <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-glass-lg w-full max-w-sm sm:max-w-md p-6 sm:p-8 border border-white/40 animate-scale-in">
        <div className="text-center mb-8">
          {loginImage ? (
            <img 
              src={loginImage} 
              alt="Login" 
              className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-soft-lg ring-4 ring-white/50"
            />
          ) : showLock ? (
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow animate-float">
              <Lock className="text-white" size={28} />
            </div>
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow animate-float">
              <Home className="text-white" size={28} />
            </div>
          )}
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-slate-800 via-indigo-700 to-purple-700 bg-clip-text text-transparent">Family Agent</h1>
          <p className="text-slate-500 mt-2 text-sm">
            {showRegister ? 'Crea tu cuenta familiar' : 'Bienvenido de vuelta'}
          </p>
        </div>

        {success && (
          <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm flex items-center gap-2 border border-emerald-200 animate-fade-in">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <Check size={12} className="text-white" />
            </div>
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 flex items-center gap-2 animate-fade-in">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            {error}
          </div>
        )}

        {showRegister ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="usuario"
                  className="input-modern pr-10"
                  required
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={16} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="••••••"
                  className="input-modern pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {showRegister && password && (
                <div className="mt-2.5 text-xs space-y-1">
                  {passwordErrors.map((err, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-red-500">
                      <X size={12} />
                      {err}
                    </div>
                  ))}
                  {passwordErrors.length === 0 && (
                    <div className="flex items-center gap-1.5 text-emerald-500">
                      <Check size={12} />
                      Contraseña segura
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Confirmar contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="input-modern"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-purple-500 text-white py-3 rounded-xl hover:shadow-glow transition-all duration-300 font-semibold hover:-translate-y-0.5 active:translate-y-0"
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
              className="w-full text-slate-500 py-2 hover:text-primary transition-colors text-sm font-medium"
            >
              Volver al login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="usuario"
                  className="input-modern pr-10"
                  required
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={16} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="input-modern pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-purple-500 text-white py-3 rounded-xl hover:shadow-glow transition-all duration-300 font-semibold hover:-translate-y-0.5 active:translate-y-0"
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
              className="w-full border-2 border-primary/20 text-primary py-3 rounded-xl hover:bg-primary/5 hover:border-primary/40 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
            >
              <UserPlus size={18} />
              Crear nuevo usuario
            </button>

            {!showForgotPassword && (
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setError('');
                  setSuccess('');
                  setResetStep('email');
                }}
                className="w-full text-slate-500 py-2 hover:text-primary transition-colors text-sm font-medium"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </form>
        )}

        {showForgotPassword && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Recuperar contraseña</h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetStep('email');
                  setResetCode('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setResetError('');
                  setResetSuccess('');
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {resetSuccess && (
              <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-200">
                {resetSuccess}
              </div>
            )}

            {resetError && (
              <div className="mb-4 p-3.5 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
                {resetError}
              </div>
            )}

            {resetStep === 'email' ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-slate-600">
                  Introduce tu nombre de usuario. Si existe y tiene email configurado, recibirás un código de recuperación.
                </p>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Usuario
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Tu usuario"
                    className="input-modern"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading || !username.trim()}
                  className="w-full bg-gradient-to-r from-primary to-purple-500 text-white py-3 rounded-xl hover:shadow-glow transition-all duration-300 font-semibold disabled:opacity-50 disabled:hover:shadow-none disabled:hover:translate-y-0 hover:-translate-y-0.5"
                >
                  {resetLoading ? 'Enviando...' : 'Enviar código'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-sm text-slate-600">
                  Introduce el código que recibiste y tu nueva contraseña.
                </p>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Código de recuperación
                  </label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                    placeholder="Código de 6 caracteres"
                    className="input-modern text-center text-lg tracking-widest font-mono"
                    maxLength={6}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-modern"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-modern"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading || !resetCode || !newPassword || !confirmNewPassword}
                  className="w-full bg-gradient-to-r from-primary to-purple-500 text-white py-3 rounded-xl hover:shadow-glow transition-all duration-300 font-semibold disabled:opacity-50 hover:-translate-y-0.5"
                >
                  {resetLoading ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetStep('email');
                    setResetCode('');
                    setResetError('');
                  }}
                  className="w-full text-slate-500 py-2 hover:text-primary transition-colors text-sm font-medium"
                >
                  No recibí el código, reenviar
                </button>
              </form>
            )}
          </div>
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

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
  getAuth: () => { username: string; password: string } | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getStoredAuth() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return { authenticated: false, isAdmin: false };
  const parsed = JSON.parse(stored);
  return parsed;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return getStoredAuth().authenticated;
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    return getStoredAuth().isAdmin;
  });

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('lastPage');
    setIsAuthenticated(false);
    setIsAdmin(false);
    window.dispatchEvent(new Event('storage'));
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const auth = getStoredAuth();
      setIsAuthenticated(auth.authenticated);
      setIsAdmin(auth.isAdmin);
    };
    
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setTimeout>;

    const checkInactivity = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const auth = JSON.parse(stored);
        const lastActivity = auth.lastActivity || 0;
        const now = Date.now();
        
        if (now - lastActivity >= INACTIVITY_TIMEOUT) {
          logout();
          return true;
        }
      }
      return false;
    };

    const resetTimer = () => {
      if (checkInactivity()) return;

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const auth = JSON.parse(stored);
        auth.lastActivity = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
      }
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Al volver a la app, comprobamos si el tiempo ha expirado en "tiempo real"
        if (!checkInactivity()) {
          resetTimer();
        }
      }
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Verificación periódica cada 30 segundos como respaldo
    intervalId = setInterval(checkInactivity, 30000);

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, logout]);

  const login = () => {
    const stored = getStoredAuth();
    setIsAdmin(!!stored.isAdmin);
    setIsAuthenticated(!!stored.authenticated);
  };

  const getAuth = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { username: parsed.username, password: parsed.password };
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, login, logout, getAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
