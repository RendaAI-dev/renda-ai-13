import React from 'react';
import { Button } from '@/components/ui/button';
import { UseFormReturn } from 'react-hook-form';
import { TransactionType } from '@/types';
import { usePreferences } from '@/contexts/PreferencesContext';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { TrendingDown } from 'lucide-react';

interface ScheduleTransactionTypeSelectorProps {
  form: UseFormReturn<any>;
  onTypeChange: (type: TransactionType) => void;
}

const ScheduleTransactionTypeSelector: React.FC<ScheduleTransactionTypeSelectorProps> = ({
  form,
  onTypeChange
}) => {
  const { t } = usePreferences();

  return (
    <FormField
      control={form.control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('common.type')}</FormLabel>
          <FormControl>
            <div className="grid grid-cols-1 gap-3">
              <Button
                type="button"
                variant="default"
                className="flex items-center justify-center gap-2 h-12 bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-md"
                disabled
              >
                <TrendingDown className="h-4 w-4" />
                <span className="font-medium">{t('common.expense')}</span>
              </Button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ScheduleTransactionTypeSelector;