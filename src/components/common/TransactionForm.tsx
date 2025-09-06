
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Transaction } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTransactionForm } from '@/hooks/useTransactionForm';
import TransactionTypeSelector from './TransactionTypeSelector';
import AmountInput from './AmountInput';
import CategoryDateFields from './CategoryDateFields';
import DescriptionField from './DescriptionField';
import GoalSelector from './GoalSelector';
import { useToast } from '@/hooks/use-toast';

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Transaction | null;
  mode: 'create' | 'edit';
  defaultType?: 'income' | 'expense';
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  open,
  onOpenChange,
  initialData,
  mode,
  defaultType = 'expense',
}) => {
  const { t } = usePreferences();
  const { setCustomDateRange, getTransactions, getGoals } = useAppContext();
  const { toast } = useToast();
  
  // Initialize form
  const { form, selectedType, handleTypeChange, onSubmit } = useTransactionForm({
    initialData: initialData || undefined,
    mode,
    onComplete: async () => {
      console.log("TransactionForm: Transaction completed successfully");
      
      // Show success message
      toast({
        title: mode === 'create' ? t('transactions.added') : t('transactions.updated'),
        description: mode === 'create' ? t('transactions.addSuccess') : t('transactions.updateSuccess'),
      });
      
      // Close dialog
      onOpenChange(false);
      
      // Data is already updated by the AppContext after add/update operations
      // No need for additional refresh calls here
    },
    defaultType,
  });

  // Debug form state
  useEffect(() => {
    if (open) {
      console.log("Form state debug:", {
        errors: form.formState.errors,
        isValid: form.formState.isValid,
        values: form.getValues(),
        mode,
        initialData
      });
    }
  }, [open, form.formState.errors, form.formState.isValid]);

  // Only render the form content when dialog is open to prevent unnecessary calculations
  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="bg-background p-6 border-b">
          <DialogTitle className="text-xl">
            {mode === 'create' 
              ? selectedType === 'income' 
                ? t('transactions.addIncome') 
                : t('transactions.addExpense')
              : selectedType === 'income'
                ? t('transactions.editIncome')
                : t('transactions.editExpense')
            }
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TransactionTypeSelector form={form} onTypeChange={handleTypeChange} />
              <AmountInput form={form} />
              <CategoryDateFields form={form} transactionType={selectedType} />
              <DescriptionField form={form} />
              
              {selectedType === 'income' && (
                <GoalSelector form={form} />
              )}

              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  className={selectedType === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={(e) => {
                    console.log("Save button clicked");
                    console.log("Form state:", form.formState);
                    console.log("Form values:", form.getValues());
                    console.log("Form errors:", form.formState.errors);
                    
                    // Try manual validation
                    const isValid = form.trigger();
                    console.log("Manual validation result:", isValid);
                  }}
                >
                  {mode === 'create' ? t('common.add') : t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
