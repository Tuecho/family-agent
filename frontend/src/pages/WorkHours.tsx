import { useState, useEffect } from 'react';
import { Clock, Play, Square, Calendar, AlertTriangle, History, ChevronLeft, ChevronRight, Edit2, Trash2, X, Check, Settings, Mail } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface WorkShift {
  id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  hours_worked: number | null;
  notes: string | null;
}

interface WorkSettings {
  daily_target_hours: number;
  work_days: string;
  weekly_target_hours: number;
  accumulated_hours: number;
  alert_on_overtime: number;
}

function getWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

function getDayName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[date.getDay()];
}

function generateWorkHoursReport(shifts: WorkShift[], settings: WorkSettings | null, summary: { totalHours: number, targetHours: number, dayStats: { date: string, hours: number }[] }, accumulatedData: { weekly_target: number, week_hours: number, accumulated_hours: number }): string {
  const lines: string[] = [];
  lines.push('📊 Resumen de Horas de Trabajo');
  lines.push('================================');
  lines.push('');
  lines.push('⏰ Horas esta semana:');
  lines.push(`  Total: ${formatHours(summary.totalHours)}`);
  lines.push(`  Meta: ${formatHours(summary.targetHours)}`);
  if (summary.totalHours > summary.targetHours) {
    lines.push(`  ⚠️ Exceso: ${formatHours(summary.totalHours - summary.targetHours)}`);
  }
  lines.push('');
  lines.push('📅 Detalle por día:');
  summary.dayStats.forEach(day => {
    if (day.hours > 0) {
      const dayName = getDayName(day.date);
      const date = new Date(day.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      lines.push(`  ${dayName} ${date}: ${formatHours(day.hours)}`);
    }
  });
  lines.push('');
  lines.push('📈 Horas acumuladas:');
  lines.push(`  Accumulated: ${formatHours(accumulatedData.accumulated_hours)}`);
  lines.push('');
  lines.push('Generado por Family Agent');
  return lines.join('\n');
}

export function WorkHours() {
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [settings, setSettings] = useState<WorkSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentShift, setCurrentShift] = useState<WorkShift | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ email_to: '', startDate: '', endDate: '' });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [accumulatedData, setAccumulatedData] = useState({ weekly_target: 40, week_hours: 0, accumulated_hours: 0, week_overtime: 0 });
  
  const [shiftForm, setShiftForm] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    hours_worked: '',
    notes: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    daily_target_hours: 2,
    work_days: '0,1,2,3,4,5,6',
    weekly_target_hours: 0,
    alert_on_overtime: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (currentShift && currentShift.start_time) {
      interval = setInterval(() => {
        const now = new Date();
        const [hours, minutes] = currentShift.start_time.split(':').map(Number);
        const start = new Date(now);
        start.setHours(hours, minutes, 0, 0);
        
        if (start > now) {
          start.setDate(start.getDate() - 1);
        }
        
        const diffMs = now.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        setElapsedTime(diffHours);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentShift]);

  const fetchData = async () => {
    const headers = getAuthHeaders();
    
    const weekDates = getWeekDates();
    const startDate = weekDates[0];
    const endDate = weekDates[weekDates.length - 1];
    
    const [shiftsRes, settingsRes, accumulatedRes] = await Promise.all([
      fetch(`${API_URL}/api/work-shifts?startDate=${startDate}&endDate=${endDate}`, { headers }),
      fetch(`${API_URL}/api/work-settings`, { headers }),
      fetch(`${API_URL}/api/work-hours/accumulated`, { headers })
    ]);
    
    const shiftsData = await shiftsRes.json();
    const settingsData = await settingsRes.json();
    const accumulatedData = await accumulatedRes.json();
    
    setShifts(Array.isArray(shiftsData) ? shiftsData : []);
    setSettings(settingsData);
    setAccumulatedData(accumulatedData);
    setSettingsForm({
      daily_target_hours: settingsData.daily_target_hours || 2,
      work_days: settingsData.work_days || '0,1,2,3,4,5,6',
      weekly_target_hours: settingsData.weekly_target_hours || 0,
      alert_on_overtime: settingsData.alert_on_overtime !== 0
    });
    
    const activeShift = (Array.isArray(shiftsData) ? shiftsData : []).find((s: WorkShift) => !s.end_time);
    setCurrentShift(activeShift || null);
    
    setLoading(false);
  };

  const startShift = async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const res = await fetch(`${API_URL}/api/work-shifts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ date: today, start_time: time })
      });
      const data = await res.json();
      
      if (data.success) {
        setCurrentShift({
          id: data.id,
          date: today,
          start_time: time,
          end_time: null,
          hours_worked: null,
          notes: null
        });
      }
    } catch (error) {
      console.error('Error starting shift:', error);
    }
  };

  const endShift = async () => {
    if (!currentShift) return;
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/work-shifts/${currentShift.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          date: today,
          start_time: currentShift.start_time,
          end_time: time,
          notes: currentShift.notes
        })
      });
      
      setCurrentShift(null);
      setElapsedTime(0);
      fetchData();
    } catch (error) {
      console.error('Error ending shift:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/work-settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(settingsForm)
      });
      
      setShowSettings(false);
      fetchData();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const deleteShift = async (id: string) => {
    if (!confirm('¿Eliminar este turno?')) return;
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/work-shifts/${id}`, { method: 'DELETE', headers });
      fetchData();
    } catch (error) {
      console.error('Error deleting shift:', error);
    }
  };

  const sendEmailReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingEmail(true);
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const res = await fetch(`${API_URL}/api/work-hours/send-email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email_to: emailForm.email_to || null,
          startDate: emailForm.startDate || null,
          endDate: emailForm.endDate || null
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Email enviado correctamente');
        setShowEmailModal(false);
        setEmailForm({ email_to: '', startDate: '', endDate: '' });
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error al enviar email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleManualShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting shift form:', shiftForm);
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      
      const payload = {
        date: shiftForm.date,
        start_time: shiftForm.start_time,
        end_time: shiftForm.end_time || null,
        notes: shiftForm.notes || null
      };
      console.log('Payload:', payload);
      
      if (editingShift) {
        await fetch(`${API_URL}/api/work-shifts/${editingShift.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        const res = await fetch(`${API_URL}/api/work-shifts`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log('Response:', data);
      }
      
      setShowAddModal(false);
      setEditingShift(null);
      setShiftForm({ date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', hours_worked: '', notes: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving shift:', error);
    }
  };

  const getWeekSummary = () => {
    const weekDates = getWeekDates();
    const dailyTarget = settings?.daily_target_hours || 2;
    const workDaysArray = (settings?.work_days || '0,1,2,3,4,5,6').split(',');
    const workDaysCount = workDaysArray.length;
    const weeklyTarget = dailyTarget * workDaysCount;
    let totalHours = 0;
    let daysWorked = 0;
    
    const dayStats = weekDates.map(date => {
      const dayShifts = shifts.filter(s => s.date === date && s.hours_worked);
      const hours = dayShifts.reduce((sum, s) => sum + (s.hours_worked || 0), 0);
      totalHours += hours;
      if (hours > 0) daysWorked++;
      return { date, hours };
    });
    
    return {
      totalHours,
      daysWorked,
      targetHours: weeklyTarget,
      targetDaily: dailyTarget,
      dayStats
    };
  };

  const summary = getWeekSummary();
  const isOvertime = elapsedTime > (settings?.daily_target_hours || 2);
  const todayDate = new Date().toISOString().split('T')[0];
  const todayCompletedShifts = shifts.filter(s => s.date === todayDate && s.hours_worked);
  const todayHours = todayCompletedShifts.reduce((sum, s) => sum + (s.hours_worked || 0), 0);
  const weeklyTarget = settings?.weekly_target_hours || accumulatedData.weekly_target || 40;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Clock size={28} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Horas de Trabajo</h2>
            <p className="text-sm text-gray-500">
              {summary.daysWorked}/7 días • {formatHours(summary.totalHours)} esta semana
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const today = new Date();
              const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
              setEmailForm({ ...emailForm, startDate: startOfYear, endDate: today.toISOString().split('T')[0] });
              setShowEmailModal(true);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Enviar informe por email"
          >
            <Mail size={20} />
          </button>
          <button
            onClick={() => {
              const text = generateWorkHoursReport(shifts, settings, summary, accumulatedData);
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
              window.open(whatsappUrl, '_blank');
            }}
            className="p-2 text-green-500 hover:text-green-600 transition-colors"
            title="Compartir por WhatsApp"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>
          <button
            onClick={() => {
              const text = generateWorkHoursReport(shifts, settings, summary, accumulatedData);
              const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(text)}`;
              window.open(telegramUrl, '_blank');
            }}
            className="p-2 text-blue-500 hover:text-blue-600 transition-colors"
            title="Compartir por Telegram"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border p-6 mb-4 shadow-sm">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">Turno actual</div>
              
              {currentShift ? (
                <div className="space-y-4">
                  <div className={`text-5xl font-bold ${isOvertime ? 'text-red-500' : 'text-gray-800'}`}>
                    {formatHours(elapsedTime)}
                  </div>
                  
                  {isOvertime && (
                    <div className="flex items-center justify-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-lg">
                      <AlertTriangle size={18} />
                      <span className="font-medium">Excedes las {settings?.daily_target_hours || 2}h</span>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-500">
                    Inicio: {formatTime(currentShift.start_time)}
                  </div>
                  
                  {todayHours > 0 || elapsedTime > 0 ? (
                    <div className="text-sm text-gray-500 bg-blue-50 px-3 py-2 rounded-lg">
                      Hoy: <span className="font-semibold text-gray-800">
                        {formatHours(todayHours + (currentShift && currentShift.date === todayDate ? elapsedTime : 0))}
                      </span>
                      {currentShift && currentShift.date === todayDate && elapsedTime > 0 && ' (incluyendo turno actual)'}
                    </div>
                  ) : null}
                  
                  <button
                    onClick={endShift}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-colors font-medium"
                  >
                    <Square size={20} />
                    Finalizar turno
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-5xl font-bold text-gray-300">0h 0m</div>
                  
                  <button
                    onClick={startShift}
                    className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors font-medium"
                  >
                    <Play size={20} />
                    Iniciar turno
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">Resumen semanal</h3>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Añadir
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-4">
              {summary.dayStats.map((day) => {
                const isOver = day.hours > (settings?.daily_target_hours || 2);
                return (
                  <div
                    key={day.date}
                    className={`text-center p-2 rounded-lg ${day.hours > 0 ? 'bg-blue-50' : 'bg-gray-50'}`}
                  >
                    <div className="text-xs text-gray-500">{getDayName(day.date)}</div>
                    <div className={`font-semibold ${isOver ? 'text-red-500' : 'text-gray-700'}`}>
                      {day.hours > 0 ? formatHours(day.hours) : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-between text-sm pt-3 border-t">
              <span className="text-gray-500">Total: <span className="font-semibold text-gray-700">{formatHours(summary.totalHours)}</span></span>
              <span className="text-gray-500">Meta: <span className="font-semibold text-gray-700">{formatHours(summary.targetHours)}</span></span>
            </div>
            
            {summary.totalHours > summary.targetHours && (
              <div className="mt-3 flex items-center gap-2 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
                <AlertTriangle size={16} />
                Has excedido las horas objetivo esta semana
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Clock size={18} />
                Horas acumuladas
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Meta semanal</div>
                <div className="text-xl font-bold text-gray-800">{formatHours(summary.targetHours)}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Esta semana</div>
                <div className={`text-xl font-bold ${accumulatedData.week_hours > summary.targetHours ? 'text-red-500' : 'text-gray-800'}`}>
                  {formatHours(accumulatedData.week_hours)}
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Horas acumuladas:</span>
                <span className={`text-lg font-bold ${accumulatedData.accumulated_hours > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                  {formatHours(accumulatedData.accumulated_hours)}
                </span>
              </div>
              {accumulatedData.week_overtime > 0 && (
                <div className="text-xs text-orange-500 mt-1">
                  +{formatHours(accumulatedData.week_overtime)} añadido esta semana
                </div>
              )}
              <button
                onClick={async () => {
                  if (!confirm('¿Resetear las horas acumuladas a 0?')) return;
                  const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
                  await fetch(`${API_URL}/api/work-hours/reset-accumulated`, {
                    method: 'POST',
                    headers
                  });
                  fetchData();
                }}
                className="mt-3 w-full py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Resetear acumuladas
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <History size={18} />
              Turnos recientes
            </h3>
            
            <div className="space-y-2">
              {shifts.filter(s => s.end_time).length === 0 ? (
                <p className="text-gray-400 text-center py-4">No hay turnos registrados</p>
              ) : (
                shifts.filter(s => s.end_time).slice(0, 10).map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-700">
                          {new Date(shift.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(shift.start_time)} - {shift.end_time ? formatTime(shift.end_time) : '...'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${(shift.hours_worked || 0) > (settings?.daily_target_hours || 2) ? 'text-red-500' : 'text-gray-700'}`}>
                        {shift.hours_worked ? formatHours(shift.hours_worked) : '-'}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingShift(shift);
                            setShiftForm({
                              date: shift.date,
                              start_time: shift.start_time,
                              end_time: shift.end_time || '',
                              hours_worked: shift.hours_worked?.toString() || '',
                              notes: shift.notes || ''
                            });
                            setShowAddModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-500"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteShift(shift.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Configuración</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horas objetivo diarias</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={settingsForm.daily_target_hours}
                  onChange={(e) => setSettingsForm({ ...settingsForm, daily_target_hours: parseFloat(e.target.value) || 2 })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Días laborales</label>
                <div className="flex flex-wrap gap-2">
                  {['0', '1', '2', '3', '4', '5', '6'].map((day) => {
                    const days = settingsForm.work_days.split(',');
                    const isSelected = days.includes(day);
                    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const newDays = isSelected
                            ? days.filter(d => d !== day)
                            : [...days, day].sort();
                          setSettingsForm({ ...settingsForm, work_days: newDays.join(',') });
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {dayNames[parseInt(day)]}
                      </button>
                    );
                  })}
</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta semanal (horas)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="80"
                  value={settingsForm.weekly_target_hours}
                  onChange={(e) => setSettingsForm({ ...settingsForm, weekly_target_hours: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Dejar en 0 para usar cálculo automático (diaria × días = 10h)</p>
              </div>
               
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Alertar si excedes horas</span>
                <button
                  onClick={() => setSettingsForm({ ...settingsForm, alert_on_overtime: !settingsForm.alert_on_overtime })}
                  className={`w-12 h-6 rounded-full p-1 transition-all ${settingsForm.alert_on_overtime ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${settingsForm.alert_on_overtime ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              
              <button
                onClick={saveSettings}
                className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingShift ? 'Editar turno' : 'Nuevo turno'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingShift(null);
                  setShiftForm({ date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', hours_worked: '', notes: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleManualShiftSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                <input
                  type="date"
                  value={shiftForm.date}
                  onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio *</label>
                  <input
                    type="time"
                    value={shiftForm.start_time}
                    onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
                  <input
                    type="time"
                    value={shiftForm.end_time}
                    onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <input
                  type="text"
                  value={shiftForm.notes}
                  onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                  placeholder="Notas adicionales..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingShift(null);
                  }}
                  className="flex-1 py-3 border rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium"
                >
                  {editingShift ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Enviar informe por email</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={sendEmailReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de destino</label>
                <input
                  type="email"
                  value={emailForm.email_to}
                  onChange={(e) => setEmailForm({ ...emailForm, email_to: e.target.value })}
                  placeholder="dejar vacío para usar el configurado"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                  <input
                    type="date"
                    value={emailForm.startDate}
                    onChange={(e) => setEmailForm({ ...emailForm, startDate: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={emailForm.endDate}
                    onChange={(e) => setEmailForm({ ...emailForm, endDate: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={sendingEmail}
                className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium disabled:opacity-50"
              >
                {sendingEmail ? 'Enviando...' : 'Enviar informe'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
