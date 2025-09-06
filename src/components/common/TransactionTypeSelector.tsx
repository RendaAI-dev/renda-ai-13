
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormValues } from '@/schemas/transactionSchema';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Button } from '@/components/ui/button';

interface TransactionTypeSelectorProps {
  form: UseFormReturn<TransactionFormValues>;
  onTypeChange: (type: 'income' | 'expense') => void;
}

const TransactionTypeSelector: React.FC<TransactionTypeSelectorProps> = ({ 
  form, 
  onTypeChange 
}) => {
  const { t } = usePreferences();
  const currentType = form.watch('type');
  
  const handleTypeSelect = (type: 'income' | 'expense') => {
    // First update the form value
    form.setValue('type', type, { shouldValidate: true });
    
    // Then notify parent component
    onTypeChange(type);
  };

  return (
    <FormField
      control={form.control}
      name="type"
      render={() => (
        <FormItem className="space-y-1">
          <FormLabel>{t('transactions.type')}</FormLabel>
          <FormControl>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={currentType === 'income' ? 'default' : 'outline'}
                className={`flex-1 ${currentType === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={() => handleTypeSelect('income')}
              >
                {t('common.income')}
              </Button>
              <Button
                type="button"
                variant={currentType === 'expense' ? 'default' : 'outline'}
                className={`flex-1 ${currentType === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                onClick={() => handleTypeSelect('expense')}
              >
                {t('common.expense')}
              </Button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TransactionTypeSelector;
