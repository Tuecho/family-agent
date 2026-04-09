import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Pencil, RefreshCw, Copy, ArrowRight, ChevronLeft, ChevronRight, Upload, X, Check, AlertCircle } from 'lucide-react';
import { useStore } from '../store';
import type { ExpenseConceptItem } from '../types';
import { formatMoneyEs, formatDateEsLower } from '../utils/format';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

function slugifyKey(label: string) {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

interface BudgetWithSpending {
  id: string;
  concept: string;
  amount: number;
  month: number;
  year: number;
  recurring: number;
  spent: number;
  remaining: number;
  percentage: number;
}

function ProgressCircle({ percentage, size = 120, strokeWidth = 10 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  const isOverBudget = percentage > 100;
  const color = isOverBudget ? '#EF4444' : percentage > 80 ? '#F59E0B' : '#10B981';
  
  return (
    <svg width={size} height={size}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </g>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.3em"
        className="text-lg font-bold"
        fill={color}
      >
        {Math.min(percentage, 999)}%
      </text>
    </svg>
  );
}

export function Budgets() {
  const { concepts, fetchConcepts, addConcept, updateConceptLabel, deleteConcept, budgets, selectedMonth, selectedYear, setSelectedMonthYear } = useStore();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BudgetWithSpending | null>(null);
  const [showConceptsModal, setShowConceptsModal] = useState(false);
  const [conceptError, setConceptError] = useState<string>('');
  const [newConceptLabel, setNewConceptLabel] = useState('');
  const [showImportConcepts, setShowImportConcepts] = useState(false);
  const [importingConcepts, setImportingConcepts] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    concept: 'comida',
    amount: '',
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    recurring: false
  });

  const fetchBudgets = () => {
    setLoading(true);
    const headers = getAuthHeaders();
    fetch(`${API_URL}/api/budgets/with-spending?month=${selectedMonth}&year=${selectedYear}`, { headers })
      .then(res => res.json())
      .then(data => {
        useStore.setState({ budgets: data });
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching budgets:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchConcepts();
    fetchBudgets();
  }, [fetchConcepts, selectedMonth, selectedYear]);

  const copyRecurringBudgets = async () => {
    const currentMonth = selectedMonth;
    const currentYear = selectedYear;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const response = await fetch(`${API_URL}/api/budgets/copy-recurring`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fromMonth: currentMonth,
          fromYear: currentYear,
          toMonth: nextMonth,
          toYear: nextYear
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(`Se han copiado ${data.copied} presupuestos recurrentes al próximo mes`);
        fetchBudgets();
      }
    } catch (error) {
      console.error('Error copying recurring budgets:', error);
    }
  };

  const moveToNextMonth = async (budget: BudgetWithSpending, copyToAllFollowing = false) => {
    const currentMonth = budget.month;
    const currentYear = budget.year;

    if (budget.recurring === 1) {
      const confirmMsg = copyToAllFollowing 
        ? '¿Copiar este presupuesto recurrente a todos los meses siguientes?'
        : '¿Copiar este presupuesto recurrente al siguiente mes? (Se mantendrá en el mes actual)';
      if (!window.confirm(confirmMsg)) return;

      try {
        const monthsToCopy = copyToAllFollowing ? 12 : 1;
        for (let i = 1; i <= monthsToCopy; i++) {
          let targetMonth = currentMonth + i;
          let targetYear = currentYear;
          while (targetMonth > 12) {
            targetMonth -= 12;
            targetYear += 1;
          }

          const exists = budgets.some(b => b.month === targetMonth && b.year === targetYear && b.concept === budget.concept);
          if (exists) continue;

          await fetch(`${API_URL}/api/budgets`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: Math.random().toString(36).substring(2, 9),
              concept: budget.concept,
              amount: budget.amount,
              month: targetMonth,
              year: targetYear,
              recurring: 1
            })
          });
        }
        fetchBudgets();
      } catch (error) {
        console.error('Error copying budget:', error);
      }
    } else {
      const nextMonth = budget.month === 12 ? 1 : budget.month + 1;
      const nextYear = budget.month === 12 ? budget.year + 1 : budget.year;

      try {
        await fetch(`${API_URL}/api/budgets/${budget.id}`, {
          method: 'PUT',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            concept: budget.concept,
            amount: budget.amount,
            month: nextMonth,
            year: nextYear,
            recurring: budget.recurring
          })
        });
        fetchBudgets();
      } catch (error) {
        console.error('Error moving budget:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) return;

    const id = editing?.id ?? Math.random().toString(36).substring(2, 9);
    
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `${API_URL}/api/budgets/${id}` : `${API_URL}/api/budgets`;
      await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          concept: formData.concept,
          amount: parseFloat(formData.amount),
          month: parseInt(formData.month),
          year: parseInt(formData.year),
          recurring: formData.recurring
        })
      });

      setFormData({
        concept: 'comida',
        amount: '',
        month: String(new Date().getMonth() + 1),
        year: String(new Date().getFullYear()),
        recurring: false
      });
      setShowModal(false);
      setEditing(null);
      fetchBudgets();
    } catch (error) {
      console.error('Error adding budget:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este presupuesto?')) return;
    try {
      await fetch(`${API_URL}/api/budgets/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const openNew = () => {
    setEditing(null);
    setFormData({
      concept: 'comida',
      amount: '',
      month: String(selectedMonth),
      year: String(selectedYear),
      recurring: false
    });
    setShowModal(true);
  };

  const openEdit = (b: BudgetWithSpending) => {
    setEditing(b);
    setFormData({
      concept: b.concept,
      amount: String(b.amount),
      month: String(b.month).padStart(2, '0'),
      year: String(b.year),
      recurring: b.recurring === 1
    });
    setShowModal(true);
  };

  const conceptLabelByKey = concepts.reduce((acc, c) => {
    acc[c.key] = c.label;
    return acc;
  }, {} as Record<string, string>);

  const handleAddConcept = async () => {
    setConceptError('');
    const label = newConceptLabel.trim();
    if (label.length < 2) {
      setConceptError('El nombre debe tener al menos 2 caracteres');
      return;
    }
    const key = slugifyKey(label);
    if (!key || key.length < 2) {
      setConceptError('No se pudo generar una clave válida');
      return;
    }
    if (concepts.some((c) => c.key === key)) {
      setConceptError('Ya existe un concepto con esa clave');
      return;
    }
    await addConcept({ key, label });
    setNewConceptLabel('');
  };

  const handleImportConcepts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingConcepts(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const errors: string[] = [];
      let success = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || i === 0) continue;

        const parts = line.split(',').map(p => p.trim().replace(/"/g, ''));
        const label = parts[0];
        
        if (!label) {
          errors.push(`Fila ${i + 1}: Falta nombre`);
          continue;
        }

        const key = slugifyKey(label);
        if (!key) {
          errors.push(`Fila ${i + 1}: Clave inválida`);
          continue;
        }

        if (concepts.some((c) => c.key === key)) {
          errors.push(`Fila ${i + 1}: Ya existe "${label}"`);
          continue;
        }

        await addConcept({ key, label });
        success++;
      }

      setImportResult({ success, errors: errors.slice(0, 10) });
      fetchConcepts();
    } catch (err) {
      setImportResult({ success: 0, errors: ['Error al procesar el archivo'] });
    }

    setImportingConcepts(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const totalPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const sortedBudgets = [...budgets].sort((a, b) => b.percentage - a.percentage);

  const monthLabel = formatDateEsLower(new Date(selectedYear, selectedMonth - 1, 1), {
    month: 'long',
    year: 'numeric'
  });

  const changeMonth = (delta: number) => {
    const d = new Date(selectedYear, selectedMonth - 1, 1);
    d.setMonth(d.getMonth() + delta);
    setSelectedMonthYear(d.getMonth() + 1, d.getFullYear());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();
  };

  return (
    <div className="p-3 sm:p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Presupuestos</h2>
          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1 rounded hover:bg-gray-100"
              title="Mes anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-2 font-medium text-gray-600 text-sm">
              {monthLabel}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-1 rounded hover:bg-gray-100"
              title="Mes siguiente"
            >
              <ChevronRight size={18} />
            </button>
            {!isCurrentMonth() && (
              <button
                onClick={() => {
                  const now = new Date();
                  setSelectedMonthYear(now.getMonth() + 1, now.getFullYear());
                }}
                className="ml-2 px-2 py-1 rounded text-xs border border-primary text-primary hover:bg-primary/5"
              >
                Hoy
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyRecurringBudgets}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors text-sm"
            title="Copiar presupuestos recurrentes al próximo mes"
          >
            <Copy size={16} />
            <span className="hidden sm:inline">Copiar recurrentes</span>
          </button>
          <button
            onClick={() => setShowConceptsModal(true)}
            className="px-2 sm:px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            Conceptos
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-1 sm:gap-2 bg-primary text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nuevo Presupuesto</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-xs sm:text-sm text-gray-500">Total Presupuesto</span>
            <TrendingUp className="text-primary" size={18} />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-primary">{formatMoneyEs(totalBudget)}</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-xs sm:text-sm text-gray-500">Total Gastado</span>
            <TrendingDown className="text-expense" size={18} />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-expense">{formatMoneyEs(totalSpent)}</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-xs sm:text-sm text-gray-500">Restante</span>
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${totalRemaining >= 0 ? 'text-income' : 'text-expense'}`}>
            {formatMoneyEs(totalRemaining)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-lg p-6 sm:p-12 text-center">
          <p className="text-gray-500 mb-4">No hay presupuestos para este mes</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-primary hover:underline text-sm"
          >
            Crear tu primer presupuesto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          {sortedBudgets.map((budget) => (
            <div key={budget.id} className="bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{conceptLabelByKey[budget.concept] || budget.concept}</h3>
                  {budget.recurring === 1 && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full flex items-center gap-1" title="Recurrente">
                      🔄
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {budget.recurring === 1 ? (
                    <div className="relative group">
                      <button
                        className="text-gray-400 hover:text-primary transition-colors p-1"
                        title="Mover al siguiente mes"
                      >
                        <ArrowRight size={16} />
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover:block z-10 min-w-[180px]">
                        <button
                          onClick={() => moveToNextMonth(budget, false)}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                        >
                          Copiar al siguiente mes
                        </button>
                        <button
                          onClick={() => moveToNextMonth(budget, true)}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                        >
                          Copiar a todos los meses siguientes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => moveToNextMonth(budget)}
                      className="text-gray-400 hover:text-primary transition-colors p-1"
                      title="Mover al siguiente mes"
                    >
                      <ArrowRight size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(budget)}
                    className="text-gray-400 hover:text-primary transition-colors p-1"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="text-gray-400 hover:text-expense transition-colors p-1"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex justify-center mb-3 sm:mb-4">
                <ProgressCircle percentage={budget.percentage} size={100} strokeWidth={8} />
              </div>
              
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Presupuesto:</span>
                  <span className="font-medium">{formatMoneyEs(budget.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gastado:</span>
                  <span className="font-medium text-expense">{formatMoneyEs(budget.spent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Restante:</span>
                  <span className={`font-medium ${budget.remaining >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatMoneyEs(budget.remaining)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editing ? 'Editar presupuesto' : 'Nuevo Presupuesto'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                <select
                  value={formData.concept}
                  onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {concepts.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="200.00"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                        {new Date(0, i).toLocaleDateString('es', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {[2025, 2026, 2027].map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.recurring}
                    onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                    className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <div>
                    <span className="font-medium text-gray-700">Presupuesto recurrente</span>
                    <p className="text-xs text-gray-500">Se copiará automáticamente al siguiente mes</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditing(null);
                  }}
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

      {showConceptsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Conceptos de gasto</h3>
              <button
                onClick={() => {
                  setShowConceptsModal(false);
                  setConceptError('');
                  setNewConceptLabel('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Cerrar
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <input
                value={newConceptLabel}
                onChange={(e) => setNewConceptLabel(e.target.value)}
                placeholder="Nuevo concepto (ej. Guardería)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                onClick={handleAddConcept}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Añadir
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                title="Importar desde CSV"
              >
                <Upload size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleImportConcepts}
                className="hidden"
              />
            </div>

            {importResult && (
              <div className={`p-3 rounded-lg mb-3 ${importResult.success > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {importResult.success > 0 ? <Check size={16} className="text-green-600" /> : <AlertCircle size={16} className="text-red-600" />}
                  <span className={importResult.success > 0 ? 'text-green-700' : 'text-red-700'}>
                    {importResult.success} conceptos importados
                  </span>
                </div>
                {importResult.errors.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">{importResult.errors[0]}</p>
                )}
              </div>
            )}

            {conceptError && <p className="text-sm text-expense mb-3">{conceptError}</p>}

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 bg-gray-50 text-xs text-gray-500 font-medium">
                <div className="col-span-4 p-3">Clave</div>
                <div className="col-span-6 p-3">Nombre</div>
                <div className="col-span-2 p-3 text-right">Acciones</div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {concepts.map((c) => (
                  <ConceptRow
                    key={c.key}
                    concept={c}
                    onSave={async (label) => updateConceptLabel(c.key, label)}
                    onDelete={async () => {
                      const res = await deleteConcept(c.key);
                      if (!res.success) setConceptError(res.error || 'No se pudo eliminar');
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Nota: si un concepto está en uso (transacciones o presupuestos), no se podrá borrar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ConceptRow({
  concept,
  onSave,
  onDelete,
}: {
  concept: ExpenseConceptItem;
  onSave: (label: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [label, setLabel] = useState(concept.label);

  useEffect(() => {
    setLabel(concept.label);
  }, [concept.label]);

  return (
    <div className="grid grid-cols-12 items-center border-t border-gray-100 text-sm">
      <div className="col-span-4 p-3 font-mono text-xs text-gray-600">{concept.key}</div>
      <div className="col-span-6 p-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full px-2 py-1 border border-gray-200 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      <div className="col-span-2 p-3 flex items-center justify-end gap-2">
        <button
          onClick={() => onSave(label.trim())}
          className="text-primary hover:underline text-xs"
        >
          Guardar
        </button>
        <button
          onClick={onDelete}
          className="text-expense hover:underline text-xs"
        >
          Borrar
        </button>
      </div>
    </div>
  );
}
