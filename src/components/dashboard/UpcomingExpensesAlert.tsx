
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Calendar, ChevronRight } from 'lucide-react';
import { ScheduledTransaction } from '@/types';
import { formatCurrency } from '@/utils/transactionUtils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface UpcomingExpensesAlertProps {
  scheduledTransactions: ScheduledTransaction[];
  onMarkAsPaid?: (transaction: ScheduledTransaction) => void;
}

const UpcomingExpensesAlert: React.FC<UpcomingExpensesAlertProps> = ({
  scheduledTransactions,
  onMarkAsPaid
}) => {
  const { t, currency } = usePreferences();

  // Filtrar apenas despesas pendentes
  const pendingExpenses = scheduledTransactions.filter(
    transaction => transaction.type === 'expense' && 
    (!transaction.status || transaction.status === 'pending')
  );

  // Categorizar por urgência
  const today = new Date();
  const categorizedExpenses = pendingExpenses.reduce((acc, transaction) => {
    const transactionDate = new Date(transaction.nextExecutionDate || transaction.scheduledDate);
    const daysUntilDue = Math.ceil((transactionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      acc.overdue.push(transaction);
    } else if (daysUntilDue === 0) {
      acc.dueToday.push(transaction);
    } else if (daysUntilDue <= 3) {
      acc.dueSoon.push(transaction);
    }

    return acc;
  }, {
    overdue: [] as ScheduledTransaction[],
    dueToday: [] as ScheduledTransaction[],
    dueSoon: [] as ScheduledTransaction[]
  });

  const totalUrgentExpenses = categorizedExpenses.overdue.length + 
                             categorizedExpenses.dueToday.length + 
                             categorizedExpenses.dueSoon.length;

  // Não mostrar se não há despesas urgentes
  if (totalUrgentExpenses === 0) {
    return null;
  }

  const totalAmount = [
    ...categorizedExpenses.overdue,
    ...categorizedExpenses.dueToday,
    ...categorizedExpenses.dueSoon
  ].reduce((sum, transaction) => sum + transaction.amount, 0);

  const getUrgencyData = () => {
    if (categorizedExpenses.overdue.length > 0) {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'bg-red-500',
        textColor: 'text-red-800 dark:text-red-200',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        borderColor: 'border-red-200 dark:border-red-800',
        count: categorizedExpenses.overdue.length,
        label: t('schedule.overdue')
      };
    }
    if (categorizedExpenses.dueToday.length > 0) {
      return {
        icon: <Clock className="h-4 w-4" />,
        color: 'bg-orange-500',
        textColor: 'text-orange-800 dark:text-orange-200',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        count: categorizedExpenses.dueToday.length,
        label: t('schedule.dueToday')
      };
    }
    return {
      icon: <Calendar className="h-4 w-4" />,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      count: categorizedExpenses.dueSoon.length,
      label: t('schedule.duesSoon')
    };
  };

  const urgencyData = getUrgencyData();

  return (
    <Card className={cn(
      "border-l-4 transition-all animate-fade-in",
      urgencyData.borderColor,
      urgencyData.bgColor
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full text-white", urgencyData.color)}>
              {urgencyData.icon}
            </div>
            <div>
              <p className={cn("font-semibold text-sm", urgencyData.textColor)}>
                {totalUrgentExpenses} {totalUrgentExpenses === 1 ? 'despesa' : 'despesas'} {urgencyData.label.toLowerCase()}
              </p>
              <p className="text-xs text-muted-foreground">
                Total: {formatCurrency(totalAmount, currency)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Badge com contagem */}
            <Badge variant="secondary" className={urgencyData.textColor}>
              {totalUrgentExpenses}
            </Badge>

            {/* Ação rápida para despesas vencidas */}
            {categorizedExpenses.overdue.length > 0 && onMarkAsPaid && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMarkAsPaid(categorizedExpenses.overdue[0])}
                className="h-8 px-3 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/20"
              >
                <span className="text-xs">Pagar</span>
              </Button>
            )}

            {/* Link para página de agendamentos */}
            <Button size="sm" variant="ghost" asChild className="h-8 px-2">
              <Link to="/schedule">
                <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Detalhes expandidos para casos mais urgentes */}
        {(categorizedExpenses.overdue.length > 0 || categorizedExpenses.dueToday.length > 0) && (
          <div className="mt-3 pt-3 border-t border-current opacity-20">
            <div className="space-y-1">
              {categorizedExpenses.overdue.slice(0, 2).map(transaction => (
                <div key={transaction.id} className="flex justify-between items-center text-xs">
                  <span className="truncate max-w-[150px]">{transaction.description}</span>
                  <span className="font-medium">{formatCurrency(transaction.amount, currency)}</span>
                </div>
              ))}
              {categorizedExpenses.dueToday.slice(0, 2).map(transaction => (
                <div key={transaction.id} className="flex justify-between items-center text-xs">
                  <span className="truncate max-w-[150px]">{transaction.description}</span>
                  <span className="font-medium">{formatCurrency(transaction.amount, currency)}</span>
                </div>
              ))}
              {totalUrgentExpenses > 2 && (
                <div className="text-xs text-muted-foreground text-center pt-1">
                  +{totalUrgentExpenses - 2} outras
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingExpensesAlert;
