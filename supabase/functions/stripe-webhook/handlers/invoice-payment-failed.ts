export async function handleInvoicePaymentFailed(
  event: any,
  stripe: any,
  supabase: any
): Promise<void> {
  console.log("Processing invoice payment failed:", event.id);
  
  const invoice = event.data.object;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    console.log("No subscription ID in invoice, skipping");
    return;
  }

  console.log("Payment failed for subscription:", subscriptionId);

  // Retrieve the subscription to get the latest status
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  console.log(`Updating subscription ${subscriptionId} to status: ${subscription.status} after payment failure`);

  // Update subscription status to reflect failed payment
  const { error } = await supabase
    .from("poupeja_subscriptions")
    .update({
      status: subscription.status, // Could be "past_due", "unpaid", etc.
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("Error updating subscription after payment failure:", error);
    throw error;
  }

  // Update plan_value in poupeja_users table (set to null if payment failed)
  try {
    await supabase.from("poupeja_users").update({
      plan_value: null
    }).eq("id", (await supabase.from("poupeja_subscriptions").select("user_id").eq("stripe_subscription_id", subscriptionId).single()).data?.user_id);
    console.log("Plan value cleared due to payment failure");
  } catch (planValueError) {
    console.error("Error clearing plan value:", planValueError);
  }

  console.log(`Subscription ${subscriptionId} updated with failed payment status: ${subscription.status}`);
}