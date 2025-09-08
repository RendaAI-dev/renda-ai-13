
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RECOVER-PURCHASES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    logStep("Recovery function started");

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-06-20',
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',  // Alterado de API_URL
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Buscar sessions de checkout completadas nas últimas 24 horas
    const last24Hours = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
    
    const sessions = await stripe.checkout.sessions.list({
      created: { gte: last24Hours },
      status: 'complete',
      limit: 100
    });

    logStep("Found completed sessions", { count: sessions.data.length });

    let processedCount = 0;
    let errorCount = 0;

    for (const session of sessions.data) {
      try {
        if (session.mode !== 'subscription') continue;

        let customerEmail = session.customer_email;
        
        // Buscar email do customer se não estiver na session
        if (!customerEmail && session.customer) {
          const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;
          customerEmail = customer.email;
        }

        if (!customerEmail) {
          logStep("Skipping session without email", { sessionId: session.id });
          continue;
        }

        // Verificar se usuário existe
        const { data: existingUser } = await supabase.auth.admin.getUserByEmail(customerEmail);
        
        if (!existingUser.user) {
          logStep("Creating missing user", { email: customerEmail, sessionId: session.id });
          
          // Criar usuário
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: customerEmail,
            // Substitua:
            password: '123mudar',
            
            // Por:
            password: Deno.env.get('DEFAULT_PASSWORD') || '123mudar',
            email_confirm: true,
            user_metadata: {
              name: session.customer_details?.name || customerEmail.split('@')[0],
              phone: session.customer_details?.phone
            }
          });

          if (createError) {
            logStep("Error creating user", { error: createError });
            errorCount++;
            continue;
          }

          // Criar em poupeja_users
            await supabase.from('poupeja_users').insert({
              id: newUser.user!.id,
              email: customerEmail,
              name: session.customer_details?.name || customerEmail.split('@')[0],
              phone: session.customer_details?.phone || null
            });

          // Processar assinatura
          if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            
            let planType = 'monthly';
            if (subscription.items.data.length > 0) {
              const priceId = subscription.items.data[0].price.id;
              if (priceId === 'price_1RYBZCB1AlWHN6VZavX3W2jU') {
                planType = 'annual';
              }
            }

            // Update user with subscription data
            await supabase.from('poupeja_users').update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              current_plan_type: subscription.status === 'active' ? planType : 'free',
              plan_value: subscription.status === 'active' ? (planType === 'annual' ? 538.92 : 49.90) : null,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString()
            }).eq('id', newUser.user!.id);
          }

          processedCount++;
          logStep("User recovered successfully", { email: customerEmail, userId: newUser.user!.id });
        }
      } catch (error) {
        logStep("Error processing session", { sessionId: session.id, error: error.message });
        errorCount++;
      }
    }

    logStep("Recovery completed", { processedCount, errorCount, totalSessions: sessions.data.length });

    return new Response(
      JSON.stringify({ 
        success: true,
        processedCount,
        errorCount,
        totalSessions: sessions.data.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    logStep("ERROR in recovery", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
