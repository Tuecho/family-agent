import { useState, useEffect } from 'react';
import { Gift, Plus, Edit2, Trash2, X, Search, Calendar, User, Tag, DollarSign, CheckCircle2, Clock, Lightbulb } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface GiftEntry {
  id: number;
  person_name: string;
  gift_name: string;
  occasion: string;
  date: string;
  notes: string;
  price: number;
  status: 'idea' | 'comprado' | 'entregado';
  created_at: string;
}

interface GiftForm {
  person_name: string;
  gift_name: string;
  occasion: string;
  date: string;
  notes: string;
  price: number;
  status: 'idea' | 'comprado' | 'entregado';
}

export function Gifts() {
  const [gifts, setGifts] = useState<GiftEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'todos' | 'idea' | 'comprado' | 'entregado'>('todos');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<GiftForm>({
    person_name: '',
    gift_name: '',
    occasion: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    price: 0,
    status: 'idea'
  });

  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/gifts`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setGifts(data);
      }
    } catch (error) {
      console.error('Error fetching gifts:', error);
    }
  };

  const handleSave = async () => {
    if (!form.person_name || !form.gift_name) return;

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_URL}/api/gifts/${editingId}` : `${API_URL}/api/gifts`;

      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        setForm({
          person_name: '',
          gift_name: '',
          occasion: '',
          date: new Date().toISOString().split('T')[0],
          notes: '',
          price: 0,
          status: 'idea'
        });
        fetchGifts();
      }
    } catch (error) {
      console.error('Error saving gift:', error);
    }
  };

  const handleEdit = (g: GiftEntry) => {
    setEditingId(g.id);
    setForm({
      person_name: g.person_name,
      gift_name: g.gift_name,
      occasion: g.occasion || '',
      date: g.date || '',
      notes: g.notes || '',
      price: g.price || 0,
      status: g.status || 'entregado'
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este registro de regalo?')) return;
    try {
      await fetch(`${API_URL}/api/gifts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      fetchGifts();
    } catch (error) {
      console.error('Error deleting gift:', error);
    }
  };

  const filteredGifts = gifts.filter(g => {
    const matchesSearch = 
      g.person_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.gift_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.occasion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || g.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idea': return <Lightbulb size={16} className="text-amber-500" />;
      case 'comprado': return <Clock size={16} className="text-blue-500" />;
      case 'entregado': return <CheckCircle2 size={16} className="text-green-500" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'idea': return 'Idea';
      case 'comprado': return 'Comprado';
      case 'entregado': return 'Entregado';
      default: return status;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Gift size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Registro de Regalos</h1>
              <p className="opacity-90">Gestiona los detalles y regalos para no repetirte nunca</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setForm({
                person_name: '',
                gift_name: '',
                occasion: '',
                date: new Date().toISOString().split('T')[0],
                notes: '',
                price: 0,
                status: 'idea'
              });
              setShowModal(true);
            }}
            className="bg-white text-amber-600 px-6 py-2.5 rounded-xl font-bold hover:bg-amber-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus size={20} />
            Nuevo Regalo
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus('todos')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${filterStatus === 'todos' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          Todos ({gifts.length})
        </button>
        <button
          onClick={() => setFilterStatus('idea')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${filterStatus === 'idea' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          <Lightbulb size={16} /> Ideas ({gifts.filter(g => g.status === 'idea').length})
        </button>
        <button
          onClick={() => setFilterStatus('comprado')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${filterStatus === 'comprado' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          <Clock size={16} /> Comprados ({gifts.filter(g => g.status === 'comprado').length})
        </button>
        <button
          onClick={() => setFilterStatus('entregado')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${filterStatus === 'entregado' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          <CheckCircle2 size={16} /> Entregados ({gifts.filter(g => g.status === 'entregado').length})
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por persona, regalo u ocasión..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all shadow-sm"
        />
      </div>

      {/* Gifts List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGifts.map((gift) => (
          <div key={gift.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEdit(gift)}
                className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(gift.id)}
                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">{gift.person_name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="p-1.5 bg-gray-50 rounded-md">
                    {getStatusIcon(gift.status)}
                  </span>
                  {getStatusLabel(gift.status)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Gift size={16} className="text-gray-400" />
                <span className="font-medium text-gray-700">{gift.gift_name}</span>
              </div>
              
              {gift.occasion && (
                <div className="flex items-center gap-3 text-sm">
                  <Tag size={16} className="text-gray-400" />
                  <span className="text-gray-600">{gift.occasion}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-gray-600">{new Date(gift.date).toLocaleDateString()}</span>
              </div>

              {gift.price > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <DollarSign size={16} className="text-gray-400" />
                  <span className="text-gray-600 font-semibold">{gift.price} €</span>
                </div>
              )}

              {gift.notes && (
                <div className="mt-4 pt-3 border-t border-gray-50 text-sm italic text-gray-500">
                  {gift.notes}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredGifts.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <Gift size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-bold text-gray-900">No se encontraron regalos</p>
            <p className="text-gray-500">Comienza a registrar tus detalles y regalos hoy mismo</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-6 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingId ? 'Editar Regalo' : 'Nuevo Regalo'}</h3>
              <button onClick={() => setShowModal(false)} className="hover:rotate-90 transition-transform duration-200">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Para quién *</label>
                  <input
                    type="text"
                    value={form.person_name}
                    onChange={e => setForm({ ...form, person_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Nombre del familiar o amigo"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Qué regalo *</label>
                  <input
                    type="text"
                    value={form.gift_name}
                    onChange={e => setForm({ ...form, gift_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Descripción del regalo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ocasión</label>
                  <input
                    type="text"
                    value={form.occasion}
                    onChange={e => setForm({ ...form, occasion: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Ej: Navidad, Cumple..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Precio (€)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Estado</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  >
                    <option value="idea">Idea</option>
                    <option value="comprado">Comprado</option>
                    <option value="entregado">Entregado</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Notas / Detalles</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                    placeholder="Tallas, colores, dónde lo compraste..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setShowModal(false)} 
                className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} 
                disabled={!form.person_name || !form.gift_name}
                className="flex-1 py-3 px-4 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 hover:bg-amber-600 disabled:opacity-50 transition-all active:scale-95"
              >
                {editingId ? 'Actualizar' : 'Guardar Regalo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
