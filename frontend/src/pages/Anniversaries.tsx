import React, { useState, useEffect } from 'react';
import { Plus, Gift, Edit2, Trash2, CalendarHeart, Sparkles, X, ChevronDown } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';
import type { Anniversary } from '../types';

export default function Anniversaries() {
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: '',
    type: 'Boda',
    date: '',
    notes: ''
  });

  const types = ['Boda', 'Bautizo', 'Comunión', 'Cumpleaños', 'Fallecimiento', 'Noviazgo', 'Personal', 'Otro'];

  useEffect(() => {
    fetchAnniversaries();
  }, []);

  const fetchAnniversaries = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/anniversaries`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setAnniversaries(data);
      }
    } catch (error) {
      console.error('Error fetching anniversaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateYearsDiff = (dateStr: string) => {
    if (!dateStr) return null;
    const past = new Date(dateStr);
    const now = new Date();
    let years = now.getFullYear() - past.getFullYear();
    const m = now.getMonth() - past.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < past.getDate())) {
      years--;
    }
    return Math.max(0, years);
  };

  const getDaysUntilNext = (dateStr: string) => {
    if (!dateStr) return null;
    const past = new Date(dateStr);
    const now = new Date();
    
    let nextDate = new Date(now.getFullYear(), past.getMonth(), past.getDate());
    
    if (now > nextDate) {
      nextDate.setFullYear(now.getFullYear() + 1);
    }
    
    const diffTime = Math.abs(nextDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `${import.meta.env.VITE_API_URL}/api/anniversaries/${editingId}`
        : `${import.meta.env.VITE_API_URL}/api/anniversaries`;
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(form)
      });

      if (response.ok) {
        fetchAnniversaries();
        setShowModal(false);
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error saving anniversary:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este aniversario?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/anniversaries/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setAnniversaries(anniversaries.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Error deleting anniversary:', error);
    }
  };

  const openNewModal = () => {
    setForm({ title: '', type: 'Boda', date: '', notes: '' });
    setEditingId(null);
    setShowModal(true);
  };

  const sortedAnniversaries = [...anniversaries].sort((a, b) => {
    const daysA = getDaysUntilNext(a.date) ?? 999;
    const daysB = getDaysUntilNext(b.date) ?? 999;
    return daysA - daysB;
  });

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Boda': return 'text-pink-600 bg-pink-100';
      case 'Comunión': return 'text-purple-600 bg-purple-100';
      case 'Bautizo': return 'text-blue-600 bg-blue-100';
      case 'Cumpleaños': return 'text-yellow-600 bg-yellow-100';
      case 'Fallecimiento': return 'text-gray-600 bg-gray-100';
      case 'Noviazgo': return 'text-rose-600 bg-rose-100';
      default: return 'text-primary bg-primary/10';
    }
  };
  
  const getTypeIcon = (type: string) => {
    if (type === 'Boda' || type === 'Noviazgo') return <Sparkles size={16} />;
    if (type === 'Cumpleaños') return <Gift size={16} />;
    return <CalendarHeart size={16} />;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarHeart className="text-primary" />
            Aniversarios
          </h1>
          <p className="text-gray-500 text-sm mt-1">Fechas importantes para no olvidar nunca</p>
        </div>
        <button
          onClick={openNewModal}
          className="btn-modern flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Añadir Aniversario</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-primary">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : sortedAnniversaries.length === 0 ? (
        <div className="card-modern p-12 text-center text-gray-500">
          <CalendarHeart size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg">No hay ningún aniversario guardado.</p>
          <button onClick={openNewModal} className="mt-4 text-primary font-medium hover:underline">
            ¡Agrega el primero!
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedAnniversaries.map((ann) => {
            const daysLeft = getDaysUntilNext(ann.date);
            const years = calculateYearsDiff(ann.date);
            const isSoon = daysLeft !== null && daysLeft <= 30;

            return (
              <div key={ann.id} className="card-modern flex flex-col group relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
                {isSoon && (
                  <div className="absolute top-0 right-0 h-16 w-16 pointer-events-none">
                    <div className="absolute transform rotate-45 bg-amber-400 font-medium text-xs text-amber-900 py-1 right-[-35px] top-[32px] w-[170px] text-center shadow-sm">
                      ¡Pronto!
                    </div>
                  </div>
                )}
                
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getTypeColor(ann.type)}`}>
                      {getTypeIcon(ann.type)}
                      {ann.type}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setForm({ 
                            title: ann.title, 
                            type: ann.type, 
                            date: ann.date, 
                            notes: ann.notes || '' 
                          });
                          setEditingId(ann.id);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 leading-tight mb-2 pr-4">{ann.title}</h3>
                  <div className="flex items-center gap-2 text-gray-600 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                    <CalendarHeart size={16} className="text-gray-400"/>
                    <span className="font-medium text-sm">
                      {new Date(ann.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {ann.notes && (
                    <p className="mt-3 text-sm text-gray-500 line-clamp-2 italic border-l-2 border-gray-200 pl-2">
                      {ann.notes}
                    </p>
                  )}
                </div>
                
                <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Antigüedad</span>
                      <span className="text-gray-800 font-semibold">{years} años</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Faltan</span>
                      <span className={`font-semibold ${isSoon ? 'text-amber-500' : 'text-gray-800'}`}>
                        {daysLeft === 0 ? '¡HOY!' : `${daysLeft} días`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="text-primary" size={20} />
                {editingId ? 'Editar Aniversario' : 'Nuevo Aniversario'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Título / Motivo</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="input-modern"
                  placeholder="Ej: Boda de Luis y María"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                  <div className="relative">
                    <select
                      value={form.type}
                      onChange={(e) => setForm({...form, type: e.target.value})}
                      className="input-modern appearance-none w-full"
                    >
                      {types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha Original</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({...form, date: e.target.value})}
                    className="input-modern"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas adicionales</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  className="input-modern min-h-[100px] resize-y"
                  placeholder="Recuerdos, regalo habitual..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 shadow-sm shadow-primary/30 transition-all hover:-translate-y-0.5"
                >
                  {editingId ? 'Guardar Cambios' : 'Anadir Aniversario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
