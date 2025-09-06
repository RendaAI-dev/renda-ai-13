
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit, MoreVertical } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Category } from '@/types/categories';
import { getCategoriesByType, addCategory, updateCategory, deleteCategory } from '@/services/categoryService';
import { useToast } from "@/hooks/use-toast";
import CategoryForm from '@/components/categories/CategoryForm';
import CategoryIcon from '@/components/categories/CategoryIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CategoriesPage: React.FC = () => {
  const { t } = usePreferences();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load categories from Supabase on mount and whenever they change
    const loadCategories = async () => {
      setLoading(true);
      try {
        const loadedCategories = await getCategoriesByType(categoryType);
        setCategories(loadedCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast({
          title: t('common.error'),
          description: t('common.errorFetching'),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [categoryType, toast, t]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (categoryToDelete) {
      try {
        const success = await deleteCategory(categoryToDelete.id);
        if (success) {
          const updatedCategories = await getCategoriesByType(categoryType);
          setCategories(updatedCategories);
          toast({
            title: t('categories.deleted'),
            description: `${categoryToDelete.name} ${t('categories.wasDeleted')}`,
          });
        } else {
          toast({
            title: t('common.error'),
            description: t('categories.defaultCantDelete'),
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        toast({
          title: t('common.error'),
          description: t('common.somethingWentWrong'),
          variant: "destructive",
        });
      } finally {
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
      }
    }
  };

  const handleSaveCategory = async (category: Omit<Category, 'id'> | Category) => {
    try {
      if ('id' in category) {
        // Update existing category
        const updatedCategory = await updateCategory(category as Category);
        if (updatedCategory) {
          toast({
            title: "Categoria atualizada",
            description: `A categoria ${category.name} foi atualizada com sucesso.`,
          });
        }
      } else {
        // Add new category - ensure type is set correctly
        const newCategory = await addCategory({
          ...category,
          type: categoryType // Make sure to use the current categoryType
        });
        if (newCategory) {
          toast({
            title: "Categoria adicionada",
            description: `A categoria ${category.name} foi adicionada com sucesso.`,
          });
        }
      }
      
      // Refresh categories list
      const updatedCategories = await getCategoriesByType(categoryType);
      setCategories(updatedCategories);
      setCategoryFormOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: t('common.error'),
        description: t('common.somethingWentWrong'),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <MainLayout title={t('categories.title')}>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={t('categories.title')}>
      <SubscriptionGuard feature="categorias personalizadas">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
            <Button onClick={handleAddCategory}>
              <Plus className="mr-2 h-4 w-4" />
              {t('categories.add')}
            </Button>
          </div>
          
          <Tabs 
            defaultValue="expense" 
            value={categoryType}
            onValueChange={(value) => setCategoryType(value as 'expense' | 'income')}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="expense" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                {t('common.expense')}
              </TabsTrigger>
              <TabsTrigger value="income" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                {t('common.income')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="expense" className="mt-0">
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li 
                    key={category.id} 
                    className="bg-card p-3 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <CategoryIcon 
                        icon={category.icon} 
                        color={category.color} 
                      />
                      <span>{category.name}</span>
                    </div>
                    <div>
                      {category.isDefault ? (
                        <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteCategory(category)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </TabsContent>
            
            <TabsContent value="income" className="mt-0">
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li 
                    key={category.id} 
                    className="bg-card p-3 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <CategoryIcon 
                        icon={category.icon} 
                        color={category.color} 
                      />
                      <span>{category.name}</span>
                    </div>
                    <div>
                      {category.isDefault ? (
                        <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteCategory(category)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </div>

        <CategoryForm
          open={categoryFormOpen}
          onOpenChange={setCategoryFormOpen}
          initialData={editingCategory}
          onSave={handleSaveCategory}
          categoryType={categoryType}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('categories.deleteConfirmation')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('categories.deleteWarning')}
                {categoryToDelete?.isDefault && (
                  <p className="mt-2 text-destructive font-medium">
                    {t('categories.defaultWarning')}
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteCategory}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default CategoriesPage;
