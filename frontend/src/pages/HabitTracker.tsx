import { useState, useEffect } from 'react';
import { Plus, Check, Edit2, Trash2, ArrowLeft, ArrowRight, Target, Pill, Apple, BookOpen, Dumbbell, Moon, Coffee, Heart, Clock, Folder, ChevronDown, ChevronRight, X, FolderPlus, Cross, Languages, Music, Sparkles, Code, Briefcase, Utensils, Footprints, Smile, Users, Baby, Dog, Cat, Palette, GraduationCap, Laptop, UtensilsCrossed, HeartHandshake } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface HabitCategory {
  id: number;
  name: string;
  color: string;
}

interface Habit {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  target_type: string;
  target_value: number;
  recurrence: string;
  category_id: number | null;
  specific_days: string | null;
  start_date: string | null;
}

interface HabitLog {
  id: number;
  habit_id: number;
  date: string;
  value: number;
  completed: number;
}

const ICONS = [
  { key: 'pill', icon: Pill, label: 'Medicación' },
  { key: 'apple', icon: Apple, label: 'Fruta/Comida' },
  { key: 'book', icon: BookOpen, label: 'Lectura' },
  { key: 'dumbbell', icon: Dumbbell, label: 'Gimnasio/Ejercicio' },
  { key: 'moon', icon: Moon, label: 'Dormir' },
  { key: 'coffee', icon: Coffee, label: 'Desayuno' },
  { key: 'heart', icon: Heart, label: 'Salud' },
  { key: 'cross', icon: Cross, label: 'Religioso' },
  { key: 'languages', icon: Languages, label: 'Idiomas' },
  { key: 'music', icon: Music, label: 'Música' },
  { key: 'code', icon: Code, label: 'Programación' },
  { key: 'laptop', icon: Laptop, label: 'Trabajo/Estudio' },
  { key: 'graduation', icon: GraduationCap, label: 'Universidad/Cursos' },
  { key: 'briefcase', icon: Briefcase, label: 'Trabajo' },
  { key: 'sparkles', icon: Sparkles, label: 'Meditación/Mental' },
  { key: 'utensils', icon: Utensils, label: 'Comida/Cocina' },
  { key: 'footprints', icon: Footprints, label: 'Caminar/Paseo' },
  { key: 'smile', icon: Smile, label: 'Bienestar' },
  { key: 'users', icon: Users, label: 'Social/Amigos' },
  { key: 'baby', icon: Baby, label: 'Cuidado de niños' },
  { key: 'dog', icon: Dog, label: 'Mascota' },
  { key: 'cat', icon: Cat, label: 'Mascota' },
  { key: 'palette', icon: Palette, label: 'Arte/Creatividad' },
  { key: 'handshake', icon: HeartHandshake, label: 'Relaciones' },
  { key: 'target', icon: Target, label: 'Otro' },
];

const COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
];

const RECURRENCE_OPTIONS = [
  { key: 'daily', label: 'Todos los días' },
  { key: 'weekdays', label: 'Lunes a viernes' },
  { key: 'weekends', label: 'Fines de semana' },
  { key: 'weekly', label: 'Una vez a la semana' },
  { key: 'biweekly', label: 'Cada 2 semanas' },
  { key: 'specific', label: 'Días específicos' },
];

const DAYS_OF_WEEK = [
  { key: 0, label: 'Dom' },
  { key: 1, label: 'Lun' },
  { key: 2, label: 'Mar' },
  { key: 3, label: 'Mié' },
  { key: 4, label: 'Jue' },
  { key: 5, label: 'Vie' },
  { key: 6, label: 'Sáb' },
];

function getDaysOfWeek(recurrence: string, specificDays?: string | null): number[] {
  switch (recurrence) {
    case 'daily': return [0, 1, 2, 3, 4, 5, 6];
    case 'weekdays': return [1, 2, 3, 4, 5];
    case 'weekends': return [0, 6];
    case 'specific': 
    case 'weekly':
    case 'biweekly':
      if (specificDays) {
        try {
          return JSON.parse(specificDays);
        } catch {
          return [];
        }
      }
      return [];
    default: return [0, 1, 2, 3, 4, 5, 6];
  }
}

function shouldShowHabitToday(habit: Habit, checkDate?: Date): boolean {
  const dateToCheck = checkDate || new Date();
  const dayOfWeek = dateToCheck.getDay();
  console.log('[shouldShowHabitToday] habit:', habit.name, 'recurrence:', habit.recurrence, 'specific_days:', habit.specific_days, 'checkDate:', dateToCheck.toDateString(), 'dayOfWeek (0=Dom,6=Sáb):', dayOfWeek);
  const days = getDaysOfWeek(habit.recurrence, habit.specific_days);
  console.log('[shouldShowHabitToday] days:', days, 'includes dayOfWeek:', days.includes(dayOfWeek), 'days.length:', days.length);
  
  if (habit.recurrence === 'biweekly') {
    if (!habit.start_date) {
      const today = new Date();
      habit.start_date = today.toISOString().split('T')[0];
    }
    const startDate = new Date(habit.start_date);
    const diffTime = dateToCheck.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weeksDiff = Math.floor(diffDays / 14);
    const isEvenWeek = weeksDiff % 2 === 0;
    const result = days.length > 0 && days.includes(dayOfWeek) && isEvenWeek;
    console.log('[shouldShowHabitToday] biweekly check:', { startDate: habit.start_date, diffDays, weeksDiff, isEvenWeek, result });
    return result;
  }
  
  const result = days.length > 0 && days.includes(dayOfWeek);
  console.log('[shouldShowHabitToday] result:', result);
  return result;
}

export function HabitTracker() {
  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<number, HabitLog>>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editingCategory, setEditingCategory] = useState<HabitCategory | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [showMoveMenu, setShowMoveMenu] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'pill',
    color: '#22c55e',
    target_type: 'boolean',
    target_value: 1,
    recurrence: 'daily',
    category_id: null as number | null,
    specific_days: null as number[] | null,
    start_date: null as string | null
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    color: '#3b82f6'
  });

  const today = currentDate.toISOString().split('T')[0];

  useEffect(() => {
    loadCategories();
    loadHabits();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [currentDate]);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/habit-categories`, { headers: getAuthHeaders() });
      const data = await res.json();
      console.log('[HabitTracker] Categories loaded:', data);
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadHabits = async () => {
    try {
      const res = await fetch(`${API_URL}/api/habits`, { headers: getAuthHeaders() });
      const data = await res.json();
      console.log('[loadHabits] loaded habits:', data);
      setHabits(data);
    } catch (err) {
      console.error('Error loading habits:', err);
    }
  };

  const loadLogs = async () => {
    try {
      const dateStr = currentDate.toISOString().split('T')[0];
      const res = await fetch(`${API_URL}/api/habits/logs?date=${dateStr}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setLogs(data.logs || {});
    } catch (err) {
      console.error('Error loading logs:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[HabitTracker] Submitting habit:', formData);
    try {
      let specificDaysValue: string | null = null;
      if (formData.recurrence === 'weekly' || formData.recurrence === 'biweekly') {
        specificDaysValue = formData.specific_days && formData.specific_days.length > 0 
          ? JSON.stringify(formData.specific_days) 
          : '[0]';
      } else if (formData.recurrence === 'specific' && formData.specific_days && formData.specific_days.length > 0) {
        specificDaysValue = JSON.stringify(formData.specific_days);
      }
      const payload = {
        ...formData,
        specific_days: specificDaysValue
      };
      if (editingHabit) {
        console.log('[HabitTracker] Editing habit:', editingHabit.id);
        await fetch(`${API_URL}/api/habits/${editingHabit.id}`, {
          method: 'PUT',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        console.log('[HabitTracker] Creating new habit');
        await fetch(`${API_URL}/api/habits`, {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setShowForm(false);
      setEditingHabit(null);
      setFormData({ name: '', description: '', icon: 'pill', color: '#22c55e', target_type: 'boolean', target_value: 1, recurrence: 'daily', category_id: null, specific_days: null, start_date: null });
      loadHabits();
    } catch (err) {
      console.error('Error saving habit:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este hábito?')) return;
    try {
      await fetch(`${API_URL}/api/habits/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      loadHabits();
    } catch (err) {
      console.error('Error deleting habit:', err);
    }
  };

  const toggleHabit = async (habit: Habit) => {
    const existingLog = logs[habit.id];
    const isCompleted = existingLog?.completed === 1;
    
    try {
      if (isCompleted) {
        await fetch(`${API_URL}/api/habits/${habit.id}/log`, {
          method: 'DELETE',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: today })
        });
      } else {
        await fetch(`${API_URL}/api/habits/${habit.id}/log`, {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: today, value: 1, completed: true })
        });
      }
      loadLogs();
    } catch (err) {
      console.error('Error toggling habit:', err);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[HabitTracker] Category form submitted:', categoryFormData);
    try {
      let url = `${API_URL}/api/habit-categories`;
      let method = 'POST';
      if (editingCategory) {
        console.log('[HabitTracker] Editing category:', editingCategory.id);
        url = `${API_URL}/api/habit-categories/${editingCategory.id}`;
        method = 'PUT';
      } else {
        console.log('[HabitTracker] Creating new category');
      }
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryFormData)
      });
      const data = await res.json();
      console.log('[HabitTracker] Category response:', res.status, data);
      if (!res.ok) {
        alert('Error al guardar categoría: ' + (data.error || 'Error desconocido'));
        return;
      }
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryFormData({ name: '', color: '#3b82f6' });
      loadCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Error al conectar con el servidor');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('¿Eliminar esta categoría? Los hábitos se moverán a Sin categoría.')) return;
    try {
      await fetch(`${API_URL}/api/habit-categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      loadCategories();
      loadHabits();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const moveHabitToCategory = async (habitId: number, categoryId: number | null) => {
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;
      
      await fetch(`${API_URL}/api/habits/${habitId}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: habit.name,
          description: habit.description,
          icon: habit.icon,
          color: habit.color,
          target_type: habit.target_type,
          target_value: habit.target_value,
          recurrence: habit.recurrence,
          category_id: categoryId,
          specific_days: habit.specific_days
        })
      });
      setShowMoveMenu(null);
      loadHabits();
    } catch (err) {
      console.error('Error moving habit:', err);
    }
  };

  const toggleCategoryExpand = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const isToday = currentDate.toDateString() === new Date().toDateString();

  const getIcon = (iconKey: string) => {
    const iconObj = ICONS.find(i => i.key === iconKey);
    return iconObj ? iconObj.icon : Target;
  };

  const habitsWithoutCategory = habits.filter(h => !h.category_id && shouldShowHabitToday(h, currentDate));
  const visibleHabits = habits.filter(h => shouldShowHabitToday(h, currentDate));
  console.log('[render] habits:', habits.length, 'visibleHabits:', visibleHabits.length);
  console.log('[render] all habits:', habits.map(h => ({ name: h.name, recurrence: h.recurrence, specific_days: h.specific_days })));

  const habitsByCategory = categories.map(cat => ({
    ...cat,
    habits: habits.filter(h => h.category_id === cat.id && shouldShowHabitToday(h, currentDate))
  }));

  const completedCount = visibleHabits.filter(h => logs[h.id]?.completed === 1).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hábitos Diarios</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isToday 
              ? `${completedCount}/${visibleHabits.length} completados hoy`
              : currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingCategory(null);
              setCategoryFormData({ name: '', color: '#3b82f6' });
              setShowCategoryForm(true);
            }}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FolderPlus size={18} />
            <span>Nueva Categoría</span>
          </button>
          <button
            onClick={() => {
              setEditingHabit(null);
              setFormData({ name: '', description: '', icon: 'pill', color: '#22c55e', target_type: 'boolean', target_value: 1, recurrence: 'daily', category_id: null, specific_days: null });
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            <span>Nuevo Hábito</span>
          </button>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Categorías disponibles:</p>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 pr-1">
                <div className="w-3 h-3 rounded-full ml-2" style={{ backgroundColor: cat.color }} />
                <span className="text-sm px-1">{cat.name}</span>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <span className="text-lg font-semibold">{today}</span>
            {isToday && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Hoy</span>}
          </div>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {visibleHabits.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <Target size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No hay hábitos para hoy</p>
          <p className="text-gray-400 text-sm mt-1">Crea un hábito que se repita diariamente</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-primary hover:underline"
          >
            Crear hábito
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {habitsByCategory.map(category => {
            const isExpanded = expandedCategories.has(category.id);
            const categoryCompleted = category.habits.filter(h => logs[h.id]?.completed === 1).length;
            
            return (
              <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleCategoryExpand(category.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-semibold text-gray-800">{category.name}</span>
                    <span className="text-xs text-gray-500">({categoryCompleted}/{category.habits.length})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategory(category);
                        setCategoryFormData({ name: category.name, color: category.color });
                        setShowCategoryForm(true);
                      }}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {category.habits.map(habit => {
                      const log = logs[habit.id];
                      const isCompleted = log?.completed === 1;
                      const IconComponent = getIcon(habit.icon || 'pill');
                      const recurrenceLabel = habit.recurrence === 'biweekly'
                        ? 'Cada 2 semanas'
                        : habit.recurrence === 'specific' && habit.specific_days
                        ? (() => {
                            try {
                              const days = JSON.parse(habit.specific_days);
                              return days.map((d: number) => DAYS_OF_WEEK.find(dow => dow.key === d)?.label).join(', ');
                            } catch { return 'Días específicos'; }
                          })()
                        : RECURRENCE_OPTIONS.find(r => r.key === habit.recurrence)?.label || 'Diario';
                      
                      return (
                        <div
                          key={habit.id}
                          className={`p-4 flex items-center gap-4 transition-all ${
                            isCompleted ? 'bg-green-50' : ''
                          }`}
                        >
                          <button
                            onClick={() => toggleHabit(habit)}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                              isCompleted 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {isCompleted ? <Check size={24} /> : <IconComponent size={24} />}
                          </button>
                          
                          <div className="flex-1">
                            <h3 className={`font-semibold ${isCompleted ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                              {habit.name}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {recurrenceLabel}
                              </span>
                              {habit.description && (
                                <span>{habit.description}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <button
                                onClick={() => setShowMoveMenu(showMoveMenu === habit.id ? null : habit.id)}
                                className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg"
                                title="Mover a otra categoría"
                              >
                                <Folder size={16} />
                              </button>
                              {showMoveMenu === habit.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                                  <button
                                    onClick={() => moveHabitToCategory(habit.id, null)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-t-lg"
                                  >
                                    Sin categoría
                                  </button>
                                  {categories.map(cat => (
                                    <button
                                      key={cat.id}
                                      onClick={() => moveHabitToCategory(habit.id, cat.id)}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                      {cat.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setEditingHabit(habit);
                                setFormData({
                                  name: habit.name,
                                  description: habit.description || '',
                                  icon: habit.icon || 'pill',
                                  color: habit.color,
                                  target_type: habit.target_type,
                                  target_value: habit.target_value,
                                  recurrence: habit.recurrence,
                                  category_id: habit.category_id,
                                  specific_days: habit.specific_days ? JSON.parse(habit.specific_days) : null,
                                  start_date: habit.start_date
                                });
                                setShowForm(true);
                              }}
                              className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(habit.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {habitsWithoutCategory.length > 0 && (
            <div className="space-y-3">
              {habitsWithoutCategory.map(habit => {
                const log = logs[habit.id];
                const isCompleted = log?.completed === 1;
                const IconComponent = getIcon(habit.icon || 'pill');
                const recurrenceLabel = habit.recurrence === 'biweekly'
                  ? 'Cada 2 semanas'
                  : habit.recurrence === 'specific' && habit.specific_days
                  ? (() => {
                      try {
                        const days = JSON.parse(habit.specific_days);
                        return days.map((d: number) => DAYS_OF_WEEK.find(dow => dow.key === d)?.label).join(', ');
                      } catch { return 'Días específicos'; }
                    })()
                  : RECURRENCE_OPTIONS.find(r => r.key === habit.recurrence)?.label || 'Diario';
                
                return (
                  <div
                    key={habit.id}
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 transition-all ${
                      isCompleted ? 'bg-green-50 border-green-200' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleHabit(habit)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {isCompleted ? <Check size={24} /> : <IconComponent size={24} />}
                    </button>
                    
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isCompleted ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                        {habit.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {recurrenceLabel}
                        </span>
                        {habit.description && (
                          <span>{habit.description}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button
                          onClick={() => setShowMoveMenu(showMoveMenu === habit.id ? null : habit.id)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg"
                          title="Mover a otra categoría"
                        >
                          <Folder size={16} />
                        </button>
                        {showMoveMenu === habit.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                            <button
                              onClick={() => moveHabitToCategory(habit.id, null)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-t-lg"
                            >
                              Sin categoría
                            </button>
                            {categories.map(cat => (
                              <button
                                key={cat.id}
                                onClick={() => moveHabitToCategory(habit.id, cat.id)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                              >
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                {cat.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setEditingHabit(habit);
                          setFormData({
                            name: habit.name,
                            description: habit.description || '',
                            icon: habit.icon || 'pill',
                            color: habit.color,
                            target_type: habit.target_type,
                            target_value: habit.target_value,
                            recurrence: habit.recurrence,
                            category_id: habit.category_id,
                            specific_days: habit.specific_days ? JSON.parse(habit.specific_days) : null,
                            start_date: habit.start_date
                          });
                          setShowForm(true);
                        }}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(habit.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingHabit ? 'Editar Hábito' : 'Nuevo Hábito'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Ej: Correr"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Ej: 30 minutos"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={formData.category_id || ''}
                  onChange={e => setFormData({ ...formData, category_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Sin categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icono</label>
                <div className="grid grid-cols-4 gap-2">
                  {ICONS.map(ic => (
                    <button
                      key={ic.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: ic.key })}
                      className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-all ${
                        formData.icon === ic.key 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ic.icon size={20} />
                      <span className="text-xs">{ic.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Repetición</label>
                <div className="grid grid-cols-2 gap-2">
                  {RECURRENCE_OPTIONS.map(rec => (
                    <button
                      key={rec.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, recurrence: rec.key, specific_days: null })}
                      className={`p-3 rounded-lg text-sm transition-all ${
                        formData.recurrence === rec.key 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {rec.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {(formData.recurrence === 'specific' || formData.recurrence === 'weekly' || formData.recurrence === 'biweekly') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.recurrence === 'specific' ? 'Selecciona los días' : 'Selecciona el día'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => {
                      const isSelected = (formData.recurrence === 'weekly' || formData.recurrence === 'biweekly') 
                        ? formData.specific_days?.[0] === day.key
                        : formData.specific_days?.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => {
                            if (formData.recurrence === 'weekly' || formData.recurrence === 'biweekly') {
                              setFormData({ ...formData, specific_days: [day.key] });
                            } else {
                              const current = formData.specific_days || [];
                              const updated = isSelected
                                ? current.filter(d => d !== day.key)
                                : [...current, day.key];
                              setFormData({ ...formData, specific_days: updated });
                            }
                          }}
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${
                            isSelected
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {formData.recurrence === 'biweekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
                  <input
                    type="date"
                    value={formData.start_date || ''}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">El hábito se repetirá cada 2 semanas a partir de esta fecha</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        formData.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingHabit(null);
                    setFormData({ name: '', description: '', icon: 'pill', color: '#22c55e', target_type: 'boolean', target_value: 1, recurrence: 'daily', category_id: null, specific_days: null, start_date: null });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  {editingHabit ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <button onClick={() => setShowCategoryForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Ej: Deportes"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategoryFormData({ ...categoryFormData, color: c })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        categoryFormData.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    setCategoryFormData({ name: '', color: '#3b82f6' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  {editingCategory ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
