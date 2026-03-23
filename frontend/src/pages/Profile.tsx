import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Users, Save, Loader2, Trash2, AlertTriangle, LogOut, Share2, UserPlus, Check, X, Download, Upload } from 'lucide-react';
import { NotificationSettings } from '../components/NotificationSettings';
import { ImportDB } from '../components/ImportDB';
import { useAuth } from '../components/Auth';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Profile {
  id: number;
  name: string;
  avatar: string | null;
  email: string | null;
  phone: string | null;
  family_name: string;
  currency: string;
}

interface Invitation {
  id: number;
  from_user_id: number;
  from_username: string;
  to_username: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface SharedUser {
  id: number;
  shared_with_id: number;
  shared_with_username: string;
  created_at: string;
}

export function Profile() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    id: 1,
    name: '',
    avatar: null,
    email: null,
    phone: null,
    family_name: 'Mi Familia',
    currency: 'EUR'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/profile`, { headers });
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
    setLoading(false);
  };

  const fetchInvitations = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/invitations`, { headers });
      const data = await response.json();
      setInvitations((data.received || []).filter((i: Invitation) => i.status === 'pending'));
      setSharedUsers(data.sharedWith || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;

    setInviting(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const response = await fetch(`${API_URL}/api/invitations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ to_username: inviteUsername.trim() })
      });
      const data = await response.json();

      if (response.ok) {
        setInviteSuccess(`Invitación enviada a ${inviteUsername}`);
        setInviteUsername('');
        fetchInvitations();
      } else {
        setInviteError(data.error || 'Error al enviar invitación');
      }
    } catch (error) {
      setInviteError('Error de conexión');
    }
    setInviting(false);
  };

  const handleInvitationAction = async (invitationId: number, action: 'accept' | 'reject') => {
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/invitations/${invitationId}/${action}`, {
        method: 'PUT',
        headers
      });
      fetchInvitations();
    } catch (error) {
      console.error('Error handling invitation:', error);
    }
  };

  const handleRemoveShare = async (sharedWithId: number) => {
    if (!window.confirm('¿Dejar de compartir datos con este usuario?')) return;
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/shares/${sharedWithId}`, { method: 'DELETE', headers });
      fetchInvitations();
    } catch (error) {
      console.error('Error removing share:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/export`, { headers });
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `family-agent-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error al exportar los datos');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!confirm('¿Estás seguro de importar estos datos? Se añadirán a los datos existentes.')) {
        return;
      }

      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const response = await fetch(`${API_URL}/api/import`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      if (response.ok) {
        alert('¡Datos importados correctamente!');
        window.location.reload();
      } else {
        alert('Error al importar los datos');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error al leer el archivo');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    console.log('Submitting profile with avatar length:', profile.avatar ? profile.avatar.length : 'null');

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(profile)
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response avatar length:', data.avatar ? data.avatar.length : 'null');
      
      if (response.ok) {
        setProfile(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        console.error('Error saving profile:', data.error);
        alert(data.error || 'Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error de conexión');
    }
    
    setSaving(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Avatar file selected:', file.name, 'size:', file.size);
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('Avatar read complete, length:', (reader.result as string).length);
        setProfile(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetData = async () => {
    const confirm = window.confirm('¿Estás seguro? Se eliminarán todas las transacciones, presupuestos, eventos y conceptos.\n\nEsta acción no se puede deshacer.');
    if (!confirm) return;

    const doubleConfirm = window.confirm('¿Realmente quieres eliminar TODOS los datos?\n\nPulsa Aceptar para confirmar.');
    if (!doubleConfirm) return;

    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/reset`, { method: 'POST', headers });
      if (response.ok) {
        alert('Todos los datos han sido eliminados.');
        window.location.reload();
      } else {
        alert('Error al eliminar los datos.');
      }
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('Error de conexión.');
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Perfil</h2>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                  <User className="text-primary" size={40} />
                </div>
              )}
              <label
                htmlFor="avatar-input"
                className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <User size={16} />
              </label>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{profile.name || 'Usuario'}</h3>
                  <p className="text-gray-500">{profile.family_name}</p>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={14} className="inline mr-1" />
                  Tu nombre
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nombre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Users size={14} className="inline mr-1" />
                  Nombre de familia
                </label>
                <input
                  type="text"
                  value={profile.family_name}
                  onChange={(e) => setProfile({ ...profile, family_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Mi Familia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail size={14} className="inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone size={14} className="inline mr-1" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="+34 600 000 000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moneda
                </label>
                <select
                  value={profile.currency}
                  onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="EUR">Euro (€)</option>
                  <option value="USD">Dólar ($)</option>
                  <option value="GBP">Libra (£)</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              
              {saved && (
                <span className="ml-4 text-income text-sm">¡Guardado correctamente!</span>
              )}
            </div>
          </form>

          <div className="mt-8">
            <NotificationSettings />
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Share2 size={20} className="text-primary" />
              Compartir datos familiares
            </h3>

            <form onSubmit={handleInvite} className="mb-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Nombre de usuario a invitar"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={inviting || !inviteUsername.trim()}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {inviting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                  Invitar
                </button>
              </div>
              {inviteError && <p className="text-expense text-sm mt-2">{inviteError}</p>}
              {inviteSuccess && <p className="text-income text-sm mt-2">{inviteSuccess}</p>}
            </form>

            {sharedUsers.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Usuarios con acceso a tus datos:</h4>
                <div className="space-y-2">
                  {sharedUsers.map((share) => (
                    <div key={share.shared_with_id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User size={16} className="text-primary" />
                        </div>
                        <span className="font-medium text-gray-800">{share.username || share.shared_with_username}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveShare(share.shared_with_id)}
                        className="text-expense hover:text-red-700 text-sm flex items-center gap-1"
                      >
                        <X size={14} />
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invitations.filter(i => i.status === 'pending').length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Invitaciones pendientes:</h4>
                <div className="space-y-2">
                  {invitations.filter(i => i.status === 'pending').map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between bg-yellow-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                          <User size={16} className="text-yellow-600" />
                        </div>
                        <span className="font-medium text-gray-800">{inv.from_username} quiere compartir contigo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleInvitationAction(inv.id, 'accept')}
                          className="flex items-center gap-1 bg-income text-white px-3 py-1 rounded-lg text-sm hover:bg-income/90"
                        >
                          <Check size={14} />
                          Aceptar
                        </button>
                        <button
                          onClick={() => handleInvitationAction(inv.id, 'reject')}
                          className="flex items-center gap-1 bg-expense text-white px-3 py-1 rounded-lg text-sm hover:bg-expense/90"
                        >
                          <X size={14} />
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sharedUsers.length === 0 && invitations.filter(i => i.status === 'pending').length === 0 && (
              <p className="text-gray-500 text-sm">
                No has compartido datos ni tienes invitaciones pendientes.
              </p>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Backup y Restauración</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Download className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-800">Exportar datos</h4>
                    <p className="text-sm text-blue-600 mt-1">
                      Descarga una copia de seguridad de todos tus datos: transacciones, presupuestos, eventos y tareas.
                    </p>
                    <button
                      onClick={handleExportData}
                      className="mt-3 flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      <Download size={16} />
                      Descargar backup
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Upload className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-800">Importar datos</h4>
                    <p className="text-sm text-green-600 mt-1">
                      Restaura tus datos desde un archivo de backup. Los datos se añadirán a los existentes.
                    </p>
                    <button
                      onClick={handleImportData}
                      className="mt-3 flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      <Upload size={16} />
                      Restaurar backup
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".json"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Upload className="text-purple-500 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-800">Importar base de datos (.db)</h4>
                    <p className="text-sm text-purple-600 mt-1">
                      Restaura una base de datos completa desde un archivo .db. Solo administradores.
                    </p>
                    <div className="mt-3">
                      <ImportDB onImportComplete={() => window.location.reload()} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-800">Zona de peligro</h4>
                  <p className="text-sm text-red-600 mt-1">
                    Esta acción eliminará permanentemente todos los datos: transacciones, presupuestos, eventos y conceptos de gasto.
                  </p>
                  <button
                    onClick={handleResetData}
                    className="mt-3 flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    <Trash2 size={16} />
                    Vaciar todos los datos
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
