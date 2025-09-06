import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, WifiOff, Filter, X } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { ScheduledTransaction } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePreferences } from '@/contexts/PreferencesContext';
import ScheduledTransactionForm from '@/components/schedule/ScheduledTransactionForm';
import TransactionForm from '@/components/common/TransactionForm';
import FixedExpensesOverview from '@/components/schedule/FixedExpensesOverview';
import RecurringTransactionCard from '@/components/schedule/RecurringTransactionCard';
import ScheduleFilters from '@/components/schedule/ScheduleFilters';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { deleteScheduledTransaction, getScheduledTransactions, markAsPaid } from '@/services/scheduledTransactionService';
import { formatCurrency } from '@/utils/transactionUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

const SchedulePage = () => {
  const { scheduledTransactions } = useAppContext();
  const [localScheduledTransactions, setLocalScheduledTransactions] = useState<ScheduledTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<ScheduledTransaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [transactionFormType, setTransactionFormType] = useState<'income' | 'expense'>('expense');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecurrence, setSelectedRecurrence] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const { t, currency } = usePreferences();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (Array.isArray(scheduledTransactions)) {
      setLocalScheduledTransactions(scheduledTransactions);
    } else {
      setLocalScheduledTransactions([]);
    }
  }, [scheduledTransactions]);

  const refreshLocalScheduledTransactions = async () => {
    try {
      const transactions = await getScheduledTransactions();
      setLocalScheduledTransactions(transactions);
    } catch (error) {
      console.error('Error refreshing scheduled transactions:', error);
    }
  };

  const handleSelectTransaction = (transaction: ScheduledTransaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleAddSchedule = () => {
    setSelectedTransaction(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleAddTransaction = (type: 'income' | 'expense') => {
    setTransactionFormType(type);
    setIsTransactionFormOpen(true);
  };

  const handleEditTransaction = (transaction: ScheduledTransaction) => {
    setSelectedTransaction(transaction);
    setFormMode('edit');
    setIsFormOpen(true);
    setIsDialogOpen(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    const success = await deleteScheduledTransaction(id);
    if (success) {
      toast({
        title: t('schedule.deleted'),
        description: t('schedule.transactionDeleted')
      });
      refreshLocalScheduledTransactions();
    } else {
      toast({
        title: t('common.error'),
        description: t('common.somethingWentWrong'),
        variant: "destructive"
      });
    }
  };

  const handleMarkAsPaid = async (transaction: ScheduledTransaction) => {
    try {
      const success = await markAsPaid(transaction.id);
      if (success) {
        toast({
          title: t('schedule.marked_as_paid'),
          description: t('schedule.transaction_marked_as_paid')
        });
        
        // Atualizar estado local
        await refreshLocalScheduledTransactions();
      } else {
        toast({
          title: t('common.error'),
          description: t('common.somethingWentWrong'),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error marking transaction as paid:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.somethingWentWrong'),
        variant: "destructive"
      });
    }
  };

  const filteredTransactions = localScheduledTransactions.filter(transaction => {
    if (selectedRecurrence && transaction.recurrence !== selectedRecurrence) return false;
    if (selectedCategory && transaction.category !== selectedCategory) return false;
    if (selectedStatus && transaction.status !== selectedStatus) return false;
    return transaction.type === 'expense';
  });

  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const recurrence = transaction.recurrence || 'once';
    if (!groups[recurrence]) {
      groups[recurrence] = [];
    }
    groups[recurrence].push(transaction);
    return groups;
  }, {} as Record<string, ScheduledTransaction[]>);

  const availableCategories = Array.from(new Set(localScheduledTransactions.map(t => t.category)));
  const availableStatuses = ['pending', 'paid', 'overdue'];

  return (
    <MainLayout 
      title={isMobile ? undefined : t('schedule.title')}
      onAddTransaction={handleAddTransaction}
    >
      <SubscriptionGuard feature="agendamentos de pagamentos">
        <div className="space-y-4 md:space-y-6 min-h-0">
          {/* Header Section */}
          <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center md:gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">{t('schedule.title')}</h2>
              <p className="text-sm md:text-base text-muted-foreground">{t('schedule.manageFixedExpenses')}</p>
            </div>
            
            <div className="flex gap-2">
              {isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {showFilters ? <X className="h-4 w-4" /> : null}
                  {t('common.filters')}
                </Button>
              )}
              
              <Button onClick={handleAddSchedule} disabled={!isOnline} size={isMobile ? "sm" : "default"}>
                <Plus className="mr-2 h-4 w-4" /> 
                <span className="hidden sm:inline">{t('schedule.addFixedExpense')}</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            </div>
          </div>

          {!isOnline && (
            <div className="p-3 md:p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-yellow-600 flex-shrink-0" />
              <span className="text-sm md:text-base text-yellow-800">{t('schedule.limitedFunctionality')}</span>
            </div>
          )}

          {/* Overview das Despesas Fixas */}
          <FixedExpensesOverview scheduledTransactions={localScheduledTransactions} />

          {/* Mobile Layout */}
          {isMobile ? (
            <div className="space-y-4">
              {/* Mobile Filters */}
              {showFilters && (
                <ScheduleFilters
                  selectedRecurrence={selectedRecurrence}
                  selectedCategory={selectedCategory}
                  onRecurrenceFilter={setSelectedRecurrence}
                  onCategoryFilter={setSelectedCategory}
                  availableCategories={availableCategories}
                />
              )}

              {/* Lista de Despesas */}
              {Object.entries(groupedTransactions).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(groupedTransactions)
                    .sort(([a], [b]) => {
                      const order = ['monthly', 'weekly', 'yearly', 'daily', 'once'];
                      return order.indexOf(a) - order.indexOf(b);
                    })
                    .map(([recurrence, transactions]) => (
                      <Card key={recurrence}>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            {t(`schedule.${recurrence}`)}
                            <Badge variant="secondary" className="text-xs">{transactions.length}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {transactions.map(transaction => (
                              <RecurringTransactionCard
                                key={transaction.id}
                                transaction={transaction}
                                onEdit={handleEditTransaction}
                                onDelete={handleDeleteTransaction}
                                onMarkAsPaid={handleMarkAsPaid}
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">{t('schedule.noFixedExpenses')}</p>
                    <Button onClick={handleAddSchedule} disabled={!isOnline} size="sm">
                      <Plus className="mr-2 h-4 w-4" /> {t('schedule.addFirstExpense')}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            /* Desktop Layout */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filtros (coluna lateral) */}
              <div className="lg:col-span-1">
                <ScheduleFilters
                  selectedRecurrence={selectedRecurrence}
                  selectedCategory={selectedCategory}
                  onRecurrenceFilter={setSelectedRecurrence}
                  onCategoryFilter={setSelectedCategory}
                  availableCategories={availableCategories}
                />
                
                {/* Filtro de Status */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base">{t('common.status')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant={selectedStatus === null ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setSelectedStatus(null)}
                    >
                      {t('common.all')}
                    </Button>
                    {availableStatuses.map(status => (
                      <Button
                        key={status}
                        variant={selectedStatus === status ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                      >
                        {t(`schedule.${status}`)}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Conteúdo principal */}
              <div className="lg:col-span-3 space-y-6">
                {Object.entries(groupedTransactions).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(groupedTransactions)
                      .sort(([a], [b]) => {
                        const order = ['monthly', 'weekly', 'yearly', 'daily', 'once'];
                        return order.indexOf(a) - order.indexOf(b);
                      })
                      .map(([recurrence, transactions]) => (
                        <Card key={recurrence}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              {t(`schedule.${recurrence}`)}
                              <Badge variant="secondary">{transactions.length}</Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-4">
                              {transactions.map(transaction => (
                                <RecurringTransactionCard
                                  key={transaction.id}
                                  transaction={transaction}
                                  onEdit={handleEditTransaction}
                                  onDelete={handleDeleteTransaction}
                                  onMarkAsPaid={handleMarkAsPaid}
                                />
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-10">
                      <Plus className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">{t('schedule.noFixedExpenses')}</p>
                      <Button onClick={handleAddSchedule} disabled={!isOnline}>
                        <Plus className="mr-2 h-4 w-4" /> {t('schedule.addFirstExpense')}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Transaction Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('schedule.transactionDetails')}</DialogTitle>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">{selectedTransaction.description}</p>
                    <p className="text-sm text-muted-foreground">{selectedTransaction.category}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className={selectedTransaction.type === 'income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {selectedTransaction.type === 'income' ? '+' : '-'}{formatCurrency(selectedTransaction.amount, currency)}
                    </p>
                    <Badge variant={selectedTransaction.type === 'income' ? 'default' : 'destructive'} className="mt-1">
                      {selectedTransaction.type === 'income' ? t('dashboard.income') : t('dashboard.expenses')}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('common.date')}</p>
                    <p>{format(new Date(selectedTransaction.scheduledDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('schedule.recurrence')}</p>
                    <p className="capitalize">{t(`schedule.${selectedTransaction.recurrence || 'once'}`)}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                  {!selectedTransaction.status || selectedTransaction.status === 'pending' ? (
                    <Button
                      variant="outline"
                      className="border-green-200 text-green-600 hover:bg-green-50"
                      onClick={() => handleMarkAsPaid(selectedTransaction)}
                      disabled={!isOnline}
                      size={isMobile ? "sm" : "default"}
                    >
                      {t('schedule.markAsPaid')}
                    </Button>
                  ) : null}
                  
                  <Button
                    variant="outline"
                    onClick={() => handleEditTransaction(selectedTransaction)}
                    disabled={!isOnline}
                    size={isMobile ? "sm" : "default"}
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteTransaction(selectedTransaction.id)}
                    disabled={!isOnline}
                    size={isMobile ? "sm" : "default"}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Scheduled Transaction Form Dialog */}
        <ScheduledTransactionForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          initialData={formMode === 'edit' ? selectedTransaction : null}
          mode={formMode}
          onSuccess={refreshLocalScheduledTransactions}
        />

        {/* Regular Transaction Form Dialog */}
        <TransactionForm
          open={isTransactionFormOpen}
          onOpenChange={setIsTransactionFormOpen}
          mode="create"
          defaultType={transactionFormType}
        />
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default SchedulePage;
