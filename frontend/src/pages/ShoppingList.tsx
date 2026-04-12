import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Trash2, Plus, ShoppingCart, Share2, MessageCircle, Mail, Copy, X, Edit2, FolderPlus, Check } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Task {
  id: number;
  owner_id: number;
  title: string;
  description: string | null;
  completed: number;
  due_date: string | null;
  priority: string;
  is_family_task: number;
  shopping_list_id: number | null;
  created_at: string;
}

interface ShoppingList {
  id: number;
  owner_id: number;
  name: string;
  color: string;
  items: Task[];
}

const LIST_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function ShoppingList() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeListId, setActiveListId] = useState<number | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [editingItem, setEditingItem] = useState<Task | null>(null);
  
  const [listForm, setListForm] = useState({ name: '', color: '#22c55e' });
  const [itemForm, setItemForm] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/shopping-lists`, { headers });
      const data = await response.json();
      setLists(data);
      if (data.length > 0 && activeListId === null) {
        setActiveListId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
    setLoading(false);
  };

  const activeList = lists.find(l => l.id === activeListId);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listForm.name.trim()) return;

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const response = await fetch(`${API_URL}/api/shopping-lists`, {
        method: 'POST',
        headers,
        body: JSON.stringify(listForm)
      });
      const data = await response.json();
      if (data.success) {
        setLists(prev => [...prev, data.list]);
        setActiveListId(data.list.id);
      }
      setListForm({ name: '', color: '#22c55e' });
      setShowListModal(false);
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const handleUpdateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingList || !listForm.name.trim()) return;

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/shopping-lists/${editingList.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(listForm)
      });
      setLists(prev => prev.map(l => 
        l.id === editingList.id ? { ...l, ...listForm } : l
      ));
      setEditingList(null);
      setListForm({ name: '', color: '#22c55e' });
      setShowListModal(false);
    } catch (error) {
      console.error('Error updating list:', error);
    }
  };

  const handleDeleteList = async (id: number) => {
    if (!window.confirm('¿Eliminar esta lista? Los productos se moverán a "Sin lista".')) return;

    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/shopping-lists/${id}`, { method: 'DELETE', headers });
      const newLists = lists.filter(l => l.id !== id);
      setLists(newLists);
      if (activeListId === id) {
        setActiveListId(newLists.length > 0 ? newLists[0].id : null);
      }
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const openEditList = (list: ShoppingList) => {
    setEditingList(list);
    setListForm({ name: list.name, color: list.color });
    setShowListModal(true);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.title.trim()) return;

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: itemForm.title,
          description: itemForm.description,
          priority: 'normal',
          is_family_task: 0,
          shopping_list_id: activeListId
        })
      });
      setItemForm({ title: '', description: '' });
      setShowItemModal(false);
      fetchLists();
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !itemForm.title.trim()) return;

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/tasks/${editingItem.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          title: itemForm.title,
          description: itemForm.description,
          completed: editingItem.completed,
          priority: editingItem.priority,
          shopping_list_id: activeListId
        })
      });
      setEditingItem(null);
      setItemForm({ title: '', description: '' });
      setShowItemModal(false);
      fetchLists();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const toggleTask = async (id: number) => {
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/tasks/${id}/toggle`, { method: 'PUT', headers });
      fetchLists();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/tasks/${id}`, { method: 'DELETE', headers });
      fetchLists();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const clearCompletedShopping = async () => {
    if (!activeList) return;
    const completed = activeList.items.filter(t => t.completed);
    for (const task of completed) {
      try {
        const headers = getAuthHeaders();
        await fetch(`${API_URL}/api/tasks/${task.id}`, { method: 'DELETE', headers });
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
    fetchLists();
  };

  const moveItemToList = async (item: Task, targetListId: number) => {
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/tasks/${item.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          completed: item.completed,
          priority: item.priority,
          shopping_list_id: targetListId === 0 ? null : targetListId
        })
      });
      fetchLists();
    } catch (error) {
      console.error('Error moving item:', error);
    }
  };

  const generateShareText = () => {
    if (!activeList) return '';
    const pendingItems = activeList.items.filter(i => !i.completed);
    const header = `🛒 *${activeList.name}*\n\n`;
    const items = pendingItems.map((item, i) => {
      const qty = item.description ? ` (${item.description})` : '';
      return `${i + 1}. ${item.title}${qty}`;
    }).join('\n');
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
    const subject = encodeURIComponent(activeList?.name || 'Lista de la Compra');
    const body = encodeURIComponent(generateShareText().replace(/[*_]/g, ''));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const copyToClipboard = async () => {
    const text = generateShareText();
    await navigator.clipboard.writeText(text);
    alert('¡Lista copiada al portapapeles!');
  };

  const openEditItem = (item: Task) => {
    setEditingItem(item);
    setItemForm({ title: item.title, description: item.description || '' });
    setShowItemModal(true);
  };

  const pendingItems = activeList?.items.filter(i => !i.completed) || [];
  const completedItems = activeList?.items.filter(i => i.completed) || [];

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 sm:p-3 rounded-xl">
            <ShoppingCart size={24} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Lista de la Compra</h2>
            <p className="text-sm text-gray-500">{lists.length} listas</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingList(null);
            setListForm({ name: '', color: '#22c55e' });
            setShowListModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm sm:text-base"
        >
          <FolderPlus size={18} />
          <span className="hidden sm:inline">Nueva lista</span>
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {lists.map(list => (
          <div
            key={list.id}
            className={`flex-shrink-0 flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-full text-sm transition-all group ${
              activeListId === list.id
                ? 'text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
            style={activeListId === list.id ? { backgroundColor: list.color } : {}}
          >
            <button
              onClick={() => setActiveListId(list.id)}
              className="flex items-center gap-1"
            >
              {list.name}
              <span className={`text-xs ${activeListId === list.id ? 'opacity-80' : 'text-gray-400'}`}>
                ({list.items.filter(i => !i.completed).length})
              </span>
            </button>
            {list.id !== 0 && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); openEditList(list); }}
                  className={`p-1 rounded hover:bg-black/10 ${activeListId === list.id ? 'text-white/80 hover:text-white' : 'text-gray-400 hover:text-gray-600'} opacity-0 group-hover:opacity-100 transition-opacity`}
                  title="Editar lista"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}
                  className={`p-1 rounded hover:bg-black/10 ${activeListId === list.id ? 'text-white/80 hover:text-white' : 'text-gray-400 hover:text-red-500'} opacity-0 group-hover:opacity-100 transition-opacity`}
                  title="Eliminar lista"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : !activeList ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-lg text-gray-600 font-medium">Crea tu primera lista</p>
          <p className="text-sm text-gray-400 mt-1">Organiza tus compras en diferentes listas</p>
        </div>
      ) : (
        <>
          {pendingItems.length > 0 && (
            <div className="bg-white rounded-xl border p-3 sm:p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Share2 size={16} />
                  Compartir lista
                </span>
              </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={shareToWhatsApp}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              >
                <MessageCircle size={14} />
                WhatsApp
              </button>
              <button
                onClick={shareToTelegram}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Telegram
              </button>
              <button
                onClick={shareByEmail}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <Mail size={14} />
                Email
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Copy size={14} />
                Copiar
              </button>
            </div>
            </div>
          )}

          <button
            onClick={() => {
              setEditingItem(null);
              setItemForm({ title: '', description: '' });
              setShowItemModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all mb-4"
          >
            <Plus size={20} />
            Añadir producto
          </button>

          <div className="space-y-2">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-sm hover:shadow-md transition-all group"
              >
                <button
                  onClick={() => toggleTask(item.id)}
                  className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-green-500 hover:bg-green-50 transition-all"
                >
                  <Circle size={16} className="text-gray-300 group-hover:text-green-500 transition-colors" />
                </button>
                <div className="flex-1 min-w-0">
                  <span className="text-gray-800 font-medium">{item.title}</span>
                  {item.description && (
                    <p className="text-sm text-gray-400">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditItem(item)}
                    className="p-1.5 text-gray-400 hover:text-blue-500"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => deleteTask(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                  {lists.length > 1 && (
                    <select
                      onChange={(e) => moveItemToList(item, parseInt(e.target.value))}
                      className="text-xs border rounded px-1 py-0.5 text-gray-500"
                      title="Mover a otra lista"
                    >
                      <option value="">Mover a...</option>
                      {lists.filter(l => l.id !== activeListId).map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>

          {completedItems.length > 0 && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Comprados ({completedItems.length})
                </h3>
                <button
                  onClick={clearCompletedShopping}
                  className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={14} />
                  Limpiar
                </button>
              </div>
              {completedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-xl border border-gray-100 p-3 sm:p-4 flex items-center gap-3 sm:gap-4 opacity-60"
                >
                  <button
                    onClick={() => toggleTask(item.id)}
                    className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-500 flex items-center justify-center text-white"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-500 font-medium line-through">{item.title}</span>
                  </div>
                  <button
                    onClick={() => deleteTask(item.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingList ? 'Editar lista' : 'Nueva lista'}
              </h3>
              <button onClick={() => setShowListModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={editingList ? handleUpdateList : handleCreateList} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la lista *</label>
                <input
                  type="text"
                  value={listForm.name}
                  onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
                  placeholder="Ej: Compras semana, Mercadona..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {LIST_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setListForm({ ...listForm, color })}
                      className={`w-8 h-8 rounded-full transition-transform ${listForm.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    >
                      {listForm.color === color && <Check size={16} className="text-white mx-auto" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowListModal(false)}
                  className="flex-1 py-3 border rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium shadow-sm"
                >
                  {editingList ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingItem ? 'Editar producto' : 'Añadir producto'}
              </h3>
              <button onClick={() => setShowItemModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                <input
                  type="text"
                  value={itemForm.title}
                  onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                  placeholder="Ej: Leche, Pan, Huevos..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (opcional)</label>
                <input
                  type="text"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Ej: 2 litros, 500g..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 py-3 border rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium shadow-sm"
                >
                  {editingItem ? 'Guardar' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
