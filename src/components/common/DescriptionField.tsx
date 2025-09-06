
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormValues } from '@/schemas/transactionSchema';
import { usePreferences } from '@/contexts/PreferencesContext';

interface DescriptionFieldProps {
  form: UseFormReturn<TransactionFormValues>;
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({ form }) => {
  const { t } = usePreferences();

  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('common.description')} ({t('common.optional')})</FormLabel>
          <FormControl>
            <Textarea {...field} placeholder={t('common.description')} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default DescriptionField;
