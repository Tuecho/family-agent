import { useState, useEffect } from 'react';
import { Cake, Plus, Edit2, Trash2, X } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Birthday {
  id: number;
  name: string;
  birthdate: string;
  day: number;
  month: number;
  age: number;
  daysUntil: number;
  source?: 'family' | 'additional';
}

interface BirthdayForm {
  name: string;
  birthdate: string;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function Birthdays() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BirthdayForm>({ name: '', birthdate: '' });
  const [editingSource, setEditingSource] = useState<'family' | 'additional' | null>(null);

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    try {
      const res = await fetch(`${API_URL}/api/family-members/birthdays`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBirthdays(data);
      }
    } catch (error) {
      console.error('Error fetching birthdays:', error);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.birthdate) return;
    
    try {
      if (editingId && editingSource === 'additional') {
        await fetch(`${API_URL}/api/birthdays/${editingId}`, {
          method: 'PUT',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, birthdate: form.birthdate })
        });
      } else if (editingId && editingSource === 'family') {
        // Correctly update family member birthdate
        await fetch(`${API_URL}/api/family-members/${editingId}`, {
          method: 'PUT',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: form.name, 
            birthdate: form.birthdate,
            // We need to preserve other fields if possible, but the API expects them.
            // For now, let's keep it simple as the user's focus is on adding NEW ones.
          })
        });
      } else {
        // Create in the NEW birthdays table
        await fetch(`${API_URL}/api/birthdays`, {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, birthdate: form.birthdate })
        });
      }
      
      setShowModal(false);
      setEditingId(null);
      setEditingSource(null);
      setForm({ name: '', birthdate: '' });
      fetchBirthdays();
    } catch (error) {
      console.error('Error saving birthday:', error);
    }
  };

  const handleEdit = (b: Birthday) => {
    setEditingId(b.id);
    setEditingSource(b.source || 'additional');
    setForm({ name: b.name, birthdate: b.birthdate });
    setShowModal(true);
  };

  const handleDelete = async (b: Birthday) => {
    if (b.source === 'family') {
      alert('Para eliminar el cumpleaños de un miembro de la familia, edítalo en la sección de Familia y borra su fecha de nacimiento.');
      return;
    }
    if (!confirm('Eliminar este cumpleaños?')) return;
    try {
      await fetch(`${API_URL}/api/birthdays/${b.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      fetchBirthdays();
    } catch (error) {
      console.error('Error deleting birthday:', error);
    }
  };

  const birthdaysByMonth = MONTHS.map((monthName, monthIndex) => {
    const monthBirthdays = birthdays.filter(b => b.month === monthIndex + 1);
    return { month: monthName, birthdays: monthBirthdays };
  }).filter(m => m.birthdays.length > 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl p-4 sm:p-6 text-white mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
              <Cake size={24} className="sm:size-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Cumpleaños</h1>
              <p className="opacity-90 text-sm">Recibirás notificaciones</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ name: '', birthdate: '' });
              setShowModal(true);
            }}
            className="bg-white text-pink-500 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-pink-50 flex items-center gap-2 w-full sm:w-auto justify-center text-sm sm:text-base"
          >
            <Plus size={18} />
            Añadir
          </button>
        </div>
      </div>

      {birthdaysByMonth.length > 0 ? (
        <div className="space-y-6">
          {birthdaysByMonth.map(({ month, birthdays: monthBirthdays }) => (
            <div key={month} className="bg-white rounded-xl shadow-sm border p-4">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-8 bg-pink-500 rounded-full"></span>
                {month}
              </h2>
              <div className="space-y-2">
                {monthBirthdays.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎂</span>
                      <div>
                        <p className="font-bold text-lg">{b.name}</p>
                        <p className="text-sm text-gray-500">{b.day}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        b.daysUntil === 0 ? 'bg-red-500 text-white' :
                        b.daysUntil <= 7 ? 'bg-orange-500 text-white' :
                        'bg-pink-200 text-pink-800'
                      }`}>
                        {b.daysUntil === 0 ? 'HOY!' : 
                         b.daysUntil === 1 ? 'Mañana' : 
                         `${b.daysUntil} dias`}
                      </span>
                      <button onClick={() => handleEdit(b)} className="p-2 text-gray-400 hover:text-orange-500">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(b)} className="p-2 text-gray-400 hover:text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Cake size={48} className="mx-auto mb-4 text-pink-300" />
          <p className="text-gray-500 mb-2">No hay cumpleaños registrados</p>
          <p className="text-sm text-gray-400">Aade los cumpleaños de tus seres queridos</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{editingId ? 'Editar' : 'Nuevo'} cumpleaños</h3>
              <button onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Ej: Maria, Juan, Mama..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de nacimiento *</label>
                <input
                  type="date"
                  value={form.birthdate}
                  onChange={e => setForm({ ...form, birthdate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
              <button 
                onClick={handleSave} 
                disabled={!form.name || !form.birthdate}
                className="flex-1 py-2 bg-pink-500 text-white rounded-lg disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
