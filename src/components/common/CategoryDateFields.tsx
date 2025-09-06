
import React, { useMemo, useEffect } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormValues } from '@/schemas/transactionSchema';
import { usePreferences } from '@/contexts/PreferencesContext';
import { getCategoriesByType } from '@/services/categoryService';
import CategoryIcon from '@/components/categories/CategoryIcon';

interface CategoryDateFieldsProps {
  form: UseFormReturn<TransactionFormValues>;
  transactionType: 'income' | 'expense';
}

const CategoryDateFields: React.FC<CategoryDateFieldsProps> = ({ form, transactionType }) => {
  const { t } = usePreferences();
  
  console.log("CategoryDateFields rendering with transactionType:", transactionType);
  
  // Use state for categories since we need to load them asynchronously
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [key, setKey] = React.useState(Date.now()); // Add a key to force re-render

  // Load categories from Supabase
  React.useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const filteredCategories = await getCategoriesByType(transactionType);
        console.log("Loaded categories from Supabase for", transactionType, ":", filteredCategories);
        setCategories(filteredCategories);
        
        // Set default category if none selected
        if (filteredCategories.length > 0) {
          const currentCategory = form.getValues('category');
          const categoryExists = filteredCategories.some(c => c.id === currentCategory || c.name === currentCategory);
          
          if (!categoryExists) {
            console.log("Setting default category to:", filteredCategories[0].id);
            form.setValue('category', filteredCategories[0].id);
          }
        }
        
        // Force re-render after categories are loaded
        setKey(Date.now());
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [transactionType, form]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem key={`category-${key}-${transactionType}`}>
            <FormLabel>{t('transactions.category')}</FormLabel>
            <Select 
              onValueChange={(value) => {
                console.log("Category selected:", value);
                field.onChange(value);
              }} 
              value={field.value}
              defaultValue={field.value}
              disabled={loading}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loading ? "Carregando..." : t('transactions.selectCategory')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent 
                position="popper" 
                className="w-full max-h-[300px] overflow-y-auto" 
                sideOffset={5}
                align="center"
                avoidCollisions={false}
              >
                {categories.map((category) => {
                  const categoryId = category.id;
                  return (
                    <SelectItem 
                      key={categoryId} 
                      value={categoryId} 
                      className="flex items-center gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <CategoryIcon icon={category.icon} color={category.color} size={16} />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('transactions.date')}</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default CategoryDateFields;
