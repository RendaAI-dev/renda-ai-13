
import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { Category } from '@/types/categories';
import { usePreferences } from '@/contexts/PreferencesContext';
import ColorPicker from './ColorPicker';
import IconSelector from './IconSelector';

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Category | null;
  onSave: (category: Omit<Category, 'id'> | Category) => void;
  categoryType?: 'income' | 'expense'; // Add categoryType prop
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  open,
  onOpenChange,
  initialData,
  onSave,
  categoryType = 'expense' // Default to expense
}) => {
  const { t } = usePreferences();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Omit<Category, 'type'> & { id?: string }>({
    defaultValues: initialData || {
      name: '',
      color: '#607D8B',
      icon: 'circle',
    }
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  // Initialize form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setValue('name', initialData.name);
      setValue('color', initialData.color);
      setValue('icon', initialData.icon);
      if (initialData.id) {
        setValue('id', initialData.id);
      }
    } else {
      // Reset form when initialData is null (for new categories)
      setValue('name', '');
      setValue('color', '#607D8B');
      setValue('icon', 'circle');
    }
  }, [initialData, setValue]);

  const handleColorChange = (color: string) => {
    setValue('color', color);
  };

  const handleIconChange = (icon: string) => {
    setValue('icon', icon);
  };

  const onSubmit = (data: Omit<Category, 'type'> & { id?: string }) => {
    console.log('Form submitted with data:', data);
    console.log('Category type being used:', categoryType);
    
    if (initialData) {
      onSave({
        ...data,
        id: initialData.id,
        type: initialData.type,
        isDefault: initialData.isDefault
      });
    } else {
      onSave({
        name: data.name,
        color: data.color,
        icon: data.icon,
        type: categoryType // Use the categoryType prop instead of hardcoded 'expense'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? t('categories.edit') : t('categories.add')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('categories.name')}</Label>
            <Input
              id="name"
              {...register('name', { required: true })}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{t('validation.required')}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>{t('categories.color')}</Label>
            <ColorPicker 
              selectedColor={selectedColor} 
              onSelectColor={handleColorChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label>{t('categories.icon')}</Label>
            <IconSelector
              selectedIcon={selectedIcon}
              onSelectIcon={handleIconChange}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {initialData ? t('common.save') : t('common.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;
