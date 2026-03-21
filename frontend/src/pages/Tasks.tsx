import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Trash2, Plus, ShoppingCart, Trash } from 'lucide-react';
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
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: ''
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
      await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...formData, priority: 'normal' })
      });
      setFormData({ title: '', description: '' });
      setShowModal(false);
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

  const clearCompleted = async () => {
    const completedTasks = tasks.filter(t => t.completed);
    for (const task of completedTasks) {
      try {
        const headers = getAuthHeaders();
        await fetch(`${API_URL}/api/tasks/${task.id}`, { method: 'DELETE', headers });
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
    fetchTasks();
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-xl">
            <ShoppingCart size={28} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Lista de la Compra</h2>
            <p className="text-sm text-gray-500">
              {pendingTasks.length} productos por comprar
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Añadir</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-lg text-gray-600 font-medium">Tu lista está vacía</p>
          <p className="text-sm text-gray-400 mt-1">Añade productos para empezar tu compra</p>
        </div>
      ) : (
        <>
          {pendingTasks.length > 0 && (
            <div className="space-y-2 mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Por comprar ({pendingTasks.length})
              </h3>
              {pendingTasks.map((task) => (
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
                    <span className="text-gray-800 font-medium text-lg">
                      {task.title}
                    </span>
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

          {completedTasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Comprados ({completedTasks.length})
                </h3>
                <button
                  onClick={clearCompleted}
                  className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <Trash size={14} />
                  Limpiar
                </button>
              </div>
              {completedTasks.map((task) => (
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
                    <span className="text-gray-500 font-medium line-through">
                      {task.title}
                    </span>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Añadir producto</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Leche, Pan, Huevos..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (opcional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej: 2 litros, 500g, 1 docena..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ title: '', description: '' });
                  }}
                  className="flex-1 py-3 border rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 font-medium shadow-sm"
                >
                  Añadir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
