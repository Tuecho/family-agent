import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Pencil } from 'lucide-react';
import { useStore } from '../store';
import type { Transaction } from '../types';
import { formatDateEs, formatMoneyEs } from '../utils/format';
import { ImportExcel } from '../components/ImportExcel';

export function Accounting() {
  const { transactions, concepts, fetchConcepts, addTransaction, updateTransaction, deleteTransaction, getMonthlyTransactions, fetchTransactions, loading, selectedMonth, selectedYear } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchConcepts();
    fetchTransactions({ month: selectedMonth, year: selectedYear });
  }, [fetchConcepts, fetchTransactions, selectedMonth, selectedYear]);

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    concept: 'comida',
    date: new Date().toISOString().split('T')[0]
  });

  const monthlyTransactions = getMonthlyTransactions().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    const payload = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      concept: formData.type === 'expense' ? formData.concept : undefined,
      date: formData.date
    };

    if (editing) {
      updateTransaction({ ...payload, id: editing.id });
    } else {
      addTransaction(payload);
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Contabilidad</h2>
        {loading && <Loader2 className="animate-spin text-primary" size={20} />}
      </div>

      <div className="flex items-center justify-end gap-3 mb-6">
        <ImportExcel onImportComplete={() => fetchTransactions({ month: selectedMonth, year: selectedYear })} />
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Nueva Transacción
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 text-gray-500 font-medium">Fecha</th>
              <th className="text-left p-4 text-gray-500 font-medium">Descripción</th>
              <th className="text-left p-4 text-gray-500 font-medium">Concepto</th>
              <th className="text-right p-4 text-gray-500 font-medium">Cantidad</th>
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
                  <td className="p-4 text-gray-600">{formatDateEs(t.date)}</td>
                  <td className="p-4 text-gray-800">{t.description}</td>
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
                  <td className={`p-4 text-right font-medium ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
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
                        onClick={() => deleteTransaction(t.id)}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editing ? 'Editar transacción' : 'Nueva Transacción'}</h3>
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
    </div>
  );
}
