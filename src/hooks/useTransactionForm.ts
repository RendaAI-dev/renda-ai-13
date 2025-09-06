
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Transaction } from '@/types';
import { createTransactionSchema, TransactionFormValues } from '@/schemas/transactionSchema';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { getCategoriesByType } from '@/services/categoryService';

interface UseTransactionFormProps {
  initialData?: Transaction;
  mode: 'create' | 'edit';
  onComplete: () => void;
  defaultType?: 'income' | 'expense';
}

export const useTransactionForm = ({ 
  initialData, 
  mode, 
  onComplete, 
  defaultType = 'expense' 
}: UseTransactionFormProps) => {
  const { addTransaction, updateTransaction, getTransactions, getGoals } = useAppContext();
  const { t } = usePreferences();
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>(
    initialData?.type || defaultType
  );

  const transactionSchema = createTransactionSchema(t);
  
  // Get default category for selected type
  const getDefaultCategory = async () => {
    if (initialData?.category_id) return initialData.category_id;
    const categories = await getCategoriesByType(selectedType);
    return categories.length > 0 ? categories[0].id : '';
  };

  // Initialize form with proper defaults
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: initialData?.type || defaultType,
      amount: initialData?.amount || 0,
      category: initialData?.category_id || '',
      description: initialData?.description || '',
      date: initialData?.date 
        ? new Date(initialData.date).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      goalId: initialData?.goalId || undefined,
    },
  });

  // Simple type change handler that doesn't cause infinite loops
  const handleTypeChange = async (type: 'income' | 'expense') => {
    if (type !== selectedType) {
      setSelectedType(type);
      
      // Update category when type changes
      const categories = await getCategoriesByType(type);
      if (categories.length > 0) {
        form.setValue('category', categories[0].id, { shouldValidate: true });
      }
    }
  };

  const onSubmit = async (values: TransactionFormValues) => {
    console.log("Form submitted with values:", values);
    console.log("Form validation state:", form.formState);
    
    // Convert "none" value and null back to undefined for goalId
    const processedValues = {
      ...values,
      goalId: values.goalId === "none" || values.goalId === null ? undefined : values.goalId
    };
    
    try {
      if (mode === 'create') {
        console.log("Creating transaction...");
        await addTransaction({
          type: processedValues.type,
          amount: processedValues.amount,
          category_id: processedValues.category,
          description: processedValues.description || '',
          date: new Date(processedValues.date).toISOString(),
          goalId: processedValues.goalId,
          category: '',
        });
        
        console.log("Transaction created successfully, refreshing data...");
      } else if (initialData) {
        console.log("Updating transaction...");
        await updateTransaction(initialData.id, {
          type: processedValues.type,
          amount: processedValues.amount,
          category_id: processedValues.category,
          description: processedValues.description || '',
          date: new Date(processedValues.date).toISOString(),
          goalId: processedValues.goalId,
        });
        
        console.log("Transaction updated successfully, refreshing data...");
      }

      // AppContext automatically updates state after add/update operations
      // No need to manually reload data here
      console.log("Transaction operation completed successfully");
      onComplete();
    } catch (error) {
      console.error("Error saving transaction:", error);
      throw error;
    }
  };

  // Set default category when form loads
  useEffect(() => {
    const loadDefaultCategory = async () => {
      if (!form.getValues('category')) {
        const defaultCategory = await getDefaultCategory();
        if (defaultCategory) {
          form.setValue('category', defaultCategory);
        }
      }
    };
    
    loadDefaultCategory();
  }, [selectedType]);

  // Sync form when initialData or defaultType changes
  useEffect(() => {
    if (initialData) {
      setSelectedType(initialData.type);
      form.reset({
        type: initialData.type,
        amount: initialData.amount,
        category: initialData.category_id || '',
        description: initialData.description || '',
        date: new Date(initialData.date).toISOString().split('T')[0],
        goalId: initialData.goalId,
      });
    } else {
      setSelectedType(defaultType);
      form.reset({
        type: defaultType,
        amount: 0,
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        goalId: undefined,
      });
    }
  }, [initialData, defaultType]);

  return {
    form,
    selectedType,
    handleTypeChange,
    onSubmit
  };
};
