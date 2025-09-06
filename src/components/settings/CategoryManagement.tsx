
import React, { useState, useEffect } from 'react';
import { Category } from '@/types/categories';
import { getCategoriesByType, deleteCategory } from '@/services/categoryService';
import CategoryForm from '@/components/categories/CategoryForm';
import CategoryIcon from '@/components/categories/CategoryIcon';
import { useToast } from "@/hooks/use-toast";
import { usePreferences } from '@/contexts/PreferencesContext';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Button } from "@/components/ui/button";
import { Plus, Edit, MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CategoryManagementProps {
  onSaveCategory: (category: Omit<Category, 'id'> | Category) => Promise<void>;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ onSaveCategory }) => {
  const { t } = usePreferences();
  const { toast } = useToast();
  
  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load categories when tab or type changes
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const loadedCategories = await getCategoriesByType(categoryType);
        setCategories(loadedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: t('common.error'),
          description: t('common.errorFetching'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
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

  const renderCategoryList = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (categories.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('categories.noCategories')}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={handleAddCategory}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('categories.add')}
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((category) => (
          <div 
            key={category.id} 
            className="bg-card p-3 rounded-lg flex items-center justify-between border"
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
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('categories.title')}</CardTitle>
            <CardDescription>{t('categories.manageCategories')}</CardDescription>
          </div>
          <Button onClick={handleAddCategory}>
            <Plus className="mr-2 h-4 w-4" />
            {t('categories.add')}
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="expense" 
            value={categoryType}
            onValueChange={(value) => setCategoryType(value as 'expense' | 'income')}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger 
                value="expense" 
                className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
              >
                {t('expense')}
              </TabsTrigger>
              <TabsTrigger 
                value="income" 
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
              >
                {t('income')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="expense" className="mt-0">
              {renderCategoryList()}
            </TabsContent>
            
            <TabsContent value="income" className="mt-0">
              {renderCategoryList()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CategoryForm
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        initialData={editingCategory}
        onSave={onSaveCategory}
        categoryType={categoryType} // Pass the current categoryType
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
    </>
  );
};

export default CategoryManagement;
