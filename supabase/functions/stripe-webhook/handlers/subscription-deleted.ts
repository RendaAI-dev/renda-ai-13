export async function handleSubscriptionDeleted(
  event: any,
  stripe: any,
  supabase: any
): Promise<void> {
  const subscription = event.data.object;
  
  console.log(`[SUBSCRIPTION-DELETED] Processing deletion for subscription: ${subscription.id}`);
  
  // Update user subscription status to canceled
  const { data, error } = await supabase
    .from("poupeja_users")
    .update({
      subscription_status: "canceled",
      current_plan_type: "free",
      plan_value: null,
      cancel_at_period_end: true,
      updated_at: new Date().toISOString()
    })
    .eq("stripe_subscription_id", subscription.id)
    .select();

  if (error) {
    console.error(`[SUBSCRIPTION-DELETED] Error updating user subscription status:`, error);
    throw new Error(`Failed to update user subscription status: ${error.message}`);
  }

  if (data && data.length > 0) {
    console.log(`[SUBSCRIPTION-DELETED] Subscription canceled for user: ${data[0].id}`);
  }

  console.log(`[SUBSCRIPTION-DELETED] Subscription marked as canceled: ${subscription.id}`, data);
}