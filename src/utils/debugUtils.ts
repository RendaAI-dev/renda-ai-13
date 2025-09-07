import { supabase } from "@/integrations/supabase/client";

export const debugUserRegistration = async (userId: string) => {
  console.log('🔍 [DEBUG] Iniciando debug do registro do usuário:', userId);
  
  try {
    // Verificar auth.users
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('📋 [DEBUG] Usuário em auth.users:', { user, authError });
    
    // Verificar poupeja_users
    const { data: poupejaUser, error: poupejaError } = await supabase
      .from('poupeja_users')
      .select('*')
      .eq('id', userId);
      
    console.log('📋 [DEBUG] Usuário em poupeja_users:', { poupejaUser, poupejaError });
    
    // Verificar se o trigger está funcionando
    const { data: triggerCheck } = await supabase.rpc('test_trigger_system');
    console.log('🔧 [DEBUG] Status do sistema de triggers:', triggerCheck);
    
    return {
      authUser: user,
      poupejaUser: poupejaUser?.[0] || null,
      hasData: !!poupejaUser?.length,
      authError,
      poupejaError,
      triggerStatus: triggerCheck
    };
  } catch (error) {
    console.error('❌ [DEBUG] Erro no debug:', error);
    return { error };
  }
};

export const testUserCreationFlow = async (email: string) => {
  console.log('🧪 [TEST] Testando fluxo de criação para:', email);
  
  try {
    // Buscar usuário por email
    const { data: users, error } = await supabase
      .from('poupeja_users')
      .select('*')
      .eq('email', email);
      
    console.log('📊 [TEST] Resultados para', email, ':', { users, error });
    
    return { users, error };
  } catch (error) {
    console.error('❌ [TEST] Erro no teste:', error);
    return { error };
  }
};