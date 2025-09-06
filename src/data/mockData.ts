
import { Transaction, Goal, ScheduledTransaction, User, Achievement, CategorySummary } from '../types';

// Helper to generate random ID
const generateId = () => Math.random().toString(36).substring(2, 10);

// Helper to generate random dates
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

// Current date
const now = new Date();

// Mock transactions
export const mockTransactions: Transaction[] = [
  {
    id: generateId(),
    type: 'income',
    amount: 2500,
    category: 'Salary',
    description: 'Monthly salary',
    date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    goalId: 'goal1',
  },
  {
    id: generateId(),
    type: 'expense',
    amount: 800,
    category: 'Rent',
    description: 'Monthly rent payment',
    date: new Date(now.getFullYear(), now.getMonth(), 3).toISOString(),
  },
  {
    id: generateId(),
    type: 'expense',
    amount: 120,
    category: 'Utilities',
    description: 'Electricity bill',
    date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
  },
  {
    id: generateId(),
    type: 'expense',
    amount: 75,
    category: 'Groceries',
    description: 'Weekly groceries',
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2).toISOString(),
  },
  {
    id: generateId(),
    type: 'expense',
    amount: 35,
    category: 'Dining',
    description: 'Restaurant dinner',
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString(),
  },
  {
    id: generateId(),
    type: 'income',
    amount: 300,
    category: 'Freelance',
    description: 'Design project',
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3).toISOString(),
    goalId: 'goal2',
  },
  {
    id: generateId(),
    type: 'expense',
    amount: 50,
    category: 'Entertainment',
    description: 'Movie tickets',
    date: new Date().toISOString(),
  },
  {
    id: generateId(),
    type: 'expense',
    amount: 130,
    category: 'Shopping',
    description: 'New clothes',
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5).toISOString(),
  },
  {
    id: generateId(),
    type: 'expense',
    amount: 60,
    category: 'Transport',
    description: 'Gas',
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4).toISOString(),
  },
  {
    id: generateId(),
    type: 'income',
    amount: 100,
    category: 'Other',
    description: 'Cash gift',
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString(),
    goalId: 'goal3',
  },
];

// Mock goals
export const mockGoals: Goal[] = [
  {
    id: 'goal1',
    name: 'New Laptop',
    targetAmount: 1500,
    currentAmount: 850,
    startDate: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString(),
    deadline: new Date(now.getFullYear(), now.getMonth() + 2, 15).toISOString(),
    color: '#4ECDC4', // MetaCash teal
    transactions: [],
  },
  {
    id: 'goal2',
    name: 'Vacation',
    targetAmount: 3000,
    currentAmount: 1200,
    startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(),
    endDate: new Date(now.getFullYear(), now.getMonth() + 4, 1).toISOString(),
    deadline: new Date(now.getFullYear(), now.getMonth() + 4, 1).toISOString(),
    color: '#FF6B6B', // MetaCash coral
    transactions: [],
  },
  {
    id: 'goal3',
    name: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 3500,
    startDate: new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString(),
    deadline: new Date(now.getFullYear() + 1, now.getMonth(), 1).toISOString(),
    color: '#2C6E7F', // MetaCash blue
    transactions: [],
  }
];

// Mock scheduled transactions
export const mockScheduledTransactions: ScheduledTransaction[] = [
  {
    id: generateId(),
    type: 'income',
    amount: 2500,
    category: 'Salary',
    description: 'Monthly salary',
    scheduledDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
    recurrence: 'monthly',
  },
  {
    id: generateId(),
    type: 'expense',
    amount: 800,
    category: 'Rent',
    description: 'Monthly rent payment',
    scheduledDate: new Date(now.getFullYear(), now.getMonth() + 1, 3).toISOString(),
    recurrence: 'monthly',
  },
  {
    id: generateId(),
    type: 'expense',
    amount: 120,
    category: 'Utilities',
    description: 'Electricity bill',
    scheduledDate: new Date(now.getFullYear(), now.getMonth() + 1, 5).toISOString(),
    recurrence: 'monthly',
  }
];

// Mock user
export const mockUser: User = {
  id: 'user1',
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  profileImage: 'https://i.pravatar.cc/150?img=33',
  achievements: [
    {
      id: 'ach1',
      name: 'Getting Started',
      description: 'Created your first financial goal',
      icon: 'Trophy',
      dateEarned: new Date(now.getFullYear(), now.getMonth() - 2, 15).toISOString(),
    },
    {
      id: 'ach2',
      name: 'Saver',
      description: 'Saved $1000 towards goals',
      icon: 'BadgeDollarSign',
      dateEarned: new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString(),
    }
  ]
};

// Mock category summaries
export const mockExpenseCategories: CategorySummary[] = [
  { category: 'Rent', amount: 800, percentage: 40, color: '#4ECDC4' },
  { category: 'Utilities', amount: 120, percentage: 6, color: '#FF6B6B' },
  { category: 'Groceries', amount: 300, percentage: 15, color: '#2C6E7F' },
  { category: 'Dining', amount: 200, percentage: 10, color: '#FBBF24' },
  { category: 'Entertainment', amount: 150, percentage: 7.5, color: '#8B5CF6' },
  { category: 'Shopping', amount: 250, percentage: 12.5, color: '#EC4899' },
  { category: 'Transport', amount: 100, percentage: 5, color: '#10B981' },
  { category: 'Other', amount: 80, percentage: 4, color: '#94A3B8' }
];

export const mockIncomeCategories: CategorySummary[] = [
  { category: 'Salary', amount: 2500, percentage: 86.2, color: '#4ECDC4' },
  { category: 'Freelance', amount: 300, percentage: 10.3, color: '#FF6B6B' },
  { category: 'Other', amount: 100, percentage: 3.5, color: '#94A3B8' }
];

// Monthly summary data (last 6 months)
export const mockMonthlySummary = [
  { month: 'Jan', income: 2800, expenses: 2100 },
  { month: 'Feb', income: 2900, expenses: 2300 },
  { month: 'Mar', income: 3100, expenses: 2200 },
  { month: 'Apr', income: 2750, expenses: 2400 },
  { month: 'May', income: 3300, expenses: 2500 },
  { month: 'Jun', income: 2900, expenses: 2000 }
];

// Categories for transaction form
export const incomeCategories = [
  'Salary', 'Freelance', 'Business', 'Investments', 'Rental', 'Gift', 'Other'
];

export const expenseCategories = [
  'Rent', 'Utilities', 'Groceries', 'Dining', 'Entertainment', 
  'Shopping', 'Transport', 'Healthcare', 'Education', 'Travel', 'Other'
];
