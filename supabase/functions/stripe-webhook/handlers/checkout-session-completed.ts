import type { SubscriptionData } from "../types.ts";

export async function handleCheckoutSessionCompleted(
  event: any,
  stripe: any,
  supabase: any
): Promise<void> {
  console.log("Processing checkout session completed:", event.id);
  
  const session = event.data.object;
  const authUserId = session.metadata?.user_id;

  if (!authUserId) {
    console.error("No user ID in metadata", { sessionId: session.id });
    throw new Error("No user ID in metadata");
  }
  
  // Get the poupeja_users ID from the auth user ID
  const { data: poupejaUser, error: userError } = await supabase
    .from('poupeja_users')
    .select('id')
    .eq('id', authUserId) // poupeja_users.id = auth.users.id
    .single();
    
  if (userError || !poupejaUser) {
    console.error("Failed to find poupeja user", { authUserId, error: userError });
    throw new Error(`User not found in poupeja_users table: ${userError?.message || 'Unknown error'}`);
  }
  
  const userId = poupejaUser.id;
  console.log("Processing subscription for verified user");

  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  
  // Map the new price IDs to plan types using the edge function config
  const priceId = subscription.items.data[0].price.id;
  const unitAmount = subscription.items.data[0].price.unit_amount; // Valor em centavos
  const planValue = unitAmount ? unitAmount / 100 : null; // Converter para reais
  let planType;
  
  try {
    // Fetch plan configurations from database directly
    const { data: planConfigData } = await supabase
      .from('poupeja_settings')
      .select('value')
      .eq('key', 'plan_config')
      .single();
    
    if (planConfigData?.value) {
      const planConfig = JSON.parse(planConfigData.value);
      if (priceId === planConfig.prices?.monthly?.priceId) {
        planType = "monthly";
      } else if (priceId === planConfig.prices?.annual?.priceId) {
        planType = "annual";
      } else {
        console.warn(`Unknown price ID: ${priceId}. Using interval fallback.`);
        planType = subscription.items.data[0].price.recurring?.interval === 'year' ? "annual" : "monthly";
      }
    } else {
      // Fallback to interval detection
      planType = subscription.items.data[0].price.recurring?.interval === 'year' ? "annual" : "monthly";
    }
  } catch (error) {
    console.error('Error fetching plan config, using interval fallback:', error);
    // Check interval as final fallback
    planType = subscription.items.data[0].price.recurring?.interval === 'year' ? "annual" : "monthly";
  }

  console.log(`Processing subscription for price ID: ${priceId}, plan type: ${planType}`);
  console.log(`Subscription status from Stripe: ${subscription.status}`);

  // Use actual subscription status from Stripe instead of assuming "active"
  const subscriptionStatus = subscription.status; // This could be: incomplete, incomplete_expired, trialing, active, past_due, canceled, or unpaid

  // Before creating the new subscription, ensure any old ones are marked as canceled
  await supabase.from("poupeja_subscriptions").update({
    status: "canceled",
    cancel_at_period_end: true,
    updated_at: new Date().toISOString()
  }).eq("user_id", userId).neq("stripe_subscription_id", session.subscription);

  console.log("Marked any previous subscriptions as canceled for user");

  // Now insert/update the new subscription
  await supabase.from("poupeja_subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
    status: subscriptionStatus, // Use actual status from Stripe
    plan_type: planType,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end
  });

  // Update plan_value in poupeja_users table
  if (planValue) {
    await supabase.from("poupeja_users").update({
      plan_value: planValue
    }).eq("id", userId);
    console.log(`Plan value updated in poupeja_users: ${planValue} for user ${userId}`);
  }

  console.log(`Subscription created/updated with plan ${planType} and status ${subscriptionStatus}`);
}