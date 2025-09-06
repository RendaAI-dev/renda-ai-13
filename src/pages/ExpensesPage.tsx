
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, BarChart, Filter, Plus } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import TransactionList from '@/components/common/TransactionList';
import TransactionForm from '@/components/common/TransactionForm';
import TimeRangeSelector from '@/components/common/TimeRangeSelector';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/utils/transactionUtils';
import { useToast } from '@/components/ui/use-toast';

const ExpensesPage = () => {
  const { filteredTransactions, deleteTransaction } = useAppContext();
  const { t, currency } = usePreferences();
  const { toast } = useToast();
  const expenses = filteredTransactions.filter(t => t.type === 'expense');
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Calculate expenses by category
  const categoryData = React.useMemo(() => {
    const categoryMap = new Map();
    expenses.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + expense.amount);
    });
    
    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value
    }));
  }, [expenses]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  const handleAddExpense = () => {
    setSelectedTransaction(null);
    setTransactionDialogOpen(true);
  };

  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setTransactionDialogOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast({
        title: t('transactions.deleted'),
        description: t('transactions.deleteSuccess'),
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: t('common.error'),
        description: t('transactions.deleteError'),
        variant: 'destructive',
      });
    }
  };

  return (
    <MainLayout title={t('expenses.title')}>
      <div className="space-y-6 min-h-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold">{t('expenses.title')}</h2>
          <div className="flex gap-2 items-center">
            <TimeRangeSelector />
            <Button onClick={handleAddExpense}>
              <Plus className="mr-2 h-4 w-4" /> {t('expenses.add')}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList>
            <TabsTrigger value="summary">
              <PieChart className="mr-2 h-4 w-4" />
              {t('expenses.summary')}
            </TabsTrigger>
            <TabsTrigger value="list">
              <BarChart className="mr-2 h-4 w-4" />
              {t('expenses.all')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="summary">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('expenses.categories')}</CardTitle>
                  <CardDescription>{t('expenses.breakdown')}</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => {
                        // Check if value is a number before using toFixed
                        return typeof value === 'number' 
                          ? formatCurrency(value, currency)
                          : formatCurrency(Number(value), currency);
                      }} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('expenses.recent')}</CardTitle>
                  <CardDescription>{t('expenses.latest')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionList 
                    transactions={expenses.slice(0, 5)}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="list">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{t('expenses.all')}</CardTitle>
                  <CardDescription>{t('expenses.complete')}</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" /> {t('common.filter')}
                </Button>
              </CardHeader>
              <CardContent>
                <TransactionList 
                  transactions={expenses}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <TransactionForm
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        initialData={selectedTransaction}
        mode={selectedTransaction?.id ? 'edit' : 'create'}
        defaultType="expense"
      />
    </MainLayout>
  );
};

export default ExpensesPage;
