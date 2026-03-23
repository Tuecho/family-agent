import { useState, useEffect } from 'react';
import { StickyNote, Plus, Trash2, Edit2, X, Check, Search, Share2, FolderOpen, Settings } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Note {
  id: number;
  owner_id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CATEGORIES = ['general', 'trabajo', 'familia', 'personal', 'importante'];

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general'
  });

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ old: string; new: string } | null>(null);

  const categories = [...DEFAULT_CATEGORIES, ...customCategories.filter(c => !DEFAULT_CATEGORIES.includes(c))];

  useEffect(() => {
    fetchNotes();
    loadCustomCategories();
  }, []);

  const fetchNotes = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/notes`, { headers });
      const data = await response.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
    setLoading(false);
  };

  const loadCustomCategories = () => {
    const saved = localStorage.getItem('note_categories');
    if (saved) {
      setCustomCategories(JSON.parse(saved));
    }
  };

  const saveCustomCategories = (cats: string[]) => {
    localStorage.setItem('note_categories', JSON.stringify(cats));
    setCustomCategories(cats);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      
      if (editingNote) {
        await fetch(`${API_URL}/api/notes/${editingNote.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`${API_URL}/api/notes`, {
          method: 'POST',
          headers,
          body: JSON.stringify(formData)
        });
      }
      
      resetForm();
      fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', category: 'general' });
    setEditingNote(null);
    setShowModal(false);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      category: note.category
    });
    setShowModal(true);
  };

  const deleteNote = async (id: number) => {
    if (!window.confirm('¿Eliminar esta nota?')) return;
    
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/notes/${id}`, { method: 'DELETE', headers });
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const shareNote = (note: Note) => {
    const text = `📝 ${note.title}\n\n${note.content}\n\n— Enviado desde Family Agent`;
    const url = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: note.title,
        text: text,
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('¡Nota copiada al portapapeles!');
    }
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    const cat = newCategory.toLowerCase().trim().replace(/\s+/g, '-');
    if (categories.includes(cat)) {
      alert('Esta categoría ya existe');
      return;
    }
    saveCustomCategories([...customCategories, cat]);
    setNewCategory('');
  };

  const updateCategory = () => {
    if (!editingCategory) return;
    const oldCat = editingCategory.old;
    const newCat = editingCategory.new.toLowerCase().trim().replace(/\s+/g, '-');
    
    if (categories.includes(newCat) && newCat !== oldCat) {
      alert('Esta categoría ya existe');
      return;
    }
    
    const updated = customCategories.map(c => c === oldCat ? newCat : c);
    saveCustomCategories(updated);
    setEditingCategory(null);
  };

  const deleteCategory = (cat: string) => {
    if (!window.confirm(`¿Eliminar la categoría "${cat}"?`)) return;
    const updated = customCategories.filter(c => c !== cat);
    saveCustomCategories(updated);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'trabajo': return 'bg-blue-100 text-blue-700';
      case 'familia': return 'bg-purple-100 text-purple-700';
      case 'personal': return 'bg-green-100 text-green-700';
      case 'importante': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: 'General',
      trabajo: 'Trabajo',
      familia: 'Familia',
      personal: 'Personal',
      importante: 'Importante'
    };
    return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-100 p-3 rounded-xl">
            <StickyNote size={28} className="text-yellow-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Notas</h2>
            <p className="text-sm text-gray-500">
              {notes.length} notas guardadas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoriesModal(true)}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
            title="Gestionar categorías"
          >
            <FolderOpen size={20} />
            <span className="hidden sm:inline">Categorías</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2.5 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nueva Nota</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        >
          <option value="all">Todas las categorías</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg text-gray-600 font-medium">No hay notas</p>
          <p className="text-sm text-gray-400 mt-1">Crea una nota para empezar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(note.category)}`}>
                  {getCategoryLabel(note.category)}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => shareNote(note)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Compartir"
                  >
                    <Share2 size={14} />
                  </button>
                  <button
                    onClick={() => openEditModal(note)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-800 mb-2">{note.title}</h3>
              
              {note.content && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-3 whitespace-pre-wrap">
                  {note.content}
                </p>
              )}
              
              <p className="text-xs text-gray-400">
                Actualizado: {formatDate(note.updated_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {showCategoriesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FolderOpen size={20} className="text-yellow-500" />
                Gestionar Categorías
              </h3>
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva categoría
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nombre de la categoría..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                  />
                  <button
                    onClick={addCategory}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Categorías por defecto</h4>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_CATEGORIES.map(cat => (
                    <span
                      key={cat}
                      className={`px-3 py-1 rounded-full text-sm ${getCategoryColor(cat)}`}
                    >
                      {getCategoryLabel(cat)}
                    </span>
                  ))}
                </div>
              </div>

              {customCategories.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Categorías personalizadas</h4>
                  <div className="space-y-2">
                    {customCategories.map(cat => (
                      <div key={cat} className="flex items-center gap-2">
                        {editingCategory?.old === cat ? (
                          <>
                            <input
                              type="text"
                              value={editingCategory.new}
                              onChange={(e) => setEditingCategory({ ...editingCategory, new: e.target.value })}
                              className="flex-1 px-3 py-1 border rounded-lg text-sm"
                              autoFocus
                              onKeyPress={(e) => e.key === 'Enter' && updateCategory()}
                            />
                            <button
                              onClick={updateCategory}
                              className="p-1 text-green-500 hover:text-green-600"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className={`flex-1 px-3 py-1 rounded-lg text-sm ${getCategoryColor(cat)}`}>
                              {getCategoryLabel(cat)}
                            </span>
                            <button
                              onClick={() => setEditingCategory({ old: cat, new: cat })}
                              className="p-1 text-gray-400 hover:text-blue-500"
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteCategory(cat)}
                              className="p-1 text-gray-400 hover:text-red-500"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowCategoriesModal(false)}
              className="w-full mt-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingNote ? 'Editar Nota' : 'Nueva Nota'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título de la nota..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenido
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Escribe tu nota aquí..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none min-h-[150px]"
                  rows={5}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 border rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 font-medium shadow-sm flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  {editingNote ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
