import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, TrendingUp, TrendingDown, Zap, Droplets, Flame, Calendar, TrendingUp as TrendingUpIcon, Wifi, Smartphone, Settings, Edit2 } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';
import type { UtilityBill } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

const DEFAULT_TYPES = [
  { id: 'luz', label: 'Luz', icon: Zap, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'agua', label: 'Agua', icon: Droplets, color: 'bg-blue-100 text-blue-700' },
  { id: 'gas', label: 'Gas', icon: Flame, color: 'bg-orange-100 text-orange-700' },
  { id: 'internet', label: 'Internet', icon: Wifi, color: 'bg-purple-100 text-purple-700' },
  { id: 'movil', label: 'Móvil', icon: Smartphone, color: 'bg-green-100 text-green-700' },
];

export function UtilityBills() {
  const [bills, setBills] = useState<UtilityBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState<UtilityBill | null>(null);
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string>('all');

  const [formData, setFormData] = useState({
    type: 'luz' as string,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: '',
    consumption: '',
    notes: '',
  });

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_URL}/api/finance/utility-bills`, { headers });
      const data = await res.json();
      setBills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting bill:', formData);
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const url = editingBill 
        ? `${API_URL}/api/finance/utility-bills/${editingBill.id}`
        : `${API_URL}/api/finance/utility-bills`;
      const res = await fetch(url, {
        method: editingBill ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      if (res.ok) {
        fetchBills();
        resetForm();
      } else {
        alert('Error: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error saving bill:', error);
      alert('Error de conexión');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta factura?')) return;
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/finance/utility-bills/${id}`, { method: 'DELETE', headers });
      setBills(bills.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting bill:', error);
    }
  };

  const handleEdit = (bill: UtilityBill) => {
    setEditingBill(bill);
    setFormData({
      type: bill.type,
      month: bill.month,
      year: bill.year,
      amount: bill.amount.toString(),
      consumption: bill.consumption?.toString() || '',
      notes: bill.notes || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingBill(null);
    setFormData({
      type: 'luz',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      amount: '',
      consumption: '',
      notes: '',
    });
  };

  const handleAddCustomType = () => {
    if (newTypeName.trim()) {
      const normalized = newTypeName.trim().toLowerCase();
      if (!customTypes.includes(normalized) && !DEFAULT_TYPES.find(t => t.id === normalized)) {
        setCustomTypes([...customTypes, normalized]);
        setFormData({ ...formData, type: normalized });
      }
      setNewTypeName('');
      setShowAddType(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const defaultType = DEFAULT_TYPES.find(t => t.id === type);
    if (defaultType) {
      const Icon = defaultType.icon;
      return <Icon size={18} />;
    }
    return <Settings size={18} />;
  };

  const getTypeLabel = (type: string) => {
    const defaultType = DEFAULT_TYPES.find(t => t.id === type);
    if (defaultType) return defaultType.label;
    const customType = customTypes.find(t => t === type);
    return customType || type;
  };

  const getTypeColor = (type: string) => {
    const defaultType = DEFAULT_TYPES.find(t => t.id === type);
    if (defaultType) return defaultType.color;
    return 'bg-gray-100 text-gray-700';
  };

  const getMonthlyAverage = (type: string) => {
    const typeBills = bills.filter(b => b.type === type);
    if (typeBills.length === 0) return 0;
    return typeBills.reduce((sum, b) => sum + b.amount, 0) / typeBills.length;
  };

  const getLastMonthBill = (type: string) => {
    const sorted = bills.filter(b => b.type === type).sort((a, b) => {
      const dateA = new Date(a.year, a.month - 1);
      const dateB = new Date(b.year, b.month - 1);
      return dateB.getTime() - dateA.getTime();
    });
    return sorted[0];
  };

  const getPreviousMonthBill = (type: string) => {
    const sorted = bills.filter(b => b.type === type).sort((a, b) => {
      const dateA = new Date(a.year, a.month - 1);
      const dateB = new Date(b.year, b.month - 1);
      return dateB.getTime() - dateA.getTime();
    });
    return sorted[1];
  };

  const getComparison = (type: string) => {
    const last = getLastMonthBill(type);
    const previous = getPreviousMonthBill(type);
    if (!last || !previous || previous.amount === 0) return null;
    const change = ((last.amount - previous.amount) / previous.amount) * 100;
    return { change, isIncrease: change > 0 };
  };

  const getAnomalyAlert = (type: string) => {
    const last = getLastMonthBill(type);
    if (!last) return null;
    const average = getMonthlyAverage(type);
    if (average === 0) return null;
    const deviation = ((last.amount - average) / average) * 100;
    if (deviation > 30) return { type: 'high', message: `Un ${Math.abs(deviation).toFixed(0)}% más alto de lo normal` };
    if (deviation < -30) return { type: 'low', message: `Un ${Math.abs(deviation).toFixed(0)}% más bajo de lo normal` };
    return null;
  };

  const luzBills = bills.filter(b => b.type === 'luz');
  const aguaBills = bills.filter(b => b.type === 'agua');
  const gasBills = bills.filter(b => b.type === 'gas');
  const internetBills = bills.filter(b => b.type === 'internet');
  const movilBills = bills.filter(b => b.type === 'movil');

  const totalLuz = luzBills.reduce((sum, b) => sum + b.amount, 0);
  const totalAgua = aguaBills.reduce((sum, b) => sum + b.amount, 0);
  const totalGas = gasBills.reduce((sum, b) => sum + b.amount, 0);
  const totalInternet = internetBills.reduce((sum, b) => sum + b.amount, 0);
  const totalMovil = movilBills.reduce((sum, b) => sum + b.amount, 0);

  const allTypes = [...DEFAULT_TYPES.map(t => t.id), ...customTypes];
  const uniqueTypes = [...new Set(bills.map(b => b.type))];
  const displayTypes = allTypes.filter(t => uniqueTypes.includes(t)).length > 0 
    ? uniqueTypes 
    : allTypes.slice(0, 5);

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Comparador de Facturas</h1>
          <p className="text-gray-500 text-sm">Luz, agua y gas - mes a mes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Nueva factura
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(displayTypes.length > 0 ? displayTypes : allTypes.slice(0, 5)).map((type) => {
          const lastBill = getLastMonthBill(type);
          const comparison = getComparison(type);
          const anomaly = getAnomalyAlert(type);
          
          return (
            <div key={type} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${getTypeColor(type)}`}>
                  {getTypeIcon(type)}
                </div>
                <h3 className="font-bold text-gray-800">{getTypeLabel(type)}</h3>
              </div>
              
              <p className="text-2xl font-bold text-gray-800 mb-1">
                {lastBill ? `${lastBill.amount.toFixed(2)}€` : 'Sin datos'}
              </p>
              {lastBill && (
                <p className="text-sm text-gray-500 mb-2">
                  {months[lastBill.month - 1]} {lastBill.year}
                </p>
              )}

              {comparison && (
                <div className={`flex items-center gap-1 text-sm ${comparison.isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                  {comparison.isIncrease ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{Math.abs(comparison.change).toFixed(1)}% vs mes anterior</span>
                </div>
              )}

              {anomaly && (
                <div className={`mt-2 flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  anomaly.type === 'high' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  <AlertTriangle size={12} />
                  {anomaly.message}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                Media: {getMonthlyAverage(type).toFixed(2)}€
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-yellow-50 rounded-xl p-4">
          <p className="text-sm text-yellow-700">Total luz</p>
          <p className="text-xl font-bold text-yellow-800">{totalLuz.toFixed(2)}€</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-700">Total agua</p>
          <p className="text-xl font-bold text-blue-800">{totalAgua.toFixed(2)}€</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-sm text-orange-700">Total gas</p>
          <p className="text-xl font-bold text-orange-800">{totalGas.toFixed(2)}€</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <p className="text-sm text-purple-700">Total internet</p>
          <p className="text-xl font-bold text-purple-800">{totalInternet.toFixed(2)}€</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-green-700">Total móvil</p>
          <p className="text-xl font-bold text-green-800">{totalMovil.toFixed(2)}€</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : bills.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Zap size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No hay facturas</p>
          <p className="text-sm text-gray-400">Añade tus primeras facturas</p>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h2 className="font-semibold text-gray-700">Historial de facturas</h2>
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-gray-500">Filtrar:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
              >
                <option value="all">Todos</option>
                {allTypes.map(t => (
                  <option key={t} value={t}>{getTypeLabel(t)}</option>
                ))}
              </select>
            </div>
          </div>
          {filterType !== 'all' && (
            <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Total {getTypeLabel(filterType)}:
              </span>
              <span className="text-lg font-bold text-gray-800">
                {bills.filter(b => b.type === filterType).reduce((sum, b) => sum + b.amount, 0).toFixed(2)}€
              </span>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => { setSortBy('type'); setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc'); }}
                    >
                      Tipo {sortBy === 'type' && (sortDirection === 'desc' ? '↓' : '↑')}
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => { setSortBy('date'); setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc'); }}
                    >
                      Mes/Año {sortBy === 'date' && (sortDirection === 'desc' ? '↓' : '↑')}
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => { setSortBy('amount'); setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc'); }}
                    >
                      Importe {sortBy === 'amount' && (sortDirection === 'desc' ? '↓' : '↑')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Consumo</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let filtered = filterType === 'all' ? bills : bills.filter(b => b.type === filterType);
                    let sorted = [...filtered].sort((a, b) => {
                      let cmp = 0;
                      if (sortBy === 'date') {
                        cmp = new Date(b.year, b.month - 1).getTime() - new Date(a.year, a.month - 1).getTime();
                      } else if (sortBy === 'type') {
                        cmp = a.type.localeCompare(b.type);
                      } else {
                        cmp = b.amount - a.amount;
                      }
                      return sortDirection === 'desc' ? cmp : -cmp;
                    });
                    return sorted.map((bill) => (
                    <tr key={bill.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${getTypeColor(bill.type)}`}>
                            {getTypeIcon(bill.type)}
                          </div>
                          <span className="font-medium text-gray-800">{getTypeLabel(bill.type)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {months[bill.month - 1]} {bill.year}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{bill.amount.toFixed(2)}€</td>
                      <td className="px-4 py-3 text-gray-500">{bill.consumption || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(bill)}
                            className="p-1 text-gray-400 hover:text-primary rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(bill.id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editingBill ? 'Editar factura' : 'Nueva factura'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <button
                      type="button"
                      onClick={() => setShowAddType(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      + Añadir tipo
                    </button>
                  </div>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  >
                    {DEFAULT_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                    {customTypes.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                  {showAddType && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        placeholder="Nuevo tipo (ej. internet)"
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomType()}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomType}
                        className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg"
                      >
                        Añadir
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddType(false); setNewTypeName(''); }}
                        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                    <select
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    >
                      {months.map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Importe (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    placeholder="85.50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consumo (opcional)</label>
                  <input
                    type="text"
                    value={formData.consumption}
                    onChange={(e) => setFormData({ ...formData, consumption: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    placeholder="250 kWh"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    rows={2}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
