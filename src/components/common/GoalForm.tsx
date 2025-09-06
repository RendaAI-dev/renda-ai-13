
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Goal } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/contexts/PreferencesContext';

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Goal;
  mode: 'create' | 'edit';
}

const presetColors = [
  '#4ECDC4', '#FF6B6B', '#2C6E7F', '#FBBF24', '#8B5CF6', 
  '#EC4899', '#10B981', '#94A3B8', '#F43F5E', '#F59E0B'
];

const GoalForm: React.FC<GoalFormProps> = ({
  open,
  onOpenChange,
  initialData,
  mode,
}) => {
  const { addGoal, updateGoal } = useAppContext();
  const { t, currency } = usePreferences();

  // Create a schema with translated validation messages
  const goalSchema = z.object({
    name: z.string().min(1, t('validation.required')),
    target_amount: z.coerce.number().positive(t('validation.positive')),
    current_amount: z.coerce.number().min(0, t('validation.nonNegative')),
    start_date: z.string().min(1, t('validation.required')),
    end_date: z.string().optional(),
    color: z.string().min(1, t('validation.required')),
  });

  type GoalFormValues = z.infer<typeof goalSchema>;

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: initialData?.name || '',
      target_amount: initialData?.targetAmount || 0,
      current_amount: initialData?.currentAmount || 0,
      start_date: initialData?.startDate
        ? new Date(initialData.startDate).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      end_date: initialData?.endDate
        ? new Date(initialData.endDate).toISOString().split('T')[0] 
        : undefined,
      color: initialData?.color || presetColors[0],
    },
  });

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    console.log('GoalForm - State change:', { open, mode, initialData: !!initialData });
    
    if (open && initialData && mode === 'edit') {
      // Reset formulário com os dados corretos quando abrir para edição
      form.reset({
        name: initialData.name,
        target_amount: initialData.targetAmount,
        current_amount: initialData.currentAmount,
        start_date: new Date(initialData.startDate).toISOString().split('T')[0],
        end_date: initialData.endDate 
          ? new Date(initialData.endDate).toISOString().split('T')[0] 
          : undefined,
        color: initialData.color,
      });
    } else if (open && mode === 'create') {
      // Reset formulário para valores padrão quando criar nova meta
      form.reset({
        name: '',
        target_amount: 0,
        current_amount: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: undefined,
        color: presetColors[0],
      });
    }
  }, [open, initialData, mode, form]);

  const onSubmit = (values: GoalFormValues) => {
    if (mode === 'create') {
      addGoal({
        name: values.name,
        targetAmount: values.target_amount,
        currentAmount: values.current_amount,
        startDate: new Date(values.start_date).toISOString(),
        endDate: values.end_date ? new Date(values.end_date).toISOString() : undefined,
        color: values.color,
        transactions: [],
      });
    } else if (initialData) {
      updateGoal(initialData.id, {
        name: values.name,
        targetAmount: values.target_amount,
        currentAmount: values.current_amount,
        startDate: new Date(values.start_date).toISOString(),
        endDate: values.end_date ? new Date(values.end_date).toISOString() : undefined,
        color: values.color,
      });
    }
    onOpenChange(false);
  };

  // Get currency symbol with space
  const getCurrencySymbol = () => {
    return currency === 'USD' ? '$ ' : 'R$ ';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('goals.create') : t('goals.edit')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('goals.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('goals.name')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('goals.targetAmount')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">{getCurrencySymbol()}</div>
                      <Input
                        type="number"
                        step="0.01"
                        className="pl-8"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="current_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('goals.currentAmount')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">{getCurrencySymbol()}</div>
                      <Input
                        type="number"
                        step="0.01"
                        className="pl-8"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('goals.startDate')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('goals.endDate')} ({t('common.optional')})</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e.target.value || undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('goals.color')}</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <div
                            className="h-4 w-4 rounded-full mr-2"
                            style={{ backgroundColor: field.value }}
                          />
                          <span>
                            {field.value || t('goals.color')}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-3">
                        <div className="grid grid-cols-5 gap-2">
                          {presetColors.map((color) => (
                            <div
                              key={color}
                              className="h-8 w-8 rounded-full cursor-pointer border border-gray-200 flex items-center justify-center"
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                form.setValue("color", color);
                              }}
                            >
                              {field.value === color && (
                                <div className="h-2 w-2 rounded-full bg-white" />
                              )}
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {mode === 'create' ? t('common.create') : t('common.update')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default GoalForm;
