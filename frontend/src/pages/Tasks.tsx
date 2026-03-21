import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Trash2, Plus, ShoppingCart, ListTodo, Calendar, AlertCircle, Share2, MessageCircle, Mail, Copy } from 'lucide-react';
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
  created_at: string;
}

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'shopping' | 'tasks'>('shopping');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'shopping' | 'task'>('shopping');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'normal'
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/tasks`, { headers });
      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const dataToSend = {
        ...formData,
        priority: modalType === 'task' ? (formData.priority || 'medium') : 'normal'
      };
      await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(dataToSend)
      });
      setFormData({ title: '', description: '', due_date: '', priority: 'normal' });
      setShowModal(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const openModal = (type: 'shopping' | 'task') => {
    setModalType(type);
    setFormData({ 
      title: '', 
      description: '', 
      due_date: '', 
      priority: type === 'task' ? 'medium' : 'normal' 
    });
    setShowModal(true);
  };

  const toggleTask = async (id: number) => {
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/tasks/${id}/toggle`, { method: 'PUT', headers });
      fetchTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/tasks/${id}`, { method: 'DELETE', headers });
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const clearCompleted = async (type: 'shopping' | 'task') => {
    const itemsToClear = tasks.filter(t => t.completed && 
      (type === 'shopping' ? !t.due_date : !!t.due_date || t.priority !== 'normal')
    );
    
    for (const task of itemsToClear) {
      if (type === 'shopping' && !task.due_date && task.priority === 'normal') {
        try {
          const headers = getAuthHeaders();
          await fetch(`${API_URL}/api/tasks/${task.id}`, { method: 'DELETE', headers });
        } catch (error) {
          console.error('Error deleting task:', error);
        }
      }
    }
    fetchTasks();
  };

  const shoppingItems = tasks.filter(t => !t.due_date && t.priority === 'normal');
  const familyTasks = tasks.filter(t => t.due_date || t.priority !== 'normal');
  
  const getTaskType = (task: Task) => {
    if (task.due_date || task.priority !== 'normal') return 'family';
    return 'shopping';
  };
  
  const pendingShopping = shoppingItems.filter(t => !t.completed);
  const completedShopping = shoppingItems.filter(t => t.completed);
  
  const pendingFamilyTasks = familyTasks.filter(t => !t.completed);
  const completedFamilyTasks = familyTasks.filter(t => t.completed);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      default: return 'Normal';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Hoy';
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Mañana';
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  };

  const generateShareText = () => {
    const header = '🛒 *Lista de la Compra*\n\n';
    const items = pendingShopping.map((item, i) => {
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
    const subject = encodeURIComponent('Lista de la Compra');
    const body = encodeURIComponent(generateShareText().replace(/[*_]/g, ''));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const copyToClipboard = async () => {
    const text = generateShareText().replace(/[*_]/g, '');
    await navigator.clipboard.writeText(text);
    alert('¡Lista copiada al portapapeles!');
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-xl">
            <ListTodo size={28} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Tareas y Lista</h2>
            <p className="text-sm text-gray-500">
              {pendingShopping.length + pendingFamilyTasks.length} tareas pendientes
            </p>
          </div>
        </div>
        <button
          onClick={() => openModal(activeTab)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">{activeTab === 'shopping' ? 'Añadir' : 'Nueva Tarea'}</span>
        </button>
      </div>

      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('shopping')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'shopping'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ShoppingCart size={20} />
          <span>Lista de la Compra</span>
          {pendingShopping.length > 0 && (
            <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
              {pendingShopping.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'tasks'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ListTodo size={20} />
          <span>Tareas Familiares</span>
          {pendingFamilyTasks.length > 0 && (
            <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
              {pendingFamilyTasks.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : (
        <>
          {activeTab === 'shopping' && (
            <div>
              {shoppingItems.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-lg text-gray-600 font-medium">Tu lista está vacía</p>
                  <p className="text-sm text-gray-400 mt-1">Añade productos para empezar tu compra</p>
                </div>
              ) : (
                <>
                  {pendingShopping.length > 0 && (
                    <div className="bg-white rounded-xl border p-4 mb-6 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <Share2 size={16} />
                          Compartir lista
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={shareToWhatsApp}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                        >
                          <MessageCircle size={16} />
                          WhatsApp
                        </button>
                        <button
                          onClick={shareToTelegram}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                          </svg>
                          Telegram
                        </button>
                        <button
                          onClick={shareByEmail}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                        >
                          <Mail size={16} />
                          Email
                        </button>
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          <Copy size={16} />
                          Copiar
                        </button>
                      </div>
                    </div>
                  )}

                  {pendingShopping.length > 0 && (
                    <div className="space-y-2 mb-8">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Por comprar ({pendingShopping.length})
                      </h3>
                      {pendingShopping.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white rounded-xl border p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all group"
                        >
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-green-500 hover:bg-green-50 transition-all"
                          >
                            <Circle size={20} className="text-gray-300 group-hover:text-green-500 transition-colors" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-800 font-medium text-lg">{task.title}</span>
                            {task.description && (
                              <p className="text-sm text-gray-400">{task.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {completedShopping.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                          Comprados ({completedShopping.length})
                        </h3>
                        <button
                          onClick={() => clearCompleted('shopping')}
                          className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                        >
                          <Trash2 size={14} />
                          Limpiar
                        </button>
                      </div>
                      {completedShopping.map((task) => (
                        <div
                          key={task.id}
                          className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center gap-4 opacity-60"
                        >
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-500 font-medium line-through">{task.title}</span>
                          </div>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-gray-300 hover:text-red-500 transition-all p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              {familyTasks.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-lg text-gray-600 font-medium">No hay tareas familiares</p>
                  <p className="text-sm text-gray-400 mt-1">Añade tareas como "Lavar la ropa", "Ir al médico"...</p>
                </div>
              ) : (
                <>
                  {pendingFamilyTasks.length > 0 && (
                    <div className="space-y-2 mb-8">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Pendientes ({pendingFamilyTasks.length})
                      </h3>
                      {pendingFamilyTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white rounded-xl border p-4 flex items-start gap-4 shadow-sm hover:shadow-md transition-all group"
                        >
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-green-500 hover:bg-green-50 transition-all mt-0.5"
                          >
                            <Circle size={20} className="text-gray-300 group-hover:text-green-500 transition-colors" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-gray-800 font-medium text-lg">{task.title}</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${getPriorityColor(task.priority)}`}>
                                {getPriorityLabel(task.priority)}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                            )}
                            {task.due_date && (
                              <div className={`flex items-center gap-1 mt-2 text-sm ${
                                isOverdue(task.due_date) ? 'text-red-500' : 'text-gray-400'
                              }`}>
                                <Calendar size={14} />
                                <span>{formatDate(task.due_date)}</span>
                                {isOverdue(task.due_date) && (
                                  <span className="flex items-center gap-1 ml-2 text-red-500">
                                    <AlertCircle size={14} />
                                    Atrasada
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {completedFamilyTasks.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                          Completadas ({completedFamilyTasks.length})
                        </h3>
                        <button
                          onClick={() => clearCompleted('tasks')}
                          className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                        >
                          <Trash2 size={14} />
                          Limpiar
                        </button>
                      </div>
                      {completedFamilyTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center gap-4 opacity-60"
                        >
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-500 font-medium line-through">{task.title}</span>
                            {task.due_date && (
                              <div className="flex items-center gap-1 mt-1 text-sm text-gray-400">
                                <Calendar size={14} />
                                <span>{formatDate(task.due_date)}</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-gray-300 hover:text-red-500 transition-all p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {modalType === 'shopping' ? 'Añadir producto' : 'Nueva Tarea'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {modalType === 'shopping' ? 'Producto *' : 'Título *'}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={modalType === 'shopping' ? 'Ej: Leche, Pan, Huevos...' : 'Ej: Lavar la ropa, Ir al médico...'}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {modalType === 'shopping' ? 'Cantidad (opcional)' : 'Descripción (opcional)'}
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={modalType === 'shopping' ? 'Ej: 2 litros, 500g...' : 'Detalles adicionales...'}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {modalType === 'task' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="normal">Normal</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ title: '', description: '', due_date: '', priority: 'normal' });
                  }}
                  className="flex-1 py-3 border rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 font-medium shadow-sm"
                >
                  {modalType === 'shopping' ? 'Añadir' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
