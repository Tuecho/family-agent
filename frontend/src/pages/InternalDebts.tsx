import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Users, ArrowRight, DollarSign, History, X, Edit2, RotateCcw } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';
import type { InternalDebt } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

interface FamilyMember {
  id: number;
  name: string;
}

export function InternalDebts() {
  const [debts, setDebts] = useState<InternalDebt[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showNewMember, setShowNewMember] = useState<string | false>(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingSettledDebt, setEditingSettledDebt] = useState<InternalDebt | null>(null);
  const [editSettledAmount, setEditSettledAmount] = useState('');
  const [editSettledReason, setEditSettledReason] = useState('');
  const [editingDebt, setEditingDebt] = useState<InternalDebt | null>(null);
  const [editFromMember, setEditFromMember] = useState('');
  const [editToMember, setEditToMember] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editReason, setEditReason] = useState('');

  const [formData, setFormData] = useState({
    from_member: '',
    to_member: '',
    amount: '',
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [debtsRes, membersRes] = await Promise.all([
        fetch(`${API_URL}/api/finance/internal-debts`, { headers }),
        fetch(`${API_URL}/api/family-members`, { headers }),
      ]);
      const debtsData = await debtsRes.json();
      const membersData = await membersRes.json();
      
      setDebts(Array.isArray(debtsData) ? debtsData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/family-members`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newMemberName.trim() })
      });
      setNewMemberName('');
      setShowNewMember(false);
      fetchData();
    } catch (error) {
      console.error('Error creating member:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const res = await fetch(`${API_URL}/api/finance/internal-debts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          from_member_id: formData.from_member,
          to_member_id: formData.to_member,
          amount: formData.amount,
          description: formData.reason
        })
      });
      if (res.ok) {
        fetchData();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating debt:', error);
    }
  };

  const handleSettle = async (id: string) => {
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/finance/internal-debts/${id}/settle`, { method: 'POST', headers });
      fetchData();
    } catch (error) {
      console.error('Error settling debt:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta deuda?')) return;
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/finance/internal-debts/${id}`, { method: 'DELETE', headers });
      setDebts(debts.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting debt:', error);
    }
  };

  const handleReopen = async (id: string) => {
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/finance/internal-debts/${id}/reopen`, { method: 'POST', headers });
      fetchData();
    } catch (error) {
      console.error('Error reopening debt:', error);
    }
  };

  const startEditSettled = (debt: InternalDebt) => {
    setEditingSettledDebt(debt);
    setEditSettledAmount(debt.amount.toString());
    setEditSettledReason(debt.description || '');
  };

  const startEditActive = (debt: InternalDebt) => {
    setEditingDebt(debt);
    const fromMember = members.find(m => m.name === debt.from_member);
    const toMember = members.find(m => m.name === debt.to_member);
    setEditFromMember(fromMember ? String(fromMember.id) : '');
    setEditToMember(toMember ? String(toMember.id) : '');
    setEditAmount(debt.amount.toString());
    setEditReason(debt.description || '');
  };

  const handleEditSettled = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSettledDebt) return;
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/finance/internal-debts/${editingSettledDebt.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          amount: parseFloat(editSettledAmount),
          description: editSettledReason
        })
      });
      setEditingSettledDebt(null);
      fetchData();
    } catch (error) {
      console.error('Error editing debt:', error);
    }
  };

  const handleEditActive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt) return;
    if (!editFromMember || !editToMember) {
      alert('Selecciona ambos miembros');
      return;
    }
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/finance/internal-debts/${editingDebt.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          from_member_id: editFromMember,
          to_member_id: editToMember,
          amount: parseFloat(editAmount),
          description: editReason
        })
      });
      setEditingDebt(null);
      fetchData();
    } catch (error) {
      console.error('Error editing debt:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setFormData({ from_member: '', to_member: '', amount: '', reason: '' });
  };

  const activeDebts = debts.filter(d => !d.settled);
  const settledDebts = debts.filter(d => d.settled);

  const totalOwed = activeDebts.reduce((sum, d) => sum + d.amount, 0);
  const debtsOwedToUser: Record<string, number> = {};
  const debtsOwedByUser: Record<string, number> = {};

  activeDebts.forEach(d => {
    debtsOwedToUser[d.to_member] = (debtsOwedToUser[d.to_member] || 0) + d.amount;
    debtsOwedByUser[d.from_member] = (debtsOwedByUser[d.from_member] || 0) + d.amount;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Deudas Internas</h1>
          <p className="text-gray-500 text-sm">Controla quién debe dinero a quién en la familia</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Nueva deuda
        </button>
      </div>

      {activeDebts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="font-medium text-amber-800">
            Total pendiente: {totalOwed.toFixed(2)}€
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : activeDebts.length === 0 && settledDebts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No hay deudas internas</p>
          <p className="text-sm text-gray-400">Ej: "Pedro le debe 20€ a mamá"</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeDebts.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-700 mb-3">Deudas activas</h2>
              <div className="space-y-3">
                {activeDebts.map((debt) => (
                  <div
                    key={debt.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{debt.from_member}</span>
                        <ArrowRight size={18} className="text-gray-400" />
                        <span className="font-medium text-gray-800">{debt.to_member}</span>
                      </div>
                      <span className="text-xl font-bold text-primary">{debt.amount}€</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {debt.description && (
                        <span className="text-sm text-gray-500">{debt.description}</span>
                      )}
                      <button
                        onClick={() => startEditActive(debt)}
                        className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleSettle(debt.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Marcar como pagado"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(debt.id)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {settledDebts.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-500 mb-3 flex items-center gap-2">
                <History size={16} />
                Historial (pagadas)
              </h2>
              <div className="space-y-2 opacity-60">
                {settledDebts.map((debt) => (
                  <div
                    key={debt.id}
                    className="bg-gray-50 rounded-lg p-3 flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 text-gray-500">
                      <span>{debt.from_member}</span>
                      <ArrowRight size={14} />
                      <span>{debt.to_member}</span>
                      <span className="font-medium">{debt.amount}€</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">
                        {debt.settled_at ? new Date(debt.settled_at).toLocaleDateString('es-ES') : 'Pagado'}
                      </span>
                      <button
                        onClick={() => startEditSettled(debt)}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-white rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleReopen(debt.id)}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-white rounded transition-colors"
                        title="Reabrir como pendiente"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Nueva deuda</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿Quién debe?</label>
                  <select
                    value={formData.from_member}
                    onChange={(e) => setFormData({ ...formData, from_member: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewMember('from')}
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    + Crear nuevo miembro
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿A quién debe?</label>
                  <select
                    value={formData.to_member}
                    onChange={(e) => setFormData({ ...formData, to_member: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewMember('to')}
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    + Crear nuevo miembro
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    placeholder="Cena, Cine..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showNewMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Nuevo miembro</h2>
                <button onClick={() => setShowNewMember(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    placeholder="Ej: María, Abel..."
                    required
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewMember(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {editingSettledDebt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Editar deuda archivada</h2>
                <button onClick={() => setEditingSettledDebt(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSettled} className="space-y-4">
                <div className="text-sm text-gray-500 mb-4">
                  {editingSettledDebt.from_member} → {editingSettledDebt.to_member}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editSettledAmount}
                    onChange={(e) => setEditSettledAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                  <input
                    type="text"
                    value={editSettledReason}
                    onChange={(e) => setEditSettledReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    placeholder="Cena, Cine..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSettledDebt(null)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {editingDebt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Editar deuda</h2>
                <button onClick={() => setEditingDebt(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditActive} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿Quién debe?</label>
                  <select
                    value={editFromMember}
                    onChange={(e) => setEditFromMember(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿A quién debe?</label>
                  <select
                    value={editToMember}
                    onChange={(e) => setEditToMember(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                  <input
                    type="text"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    placeholder="Cena, Cine..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingDebt(null)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Guardar
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
