
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Subscription {
  id: string;
  status: string;
  plan_type: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  isLoading: boolean;
  checkSubscription: () => Promise<void>;
  hasActiveSubscription: boolean;
  isSubscriptionExpiring: boolean;
  isSubscriptionExpired: boolean; // Nova propriedade para verificar se está expirado
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSubscription = async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('User not authenticated:', userError?.message);
        setSubscription(null);
        return;
      }

      // Usar a nova edge function para verificar assinatura
      const { data, error } = await supabase.functions.invoke('check-subscription-status');

      if (error) {
        console.error('Error checking subscription via edge function:', error);
        // Fallback: tentar busca direta na tabela
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('poupeja_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (fallbackError && fallbackError.code !== 'PGRST116') {
          console.error('Error fetching subscription directly:', fallbackError);
          return;
        }

        setSubscription(fallbackData);
      } else {
        // Usar dados da edge function
        console.log('Subscription check result:', data);
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Verifica se a assinatura está expirada (data atual é posterior à data de expiração)
  const isSubscriptionExpired = subscription?.current_period_end
    ? new Date() > new Date(subscription.current_period_end)
    : false;

  // Modifica a verificação de assinatura ativa para considerar também a data de expiração
  const hasActiveSubscription = subscription?.status === 'active' && !isSubscriptionExpired;
  
  // Verifica se a assinatura está expirando nos próximos 7 dias
  const isSubscriptionExpiring = subscription?.current_period_end 
    ? new Date(subscription.current_period_end) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && 
      new Date(subscription.current_period_end) > new Date()
    : false;

  useEffect(() => {
    checkSubscription();

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          // Verificação imediata após login
          checkSubscription();
        } else if (event === 'SIGNED_OUT') {
          setSubscription(null);
        }
      }
    );

    return () => authListener?.unsubscribe();
  }, []);

  return (
    <SubscriptionContext.Provider value={{ 
      subscription, 
      isLoading, 
      checkSubscription, 
      hasActiveSubscription,
      isSubscriptionExpiring,
      isSubscriptionExpired
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
