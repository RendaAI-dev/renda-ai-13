
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import TransactionList from '@/components/common/TransactionList';
import TransactionForm from '@/components/common/TransactionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Transaction } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const TransactionsPage = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { transactions, deleteTransaction } = useAppContext();
  const isMobile = useIsMobile();

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setFormOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
  };

  return (
    <MainLayout>
      <SubscriptionGuard feature="movimentações ilimitadas">
        <div className="w-full px-4 py-4 md:py-8 pb-20 md:pb-8 min-h-0">
          {/* Desktop Add Button */}
          {!isMobile && (
            <div className="mb-6">
              <Button onClick={handleAddTransaction} size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Transação
              </Button>
            </div>
          )}
          
          {/* Content Container */}
          <div className={cn(
            isMobile ? "space-y-4" : ""
          )}>
            {/* Header for Mobile */}
            {isMobile && (
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Transações</h1>
              </div>
            )}
            
            {/* Content */}
            {isMobile ? (
              <TransactionList 
                transactions={transactions}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Transações Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <TransactionList 
                    transactions={transactions}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Mobile Floating Action Button */}
        {isMobile && (
          <div className="fixed bottom-20 right-4 z-50">
            <Button 
              onClick={handleAddTransaction}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">Adicionar Transação</span>
            </Button>
          </div>
        )}

        <TransactionForm
          open={formOpen}
          onOpenChange={setFormOpen}
          initialData={editingTransaction}
          mode={editingTransaction ? 'edit' : 'create'}
        />
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default TransactionsPage;
