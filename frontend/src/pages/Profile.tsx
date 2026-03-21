import { useState, useEffect } from 'react';
import { User, Mail, Phone, Users, Save, Loader2, Trash2, AlertTriangle, LogOut } from 'lucide-react';
import { NotificationSettings } from '../components/NotificationSettings';
import { useAuth } from '../components/Auth';

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

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/profile`);
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      const data = await response.json();
      setProfile(data);
      setSaved(true);
      
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
    
    setSaving(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
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
      const response = await fetch(`${API_URL}/api/reset`, { method: 'POST' });
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Perfil</h2>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>
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
            <div>
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
