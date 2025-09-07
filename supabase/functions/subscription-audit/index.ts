import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBSCRIPTION-AUDIT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting subscription audit");

    // Initialize Supabase service client
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get Stripe secret key
    const { data: stripeKeyData, error: stripeKeyError } = await supabaseService
      .from("poupeja_settings")
      .select("value, encrypted")
      .eq("category", "stripe")
      .eq("key", "stripe_secret_key")
      .single();
    
    if (stripeKeyError || !stripeKeyData?.value) {
      throw new Error("Stripe secret key not configured");
    }
    
    let stripeSecretKey = stripeKeyData.value;
    if (stripeKeyData.encrypted) {
      stripeSecretKey = atob(stripeSecretKey);
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    logStep("Stripe initialized");

    // Get all customers from our database
    const { data: customers, error: customersError } = await supabaseService
      .from("poupeja_customers")
      .select("user_id, stripe_customer_id");

    if (customersError) {
      throw new Error(`Failed to fetch customers: ${customersError.message}`);
    }

    logStep("Found customers in database", { count: customers?.length || 0 });

    const auditResults = {
      totalCustomers: customers?.length || 0,
      usersWithMultipleSubscriptions: [],
      inconsistencies: [],
      fixedSubscriptions: 0,
      errors: []
    };

    // Check each customer for multiple active subscriptions
    for (const customer of customers || []) {
      try {
        // Get active subscriptions from Stripe
        const stripeSubscriptions = await stripe.subscriptions.list({
          customer: customer.stripe_customer_id,
          status: 'active',
          limit: 10
        });

        // Get subscriptions from our database
        const { data: dbSubscriptions } = await supabaseService
          .from("poupeja_subscriptions")
          .select("*")
          .eq("user_id", customer.user_id)
          .eq("status", "active");

        logStep("Checking customer", {
          userId: customer.user_id,
          stripeActiveCount: stripeSubscriptions.data.length,
          dbActiveCount: dbSubscriptions?.length || 0
        });

        // Check for multiple active subscriptions in Stripe
        if (stripeSubscriptions.data.length > 1) {
          auditResults.usersWithMultipleSubscriptions.push({
            userId: customer.user_id,
            stripeCustomerId: customer.stripe_customer_id,
            activeSubscriptions: stripeSubscriptions.data.length,
            subscriptions: stripeSubscriptions.data.map(sub => ({
              id: sub.id,
              status: sub.status,
              planType: sub.items.data[0]?.price.recurring?.interval === 'year' ? 'annual' : 'monthly',
              created: new Date(sub.created * 1000).toISOString()
            }))
          });

          // Fix by canceling all but the most recent subscription
          const sortedSubscriptions = stripeSubscriptions.data.sort((a, b) => b.created - a.created);
          const mostRecent = sortedSubscriptions[0];
          
          for (let i = 1; i < sortedSubscriptions.length; i++) {
            const oldSubscription = sortedSubscriptions[i];
            logStep("Canceling old subscription", { 
              subscriptionId: oldSubscription.id,
              customerUserId: customer.user_id 
            });
            
            try {
              await stripe.subscriptions.cancel(oldSubscription.id, {
                prorate: true
              });
              
              // Update database
              await supabaseService.from("poupeja_subscriptions").update({
                status: "canceled",
                cancel_at_period_end: true,
                updated_at: new Date().toISOString()
              }).eq("stripe_subscription_id", oldSubscription.id);
              
              auditResults.fixedSubscriptions++;
            } catch (cancelError) {
              auditResults.errors.push({
                userId: customer.user_id,
                subscriptionId: oldSubscription.id,
                error: cancelError.message
              });
            }
          }
        }

        // Check for inconsistencies between Stripe and DB
        if (stripeSubscriptions.data.length !== (dbSubscriptions?.length || 0)) {
          auditResults.inconsistencies.push({
            userId: customer.user_id,
            stripeCount: stripeSubscriptions.data.length,
            dbCount: dbSubscriptions?.length || 0,
            issue: "Count mismatch between Stripe and database"
          });
        }

      } catch (customerError) {
        auditResults.errors.push({
          userId: customer.user_id,
          error: customerError.message
        });
      }
    }

    logStep("Audit completed", auditResults);

    return new Response(
      JSON.stringify({ 
        success: true, 
        audit: auditResults 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in subscription-audit", { message: errorMessage });
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});