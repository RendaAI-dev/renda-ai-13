export async function handleInvoicePaymentSucceeded(
  event: any,
  stripe: any,
  supabase: any
): Promise<void> {
  console.log("Processing invoice payment succeeded:", event.id);
  
  const invoice = event.data.object;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    console.log("No subscription ID in invoice, skipping");
    return;
  }

  console.log("Payment succeeded for subscription:", subscriptionId);

  // Retrieve the subscription to get the latest status
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  console.log(`Updating subscription ${subscriptionId} to status: ${subscription.status}`);

  // Update user subscription status to reflect successful payment
  const planValue = subscription.plan?.amount ? subscription.plan.amount / 100 : null;
  const planType = subscription.plan?.interval === 'year' ? 'annual' : 'monthly';
  
  const { error } = await supabase
    .from("poupeja_users")
    .update({
      subscription_status: subscription.status, // Should be "active" after successful payment
      current_plan_type: planType,
      plan_value: planValue,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("Error updating user subscription after payment success:", error);
    throw error;
  }

  console.log(`User subscription updated after successful payment: ${subscriptionId}`);

  console.log(`Subscription ${subscriptionId} successfully updated after payment confirmation`);
}