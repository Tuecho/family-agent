import { useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import type { FamilyEvent } from '../types';
import { formatTime24 } from '../utils/format';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

type ViewMode = 'day' | 'week' | 'month';

const DAY_NAMES: Record<string, string> = {
  '0': 'Dom', '1': 'Lun', '2': 'Mar', '3': 'Mié', '4': 'Jue', '5': 'Vie', '6': 'Sáb'
};

function getDaysLabel(daysStr: string) {
  return daysStr.split(',').map(d => DAY_NAMES[d.trim()] || d).join(', ');
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = domingo
  const diff = (day === 0 ? -6 : 1) - day; // mover a lunes
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateMonthGrid(current: Date) {
  const year = current.getFullYear();
  const month = current.getMonth(); // 0-11

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const start = startOfWeek(firstDayOfMonth);
  const end = new Date(start);
  end.setDate(end.getDate() + 6 * 7 - 1);

  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return { days, firstDayOfMonth, lastDayOfMonth };
}

export function Agenda() {
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [view, setView] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FamilyEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: formatISODate(new Date()),
    start_time: '',
    end_time: '',
    type: '',
    location: '',
    recurrence: '',
    days_of_week: [] as number[],
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let from: string;
      let to: string;

      if (view === 'day') {
        const d = formatISODate(currentDate);
        from = d;
        to = d;
      } else if (view === 'week') {
        const start = startOfWeek(currentDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        from = formatISODate(start);
        to = formatISODate(end);
      } else {
        const { firstDayOfMonth, lastDayOfMonth } = generateMonthGrid(currentDate);
        from = formatISODate(firstDayOfMonth);
        to = formatISODate(lastDayOfMonth);
      }

      const headers = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/events?from=${from}&to=${to}`, { headers });
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [view, currentDate]);

  const openNewEvent = (date?: string) => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      date: date || formatISODate(currentDate),
      start_time: '',
      end_time: '',
      type: '',
      location: '',
      recurrence: '',
      days_of_week: [],
    });
    setShowModal(true);
  };

  const openEditEvent = (event: FamilyEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      date: event.date,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      type: event.type || '',
      location: event.location || '',
      recurrence: event.recurrence || '',
      days_of_week: event.days_of_week ? event.days_of_week.split(',').map(Number) : [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (formData.recurrence === 'weekly' && formData.days_of_week.length === 0) {
      alert('Selecciona al menos un día de la semana para eventos recurrentes');
      return;
    }

    const id = editingEvent?.id ?? Math.random().toString(36).substring(2, 9);
    const payload = {
      id,
      title: formData.title,
      description: formData.description,
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      type: formData.type,
      location: formData.location,
      recurrence: formData.recurrence || null,
      days_of_week: formData.recurrence === 'weekly' && formData.days_of_week.length > 0 ? formData.days_of_week.sort((a,b) => a-b).join(',') : null,
    };

    try {
      const url = editingEvent ? `${API_URL}/api/events/${id}` : `${API_URL}/api/events`;
      const method = editingEvent ? 'PUT' : 'POST';
      console.log('Saving event:', payload);
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const resp = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const err = await resp.text();
        console.error('Error saving event:', err);
      }
      setShowModal(false);
      await fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDelete = async (event: FamilyEvent) => {
    if (!window.confirm('¿Eliminar este evento?')) return;
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/events/${event.id}`, { method: 'DELETE', headers });
      await fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const changePeriod = (direction: 'prev' | 'next') => {
    const factor = direction === 'prev' ? -1 : 1;
    const d = new Date(currentDate);

    if (view === 'day') {
      d.setDate(d.getDate() + 1 * factor);
    } else if (view === 'week') {
      d.setDate(d.getDate() + 7 * factor);
    } else {
      d.setMonth(d.getMonth() + 1 * factor);
    }
    setCurrentDate(d);
  };

  const todayLabel = currentDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const { days } = generateMonthGrid(currentDate);

  const eventsByDate: Record<string, FamilyEvent[]> = events.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {} as Record<string, FamilyEvent[]>);

  const weekStart = startOfWeek(currentDate);
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    weekDays.push(d);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="text-primary" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Agenda familiar</h2>
            <p className="text-gray-500 text-sm">Organiza citas, actividades y eventos de la familia</p>
          </div>
        </div>
        <button
          onClick={() => openNewEvent()}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Nuevo evento
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changePeriod('prev')}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
          >
            Hoy
          </button>
          <button
            onClick={() => changePeriod('next')}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ChevronRight size={18} />
          </button>
          <span className="ml-3 font-medium text-gray-700 capitalize">{todayLabel}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setView('day')}
            className={`px-3 py-1 rounded-full text-sm border ${
              view === 'day' ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600'
            }`}
          >
            Día
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1 rounded-full text-sm border ${
              view === 'week' ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1 rounded-full text-sm border ${
              view === 'month' ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600'
            }`}
          >
            Mes
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-500 text-sm">Cargando eventos...</div>
      )}

      {!loading && view === 'month' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-7 text-xs font-medium text-gray-500 mb-2">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
              <div key={d} className="text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-sm">
            {days.map((day) => {
              const key = formatISODate(day);
              const dayEvents = eventsByDate[key] || [];
              const isToday = key === formatISODate(new Date());
              const inCurrentMonth = day.getMonth() === currentDate.getMonth();
              return (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentDate(day);
                    setView('day');
                  }}
                  className={`min-h-[80px] rounded-lg p-1 text-left border ${
                    inCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
                  } ${isToday ? 'border-primary' : 'border-gray-100'} hover:bg-primary/5 transition-colors`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${isToday ? 'text-primary font-semibold' : ''}`}>
                      {day.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] px-1 rounded-full bg-primary/10 text-primary">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[11px] truncate px-1 py-0.5 rounded bg-primary/10 text-primary cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditEvent(ev);
                        }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-gray-400">+{dayEvents.length - 2} más</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!loading && view === 'week' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const key = formatISODate(day);
              const dayEvents = eventsByDate[key] || [];
              const isToday = key === formatISODate(new Date());
              return (
                <div key={key} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs text-gray-500">
                        {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                      </div>
                      <div className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-gray-800'}`}>
                        {day.getDate()}
                      </div>
                    </div>
                    <button
                      onClick={() => openNewEvent(key)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <Plus size={14} className="text-gray-500" />
                    </button>
                  </div>
                  {dayEvents.length === 0 ? (
                    <p className="text-xs text-gray-400">Sin eventos</p>
                  ) : (
                    <div className="space-y-2">
                      {dayEvents.map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => openEditEvent(ev)}
                          className="w-full text-left text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          <div className="flex items-center gap-1">
                            <Clock size={10} />
                            <span>
                              {formatTime24(ev.start_time) || ''}{ev.start_time && ev.end_time ? ' - ' : ''}{formatTime24(ev.end_time) || ''}
                            </span>
                          </div>
                          <div className="font-semibold truncate">{ev.title}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && view === 'day' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-semibold text-gray-800 capitalize">
                {currentDate.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
            <button
              onClick={() => openNewEvent(formatISODate(currentDate))}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
            >
              <Plus size={14} />
              Añadir evento
            </button>
          </div>
          {(() => {
            const key = formatISODate(currentDate);
            const dayEvents = eventsByDate[key] || [];
            if (dayEvents.length === 0) {
              return <p className="text-sm text-gray-500">No hay eventos para este día.</p>;
            }
            return (
              <div className="space-y-3">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="border border-gray-100 rounded-lg p-3 flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {ev.type || 'Familia'}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={10} />
                          {formatTime24(ev.start_time) || 'Sin hora'}
                          {ev.end_time ? ` - ${formatTime24(ev.end_time)}` : ''}
                        </span>
                      </div>
                      <div className="font-semibold text-gray-800">{ev.title}</div>
                      {ev.description && (
                        <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                          {ev.description}
                        </p>
                      )}
                      {ev.location && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          📍 {ev.location}
                        </p>
                      )}
                      {ev.recurrence === 'weekly' && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          🔄 Semanal {ev.days_of_week ? `(${getDaysLabel(ev.days_of_week)})` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      <button
                        onClick={() => openEditEvent(ev)}
                        className="text-xs text-primary hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(ev)}
                        className="text-xs text-expense hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingEvent ? 'Editar evento' : 'Nuevo evento'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="Cole, médico, ocio..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Dirección o lugar..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora inicio
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora fin
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.recurrence === 'weekly'}
                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.checked ? 'weekly' : '' })}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Repetir semanalmente</span>
                </label>
                {formData.recurrence === 'weekly' && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Días de la semana:</p>
                    <div className="flex gap-2">
                      {[
                        { num: 1, label: 'L' },
                        { num: 2, label: 'M' },
                        { num: 3, label: 'X' },
                        { num: 4, label: 'J' },
                        { num: 5, label: 'V' },
                        { num: 6, label: 'S' },
                        { num: 0, label: 'D' },
                      ].map(({ num, label }) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            const current = formData.days_of_week;
                            const updated = current.includes(num)
                              ? current.filter(d => d !== num)
                              : [...current, num];
                            setFormData({ ...formData, days_of_week: updated });
                          }}
                          className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                            formData.days_of_week.includes(num)
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {formData.days_of_week.length === 0 && (
                      <p className="text-xs text-expense mt-1">Selecciona al menos un día</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

