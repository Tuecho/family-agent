import { useState, useEffect } from 'react';
import { MapPin, Plus, X, Star, Phone, BookOpen, Trash2, Edit2, Camera, Share2, Mail, Copy } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface InterestingPlace {
  id: string;
  owner_id: number;
  name: string;
  description: string;
  location: string;
  category: string;
  visit_date: string;
  rating: number;
  notes: string;
  image_url: string;
  created_at: string;
}

export function SitesOfInterest() {
  const [places, setPlaces] = useState<InterestingPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    category: '',
    visit_date: '',
    rating: 0,
    notes: '',
    image_url: ''
  });
  
  const [showCategorySettings, setShowCategorySettings] = useState(false);
  const [editingCategoriesText, setEditingCategoriesText] = useState("");
  
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('sites_categories');
    if (saved) return JSON.parse(saved);
    return [
      'Monumento', 'Museo', 'Parque', 'Playa', 'Montaña',
      'Castillo', 'Ciudad', 'Pueblo', 'Jardín', 'Edificio Histórico',
      'Otro'
    ];
  });

  const saveCustomCategories = (cats: string[]) => {
    setCustomCategories(cats);
    localStorage.setItem('sites_categories', JSON.stringify(cats));
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/interesting-places`, { headers });
      const data = await response.json();
      setPlaces(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching places:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      
      let response;
      if (editingId) {
        response = await fetch(`${API_URL}/api/interesting-places/${editingId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(form)
        });
      } else {
        response = await fetch(`${API_URL}/api/interesting-places`, {
          method: 'POST',
          headers,
          body: JSON.stringify(form)
        });
      }
      
      if (!response.ok) {
        const error = await response.json();
        alert('Error: ' + (error.error || 'Error desconocido'));
        return;
      }
      
      setForm({ name: '', description: '', location: '', category: '', visit_date: '', rating: 0, notes: '', image_url: '' });
      setShowModal(false);
      setEditingId(null);
      fetchPlaces();
    } catch (error) {
      console.error('Error saving place:', error);
      alert('Error de conexión: ' + error);
    }
  };

  const handleEdit = (place: InterestingPlace) => {
    setForm({
      name: place.name,
      description: place.description || '',
      location: place.location || '',
      category: place.category || '',
      visit_date: place.visit_date || '',
      rating: place.rating || 0,
      notes: place.notes || '',
      image_url: place.image_url || ''
    });
    setEditingId(place.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este lugar?')) return;
    
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/interesting-places/${id}`, {
        method: 'DELETE',
        headers
      });
      fetchPlaces();
    } catch (error) {
      console.error('Error deleting place:', error);
    }
  };

  const openNewModal = () => {
    setForm({ name: '', description: '', location: '', category: '', visit_date: '', rating: 0, notes: '', image_url: '' });
    setEditingId(null);
    setShowModal(true);
  };

  const generateShareText = () => {
    if (places.length === 0) return '';
    const header = '📍 *Lugares de Interés*\n\n';
    const items = places.map((place, i) => {
      const rating = place.rating > 0 ? ` ⭐${place.rating}/5` : '';
      const location = place.location ? ` 📍${place.location}` : '';
      const category = place.category ? ` (${place.category})` : '';
      return `${i + 1}. *${place.name}*${category}${rating}${location}\n   ${place.description || ''}`;
    }).join('\n\n');
    const footer = '\n---\nEnviado desde Family Agent';
    return header + items + footer;
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://t.me/share/url?url=&text=${text}`, '_blank');
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent('Lugares de Interés - Family Agent');
    const body = encodeURIComponent(generateShareText().replace(/[*_]/g, ''));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const copyToClipboard = async () => {
    const text = generateShareText().replace(/[*_]/g, '');
    await navigator.clipboard.writeText(text);
    alert('¡Lista copiada al portapapeles!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <MapPin className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Lugares de Interés</h1>
            <p className="text-gray-500 text-sm">Comparte sitios que has visitado o quieres visitar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {places.length > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Share2 size={18} />
                <span>Compartir</span>
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[160px]">
                <button onClick={shareToWhatsApp} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
                  <span>WhatsApp</span>
                </button>
                <button onClick={shareToTelegram} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
                  <span>Telegram</span>
                </button>
                <button onClick={shareByEmail} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
                  <Mail size={14} />
                  <span>Email</span>
                </button>
                <button onClick={copyToClipboard} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
                  <Copy size={14} />
                  <span>Copiar</span>
                </button>
              </div>
            </div>
          )}
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            <span>Nuevo</span>
          </button>
        </div>
      </div>

      {places.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No tienes lugares de interés</p>
          <button
            onClick={openNewModal}
            className="mt-4 text-primary hover:underline"
          >
            Añadir tu primer lugar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((place) => (
            <div
              key={place.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{place.name}</h3>
                  {place.category && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {place.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(place)}
                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(place.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {place.description && (
                  <p className="line-clamp-2">{place.description}</p>
                )}
                {place.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{place.location}</span>
                  </div>
                )}
                {place.visit_date && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Visitado:</span>
                    <span>{new Date(place.visit_date).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
                {place.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span>{place.rating}/5</span>
                  </div>
                )}
                {place.notes && (
                  <div className="flex items-start gap-2">
                    <BookOpen size={14} className="text-gray-400 mt-0.5" />
                    <span className="line-clamp-2">{place.notes}</span>
                  </div>
                )}
                {place.image_url && (
                  <div className="mt-2">
                    <img 
                      src={place.image_url} 
                      alt={place.name}
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Editar Lugar' : 'Nuevo Lugar de Interés'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingId(null); }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Nombre del lugar"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Categoría
                  </label>
                  <button 
                    type="button"
                    onClick={() => {
                        setEditingCategoriesText(customCategories.join('\n'));
                        setShowCategorySettings(true);
                    }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Editar categorías
                  </button>
                </div>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Seleccionar...</option>
                  {customCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Descripción del lugar..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Dirección o ubicación"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de visita
                </label>
                <input
                  type="date"
                  value={form.visit_date}
                  onChange={(e) => setForm({ ...form, visit_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valoración
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setForm({ ...form, rating: star })}
                      className="p-1"
                    >
                      <Star
                        size={24}
                        className={star <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de imagen
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Notas sobre el lugar..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingId(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  {editingId ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategorySettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Editar Categorías</h2>
              <button
                onClick={() => setShowCategorySettings(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-3">Introduce una categoría por línea:</p>
              <textarea
                value={editingCategoriesText}
                onChange={(e) => setEditingCategoriesText(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowCategorySettings(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const newCats = editingCategoriesText.split('\n').map(c => c.trim()).filter(Boolean);
                  saveCustomCategories(newCats);
                  setShowCategorySettings(false);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
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