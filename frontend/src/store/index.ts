import { create } from 'zustand';
import type { ExpenseConceptItem, Transaction } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

interface BudgetItem {
  id: string;
  concept: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
}

interface MonthlyData {
  month: number;
  year: number;
  label: string;
  income: number;
  expense: number;
  balance: number;
}

interface AppState {
  transactions: Transaction[];
  concepts: ExpenseConceptItem[];
  budgets: BudgetItem[];
  monthlyData: MonthlyData[];
  loading: boolean;
  selectedMonth: number; // 1-12
  selectedYear: number; // YYYY
  setSelectedMonthYear: (month: number, year: number) => void;
  fetchConcepts: () => Promise<void>;
  addConcept: (concept: ExpenseConceptItem) => Promise<void>;
  updateConceptLabel: (key: string, label: string) => Promise<void>;
  deleteConcept: (key: string) => Promise<{ success: boolean; error?: string }>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  fetchTransactions: (opts?: { month?: number; year?: number }) => Promise<void>;
  fetchBudgets: () => Promise<void>;
  fetchMonthlyData: () => Promise<void>;
  getMonthlyTransactions: () => Transaction[];
  getTotals: () => { income: number; expense: number; balance: number };
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useStore = create<AppState>((set, get) => ({
  transactions: [],
  concepts: [],
  budgets: [],
  monthlyData: [],
  loading: false,
  selectedMonth: new Date().getMonth() + 1,
  selectedYear: new Date().getFullYear(),

  setSelectedMonthYear: (month, year) => {
    set({ selectedMonth: month, selectedYear: year });
    get().fetchBudgets();
  },

  fetchConcepts: async () => {
    try {
      const resp = await fetch(`${API_URL}/api/concepts`);
      const data = await resp.json();
      set({ concepts: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error('Error fetching concepts:', error);
    }
  },

  addConcept: async (concept) => {
    try {
      const resp = await fetch(`${API_URL}/api/concepts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(concept)
      });
      if (!resp.ok) return;
      set((state) => ({ concepts: [...state.concepts, concept].sort((a, b) => a.label.localeCompare(b.label)) }));
    } catch (error) {
      console.error('Error adding concept:', error);
    }
  },

  updateConceptLabel: async (key, label) => {
    try {
      const resp = await fetch(`${API_URL}/api/concepts/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label })
      });
      if (!resp.ok) return;
      set((state) => ({
        concepts: state.concepts
          .map((c) => (c.key === key ? { ...c, label } : c))
          .sort((a, b) => a.label.localeCompare(b.label))
      }));
    } catch (error) {
      console.error('Error updating concept:', error);
    }
  },

  deleteConcept: async (key) => {
    try {
      const resp = await fetch(`${API_URL}/api/concepts/${key}`, { method: 'DELETE' });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        return { success: false, error: data?.error || 'No se pudo eliminar' };
      }
      set((state) => ({ concepts: state.concepts.filter((c) => c.key !== key) }));
      return { success: true };
    } catch (error) {
      console.error('Error deleting concept:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  fetchTransactions: async (opts) => {
    set({ loading: true });
    try {
      const month = opts?.month ?? get().selectedMonth;
      const year = opts?.year ?? get().selectedYear;
      const response = await fetch(`${API_URL}/api/transactions?month=${month}&year=${year}`);
      const data = await response.json();
      set({ transactions: data, loading: false });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      set({ loading: false });
    }
  },

  addTransaction: async (transaction) => {
    const id = generateId();
    const transactionWithId = { ...transaction, id };
    
    try {
      await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionWithId)
      });
      
      set((state) => ({
        transactions: [transactionWithId, ...state.transactions]
      }));
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  },

  updateTransaction: async (transaction) => {
    try {
      await fetch(`${API_URL}/api/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });

      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === transaction.id ? transaction : t))
      }));
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  },

  deleteTransaction: async (id) => {
    try {
      await fetch(`${API_URL}/api/transactions/${id}`, {
        method: 'DELETE'
      });
      
      set((state) => ({
        transactions: state.transactions.filter(t => t.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  },

  fetchBudgets: async () => {
    const { selectedMonth, selectedYear } = get();
    try {
      const response = await fetch(`${API_URL}/api/budgets/with-spending?month=${selectedMonth}&year=${selectedYear}`);
      const data = await response.json();
      set({ budgets: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  },

  fetchMonthlyData: async () => {
    try {
      const response = await fetch(`${API_URL}/api/transactions/monthly?months=6`);
      const data = await response.json();
      set({ monthlyData: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    }
  },

  getMonthlyTransactions: () => {
    // El backend ya devuelve filtrado por mes/año, pero filtramos por seguridad.
    const { selectedMonth, selectedYear } = get();
    const mm = String(selectedMonth).padStart(2, '0');
    const yyyy = String(selectedYear);
    return get().transactions.filter((t) => t.date?.slice(0, 7) === `${yyyy}-${mm}`);
  },

  getTotals: () => {
    const monthly = get().getMonthlyTransactions();
    const income = monthly
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = monthly
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  },
}));
