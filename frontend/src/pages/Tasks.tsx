import { useState, useEffect, useRef } from 'react';
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
  is_family_task: number;
  created_at: string;
}

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const modalTypeRef = useRef<'shopping' | 'task'>('shopping');
  
  const [shoppingForm, setShoppingForm] = useState({
    title: '',
    description: ''
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium'
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

  const handleShoppingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shoppingForm.title.trim()) return;

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: shoppingForm.title,
          description: shoppingForm.description,
          priority: 'normal',
          is_family_task: 0
        })
      });
      setShoppingForm({ title: '', description: '' });
      setShowShoppingModal(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating shopping item:', error);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: taskForm.title,
          description: taskForm.description,
          due_date: taskForm.due_date,
          priority: taskForm.priority,
          is_family_task: 1
        })
      });
      setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' });
      setShowTaskModal(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
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

  const clearCompletedShopping = async () => {
    const completed = tasks.filter(t => !t.is_family_task && t.completed);
    for (const task of completed) {
      try {
        const headers = getAuthHeaders();
        await fetch(`${API_URL}/api/tasks/${task.id}`, { method: 'DELETE', headers });
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
    fetchTasks();
  };

  const clearCompletedTasks = async () => {
    const completed = tasks.filter(t => t.is_family_task && t.completed);
    for (const task of completed) {
      try {
        const headers = getAuthHeaders();
        await fetch(`${API_URL}/api/tasks/${task.id}`, { method: 'DELETE', headers });
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
    fetchTasks();
  };

  const shoppingItems = tasks.filter(t => !t.is_family_task);
  const familyTasks = tasks.filter(t => t.is_family_task);
  
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

  const generateTasksShareText = () => {
    const header = '📋 *Tareas Familiares*\n\n';
    const items = pendingFamilyTasks.map((task, i) => {
      const priority = task.priority !== 'normal' ? ` [${getPriorityLabel(task.priority)}]` : '';
      const date = task.due_date ? ` - ${formatDate(task.due_date)}` : '';
      return `${i + 1}. ${task.title}${priority}${date}`;
    }).join('\n');
    const footer = '\n---\nEnviado desde Family Agent';
    return header + items + footer;
  };

  const shareTasksToWhatsApp = () => {
    const text = encodeURIComponent(generateTasksShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareTasksToTelegram = () => {
    const text = encodeURIComponent(generateTasksShareText());
    window.open(`https://t.me/share/url?url=&text=${text}`, '_blank');
  };

  const shareTasksByEmail = () => {
    const subject = encodeURIComponent('Tareas Familiares');
    const body = encodeURIComponent(generateTasksShareText().replace(/[*_]/g, ''));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const copyTasksToClipboard = async () => {
    const text = generateTasksShareText().replace(/[*_]/g, '');
    await navigator.clipboard.writeText(text);
    alert('¡Tareas copiadas al portapapeles!');
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-xl">
              <ShoppingCart size={28} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Lista de la Compra</h2>
              <p className="text-sm text-gray-500">
                {pendingShopping.length} productos por comprar
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowShoppingModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Añadir</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : shoppingItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-lg text-gray-600 font-medium">Tu lista está vacía</p>
            <p className="text-sm text-gray-400 mt-1">Añade productos para empezar tu compra</p>
          </div>
        ) : (
          <>
            {pendingShopping.length > 0 && (
              <div className="bg-white rounded-xl border p-4 mb-4 shadow-sm">
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

            <div className="space-y-2">
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

            {completedShopping.length > 0 && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Comprados ({completedShopping.length})
                  </h3>
                  <button
                    onClick={clearCompletedShopping}
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

      <div className="border-t-2 border-dashed border-gray-200 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-xl">
              <ListTodo size={28} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Tareas Familiares</h2>
              <p className="text-sm text-gray-500">
                {pendingFamilyTasks.length} tareas pendientes
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' });
              setShowTaskModal(true);
            }}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nueva Tarea</span>
          </button>
        </div>

        {familyTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg text-gray-600 font-medium">No hay tareas familiares</p>
            <p className="text-sm text-gray-400 mt-1">Añade tareas como "Lavar la ropa", "Ir al médico"...</p>
          </div>
        ) : (
          <>
            {pendingFamilyTasks.length > 0 && (
              <div className="bg-white rounded-xl border p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Share2 size={16} />
                    Compartir tareas
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={shareTasksToWhatsApp}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </button>
                  <button
                    onClick={shareTasksToTelegram}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Telegram
                  </button>
                  <button
                    onClick={shareTasksByEmail}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <Mail size={16} />
                    Email
                  </button>
                  <button
                    onClick={copyTasksToClipboard}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <Copy size={16} />
                    Copiar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
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

            {completedFamilyTasks.length > 0 && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Completadas ({completedFamilyTasks.length})
                  </h3>
                  <button
                    onClick={clearCompletedTasks}
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

      {showShoppingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Añadir producto</h3>
            <form onSubmit={handleShoppingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                <input
                  type="text"
                  value={shoppingForm.title}
                  onChange={(e) => setShoppingForm({ ...shoppingForm, title: e.target.value })}
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
                  value={shoppingForm.description}
                  onChange={(e) => setShoppingForm({ ...shoppingForm, description: e.target.value })}
                  placeholder="Ej: 2 litros, 500g..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowShoppingModal(false);
                    setShoppingForm({ title: '', description: '' });
                  }}
                  className="flex-1 py-3 border rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium shadow-sm"
                >
                  Añadir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Nueva Tarea</h3>
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Ej: Lavar la ropa, Ir al médico..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <input
                  type="text"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Detalles adicionales..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="normal">Normal</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskModal(false);
                    setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' });
                  }}
                  className="flex-1 py-3 border rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium shadow-sm"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
