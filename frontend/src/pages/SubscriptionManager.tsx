import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, AlertTriangle, CreditCard, Play, Music, Dumbbell, Shield, DollarSign, Calendar, Tag } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';
import type { Subscription } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

interface SubCategory {
  id: number;
  owner_id: number;
  name: string;
  icon: string;
  color: string;
}

const defaultCategories = [
  { name: 'Streaming', icon: 'play', color: '#ef4444' },
  { name: 'Música', icon: 'music', color: '#22c55e' },
  { name: 'Gimnasio', icon: 'dumbbell', color: '#3b82f6' },
  { name: 'Seguro', icon: 'shield', color: '#f59e0b' },
  { name: 'Otro', icon: 'tag', color: '#6366f1' }
];

export function SubscriptionManager() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    amount: '',
    billing_cycle: 'mensual' as const,
    next_billing_date: '',
    auto_renew: true,
    notes: '',
  });

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  useEffect(() => {
    fetchSubscriptions();
    fetchCategories();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_URL}/api/home/subscriptions`, { headers });
      const data = await res.json();
      const normalized = (Array.isArray(data) ? data : []).map((sub: any) => ({
        ...sub,
        customCategory: sub.custom_category,
      }));
      setSubscriptions(normalized);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_URL}/api/home/subscription-categories`, { headers });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/home/subscription-categories`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newCatName.trim(), color: newCatColor })
      });
      setNewCatName('');
      setNewCatColor('#6366f1');
      setShowCatForm(false);
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const url = editingSub ? `${API_URL}/api/home/subscriptions/${editingSub.id}` : `${API_URL}/api/home/subscriptions`;
      const method = editingSub ? 'PUT' : 'POST';
      
      const res = await fetch(url, { method, headers, body: JSON.stringify(formData) });
      if (res.ok) {
        fetchSubscriptions();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta suscripción?')) return;
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/home/subscriptions/${id}`, { method: 'DELETE', headers });
      setSubscriptions(subscriptions.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSub(null);
    setFormData({
      name: '',
      category: categories[0]?.name || 'Streaming',
      amount: '',
      billing_cycle: 'mensual',
      next_billing_date: '',
      auto_renew: true,
      notes: '',
    });
  };

  const getCategoryIcon = (categoryName: string) => {
    const cat = categories.find(c => c.name === categoryName);
    if (!cat) return <CreditCard size={18} />;
    switch (cat.icon) {
      case 'play': return <Play size={18} />;
      case 'music': return <Music size={18} />;
      case 'dumbbell': return <Dumbbell size={18} />;
      case 'shield': return <Shield size={18} />;
      default: return <Tag size={18} />;
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const cat = categories.find(c => c.name === categoryName);
    return cat?.color || '#6366f1';
  };

  const totalMonthly = subscriptions.reduce((sum, s) => sum + (s.billing_cycle === 'anual' ? s.amount / 12 : s.amount), 0);

  const upcomingPayments = subscriptions.filter(s => {
    if (!s.next_billing_date) return false;
    const daysUntil = Math.ceil((new Date(s.next_billing_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
  });

  const isBillingSoon = (date?: string) => {
    if (!date) return false;
    const daysUntil = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
  };

  const allCategories = [...defaultCategories, ...categories.map(c => ({ name: c.name, icon: c.icon, color: c.color }))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestor de Suscripciones</h1>
          <p className="text-gray-500 text-sm">Netflix, Spotify, gimnasio, seguros...</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCatForm(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Tag size={18} />
            Categorías
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            Nueva suscripción
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <DollarSign size={18} />
            <span className="text-sm">Gasto mensual</span>
          </div>
          <p className="text-3xl font-bold">{totalMonthly.toFixed(2)}€</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Calendar size={18} />
            <span className="text-sm">Gasto anual</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{(totalMonthly * 12).toFixed(2)}€</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <CreditCard size={18} />
            <span className="text-sm">Total suscripciones</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{subscriptions.length}</p>
        </div>
      </div>

      {upcomingPayments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-amber-800">{upcomingPayments.length} pago(s) próximo(s) esta semana</p>
            <p className="text-sm text-amber-700">
              {upcomingPayments.map(s => `${s.name}: ${s.amount}€`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No hay suscripciones</p>
          <p className="text-sm text-gray-400">Añade Netflix, Spotify, gimnasio...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: getCategoryColor(sub.category) + '20', color: getCategoryColor(sub.category) }}>
                    {getCategoryIcon(sub.category)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{sub.name}</h3>
                    <p className="text-xs text-gray-500">{sub.category}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingSub(sub);
                      setFormData({
                        name: sub.name,
                        category: sub.category,
                        amount: sub.amount.toString(),
                        billing_cycle: sub.billing_cycle,
                        next_billing_date: sub.next_billing_date || '',
                        auto_renew: sub.auto_renew ?? true,
                        notes: sub.notes || '',
                      });
                      setShowForm(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(sub.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-gray-800">{sub.amount}€</span>
                <span className="text-sm text-gray-500">/{sub.billing_cycle === 'mensual' ? 'mes' : 'año'}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                {sub.next_billing_date && (
                  <span className={isBillingSoon(sub.next_billing_date) ? 'text-amber-600 font-medium' : 'text-gray-500'}>
                    {isBillingSoon(sub.next_billing_date) ? '⚠️ ' : ''}
                    Próximo: {new Date(sub.next_billing_date).toLocaleDateString('es-ES')}
                  </span>
                )}
                {sub.auto_renew !== false && (
                  <span className="text-green-600 text-xs">Renovación automática</span>
                )}
              </div>

              {sub.notes && (
                <p className="mt-2 text-sm text-gray-500">{sub.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showCatForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Categorías</h2>
              
              <form onSubmit={handleCreateCategory} className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Nueva categoría..."
                  />
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </form>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowCatForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editingSub ? 'Editar suscripción' : 'Nueva suscripción'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Netflix, Spotify..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {allCategories.map((cat) => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Importe</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="9.99"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciclo</label>
                    <select
                      value={formData.billing_cycle}
                      onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="mensual">Mensual</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Próxima facturación</label>
                  <input
                    type="date"
                    value={formData.next_billing_date}
                    onChange={(e) => setFormData({ ...formData, next_billing_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="auto_renew"
                    checked={formData.auto_renew}
                    onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <label htmlFor="auto_renew" className="text-sm text-gray-700">Renovación automática</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {editingSub ? 'Guardar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}