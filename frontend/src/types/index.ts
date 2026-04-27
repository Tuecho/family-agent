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
  date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  type?: string;
  location?: string;
  recurrence?: string;
  days_of_week?: string;
  recurrence_start_date?: string;
}

export interface Anniversary {
  id: string;
  title: string;
  type: string;
  date: string;
  notes?: string;
  created_at?: string;
}

export interface Restaurant {
  id: string;
  owner_id: number;
  name: string;
  address?: string;
  phone?: string;
  cuisine_type?: string;
  notes?: string;
  rating: number;
  created_at?: string;
}

export interface HomeAppliance {
  id: string;
  name: string;
  category_id: number;
  category: string;
  category_icon: string;
  category_color: string;
  purchase_date?: string;
  warranty_end_date?: string;
  manual_url?: string;
  notes?: string;
  image_url?: string;
}

export interface MaintenanceTask {
  id: string;
  name: string;
  type: string;
  frequency_days: number;
  last_completed?: string;
  estimated_cost?: number;
  notes?: string;
}

export interface Subscription {
  id: string;
  name: string;
  category: 'streaming' | 'musica' | 'gimnasio' | 'seguro' | 'otro' | 'custom';
  customCategory?: string;
  amount: number;
  billing_cycle: 'mensual' | 'anual';
  next_billing_date?: string;
  auto_renew?: boolean;
  notes?: string;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  birth_date?: string;
  weight?: number;
  microchip?: string;
  photo_url?: string;
}

export interface PetVaccine {
  id: string;
  pet_id: string;
  name: string;
  date_given?: string;
  next_due?: string;
  veterinarian?: string;
  notes?: string;
}

export interface PetMedication {
  id: string;
  pet_id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface Trip {
  id: string;
  name: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  flights_booked?: boolean;
  hotels_booked?: boolean;
  activities_planned?: boolean;
  checklist?: { item: string; packed: boolean }[];
  notes?: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  member_name: string;
  checklist: { item: string; packed: boolean }[];
}

export interface TripActivity {
  id: string;
  trip_id: string;
  name: string;
  date?: string;
  time?: string;
  location?: string;
  notes?: string;
  cost?: number;
  booked?: boolean;
}

export interface PackingList {
  id: string;
  name: string;
  items: { item: string; packed: boolean }[];
}

export interface SavingsPig {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  notes?: string;
  created_at?: string;
}

export interface SavingsGoal {
  id: string;
  pig_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  icon?: string;
  notes?: string;
  created_at?: string;
}

export interface InternalDebt {
  id: string;
  from_member_id?: number;
  to_member_id?: number;
  from_member: string;
  to_member: string;
  amount: number;
  description?: string;
  created_at?: string;
  settled?: boolean | number;
  settled_at?: string;
}

export interface UtilityBill {
  id: string;
  type: string;
  month: number;
  year: number;
  amount: number;
  consumption?: number;
  notes?: string;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  format: 'fisico' | 'ebook';
  isbn?: string;
  owned_by?: string;
  status: 'disponible' | 'leyendo' | 'leido';
  rating?: number;
  notes?: string;
}

export interface ExtraSchool {
  id: string;
  name: string;
  activity: string;
  schedule?: string;
  location?: string;
  teacher_name?: string;
  teacher_contact?: string;
  monthly_price?: number;
  payment_due_day?: number;
  material_needed?: string;
  notes?: string;
}

export interface Indulgence {
  id: string;
  owner_id?: number;
  title: string;
  date: string;
  type: 'plenary' | 'partial';
  description?: string;
  created_at?: string;
}
