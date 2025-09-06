
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Transaction } from '@/types';

interface ReportSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

const ReportSummary: React.FC<ReportSummaryProps> = ({
  totalIncome,
  totalExpenses,
  balance
}) => {
  const { t, currency } = usePreferences();
  
  // Format currency in BRL
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: currency 
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
      <Card className="border border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm lg:text-base font-medium text-muted-foreground">
            {t('reports.totalIncome')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalIncome)}
          </p>
        </CardContent>
      </Card>
      <Card className="border border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm lg:text-base font-medium text-muted-foreground">
            {t('reports.totalExpenses')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totalExpenses)}
          </p>
        </CardContent>
      </Card>
      <Card className="border border-border/50 shadow-sm sm:col-span-2 lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm lg:text-base font-medium text-muted-foreground">
            {t('reports.balance')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-xl lg:text-2xl xl:text-3xl font-bold ${
            balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(balance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportSummary;
