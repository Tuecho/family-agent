import { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Pencil } from 'lucide-react';
import { useStore } from '../store';
import type { ExpenseConceptItem } from '../types';
import { formatMoneyEs } from '../utils/format';

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
  const { concepts, fetchConcepts, addConcept, updateConceptLabel, deleteConcept } = useStore();
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BudgetWithSpending | null>(null);
  const [showConceptsModal, setShowConceptsModal] = useState(false);
  const [conceptError, setConceptError] = useState<string>('');
  const [newConceptLabel, setNewConceptLabel] = useState('');
  const [formData, setFormData] = useState({
    concept: 'comida',
    amount: '',
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear())
  });

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const year = new Date().getFullYear();
      
      const response = await fetch(`${API_URL}/api/budgets/with-spending?month=${month}&year=${year}`);
      const data = await response.json();
      setBudgets(data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConcepts();
    fetchBudgets();
  }, [fetchConcepts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) return;

    const id = editing?.id ?? Math.random().toString(36).substring(2, 9);
    
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `${API_URL}/api/budgets/${id}` : `${API_URL}/api/budgets`;

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          concept: formData.concept,
          amount: parseFloat(formData.amount),
          month: parseInt(formData.month),
          year: parseInt(formData.year)
        })
      });

      setFormData({
        concept: 'comida',
        amount: '',
        month: String(new Date().getMonth() + 1),
        year: String(new Date().getFullYear())
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
        method: 'DELETE'
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
      month: String(new Date().getMonth() + 1),
      year: String(new Date().getFullYear())
    });
    setShowModal(true);
  };

  const openEdit = (b: BudgetWithSpending) => {
    setEditing(b);
    setFormData({
      concept: b.concept,
      amount: String(b.amount),
      month: String(b.month).padStart(2, '0'),
      year: String(b.year)
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

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const totalPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Presupuestos</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConceptsModal(true)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Conceptos
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Nuevo Presupuesto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500">Total Presupuesto</span>
            <TrendingUp className="text-primary" size={20} />
          </div>
          <p className="text-2xl font-bold text-primary">{formatMoneyEs(totalBudget)}</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500">Total Gastado</span>
            <TrendingDown className="text-expense" size={20} />
          </div>
          <p className="text-2xl font-bold text-expense">{formatMoneyEs(totalSpent)}</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500">Restante</span>
          </div>
          <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-income' : 'text-expense'}`}>
            {formatMoneyEs(totalRemaining)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">No hay presupuestos para este mes</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-primary hover:underline"
          >
            Crear tu primer presupuesto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <div key={budget.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">{conceptLabelByKey[budget.concept] || budget.concept}</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEdit(budget)}
                    className="text-gray-400 hover:text-primary transition-colors"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="text-gray-400 hover:text-expense transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex justify-center mb-4">
                <ProgressCircle percentage={budget.percentage} />
              </div>
              
              <div className="space-y-2 text-sm">
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

            <div className="flex gap-2 mb-3">
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
            </div>
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
