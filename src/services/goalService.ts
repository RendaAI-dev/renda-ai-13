
import { supabase } from "@/integrations/supabase/client";
import { Goal, Transaction } from "@/types";
import { v4 as uuidv4 } from "uuid";

export const getGoals = async (): Promise<Goal[]> => {
  try {
    console.log("Iniciando busca de metas...");
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      console.log("Usuário não autenticado");
      return [];
    }

    const userId = authData.user.id;
    console.log("Buscando metas para o usuário autenticado");

    const { data, error } = await supabase
      .from("poupeja_goals")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Erro ao buscar metas:", error);
      throw error;
    }

    console.log("Metas encontradas no banco:", data);

    const goals: Goal[] = [];

    for (const goalData of data) {
      console.log(`Processando meta ${goalData.id}: ${goalData.name}`);
      console.log(`Valores da meta no banco: target_amount=${goalData.target_amount}, current_amount=${goalData.current_amount}`);

      // Buscar transações relacionadas à meta
      const { data: transactions } = await supabase
        .from("poupeja_transactions")
        .select("*, category:poupeja_categories(name, color, icon)")
        .eq("goal_id", goalData.id);

      console.log(`Encontradas ${transactions ? transactions.length : 0} transações para a meta ${goalData.id}`);

      goals.push({
        id: goalData.id,
        name: goalData.name,
        targetAmount: goalData.target_amount,
        currentAmount: goalData.current_amount,
        startDate: goalData.start_date,
        endDate: goalData.end_date,
        deadline: goalData.deadline,
        color: goalData.color,
        transactions: transactions ? transactions.map((t) => ({
          id: t.id,
          type: t.type as 'income' | 'expense',
          amount: t.amount,
          category: t.category ? t.category.name : "Outros",
          categoryColor: t.category ? t.category.color : "#9E9E9E",
          categoryIcon: t.category ? t.category.icon : "grid",
          description: t.description || "",
          date: t.date,
          goalId: t.goal_id
        })) : []
      });
    }

    console.log("Metas processadas e prontas para retorno:", goals);
    return goals;
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    return [];
  }
};

export const addGoal = async (goal: Omit<Goal, "id" | "transactions">): Promise<Goal | null> => {
  try {
    console.log("Adding goal:", goal);
    const newId = uuidv4();
    
    // Get the current user
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error("User not authenticated when adding goal");
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("poupeja_goals")
      .insert({
        id: newId,
        name: goal.name,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount || 0,
        start_date: goal.startDate,
        end_date: goal.endDate,
        deadline: goal.deadline,
        color: goal.color || "#06465f",
        user_id: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error("Error in addGoal:", error);
      throw error;
    }

    console.log("Goal added:", data);

    return {
      id: data.id,
      name: data.name,
      targetAmount: data.target_amount,
      currentAmount: data.current_amount,
      startDate: data.start_date,
      endDate: data.end_date,
      deadline: data.deadline,
      color: data.color,
      transactions: []
    };
  } catch (error) {
    console.error("Error adding goal:", error);
    return null;
  }
};

export const updateGoal = async (goal: Omit<Goal, "transactions">): Promise<Goal | null> => {
  try {
    const { data, error } = await supabase
      .from("poupeja_goals")
      .update({
        name: goal.name,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        start_date: goal.startDate,
        end_date: goal.endDate,
        deadline: goal.deadline,
        color: goal.color
      })
      .eq("id", goal.id)
      .select()
      .single();

    if (error) throw error;

    // Fetch the related transactions
    const { data: transactions } = await supabase
      .from("poupeja_transactions")
      .select("*, category:poupeja_categories(name, color, icon)")
      .eq("goal_id", goal.id);

    return {
      id: data.id,
      name: data.name,
      targetAmount: data.target_amount,
      currentAmount: data.current_amount,
      startDate: data.start_date,
      endDate: data.end_date,
      deadline: data.deadline,
      color: data.color,
      transactions: transactions ? transactions.map((t) => ({
        id: t.id,
        type: t.type as 'income' | 'expense',
        amount: t.amount,
        category: t.category ? t.category.name : "Outros",
        categoryColor: t.category ? t.category.color : "#9E9E9E",
        categoryIcon: t.category ? t.category.icon : "grid",
        description: t.description || "",
        date: t.date,
        goalId: t.goal_id
      })) : []
    };
  } catch (error) {
    console.error("Error updating goal:", error);
    return null;
  }
};

export const deleteGoal = async (id: string): Promise<boolean> => {
  try {
    // Update transactions to remove the goal reference
    await supabase
      .from("poupeja_transactions")
      .update({ goal_id: null })
      .eq("goal_id", id);
    
    const { error } = await supabase
      .from("poupeja_goals")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error deleting goal:", error);
    return false;
  }
};

// Adicionar esta função ao arquivo goalService.ts
export const recalculateGoalAmounts = async (): Promise<boolean> => {
  try {
    console.log("Recalculando valores das metas...");
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      console.log("Usuário não autenticado");
      return false;
    }

    const userId = authData.user.id;
    
    // Buscar todas as metas do usuário
    const { data: goals, error: goalsError } = await supabase
      .from("poupeja_goals")
      .select("id, name")
      .eq("user_id", userId);

    if (goalsError) {
      console.error("Erro ao buscar metas para recálculo:", goalsError);
      return false;
    }

    // Para cada meta, calcular o valor atual com base nas transações
    for (const goal of goals) {
      console.log(`Recalculando valor para meta ${goal.id}: ${goal.name}`);
      
      // Buscar todas as transações de receita vinculadas à meta
      const { data: transactions, error: transactionsError } = await supabase
        .from("poupeja_transactions")
        .select("amount")
        .eq("goal_id", goal.id)
        .eq("type", "income");

      if (transactionsError) {
        console.error(`Erro ao buscar transações para meta ${goal.id}:`, transactionsError);
        continue;
      }

      // Calcular o valor total das transações
      const currentAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      console.log(`Valor calculado para meta ${goal.id}: ${currentAmount}`);

      // Atualizar o valor atual da meta no banco de dados
      const { error: updateError } = await supabase
        .from("poupeja_goals")
        .update({ current_amount: currentAmount })
        .eq("id", goal.id);

      if (updateError) {
        console.error(`Erro ao atualizar valor da meta ${goal.id}:`, updateError);
      } else {
        console.log(`Meta ${goal.id} atualizada com sucesso!`);
      }
    }

    return true;
  } catch (error) {
    console.error("Erro ao recalcular valores das metas:", error);
    return false;
  }
};
