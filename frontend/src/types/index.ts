export type ExpenseConcept = string;

export interface ExpenseConceptItem {
  key: string;
  label: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  concept?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface FamilyEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  start_time?: string; // HH:MM
  end_time?: string;   // HH:MM
  type?: string;
  location?: string;
  recurrence?: string;
  days_of_week?: string;
}
