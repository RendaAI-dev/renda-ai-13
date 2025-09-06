
import { LucideIcon } from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  isDefault?: boolean;
}
