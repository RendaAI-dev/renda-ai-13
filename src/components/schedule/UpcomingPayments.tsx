
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduledTransaction } from '@/types';
import { formatCurrency, createLocalDate } from '@/utils/transactionUtils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useDateFormat } from '@/hooks/useDateFormat';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface UpcomingPaymentsProps {
  scheduledTransactions: ScheduledTransaction[];
  onSelectTransaction: (transaction: ScheduledTransaction) => void;
}

const UpcomingPayments: React.FC<UpcomingPaymentsProps> = ({ 
  scheduledTransactions, 
  onSelectTransaction 
}) => {
  const { t, currency } = usePreferences();
  const { formatShortDate } = useDateFormat();
  const isMobile = useIsMobile();

  // Filtrar próximos vencimentos (próximos 7 dias)
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const upcomingPayments = scheduledTransactions
    .filter(transaction => {
      const transactionDate = createLocalDate(transaction.scheduledDate);
      return transactionDate >= today && transactionDate <= nextWeek && transaction.type === 'expense';
    })
    .sort((a, b) => createLocalDate(a.scheduledDate).getTime() - createLocalDate(b.scheduledDate).getTime());

  const getDaysUntilDue = (date: string) => {
    const transactionDate = createLocalDate(date);
    const diffTime = transactionDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (upcomingPayments.length === 0) {
    return (
      <Card>
        <CardHeader className={isMobile ? "pb-3" : undefined}>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
            <Calendar className="h-5 w-5" />
            {t('schedule.upcomingPayments')}
          </CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? "pt-0" : undefined}>
          <div className={`text-center ${isMobile ? 'py-6' : 'py-8'}`}>
            <Calendar className={`mx-auto text-muted-foreground mb-3 ${isMobile ? 'h-8 w-8' : 'h-12 w-12 mb-4'}`} />
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>{t('schedule.noUpcomingPayments')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className={isMobile ? "pb-3" : undefined}>
        <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
          <AlertCircle className="h-5 w-5 text-orange-500" />
          {t('schedule.upcomingPayments')}
          <Badge variant="secondary" className={isMobile ? "text-xs" : undefined}>{upcomingPayments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className={isMobile ? "pt-0" : undefined}>
        <div className={isMobile ? "space-y-2" : "space-y-3"}>
          {upcomingPayments.map((transaction) => {
            const daysUntilDue = getDaysUntilDue(transaction.scheduledDate);
            
            return (
              <div
                key={transaction.id}
                className={`flex items-center justify-between border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                  isMobile ? 'p-2' : 'p-3'
                }`}
                onClick={() => onSelectTransaction(transaction)}
              >
                <div className="flex-1 min-w-0">
                  <div className={`flex items-center gap-2 ${isMobile ? 'mb-1' : 'mb-1'}`}>
                    <h4 className={`font-medium truncate ${isMobile ? 'text-sm' : ''}`}>{transaction.description}</h4>
                    <Badge 
                      variant={daysUntilDue === 0 ? 'destructive' : daysUntilDue <= 1 ? 'default' : 'secondary'}
                      className="text-xs flex-shrink-0"
                    >
                      {daysUntilDue === 0 ? t('schedule.today') : 
                       daysUntilDue === 1 ? t('schedule.tomorrow') : 
                       `${daysUntilDue} ${t('schedule.days')}`}
                    </Badge>
                  </div>
                  
                  <div className={`flex items-center gap-2 text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    <span>{formatShortDate(transaction.scheduledDate)}</span>
                    <span>•</span>
                    <span className="truncate">{transaction.category}</span>
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0 ml-2">
                  <div className={`font-semibold text-red-600 ${isMobile ? 'text-sm' : ''}`}>
                    -{formatCurrency(transaction.amount, currency)}
                  </div>
                  <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    {t(`schedule.${transaction.recurrence || 'once'}`)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingPayments;
