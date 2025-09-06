
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormValues } from '@/schemas/transactionSchema';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Goal } from '@/types';

interface GoalSelectorProps {
  form: UseFormReturn<TransactionFormValues>;
}

const GoalSelector: React.FC<GoalSelectorProps> = ({ form }) => {
  const { goals } = useAppContext();
  const { t } = usePreferences();

  return (
    <FormField
      control={form.control}
      name="goalId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('goals.title')} ({t('common.optional')})</FormLabel>
          <Select
            onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
            value={field.value || "none"}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t('goals.title')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="none">{t('common.none')}</SelectItem>
              {goals.map((goal: Goal) => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default GoalSelector;
