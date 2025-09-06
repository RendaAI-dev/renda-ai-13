
import React from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/utils/transactionUtils';
import { MoreHorizontal, TrendingUp, TrendingDown, Target, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import CategoryIcon from '../categories/CategoryIcon';
import TransactionCard from './TransactionCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  hideValues?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  hideValues = false
}) => {
  const { goals } = useAppContext();
  const { t, currency } = usePreferences();
  const isMobile = useIsMobile();

  // Helper to get goal name
  const getGoalName = (goalId?: string) => {
    if (!goalId) return null;
    const goal = goals.find(g => g.id === goalId);
    return goal ? goal.name : null;
  };

  // Helper to render masked values
  const renderHiddenValue = () => {
    return '******';
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M16 6h6"></path><path d="M21 12h1"></path><path d="M16 18h6"></path><path d="M8 6H3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h5"></path><path d="M10 18H3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h7"></path><path d="m7 14 4-4"></path><path d="m7 10 4 4"></path>
            </svg>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">{t('common.noData')}</p>
            <p className="text-sm text-muted-foreground">{t('transactions.empty')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Mobile card layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {transactions.map((transaction, index) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            onEdit={onEdit}
            onDelete={onDelete}
            hideValues={hideValues}
            index={index}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead>{t('common.type')}</TableHead>
            <TableHead>{t('common.date')}</TableHead>
            <TableHead>{t('common.category')}</TableHead>
            <TableHead>{t('common.description')}</TableHead>
            <TableHead>{t('nav.goals')}</TableHead>
            <TableHead className="text-right">{t('common.amount')}</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction, index) => {
            // Use different icons and colors based on transaction type
            const iconColor = transaction.type === 'income' ? '#26DE81' : '#EF4444';
            
            return (
              <motion.tr
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="group"
              >
                <TableCell>
                  {transaction.type === 'income' ? (
                    <div className="flex items-center">
                      <div className="w-7 h-7 rounded-full bg-metacash-success flex items-center justify-center mr-2">
                        <ArrowUp className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs md:text-sm">{t('income.title')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="w-7 h-7 rounded-full bg-metacash-error flex items-center justify-center mr-2">
                        <ArrowDown className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs md:text-sm">{t('expense.title')}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium text-xs md:text-sm">
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CategoryIcon 
                      icon={transaction.type === 'income' ? 'trending-up' : transaction.type === 'expense' ? transaction.category.toLowerCase().includes('food') ? 'utensils' : 'shopping-bag' : 'circle'} 
                      color={iconColor} 
                      size={16}
                    />
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      transaction.type === 'income' 
                        ? "bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                        : "bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                    )}>
                      {transaction.category}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-xs md:text-sm">
                  {transaction.description}
                </TableCell>
                <TableCell>
                  {transaction.goalId && (
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-metacash-blue" />
                      <span className="text-xs">{getGoalName(transaction.goalId)}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-semibold text-xs md:text-sm",
                  transaction.type === 'income' ? 'text-metacash-success' : 'text-metacash-error'
                )}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {hideValues ? renderHiddenValue() : formatCurrency(transaction.amount, currency)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{t('common.edit')}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(transaction)}>
                          {t('common.edit')}
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(transaction.id)}
                          className="text-metacash-error"
                        >
                          {t('common.delete')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </motion.tr>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionList;
