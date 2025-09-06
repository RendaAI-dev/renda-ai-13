
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScheduledTransaction } from '@/types';
import { formatCurrency, createLocalDate } from '@/utils/transactionUtils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useDateFormat } from '@/hooks/useDateFormat';
import { Calendar, Edit, Trash2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import TransactionStatusBadge from './TransactionStatusBadge';
import { useIsMobile } from '@/hooks/use-mobile';

interface RecurringTransactionCardProps {
  transaction: ScheduledTransaction;
  onEdit: (transaction: ScheduledTransaction) => void;
  onDelete: (id: string) => void;
  onMarkAsPaid?: (transaction: ScheduledTransaction) => void;
}

const RecurringTransactionCard: React.FC<RecurringTransactionCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  onMarkAsPaid
}) => {
  const { t, currency } = usePreferences();
  const { formatShortDate } = useDateFormat();
  const isMobile = useIsMobile();

  // Verificar status da transação
  const isPaid = transaction.status === 'paid';
  
  const today = new Date();
  const transactionDate = createLocalDate(transaction.nextExecutionDate || transaction.scheduledDate);
  const daysUntilDue = Math.ceil((transactionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isUpcoming = daysUntilDue <= 3 && daysUntilDue >= 0;
  const isOverdue = daysUntilDue < 0;

  const getRecurrenceColor = (recurrence?: string) => {
    switch (recurrence) {
      case 'monthly': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700';
      case 'weekly': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700';
      case 'yearly': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700';
      case 'daily': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600';
    }
  };

  const getCardStyle = () => {
    if (isPaid) return 'border-l-green-500 bg-green-50/30 dark:bg-green-900/20';
    if (isOverdue) return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
    if (isUpcoming) return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
    return 'border-l-blue-500 bg-white dark:bg-card';
  };

  const getStatusIcon = () => {
    if (isPaid) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (isOverdue) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (isUpcoming) return <Clock className="h-4 w-4 text-orange-600" />;
    return <Calendar className="h-4 w-4 text-blue-600" />;
  };

  return (
    <Card className={cn("transition-all hover:shadow-md border-l-4", getCardStyle())}>
      <CardContent className={isMobile ? "p-3" : "p-4"}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className={`flex items-center gap-2 ${isMobile ? 'mb-1' : 'mb-2'}`}>
              {getStatusIcon()}
              <h3 className={`font-semibold truncate ${isMobile ? 'text-base' : 'text-lg'}`}>{transaction.description}</h3>
              <TransactionStatusBadge transaction={transaction} />
            </div>
            
            <div className={`flex items-center gap-2 flex-wrap ${isMobile ? 'mb-2' : 'mb-3'}`}>
              <div className={`flex items-center gap-1 text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <Calendar className="h-3 w-3" />
                <span>{formatShortDate(transactionDate)}</span>
              </div>
              
              <Badge className={cn("text-xs border", getRecurrenceColor(transaction.recurrence))}>
                {t(`schedule.${transaction.recurrence || 'once'}`)}
              </Badge>
              
              <Badge variant="outline" className="text-xs">
                {transaction.category}
              </Badge>
            </div>
            
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
              <div className={`font-bold text-red-600 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                -{formatCurrency(transaction.amount, currency)}
                {transaction.paidAmount && transaction.paidAmount !== transaction.amount && (
                  <span className={`text-gray-500 ml-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    ({t('schedule.paid')}: {formatCurrency(transaction.paidAmount, currency)})
                  </span>
                )}
              </div>
              
              <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
                {onMarkAsPaid && !isPaid && (
                  <Button
                    size={isMobile ? "sm" : "sm"}
                    variant="outline"
                    onClick={() => onMarkAsPaid(transaction)}
                    className={`text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20 dark:hover:text-green-200 dark:border-green-700 dark:text-green-400 ${
                      isMobile ? 'h-7 px-2 text-xs' : 'h-8 px-3'
                    }`}
                  >
                    <CheckCircle className={`mr-1 ${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
                    {isMobile ? 'Pagar' : t('schedule.markAsPaid')}
                  </Button>
                )}
                
                <Button
                  size={isMobile ? "sm" : "sm"}
                  variant="ghost"
                  onClick={() => onEdit(transaction)}
                  className={isMobile ? 'h-7 px-2' : 'h-8 px-2'}
                >
                  <Edit className={isMobile ? 'h-3 w-3' : 'h-3 w-3'} />
                </Button>
                
                <Button
                  size={isMobile ? "sm" : "sm"}
                  variant="ghost"
                  onClick={() => onDelete(transaction.id)}
                  className={`text-red-600 hover:bg-red-50 ${isMobile ? 'h-7 px-2' : 'h-8 px-2'}`}
                >
                  <Trash2 className={isMobile ? 'h-3 w-3' : 'h-3 w-3'} />
                </Button>
              </div>
            </div>

            {isPaid && transaction.paidDate && (
              <div className={`mt-2 text-green-600 flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                <CheckCircle className="h-3 w-3" />
                {t('schedule.paid')} em {formatShortDate(transaction.paidDate)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecurringTransactionCard;
