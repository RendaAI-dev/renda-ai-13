import type { SubscriptionData } from "../types.ts";

export async function handleSubscriptionUpdated(
  event: any,
  stripe: any,
  supabase: any
): Promise<void> {
  const subscription = event.data.object;
  console.log("Processing subscription update:", JSON.stringify(subscription));
  
  try {
    // First, find the user_id using subscription or customer metadata
    let userId = subscription.metadata?.user_id;
    
    if (!userId) {
      // If not in subscription metadata, check customer
      const customer = await stripe.customers.retrieve(subscription.customer);
      userId = customer.metadata?.user_id;
    }
    
    if (!userId) {
      // Last resort: search the poupeja_users table by stripe_subscription_id
      const { data: existingUser } = await supabase
        .from("poupeja_users")
        .select("id")
        .eq("stripe_subscription_id", subscription.id)
        .single();
      
      userId = existingUser?.id;
    }
    
    if (!userId) {
      console.error(`No user_id found for subscription ${subscription.id}`);
      return;
    }
    
    // Verify the user exists in poupeja_users table and get the correct ID
    const { data: poupejaUser, error: userError } = await supabase
      .from('poupeja_users')
      .select('id')
      .eq('id', userId) // poupeja_users.id = auth.users.id
      .single();
      
    if (userError || !poupejaUser) {
      console.error(`User not found in poupeja_users table for userId: ${userId}`, { error: userError });
      return;
    }
    
    const verifiedUserId = poupejaUser.id;
    console.log(`Found and verified user for subscription ${subscription.id}`);
    
    // Prepare update/insert data
    const subscriptionData: any = {
      user_id: verifiedUserId, // Use verified user ID
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end
    };
    
    // Add timestamps from subscription object directly
    if (subscription.current_period_start) {
      subscriptionData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
      console.log(`Setting current_period_start: ${subscriptionData.current_period_start}`);
    }
    
    if (subscription.current_period_end) {
      subscriptionData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
      console.log(`Setting current_period_end: ${subscriptionData.current_period_end}`);
    }
    
    // Add logic to update plan_type based on price
    if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
      const priceId = subscription.items.data[0].price.id;
      const interval = subscription.items.data[0].price.recurring?.interval;
      const unitAmount = subscription.items.data[0].price.unit_amount; // Valor em centavos
      
      console.log(`[SUBSCRIPTION-UPDATED] Price details:`, {
        priceId,
        interval,
        unitAmount,
        recurring: subscription.items.data[0].price.recurring
      });
      
      // Calcular plan_value em reais
      const planValue = unitAmount ? unitAmount / 100 : null;
      subscriptionData.plan_value = planValue;
      
      // Try to get plan_type from direct price ID mapping first
      let planType;
      try {
        // Fetch price IDs directly from settings table for accurate mapping
        const { data: priceSettings } = await supabase
          .from('poupeja_settings')
          .select('key, value')
          .in('key', ['stripe_price_id_monthly', 'stripe_price_id_annual']);
        
        const monthlyPriceId = priceSettings?.find(s => s.key === 'stripe_price_id_monthly')?.value;
        const annualPriceId = priceSettings?.find(s => s.key === 'stripe_price_id_annual')?.value;
        
        console.log(`[SUBSCRIPTION-UPDATED] Price mapping - ID: ${priceId}, Monthly: ${monthlyPriceId}, Annual: ${annualPriceId}`);
        
        if (priceId === monthlyPriceId) {
          planType = "monthly";
        } else if (priceId === annualPriceId) {
          planType = "annual";
        } else {
          console.warn(`[SUBSCRIPTION-UPDATED] Unknown price ID: ${priceId}. Using interval fallback.`);
          planType = interval === 'year' ? "annual" : "monthly";
        }
      } catch (error) {
        console.error('[SUBSCRIPTION-UPDATED] Error fetching price IDs, using interval fallback:', error);
        // Final fallback: use interval
        planType = interval === 'year' ? "annual" : "monthly";
      }
      
      console.log(`[SUBSCRIPTION-UPDATED] Final plan type determined: ${planType} for price ${priceId} with interval ${interval}`);
      
      if (planType) {
        subscriptionData.plan_type = planType;
        console.log(`[SUBSCRIPTION-UPDATED] Setting plan_type to ${planType} for subscription ${subscription.id}`);
      }
    }
    
    // If this subscription is being activated, mark any other subscriptions for this user as canceled
    if (subscription.status === 'active') {
      console.log(`[SUBSCRIPTION-UPDATED] Deactivating other user subscriptions for user: ${verifiedUserId}`);
      await supabase
        .from("poupeja_users")
        .update({
          subscription_status: "canceled",
          current_plan_type: "free",
          plan_value: null,
          updated_at: new Date().toISOString()
        })
        .neq("stripe_subscription_id", subscription.id)
        .eq("subscription_status", "active");
      
      console.log(`[SUBSCRIPTION-UPDATED] Deactivated other subscriptions for user ${verifiedUserId}`);
    }

    // Update user data directly in poupeja_users table
    const userData = {
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      current_plan_type: subscription.status === 'active' ? subscriptionData.plan_type : 'free',
      plan_value: subscription.status === 'active' && subscriptionData.plan_value ? subscriptionData.plan_value : null,
      current_period_start: subscriptionData.current_period_start,
      current_period_end: subscriptionData.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString()
    };

    console.log(`[SUBSCRIPTION-UPDATED] Prepared user data:`, {
      subscriptionId: subscription.id,
      userId: verifiedUserId,
      planType: subscriptionData.plan_type,
      status: subscription.status
    });

    // Update the user's subscription data
    const { data: updatedData, error: updateError } = await supabase
      .from("poupeja_users")
      .update(userData)
      .eq("id", verifiedUserId)
      .select();

    if (updateError) {
      console.error(`[SUBSCRIPTION-UPDATED] Error updating user subscription:`, updateError);
      throw new Error(`Failed to update user subscription: ${updateError.message}`);
    }

    console.log(`[SUBSCRIPTION-UPDATED] Successfully updated user subscription:`, {
      subscriptionId: subscription.id,
      status: subscription.status,
      planType: subscriptionData.plan_type
    });
  } catch (updateError) {
    console.error("Error updating subscription:", updateError);
    throw updateError;
  }
}