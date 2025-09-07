
export type TransactionType = 'income' | 'expense';

export type TimeRange = 'today' | 'yesterday' | '7days' | '14days' | '30days' | 'custom';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  categoryIcon?: string;
  categoryColor?: string;
  description?: string;
  date: string; // ISO date string
  goalId?: string; // Optional reference to a goal
  // Database fields for compatibility
  category_id?: string;
  goal_id?: string;
  user_id?: string;
  created_at?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string; // ISO date string
  endDate?: string; // Optional end date
  deadline?: string; // Optional deadline date
  color: string;
  transactions: Transaction[];
  // Database fields for compatibility
  target_amount?: number;
  current_amount?: number;
  start_date?: string;
  end_date?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduledTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  categoryIcon?: string;
  categoryColor?: string;
  description?: string;
  scheduledDate: string; // ISO date string
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  goalId?: string; // Optional reference to a goal
  status?: 'pending' | 'paid' | 'overdue' | 'upcoming';
  paidDate?: string; // ISO date string
  paidAmount?: number;
  lastExecutionDate?: string; // ISO date string
  nextExecutionDate?: string; // ISO date string
  // Database fields for compatibility
  category_id?: string;
  goal_id?: string;
  user_id?: string;
  scheduled_date?: string;
  paid_date?: string;
  last_execution_date?: string;
  next_execution_date?: string;
  created_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  phone?: string;
  cpf?: string;
  birthDate?: string; // ISO date string
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  currentPlanType?: string;
  planValue?: number; // Valor específico que o usuário paga pelo plano atual
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  dateEarned: string; // ISO date string
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export type ReportFormat = 'csv' | 'pdf';
