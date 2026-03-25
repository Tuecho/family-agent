import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Users, Save, Loader2, Trash2, AlertTriangle, LogOut, Share2, UserPlus, Check, X, Download, Upload, Settings } from 'lucide-react';
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
  city: string | null;
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
  share_dashboard: number;
  share_accounting: number;
  share_budgets: number;
  share_agenda: number;
  share_tasks: number;
  share_notes: number;
  share_shopping: number;
  share_contacts: number;
  share_recipes: number;
  share_restaurants: number;
  share_family_members: number;
}

interface SharePreferences {
  share_dashboard: boolean;
  share_accounting: boolean;
  share_budgets: boolean;
  share_agenda: boolean;
  share_tasks: boolean;
  share_notes: boolean;
  share_shopping: boolean;
  share_contacts: boolean;
  share_recipes: boolean;
  share_restaurants: boolean;
  share_family_members: boolean;
}

export function Profile() {
  const { logout, isAdmin } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    id: 1,
    name: '',
    avatar: null,
    email: null,
    phone: null,
    family_name: 'Mi Familia',
    city: null,
    currency: 'EUR'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{id: number; username: string}[]>([]);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [editingShare, setEditingShare] = useState<SharedUser | null>(null);
  const [sharePrefs, setSharePrefs] = useState<SharePreferences>({
    share_dashboard: true,
    share_accounting: true,
    share_budgets: true,
    share_agenda: true,
    share_tasks: true,
    share_notes: false,
    share_shopping: false,
    share_contacts: false,
    share_recipes: false,
    share_restaurants: false,
    share_family_members: false
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchAvailableUsers = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/users`, { headers });
      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

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
        body: JSON.stringify({ 
          to_username: inviteUsername.trim(),
          ...sharePrefs
        })
      });
      const data = await response.json();

      if (response.ok) {
        setInviteSuccess(`Invitación enviada a ${inviteUsername}`);
        setInviteUsername('');
        setShowShareModal(false);
        setSharePrefs({
          share_dashboard: true,
          share_accounting: true,
          share_budgets: true,
          share_agenda: true,
          share_tasks: true,
          share_notes: false,
          share_shopping: false,
          share_contacts: false,
          share_recipes: false,
          share_restaurants: false,
          share_family_members: false
        });
        fetchInvitations();
      } else {
        setInviteError(data.error || 'Error al enviar invitación');
      }
    } catch (error) {
      setInviteError('Error de conexión');
    }
    setInviting(false);
  };

  const handleUpdateShare = async () => {
    if (!editingShare) return;

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const response = await fetch(`${API_URL}/api/shares/${editingShare.shared_with_id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(sharePrefs)
      });

      if (response.ok) {
        setShowShareModal(false);
        setEditingShare(null);
        fetchInvitations();
      }
    } catch (error) {
      console.error('Error updating share:', error);
    }
  };

  const openEditShare = (share: SharedUser) => {
    setEditingShare(share);
    setSharePrefs({
      share_dashboard: !!share.share_dashboard,
      share_accounting: !!share.share_accounting,
      share_budgets: !!share.share_budgets,
      share_agenda: !!share.share_agenda,
      share_tasks: !!share.share_tasks,
      share_notes: !!share.share_notes,
      share_shopping: !!share.share_shopping,
      share_contacts: !!share.share_contacts,
      share_recipes: !!share.share_recipes,
      share_restaurants: !!share.share_restaurants,
      share_family_members: !!share.share_family_members
    });
    setShowShareModal(true);
  };

  const openNewShare = () => {
    setEditingShare(null);
    setSharePrefs({
      share_dashboard: true,
      share_accounting: true,
      share_budgets: true,
      share_agenda: true,
      share_tasks: true,
      share_notes: false,
      share_shopping: false,
      share_contacts: false,
      share_recipes: false,
      share_restaurants: false,
      share_family_members: false
    });
    setInviteUsername('');
    setAvailableUsers([]);
    fetchAvailableUsers();
    setShowShareModal(true);
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al exportar los datos');
      }
      
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
        const errorData = await response.json();
        alert(errorData.error || 'Error al importar los datos');
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
      const data = await response.json();
      if (response.ok) {
        alert('Todos los datos han sido eliminados.');
        window.location.reload();
      } else {
        alert(data.error || 'Error al eliminar los datos.');
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
    <div className="p-3 sm:p-4 md:p-8">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Perfil</h2>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
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
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-semibold text-gray-800">{profile.name || 'Usuario'}</h3>
              <p className="text-gray-500">{profile.family_name}</p>
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
                  <Mail size={14} className="inline mr-1" />
                  Ciudad (para el clima)
                </label>
                <input
                  type="text"
                  value={profile.city || ''}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Madrid"
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

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Share2 size={18} className="text-primary" />
                Compartir datos
              </h3>
              <button
                onClick={openNewShare}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                <UserPlus size={16} />
                Compartir con usuario
              </button>
            </div>

            {sharedUsers.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2 text-sm">Usuarios con acceso:</h4>
                <div className="space-y-2">
                  {sharedUsers.map((share) => (
                    <div key={share.shared_with_id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User size={16} className="text-primary" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-800 text-sm">{share.username || share.shared_with_username}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {share.share_dashboard === 1 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Dashboard</span>}
                            {share.share_accounting === 1 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Contabilidad</span>}
                            {share.share_budgets === 1 && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Presupuestos</span>}
                            {share.share_agenda === 1 && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Agenda</span>}
                            {share.share_tasks === 1 && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Tareas</span>}
                            {share.share_notes === 1 && <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded">Notas</span>}
                            {share.share_shopping === 1 && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded">Compra</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditShare(share)}
                          className="text-gray-500 hover:text-primary text-sm flex items-center gap-1 p-1"
                          title="Editar compartición"
                        >
                          <Settings size={16} />
                        </button>
                        <button
                          onClick={() => handleRemoveShare(share.shared_with_id)}
                          className="text-expense hover:text-red-700 text-sm flex items-center gap-1"
                        >
                          <X size={14} />
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invitations.filter(i => i.status === 'pending').length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2 text-sm">Invitaciones pendientes:</h4>
                <div className="space-y-2">
                  {invitations.filter(i => i.status === 'pending').map((inv) => (
                    <div key={inv.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-yellow-50 rounded-lg p-3 gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                          <User size={16} className="text-yellow-600" />
                        </div>
                        <span className="font-medium text-gray-800 text-sm">{inv.from_username} quiere compartir contigo</span>
                      </div>
                      <div className="flex items-center gap-2 ml-11 sm:ml-0">
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

          {showShareModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {editingShare ? 'Editar compartición' : 'Compartir datos'}
                  </h3>
                  <button onClick={() => { setShowShareModal(false); setInviteUsername(''); }} className="text-gray-500 hover:text-gray-700">
                    <X size={20} />
                  </button>
                </div>

                {!editingShare && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usuario
                    </label>
                    {availableUsers.length > 0 ? (
                      <select
                        value={inviteUsername}
                        onChange={(e) => setInviteUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      >
                        <option value="">Selecciona un usuario...</option>
                        {availableUsers.map((user) => (
                          <option key={user.id} value={user.username}>{user.username}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={inviteUsername}
                        onChange={(e) => setInviteUsername(e.target.value)}
                        placeholder="Nombre de usuario"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      />
                    )}
                    {inviteError && <p className="text-expense text-sm mt-1">{inviteError}</p>}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Datos a compartir
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: 'share_dashboard', label: 'Dashboard', color: 'blue' },
                      { key: 'share_accounting', label: 'Contabilidad', color: 'green' },
                      { key: 'share_budgets', label: 'Presupuestos', color: 'yellow' },
                      { key: 'share_agenda', label: 'Agenda', color: 'purple' },
                      { key: 'share_tasks', label: 'Tareas', color: 'orange' },
                      { key: 'share_notes', label: 'Notas', color: 'pink' },
                      { key: 'share_shopping', label: 'Lista de compra', color: 'teal' },
                      { key: 'share_contacts', label: 'Contactos', color: 'indigo' },
                      { key: 'share_recipes', label: 'Recetas', color: 'red' },
                      { key: 'share_restaurants', label: 'Restaurantes', color: 'amber' },
                      { key: 'share_family_members', label: 'Miembros familia', color: 'cyan' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sharePrefs[item.key as keyof SharePreferences]}
                          onChange={(e) => setSharePrefs({ ...sharePrefs, [item.key]: e.target.checked })}
                          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingShare ? handleUpdateShare : handleInvite}
                    disabled={inviting || (!editingShare && !inviteUsername.trim())}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
                  >
                    {inviting ? <Loader2 size={16} className="animate-spin" /> : null}
                    {editingShare ? 'Guardar' : 'Invitar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
