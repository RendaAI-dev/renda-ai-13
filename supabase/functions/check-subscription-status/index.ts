import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função helper para logs de depuração
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Criar cliente Supabase usando service role para bypass RLS
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Buscar por email em vez de token para PaymentSuccessPage
    const { email } = await req.json().catch(() => ({}));
    
    let user = null;
    let userLookupMethod = "none";

    // Se temos email, buscar usuário por email
    if (email && email !== 'user@example.com') {
      logStep("Looking up user by email", { email });
      
      const { data: users, error: listError } = await supabaseService.auth.admin.listUsers();
      if (!listError && users?.users) {
        user = users.users.find(u => u.email === email);
        if (user) {
          userLookupMethod = "email";
          logStep("User found by email", { userId: user.id, email: user.email });
        }
      }
    }

    // Fallback: tentar autenticação por token se fornecido
    if (!user) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        logStep("Attempting authentication by token");
        
        const supabaseAuth = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );

        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
        if (!userError && userData.user?.email) {
          user = userData.user;
          userLookupMethod = "token";
          logStep("User authenticated by token", { userId: user.id, email: user.email });
        }
      }
    }

    if (!user?.email) {
      throw new Error("User not found - email or valid token required");
    }

    // Buscar assinatura do usuário usando service role
    const { data: subscription, error: subscriptionError } = await supabaseService
      .from("poupeja_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      logStep("Error fetching subscription", { error: subscriptionError });
      throw new Error(`Error fetching subscription: ${subscriptionError.message}`);
    }

    const hasActiveSubscription = !!subscription;
    const isExpired = subscription?.current_period_end 
      ? new Date() > new Date(subscription.current_period_end)
      : false;

    const isActiveAndNotExpired = hasActiveSubscription && !isExpired;

    logStep("Subscription check completed", { 
      hasSubscription: hasActiveSubscription,
      isExpired,
      isActiveAndNotExpired,
      planType: subscription?.plan_type,
      currentPeriodEnd: subscription?.current_period_end,
      userLookupMethod
    });

    return new Response(JSON.stringify({
      hasActiveSubscription: isActiveAndNotExpired,
      subscription: subscription || null,
      isExpired,
      exists: true,
      hasSubscription: isActiveAndNotExpired,
      user: {
        id: user.id,
        email: user.email
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription-status", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      hasActiveSubscription: false,
      subscription: null 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});