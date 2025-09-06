export async function handleSubscriptionDeleted(
  event: any,
  stripe: any,
  supabase: any
): Promise<void> {
  const subscription = event.data.object;
  
  console.log(`[SUBSCRIPTION-DELETED] Processing deletion for subscription: ${subscription.id}`);
  
  // Update subscription status to canceled instead of deleting the record
  const { data, error } = await supabase
    .from("poupeja_subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: true,
      updated_at: new Date().toISOString()
    })
    .eq("stripe_subscription_id", subscription.id)
    .select();

  if (error) {
    console.error(`[SUBSCRIPTION-DELETED] Error updating subscription status:`, error);
    throw new Error(`Failed to update subscription status: ${error.message}`);
  }

  console.log(`[SUBSCRIPTION-DELETED] Subscription marked as canceled: ${subscription.id}`, data);
}