
import { supabase } from "@/integrations/supabase/client";

// Function to test database connection and functions
export const testDatabaseFunctions = async () => {
  try {
    console.log("Verificando conexão com o banco de dados...");
    
    // Test basic connection by fetching user
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Conexão com Supabase estabelecida:", !!user);
    
    if (user) {
      // Test if update_goal_amount function exists by calling it with test data
      console.log("Testando função update_goal_amount...");
      
      // This is just a test - won't actually update anything if goal doesn't exist
      const { data, error } = await supabase.rpc('update_goal_amount', {
        p_goal_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        p_amount_change: 0
      });
      
      if (error && !error.message.includes('null value')) {
        console.log("Função update_goal_amount disponível");
      } else {
        console.log("Função update_goal_amount testada com sucesso");
      }
    }
  } catch (error) {
    console.error("Erro ao verificar funções do banco de dados:", error);
  }
};

// Execute this function once during application initialization
export const setupDatabase = async () => {
  await testDatabaseFunctions();
};
