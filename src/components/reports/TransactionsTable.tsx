
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/types';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown, FileText } from 'lucide-react';

interface TransactionsTableProps {
  transactions: Transaction[];
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions }) => {
  const { t, currency } = usePreferences();
  const isMobile = useIsMobile();
  
  // Format currency based on currency preference
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: currency 
    }).format(amount);
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.transactionsList')}</CardTitle>
          <CardDescription>{t('reports.transactionsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('reports.noTransactions')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.transactionsList')}</CardTitle>
        <CardDescription>{t('reports.transactionsDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          // Mobile: Card layout
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {transaction.type === 'income' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                      {transaction.type === 'income' ? t('common.income') : t('common.expense')}
                    </Badge>
                  </div>
                  <span className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="font-medium">{transaction.category}</div>
                  {transaction.description && (
                    <div className="text-muted-foreground">{transaction.description}</div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          // Desktop: Table layout
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">{t('common.date')}</th>
                  <th className="text-left py-2 px-4">{t('common.type')}</th>
                  <th className="text-left py-2 px-4">{t('common.category')}</th>
                  <th className="text-left py-2 px-4">{t('common.description')}</th>
                  <th className="text-right py-2 px-4">{t('common.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-muted">
                    <td className="py-2 px-4">{new Date(transaction.date).toLocaleDateString('pt-BR')}</td>
                    <td className="py-2 px-4">
                      {transaction.type === 'income' ? t('common.income') : t('common.expense')}
                    </td>
                    <td className="py-2 px-4">{transaction.category}</td>
                    <td className="py-2 px-4">{transaction.description}</td>
                    <td className={`py-2 px-4 text-right ${
                      transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsTable;
