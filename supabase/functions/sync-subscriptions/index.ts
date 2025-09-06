
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4' // ou versão mais recente

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-SUBSCRIPTIONS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, test } = await req.json().catch(() => ({}));
    
    // Se é uma requisição de teste, retorna sucesso
    if (test) {
      return new Response(
        JSON.stringify({ success: true, message: "Test successful" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    logStep("Sync subscriptions started", { targetEmail: email });

    // Buscar chave secreta do Stripe nas configurações
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: settingsData, error: settingsError } = await supabaseService
      .from('poupeja_settings')
      .select('value')
      .eq('key', 'stripe_secret_key')
      .single();

    if (settingsError || !settingsData?.value) {
      throw new Error('Chave secreta do Stripe não configurada. Entre em contato com o administrador.');
    }

    // Decodificar a chave se estiver em base64
    const stripeSecretKey = settingsData.value.includes('sk_') ? 
      settingsData.value : 
      atob(settingsData.value);

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',  // Alterado de API_URL
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Buscar assinaturas ativas no Stripe (filtradas por email se fornecido)
    let subscriptions;
    if (email) {
      // Buscar customer específico por email
      const customers = await stripe.customers.list({
        email: email,
        limit: 1
      });
      
      if (customers.data.length === 0) {
        logStep("No customer found for email", { email });
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "Customer not found in Stripe"
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          }
        );
      }
      
      // Buscar assinaturas do customer específico
      subscriptions = await stripe.subscriptions.list({
        customer: customers.data[0].id,
        status: 'active',
        limit: 10
      });
    } else {
      // Buscar todas as assinaturas ativas
      subscriptions = await stripe.subscriptions.list({
        status: 'active',
        limit: 100
      });
    }

    logStep("Found active subscriptions", { count: subscriptions.data.length, filteredByEmail: !!email });

    let syncedCount = 0;
    let createdUsersCount = 0;

    for (const subscription of subscriptions.data) {
      try {
        // Buscar dados do cliente
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        
        if (!customer.email) {
          logStep("Skipping subscription without customer email", { subscriptionId: subscription.id });
          continue;
        }

        logStep("Processing subscription", { subscriptionId: subscription.id, email: customer.email });

        // Verificar se usuário existe no Supabase Auth
        const { data, error: getUserError } = await supabase.auth.admin.listUsers({
          filter: {
            email: customer.email
          }
        });

        const existingUser = data?.users?.[0];
        let userId = existingUser?.id;

        if (!existingUser) {
          logStep("Creating new user", { email: customer.email });
          
          // Criar usuário no Supabase Auth
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: customer.email,
            // Substitua:
            password: '123mudar',
            
            // Por:
            password: Deno.env.get('DEFAULT_PASSWORD') || '123mudar',
            email_confirm: true,
            user_metadata: {
              name: customer.name || customer.email.split('@')[0]
            }
          });

          if (createError) {
            logStep("Error creating user", { email: customer.email, error: createError });
            continue;
          }

          userId = newUser.user?.id;
          createdUsersCount++;
          logStep("User created", { userId, email: customer.email });
        }

        if (userId) {
          // Determinar tipo de plano usando a função utilitária
          let planType = 'monthly';
          if (subscription.items.data.length > 0) {
            const priceId = subscription.items.data[0].price.id;
            console.log("Checking price ID for plan type", { priceId });
            
            // Usar a função utilitária para mapear price ID para plan type
            try {
              const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/get-plan-config`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const planConfig = await response.json();
                if (priceId === planConfig.prices.annual.priceId) {
                  planType = 'annual';
                } else if (priceId === planConfig.prices.monthly.priceId) {
                  planType = 'monthly';
                } else {
                  // Fallback para detecção por interval
                  if (subscription.items.data[0].price.recurring?.interval === 'year') {
                    planType = 'annual';
                  }
                }
              }
            } catch (error) {
              console.log("Error fetching plan config, using fallback logic", error);
              // Fallback para detecção por interval
              if (subscription.items.data[0].price.recurring?.interval === 'year') {
                planType = 'annual';
              }
            }
          }

          // Inserir/atualizar assinatura
          const subscriptionData = {
            user_id: userId,
            stripe_customer_id: customer.id,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            plan_type: planType,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
          };
          
          // Log dos dados antes de inserir
          logStep("Subscription data to upsert", { 
            subscriptionId: subscription.id,
            periods: {
              raw_start: subscription.current_period_start,
              raw_end: subscription.current_period_end,
              formatted_start: subscriptionData.current_period_start,
              formatted_end: subscriptionData.current_period_end
            }
          });

          // Primeiro, deletar assinatura existente do usuário para evitar conflitos
          await supabase
            .from('poupeja_subscriptions')
            .delete()
            .eq('user_id', userId);

          // Inserir nova assinatura
          const { data, error: subscriptionError } = await supabase
            .from('poupeja_subscriptions')
            .insert(subscriptionData);

          if (subscriptionError) {
            logStep("Error upserting subscription", { 
              error: subscriptionError,
              errorCode: subscriptionError.code,
              errorMessage: subscriptionError.message,
              errorDetails: subscriptionError.details,
              userId,
              subscriptionId: subscription.id
            });
            continue;
          }

          syncedCount++;
          logStep("Subscription synced", { subscriptionId: subscription.id });
        }
      } catch (error) {
        logStep("Error processing subscription", { subscriptionId: subscription.id, error: error.message });
      }
    }

    logStep("Sync completed", { 
      totalSubscriptions: subscriptions.data.length,
      syncedCount,
      createdUsersCount
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        totalSubscriptions: subscriptions.data.length,
        syncedCount,
        createdUsersCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    logStep("ERROR in sync", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
