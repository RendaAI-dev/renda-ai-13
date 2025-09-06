export interface CryptoProvider {
  computeHMACSignatureAsync: (payload: string, secret: string) => Promise<string>;
}

export interface WebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

export interface SubscriptionData {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: string;
  plan_type?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
}