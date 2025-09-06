import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAppContext } from '@/contexts/AppContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScheduledTransaction } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ScheduleTransactionTypeSelector from './ScheduleTransactionTypeSelector';
import { getCategoriesByType } from '@/services/categoryService';
import { Category } from '@/types/categories';
import CategoryIcon from '@/components/categories/CategoryIcon';

interface ScheduledTransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ScheduledTransaction | null;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
}

const ScheduledTransactionForm: React.FC<ScheduledTransactionFormProps> = ({
  open,
  onOpenChange,
  initialData,
  mode,
  onSuccess,
}) => {
  const { t } = usePreferences();
  const { addScheduledTransaction, updateScheduledTransaction, deleteScheduledTransaction } = useAppContext();
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>(initialData?.type || 'expense');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isOnline] = useState(navigator.onLine);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Schema for the scheduled transaction form
  const formSchema = z.object({
    type: z.enum(['income', 'expense']),
    description: z.string().min(1, { message: t('validation.required') }),
    amount: z.number().positive({ message: t('validation.positive') }),
    category: z.string().min(1, { message: t('validation.required') }),
    scheduledDate: z.string().min(1, { message: t('validation.required') }),
    recurrence: z.enum(['once', 'daily', 'weekly', 'monthly', 'yearly']),
    goalId: z.string().optional(),
  });

  // Default form values
  const defaultValues = {
    type: initialData?.type || 'expense',
    description: initialData?.description || '',
    amount: initialData?.amount || 0,
    category: initialData?.category_id || '',
    scheduledDate: initialData?.scheduledDate 
      ? new Date(initialData.scheduledDate).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0],
    recurrence: (initialData?.recurrence as 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly') || 'once',
    goalId: initialData?.goalId || undefined,
  };

  // Form setup
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Load categories when type changes
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const categoryData = await getCategoriesByType(selectedType);
        console.log(`Loaded ${categoryData.length} categories for ${selectedType}:`, categoryData);
        setCategories(categoryData);
        
        // Set default category if none selected and categories are available
        if (categoryData.length > 0) {
          const currentCategory = form.getValues('category');
          const categoryExists = categoryData.some(c => c.id === currentCategory || c.name === currentCategory);
          
          if (!categoryExists) {
            console.log("Setting default category to:", categoryData[0].id);
            form.setValue('category', categoryData[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        // Set a fallback empty array to prevent UI issues
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    // Always load categories, regardless of whether modal is open
    loadCategories();
  }, [selectedType, form]);

  // Reset form when opening/closing
  useEffect(() => {
    if (open && !initialData) {
      // Reset form to default values when creating new transaction
      form.reset(defaultValues);
      setSelectedType(defaultValues.type);
    } else if (open && initialData) {
      // Populate form with initial data when editing
      form.reset({
        type: initialData.type,
        description: initialData.description,
        amount: initialData.amount,
        category: initialData.category_id || '',
        scheduledDate: new Date(initialData.scheduledDate).toISOString().split('T')[0],
        recurrence: initialData.recurrence || 'once',
        goalId: initialData.goalId,
      });
      setSelectedType(initialData.type);
    }
  }, [open, initialData, form]);

  const handleTypeChange = (type: 'income' | 'expense') => {
    setSelectedType(type);
    form.setValue('type', type);
    form.setValue('category', ''); // Reset category when type changes
  };

  // Form submission handler
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (mode === 'create') {
      // Find the selected category to get both name and id
      const selectedCategory = categories.find(cat => cat.id === values.category);
      
      addScheduledTransaction({
        type: values.type,
        description: values.description,
        amount: values.amount,
        category: selectedCategory?.name || 'Outros',
        category_id: values.category,
        scheduledDate: new Date(values.scheduledDate).toISOString(),
        recurrence: values.recurrence,
        goalId: values.goalId,
      });
    } else if (initialData) {
      // Find the selected category to get both name and id
      const selectedCategory = categories.find(cat => cat.id === values.category);
      
      updateScheduledTransaction(initialData.id, {
        type: values.type,
        description: values.description,
        amount: values.amount,
        category: selectedCategory?.name || 'Outros',
        category_id: values.category,
        scheduledDate: new Date(values.scheduledDate).toISOString(),
        recurrence: values.recurrence,
        goalId: values.goalId,
      });
    }
    onOpenChange(false);
    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess();
    }
  };

  // Delete handler
  const handleDelete = () => {
    if (initialData) {
      deleteScheduledTransaction(initialData.id);
      onOpenChange(false);
      setDeleteDialogOpen(false);
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? t('schedule.scheduleTransaction') : t('common.edit')}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <ScheduleTransactionTypeSelector form={form} onTypeChange={handleTypeChange} />
              
              {/* Amount Field */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.amount')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.category')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={loadingCategories}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingCategories ? t('common.loading') : t('transactions.selectCategory')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id} className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <CategoryIcon icon={category.icon} color={category.color} size={16} />
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.description')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('schedule.scheduledFor')}</FormLabel>
                        <FormControl>
                      <Input type="date" {...field} />
                        </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="recurrence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('schedule.recurrence')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('schedule.recurrence')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="once">{t('schedule.once')}</SelectItem>
                        <SelectItem value="daily">{t('schedule.daily')}</SelectItem>
                        <SelectItem value="weekly">{t('schedule.weekly')}</SelectItem>
                        <SelectItem value="monthly">{t('schedule.monthly')}</SelectItem>
                        <SelectItem value="yearly">{t('schedule.yearly')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 justify-between sm:justify-end">
                {mode === 'edit' && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 sm:mr-auto"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={!isOnline}
                  >
                    {t('common.delete')}
                  </Button>
                )}
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={!isOnline}>
                    {mode === 'create' ? t('common.create') : t('common.update')}
                  </Button>
                </div>
              </DialogFooter>
              {!isOnline && (
                <p className="text-xs text-muted-foreground text-right mt-2">
                  {t('schedule.editingRequiresConnection')}
                </p>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('schedule.confirmDeleteSchedule')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ScheduledTransactionForm;
