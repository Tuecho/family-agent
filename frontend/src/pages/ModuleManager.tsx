import { useState, useEffect } from 'react';
import { Settings, GripVertical } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

const MODULE_LIST = [
  { key: 'sales', label: 'Ventas', icon: '💵' },
  { key: 'howitworks', label: 'Como funciona', icon: '📖' },
  { key: 'about', label: 'Acerca de', icon: 'ℹ️' },
  { key: 'terms', label: 'Terminos', icon: '📄' },
  { key: 'privacy', label: 'Privacidad', icon: '🔒' },
  { key: 'agenda', label: 'Agenda', icon: '📅' },
  { key: 'shopping', label: 'Lista Compra', icon: '🛒' },
  { key: 'tasks', label: 'Tareas', icon: '✅' },
  { key: 'habits', label: 'Habitos', icon: '🎯' },
  { key: 'notes', label: 'Notas', icon: '📝' },
  { key: 'meals', label: 'Comidas', icon: '🍽️' },
  { key: 'books_movies', label: 'Libros y Peliculas', icon: '📚' },
  { key: 'gifts', label: 'Regalos', icon: '🎁' },
  { key: 'restaurants', label: 'Restaurantes', icon: '🍴' },
  { key: 'contacts', label: 'Contactos', icon: '👥' },
  { key: 'gallery', label: 'Galeria', icon: '🖼️' },
  { key: 'chatbot', label: 'Chat IA', icon: '🤖' },
  { key: 'home_inventory', label: 'Inventario Hogar', icon: '🏠' },
  { key: 'home_maintenance', label: 'Mantenimiento', icon: '🔧' },
  { key: 'subscriptions', label: 'Suscripciones', icon: '📺' },
  { key: 'travel_manager', label: 'Viajes', icon: '✈️' },
  { key: 'savings_goals', label: 'Ahorros', icon: '🐷' },
  { key: 'internal_debts', label: 'Deudas', icon: '💳' },
  { key: 'utility_bills', label: 'Facturas', icon: '⚡' },
  { key: 'pet_tracker', label: 'Mascotas', icon: '🐕' },
  { key: 'extra_school', label: 'Educacion', icon: '🎓' },
  { key: 'birthdays', label: 'Cumpleanos', icon: '🎂' },
  { key: 'accounting', label: 'Contabilidad', icon: '💰' },
  { key: 'budgets', label: 'Presupuestos', icon: '📊' },
  { key: 'work_hours', label: 'Horas Trabajo', icon: '⏰' },
  { key: 'interesting_places', label: 'Lugares de Interés', icon: '📍' },
  { key: 'family_organization', label: 'Org. Familiar', icon: '👨‍👩‍👧‍👦' },
  { key: 'anniversaries', label: 'Aniversarios', icon: '🗓️' },
  { key: 'indulgences', label: 'Indulgencias', icon: '🕊️' },
].sort((a, b) => a.label.localeCompare(b.label));

const DEFAULT_MODULES = ['dashboard', 'agenda', 'accounting', 'birthdays', 'anniversaries', 'habits', 'shopping', 'notes', 'tasks'];

export function ModuleManager() {
  const [enabledModules, setEnabledModules] = useState<string[]>(DEFAULT_MODULES);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [globalHiddenModules, setGlobalHiddenModules] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/profile`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        const saved = (data.enabled_modules || '').split(',').filter(Boolean);
        setEnabledModules(saved.length > 0 ? saved : DEFAULT_MODULES);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    fetch(`${API_URL}/api/global-hidden-modules`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => setGlobalHiddenModules(data))
      .catch(console.error);
  }, []);

  const toggleModule = async (moduleKey: string) => {
    const isEnabled = enabledModules.includes(moduleKey);
    let newModules: string[];
    
    if (isEnabled) {
      newModules = enabledModules.filter(m => m !== moduleKey);
    } else {
      newModules = [...enabledModules, moduleKey];
    }
    
    setEnabledModules(newModules);
    await saveModules(newModules);
  };

  const saveModules = async (modules: string[]) => {
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ enabled_modules: modules.join(',') })
      });
      localStorage.setItem('profile_refresh', Date.now().toString());
      window.dispatchEvent(new Event('profile_updated'));
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, moduleKey: string) => {
    setDraggedItem(moduleKey);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', moduleKey);
  };

  const handleDragOver = (e: React.DragEvent, moduleKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(moduleKey);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetKey) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const currentModules = [...enabledModules];
    const fromIndex = currentModules.indexOf(draggedItem);
    const toIndex = currentModules.indexOf(targetKey);

    if (fromIndex !== -1 && toIndex !== -1) {
      currentModules.splice(fromIndex, 1);
      currentModules.splice(toIndex, 0, draggedItem);
      
      setEnabledModules(currentModules);
      saveModules(currentModules);
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  if (loading) {
    return <div className="p-6 text-center">Cargando...</div>;
  }

  const enabledModuleData = enabledModules
    .filter(key => key !== 'dashboard')
    .map(key => MODULE_LIST.find(m => m.key === key))
    .filter(Boolean);

  const disabledModules = MODULE_LIST.filter(m => !enabledModules.includes(m.key));

  const globalHiddenSet = new Set(globalHiddenModules);

  const visibleEnabledModules = enabledModuleData.filter(m => !globalHiddenSet.has(m!.key));

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Modulos</h1>
            <p className="text-sm text-gray-500">Activa y ordena los modulos a tu gusto</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-700">
            <strong>Nota:</strong> Dashboard siempre esta activo. Arrastra los modulos para ordenarlos. Los modulos activados aparecen con borde azul.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Modulos activos (arrastra para ordenar)</h3>
          <div className="space-y-2">
            {visibleEnabledModules.map((module) => {
              if (!module) return null;
              return (
                <div
                  key={module.key}
                  draggable
                  onDragStart={(e) => handleDragStart(e, module.key)}
                  onDragOver={(e) => handleDragOver(e, module.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, module.key)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-move ${
                    draggedItem === module.key ? 'opacity-50' : ''
                  } ${
                    dragOverItem === module.key ? 'border-primary bg-primary/10' : 'border-primary bg-primary/5'
                  }`}
                >
                  <GripVertical size={20} className="text-gray-400" />
                  <span className="text-xl">{module.icon}</span>
                  <span className="flex-1 font-medium text-gray-700 text-sm">{module.label}</span>
                  <button
                    onClick={() => toggleModule(module.key)}
                    style={{
                      backgroundColor: '#ef4444',
                    }}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  >
                    <span
                      style={{
                        transform: 'translateX(1.375rem)',
                      }}
                      className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Modulos disponibles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {disabledModules.filter(m => !globalHiddenSet.has(m.key)).map((module) => {
              return (
                <div
                  key={module.key}
                  className="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all"
                >
                  <span className="text-xl">{module.icon}</span>
                  <span className="flex-1 font-medium text-gray-700 text-sm">{module.label}</span>
                  <button
                    onClick={() => toggleModule(module.key)}
                    style={{
                      backgroundColor: '#d1d5db',
                    }}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  >
                    <span
                      style={{
                        transform: 'translateX(0.125rem)',
                      }}
                      className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Los cambios se guardan automaticamente
          </p>
        </div>
      </div>
    </div>
  );
}
