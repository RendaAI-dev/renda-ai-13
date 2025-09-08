import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      throw new Error('Email is required');
    }

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Stripe secret key
    const { data: settingsData } = await supabase
      .from('poupeja_settings')
      .select('value')
      .eq('key', 'stripe_secret_key')
      .single();

    const stripeSecretKey = settingsData.value.includes('sk_') ? 
      settingsData.value : 
      atob(settingsData.value);

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });

    // Get user data from database
    const { data: userData } = await supabase
      .from('poupeja_users')
      .select('*')
      .eq('email', email)
      .single();

    if (!userData) {
      throw new Error('User not found');
    }

    // Get price ID configurations
    const { data: priceSettings } = await supabase
      .from('poupeja_settings')
      .select('key, value')
      .in('key', ['stripe_price_id_monthly', 'stripe_price_id_annual']);

    const monthlyPriceId = priceSettings?.find(s => s.key === 'stripe_price_id_monthly')?.value;
    const annualPriceId = priceSettings?.find(s => s.key === 'stripe_price_id_annual')?.value;

    // Get subscription from Stripe
    let stripeSubscription = null;
    let stripeCustomer = null;
    
    if (userData.stripe_subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(userData.stripe_subscription_id);
        stripeCustomer = await stripe.customers.retrieve(stripeSubscription.customer as string);
      } catch (error) {
        console.log('Error fetching from Stripe:', error);
      }
    }

    // Calculate what the plan type should be based on different methods
    const calculations = {
      database_plan_type: userData.current_plan_type,
      database_plan_value: userData.plan_value,
      
      // Method 1: Based on plan_value
      calculated_from_value: userData.plan_value === 538.92 ? 'annual' : 
                            userData.plan_value === 49.90 ? 'monthly' : 'unknown',
      
      // Method 2: Based on Stripe price ID (if available)
      stripe_price_id: stripeSubscription?.items?.data?.[0]?.price?.id || 'not_found',
      stripe_unit_amount: stripeSubscription?.items?.data?.[0]?.price?.unit_amount || 'not_found',
      stripe_calculated_value: stripeSubscription?.items?.data?.[0]?.price?.unit_amount ? 
                              (stripeSubscription.items.data[0].price.unit_amount / 100) : 'not_found',
      
      calculated_from_price_id: null,
      stripe_interval: stripeSubscription?.items?.data?.[0]?.price?.recurring?.interval || 'not_found',
      
      // Configuration
      configured_monthly_price_id: monthlyPriceId,
      configured_annual_price_id: annualPriceId,
      
      // Stripe subscription details
      stripe_status: stripeSubscription?.status || 'not_found',
      stripe_current_period_end: stripeSubscription?.current_period_end ? 
        new Date(stripeSubscription.current_period_end * 1000).toISOString() : 'not_found'
    };

    // Determine plan type from Stripe price ID
    if (stripeSubscription?.items?.data?.[0]?.price?.id) {
      const stripePriceId = stripeSubscription.items.data[0].price.id;
      if (stripePriceId === monthlyPriceId) {
        calculations.calculated_from_price_id = 'monthly';
      } else if (stripePriceId === annualPriceId) {
        calculations.calculated_from_price_id = 'annual';
      } else {
        calculations.calculated_from_price_id = 'unknown_price_id';
      }
    }

    return new Response(JSON.stringify({
      user_email: email,
      debug_info: calculations,
      recommendations: {
        should_be_plan_type: calculations.calculated_from_value,
        issues: [
          calculations.database_plan_type !== calculations.calculated_from_value ? 
            `Database shows ${calculations.database_plan_type} but value ${calculations.database_plan_value} suggests ${calculations.calculated_from_value}` : null,
          calculations.calculated_from_price_id === 'unknown_price_id' ? 
            `Stripe price ID ${calculations.stripe_price_id} not found in configuration` : null,
          calculations.calculated_from_price_id && calculations.calculated_from_price_id !== calculations.calculated_from_value ?
            `Price ID suggests ${calculations.calculated_from_price_id} but value suggests ${calculations.calculated_from_value}` : null
        ].filter(Boolean)
      }
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});