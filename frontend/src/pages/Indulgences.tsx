import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, X, ChevronDown, Sparkles, Heart } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';
import type { Indulgence } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Indulgences() {
  const [indulgences, setIndulgences] = useState<Indulgence[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: '',
    date: '',
    type: 'plenary' as 'plenary' | 'partial',
    description: ''
  });

  const types = [
    { value: 'plenary', label: 'Plenaria' },
    { value: 'partial', label: 'Parcial' }
  ];

  useEffect(() => {
    fetchIndulgences();
  }, []);

  const fetchIndulgences = async () => {
    try {
      const response = await fetch(`${API_URL}/api/indulgences`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setIndulgences(data);
      }
    } catch (error) {
      console.error('Error fetching indulgences:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntil = (dateStr: string) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const now = new Date();
    
    let nextDate = new Date(now.getFullYear(), target.getMonth(), target.getDate());
    
    if (now > nextDate) {
      nextDate.setFullYear(now.getFullYear() + 1);
    }
    
    const diffTime = Math.abs(nextDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  const isWithinDays = (dateStr: string, days: number) => {
    const daysUntil = getDaysUntil(dateStr);
    return daysUntil !== null && daysUntil <= days;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `${API_URL}/api/indulgence/${editingId}`
        : `${API_URL}/api/indulgences`;
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: editingId })
      });

      if (response.ok) {
        fetchIndulgences();
        setShowModal(false);
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error saving indulgence:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta indulgencia?')) return;
    try {
      const response = await fetch(`${API_URL}/api/indulgence/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setIndulgences(indulgences.filter(i => i.id !== id));
      }
    } catch (error) {
      console.error('Error deleting indulgence:', error);
    }
  };

  const openEditModal = (indulgence: Indulgence) => {
    setForm({
      title: indulgence.title,
      date: indulgence.date,
      type: indulgence.type as 'plenary' | 'partial',
      description: indulgence.description || ''
    });
    setEditingId(indulgence.id);
    setShowModal(true);
  };

  const openNewModal = () => {
    setForm({ title: '', date: '', type: 'plenary', description: '' });
    setEditingId(null);
    setShowModal(true);
  };

  const sortedIndulgences = [...indulgences].sort((a, b) => {
    const daysA = getDaysUntil(a.date) ?? 999;
    const daysB = getDaysUntil(b.date) ?? 999;
    return daysA - daysB;
  });

  const upcomingIndulgences = sortedIndulgences.filter(i => isWithinDays(i.date, 15));
  const otherIndulgences = sortedIndulgences.filter(i => !isWithinDays(i.date, 15));

  const getTypeColor = (type: string) => {
    return type === 'plenary' 
      ? 'text-amber-600 bg-amber-100' 
      : 'text-purple-600 bg-purple-100';
  };

  const getTypeIcon = (type: string) => {
    return type === 'plenary' ? <Star size={16} /> : <Sparkles size={16} />;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Heart className="text-primary" />
            Indulgencias
          </h1>
          <p className="text-gray-500 text-sm mt-1">Fechas de indulgencias para los próximos 15 días</p>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-xs font-semibold mb-1">¿Cómo obtener la indulgencia plenaria?</p>
            <p className="text-amber-700 text-xs">Además del acto específico, se deben cumplir:</p>
            <ul className="text-amber-700 text-xs mt-1 list-disc list-inside">
              <li>Confesión individual e íntegra</li>
              <li>Comunión eucarística</li>
              <li>Rezar por las intenciones del Papa</li>
            </ul>
          </div>
        </div>
        <button
          type="button"
          onClick={openNewModal}
          className="btn-modern flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : (
        <>
          {upcomingIndulgences.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200">
              <h2 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
                <Star className="fill-amber-500" size={20} />
                Próximas indulgencias (15 días)
              </h2>
              <div className="grid gap-3">
                {upcomingIndulgences.map((indulgence) => {
                  const daysUntil = getDaysUntil(indulgence.date);
                  return (
                    <div
                      key={indulgence.id}
                      className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getTypeColor(indulgence.type)}`}>
                              {getTypeIcon(indulgence.type)}
                              {indulgence.type === 'plenary' ? 'Plenaria' : 'Parcial'}
                            </span>
                            <span className="text-amber-600 font-semibold">
                              {daysUntil === 0 ? '¡HOY!' : daysUntil === 1 ? 'Mañana' : `En ${daysUntil} días`}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-800">{indulgence.title}</h3>
                          <p className="text-sm text-gray-500">{formatDate(indulgence.date)}</p>
                          {indulgence.description && (
                            <p className="text-sm text-gray-600 mt-1">{indulgence.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditModal(indulgence)}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(indulgence.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {otherIndulgences.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Otras indulgencias</h2>
              <div className="grid gap-3">
                {otherIndulgences.map((indulgence) => {
                  const daysUntil = getDaysUntil(indulgence.date);
                  return (
                    <div
                      key={indulgence.id}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`p-2 rounded-full ${getTypeColor(indulgence.type)}`}>
                          {getTypeIcon(indulgence.type)}
                        </span>
                        <div>
                          <h3 className="font-medium text-gray-800">{indulgence.title}</h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(indulgence.date)} • {daysUntil} días
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(indulgence)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(indulgence.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {indulgences.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
              <Heart className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No hay indulgencias guardadas</p>
              <button
                onClick={openNewModal}
                className="mt-3 text-primary hover:underline"
              >
                Añadir la primera
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingId ? 'Editar' : 'Nueva'} Indulgencia
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingId(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Indulgencia del 2 de Noviembre"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <div className="relative">
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as 'plenary' | 'partial' })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none bg-white"
                  >
                    {types.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detalles adicionales..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingId(null); }}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}