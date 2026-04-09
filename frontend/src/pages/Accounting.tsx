import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Loader2, Pencil, Filter, X, Settings, Upload, Check, AlertCircle, Download } from 'lucide-react';
import { useStore } from '../store';
import type { Transaction } from '../types';
import { formatDateEs, formatMoneyEs } from '../utils/format';
import { ImportExcel } from '../components/ImportExcel';
import { ImportPDF } from '../components/ImportPDF';

export function Accounting() {
  const { transactions, concepts, fetchConcepts, addTransaction, updateTransaction, deleteTransaction, getMonthlyTransactions, fetchTransactions, loading, selectedMonth, selectedYear, addConcept, updateConceptLabel, deleteConcept } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [filterConcept, setFilterConcept] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showConceptModal, setShowConceptModal] = useState(false);
  const [newConceptLabel, setNewConceptLabel] = useState('');
  const [conceptError, setConceptError] = useState('');
  const [editingConceptKey, setEditingConceptKey] = useState<string | null>(null);
  const [editingConceptLabel, setEditingConceptLabel] = useState('');
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConcepts();
  }, [fetchConcepts]);

  const slugifyKey = (text: string) => {
    return text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '');
  };

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

  const handleUpdateConcept = async (key: string) => {
    if (!editingConceptLabel.trim()) return;
    await updateConceptLabel(key, editingConceptLabel.trim());
    setEditingConceptKey(null);
    setEditingConceptLabel('');
  };

  const handleDeleteConcept = async (key: string) => {
    const res = await deleteConcept(key);
    if (!res.success) {
      setConceptError(res.error || 'No se pudo eliminar');
    }
  };

  const handleImportConcepts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    concept: 'comida',
    date: new Date().toISOString().split('T')[0]
  });

  let monthlyTransactions = getMonthlyTransactions().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  if (filterConcept !== 'all') {
    monthlyTransactions = monthlyTransactions.filter(t => t.concept === filterConcept);
  }
  
  if (filterType !== 'all') {
    monthlyTransactions = monthlyTransactions.filter(t => t.type === filterType);
  }

  const hasFilters = filterConcept !== 'all' || filterType !== 'all';

  const filteredIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredExpense = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredBalance = filteredIncome - filteredExpense;

  const clearFilters = () => {
    setFilterConcept('all');
    setFilterType('all');
  };

  const exportToCSV = () => {
    if (monthlyTransactions.length === 0) return;

    const csvRows = monthlyTransactions.map(t => {
      const type = t.type === 'income' ? 'Ingreso' : 'Gasto';
      const concept = t.concept ? (conceptLabelByKey[t.concept] || t.concept) : '-';
      const amount = t.amount.toString().replace('.', ','); 
      const date = formatDateEs(t.date);
      return `"${date}";"${t.description.replace(/"/g, '""')}";"${concept}";"${type}";"${amount}"`;
    });
    
    const csvContent = ['Fecha;Descripción;Concepto;Tipo;Cantidad', ...csvRows].join('\n');
    
    // Add BOM for Excel UTF-8
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `contabilidad_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    const payload = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      concept: formData.type === 'expense' ? formData.concept : undefined,
      date: formData.date
    };

    try {
      if (editing) {
        await updateTransaction({ ...payload, id: editing.id });
      } else {
        await addTransaction(payload);
      }

      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        concept: 'comida',
        date: new Date().toISOString().split('T')[0]
      });
      setEditing(null);
      setShowModal(false);
    } catch (error) {
      alert('Error al guardar la transacción. Intenta de nuevo.');
    }
  };

  const openNew = () => {
    setEditing(null);
    setFormData({
      type: 'expense',
      amount: '',
      description: '',
      concept: 'comida',
      date: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setFormData({
      type: t.type,
      amount: String(t.amount),
      description: t.description,
      concept: t.concept || 'comida',
      date: t.date
    });
    setShowModal(true);
  };

  const conceptLabelByKey = concepts.reduce((acc, c) => {
    acc[c.key] = c.label;
    return acc;
  }, {} as Record<string, string>);

  const monthLabel = new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="p-3 sm:p-4 md:p-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Contabilidad</h2>
        {loading && <Loader2 className="animate-spin text-primary" size={20} />}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-sm bg-white"
            title="Exportar vista actual a CSV/Excel"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          <ImportExcel onImportComplete={() => fetchTransactions({ month: selectedMonth, year: selectedYear })} />
          <ImportPDF onImportComplete={() => fetchTransactions({ month: selectedMonth, year: selectedYear })} />
        </div>
        <button
          onClick={openNew}
          className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          <span className="text-sm">Nueva</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="border-l border-gray-300 pl-4 flex items-center gap-2 text-gray-600">
              <Filter size={18} />
              <span className="text-sm font-medium">Filtrar:</span>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2 sm:px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todos los tipos</option>
              <option value="expense">Gastos</option>
              <option value="income">Ingresos</option>
            </select>
            <select
              value={filterConcept}
              onChange={(e) => setFilterConcept(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todos los conceptos</option>
              {concepts.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowConceptModal(true)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Gestionar conceptos"
            >
              <Settings size={18} />
            </button>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-expense hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={16} />
                Limpiar
              </button>
            )}
            <span className="ml-auto text-sm text-gray-500">
              {monthlyTransactions.length} {monthlyTransactions.length === 1 ? 'transacción' : 'transacciones'}
            </span>
          </div>
        </div>

        {hasFilters && (
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700">
                <span className="text-sm font-medium">Resumen filtrado:</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-income font-medium">
                  Ingresos: <span className="font-bold">{formatMoneyEs(filteredIncome)}</span>
                </span>
                <span className="text-expense font-medium">
                  Gastos: <span className="font-bold">{formatMoneyEs(filteredExpense)}</span>
                </span>
                <span className={`font-medium ${filteredBalance >= 0 ? 'text-income' : 'text-expense'}`}>
                  Balance: <span className="font-bold">{formatMoneyEs(filteredBalance)}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-gray-500 font-medium text-sm">Fecha</th>
                <th className="text-left p-4 text-gray-500 font-medium text-sm">Descripción</th>
                <th className="text-left p-4 text-gray-500 font-medium text-sm">Concepto</th>
                <th className="text-right p-4 text-gray-500 font-medium text-sm">Cantidad</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {monthlyTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No hay transacciones este mes
                  </td>
                </tr>
              ) : (
                monthlyTransactions.map((t) => (
                  <tr key={t.id} className="border-t border-gray-100">
                    <td className="p-4 text-gray-600 text-sm">{formatDateEs(t.date)}</td>
                    <td className="p-4 text-gray-800 text-sm">{t.description}</td>
                    <td className="p-4">
                      {t.concept ? (
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">
                          {conceptLabelByKey[t.concept] || t.concept}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-income/10 rounded text-sm text-income">
                          Ingreso
                        </span>
                      )}
                    </td>
                    <td className={`p-4 text-right font-medium text-sm ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatMoneyEs(t.amount)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEdit(t)}
                          className="text-gray-400 hover:text-primary transition-colors"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => { if (window.confirm('¿Eliminar esta transacción?')) deleteTransaction(t.id); }}
                          className="text-gray-400 hover:text-expense transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="md:hidden">
          {monthlyTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay transacciones este mes
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {monthlyTransactions.map((t) => (
                <div key={t.id} className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatMoneyEs(t.amount)}
                        </span>
                        {t.concept ? (
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500">
                            {conceptLabelByKey[t.concept] || t.concept}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-income/10 rounded text-xs text-income">
                            Ingreso
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 text-sm truncate">{t.description}</p>
                      <p className="text-gray-400 text-xs mt-1">{formatDateEs(t.date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => { if (window.confirm('¿Eliminar esta transacción?')) deleteTransaction(t.id); }}
                        className="p-2 text-gray-400 hover:text-expense transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold mb-4">{editing ? 'Editar' : 'Nueva'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    formData.type === 'expense'
                      ? 'bg-expense text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Gasto
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    formData.type === 'income'
                      ? 'bg-income text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Ingreso
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              {formData.type === 'expense' && (
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
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
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

      {showConceptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Gestionar Conceptos</h2>
              <button
                onClick={() => {
                  setShowConceptModal(false);
                  setConceptError('');
                  setNewConceptLabel('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b">
              <div className="flex gap-2">
                <input
                  value={newConceptLabel}
                  onChange={(e) => setNewConceptLabel(e.target.value)}
                  placeholder="Nuevo concepto (ej. Guardería)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddConcept()}
                />
                <button
                  onClick={handleAddConcept}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Añadir
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
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

              {conceptError && <p className="text-sm text-red-500 mt-2">{conceptError}</p>}
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="divide-y">
                {concepts.map((c) => (
                  <div key={c.key} className="p-3 flex items-center gap-2">
                    {editingConceptKey === c.key ? (
                      <>
                        <input
                          value={editingConceptLabel}
                          onChange={(e) => setEditingConceptLabel(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateConcept(c.key)}
                        />
                        <button
                          onClick={() => handleUpdateConcept(c.key)}
                          className="text-green-600 hover:bg-green-50 px-2 py-1 rounded"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => {
                            setEditingConceptKey(null);
                            setEditingConceptLabel('');
                          }}
                          className="text-gray-500 hover:bg-gray-50 px-2 py-1 rounded"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <span className="font-medium">{c.label}</span>
                          <span className="text-gray-400 text-sm ml-2">({c.key})</span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingConceptKey(c.key);
                            setEditingConceptLabel(c.label);
                          }}
                          className="text-gray-400 hover:text-primary p-1"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteConcept(c.key)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
