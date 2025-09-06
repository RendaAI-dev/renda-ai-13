
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScheduledTransaction } from '@/types';
import { formatCurrency, createLocalDate } from '@/utils/transactionUtils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Calendar, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface FixedExpensesOverviewProps {
  scheduledTransactions: ScheduledTransaction[];
}

const FixedExpensesOverview: React.FC<FixedExpensesOverviewProps> = ({ scheduledTransactions }) => {
  const { t, currency } = usePreferences();

  // Filtrar apenas despesas
  const expenses = scheduledTransactions.filter(transaction => transaction.type === 'expense');

  // Calcular total mensal de despesas fixas (pendentes)
  const monthlyTotal = expenses
    .filter(transaction => transaction.recurrence === 'monthly' && transaction.status !== 'paid')
    .reduce((total, transaction) => total + transaction.amount, 0);

  // Calcular total pago neste mês
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyPaid = expenses
    .filter(transaction => {
      if (!transaction.paidDate) return false;
      const paidDate = createLocalDate(transaction.paidDate);
      return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
    })
    .reduce((total, transaction) => total + (transaction.paidAmount || transaction.amount), 0);

  // Calcular próximos vencimentos (próximos 7 dias)
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const upcomingPayments = expenses.filter(transaction => {
    if (transaction.status === 'paid') return false;
    const transactionDate = createLocalDate(transaction.nextExecutionDate || transaction.scheduledDate);
    return transactionDate >= today && transactionDate <= nextWeek;
  });

  // Calcular transações vencidas
  const overdueTransactions = expenses.filter(transaction => {
    if (transaction.status === 'paid') return false;
    const transactionDate = createLocalDate(transaction.nextExecutionDate || transaction.scheduledDate);
    return transactionDate < today;
  });

  // Contar por tipo de recorrência
  const recurrenceStats = expenses
    .filter(transaction => transaction.status !== 'paid')
    .reduce((stats, transaction) => {
      const recurrence = transaction.recurrence || 'once';
      stats[recurrence] = (stats[recurrence] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('schedule.monthlyTotal')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(monthlyTotal, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('schedule.pendingExpenses')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('schedule.paidThisMonth')}</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(monthlyPaid, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('schedule.alreadyPaid')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('schedule.upcomingPayments')}</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {upcomingPayments.length}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('schedule.next7Days')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('schedule.overdue')}</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {overdueTransactions.length}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('schedule.needAttention')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('schedule.totalScheduled')}</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {expenses.filter(t => t.status !== 'paid').length}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(recurrenceStats).slice(0, 3).map(([recurrence, count]) => (
              <Badge key={recurrence} variant="secondary" className="text-xs">
                {t(`schedule.${recurrence}`)}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FixedExpensesOverview;
