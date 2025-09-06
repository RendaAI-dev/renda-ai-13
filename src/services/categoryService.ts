
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/categories";
import { v4 as uuidv4 } from "uuid";

export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from("poupeja_categories")
      .select("*")
      .order("name");

    if (error) throw error;

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type as 'income' | 'expense',
      color: item.color,
      icon: item.icon || "circle",
      isDefault: item.is_default
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const getCategoriesByType = async (type: 'income' | 'expense'): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from("poupeja_categories")
      .select("*")
      .eq("type", type)
      .order("name");

    if (error) throw error;

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type as 'income' | 'expense',
      color: item.color,
      icon: item.icon || "circle",
      isDefault: item.is_default
    }));
  } catch (error) {
    console.error(`Error fetching ${type} categories:`, error);
    return [];
  }
};

export const addCategory = async (category: Omit<Category, "id">): Promise<Category | null> => {
  try {
    // Get current authenticated user
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      console.error("No authenticated user found");
      throw new Error("You must be logged in to add a category");
    }

    const userId = authData.user.id;
    console.log("Adding category for authenticated user");
    
    const newId = uuidv4();
    
    const { data, error } = await supabase
      .from("poupeja_categories")
      .insert({
        id: newId,
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
        is_default: category.isDefault || false,
        user_id: userId // Add user_id to the inserted data
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insertion error:", error);
      throw error;
    }

    console.log("Category added successfully:", data);
    return {
      id: data.id,
      name: data.name,
      type: data.type as 'income' | 'expense',
      color: data.color,
      icon: data.icon || "circle",
      isDefault: data.is_default
    };
  } catch (error) {
    console.error("Error adding category:", error);
    return null;
  }
};

export const updateCategory = async (category: Category): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from("poupeja_categories")
      .update({
        name: category.name,
        color: category.color,
        icon: category.icon,
        is_default: category.isDefault
      })
      .eq("id", category.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      type: data.type as 'income' | 'expense',
      color: data.color,
      icon: data.icon || "circle",
      isDefault: data.is_default
    };
  } catch (error) {
    console.error("Error updating category:", error);
    return null;
  }
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    // First check if this is a default category
    const { data: category } = await supabase
      .from("poupeja_categories")
      .select("is_default")
      .eq("id", id)
      .single();
    
    if (category?.is_default) {
      console.error("Cannot delete default category");
      return false;
    }

    // Get default category of same type to reassign transactions
    const { data: defaultCategory } = await supabase
      .from("poupeja_categories")
      .select("id, type")
      .eq("is_default", true)
      .eq("name", "Outros")
      .single();

    if (defaultCategory) {
      // Update any transactions using this category
      await supabase
        .from("poupeja_transactions")
        .update({ category_id: defaultCategory.id })
        .eq("category_id", id);
    }

    // Now delete the category
    const { error } = await supabase
      .from("poupeja_categories")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error deleting category:", error);
    return false;
  }
};
