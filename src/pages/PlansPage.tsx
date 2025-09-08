
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionStatusCard from '@/components/subscription/SubscriptionStatusCard';
import PlanCard from '@/components/subscription/PlanCard';
import ManageSubscriptionButton from '@/components/subscription/ManageSubscriptionButton';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { usePlanConfig } from '@/hooks/usePlanConfig';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PlansPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = usePreferences();
  const { toast } = useToast();
  const { hasActiveSubscription } = useSubscription();
  const { config, isLoading: configLoading } = usePlanConfig();

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  // Debug function to check subscription logic
  const debugSubscription = async () => {
    try {
      const { data } = await supabase.functions.invoke('debug-subscription', {
        body: { email: 'fernando.testerenda18@gmail.com' }
      });
      console.log('=== DEBUG SUBSCRIPTION RESULTS ===');
      console.log(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  useEffect(() => {
    if (success === 'true') {
      toast({
        title: "Pagamento realizado com sucesso!",
        description: "Sua assinatura foi ativada. Bem-vindo ao PoupeJá!",
      });
      // Remove the search params from URL
      navigate('/plans', { replace: true });
    } else if (canceled === 'true') {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
      // Remove the search params from URL
      navigate('/plans', { replace: true });
    }
    
    // Execute debug function to understand the plan detection logic
    debugSubscription();
  }, [success, canceled, navigate, toast]);

  // Mostrar carregamento enquanto busca as configurações
  if (configLoading) {
    return (
      <MainLayout title={t('plans.title')}>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando planos...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  const plans = [
    {
      name: t('plans.monthly'),
      price: config?.prices.monthly.displayPrice || 'R$ 29,90',
      period: "/mês",
      priceId: config?.prices.monthly.priceId,
      description: "Para uso pessoal completo",
      features: [
        t('plans.features.unlimited'), 
        t('plans.features.dashboard'), 
        t('plans.features.reports'), 
        t('plans.features.goals'), 
        t('plans.features.schedules'), 
        t('plans.features.support')
      ],
      planType: 'monthly' as const,
    },
    {
      name: t('plans.annual'),
      price: config?.prices.annual.displayPrice || 'R$ 177,00',
      period: "/ano",
      priceId: config?.prices.annual.priceId,
      originalPrice: config?.prices.annual.displayOriginalPrice || 'R$ 238,80',
      savings: config?.prices.annual.displaySavings || 'Economize 25%',
      description: "Melhor custo-benefício",
      features: [
        t('plans.features.unlimited'), 
        t('plans.features.dashboard'), 
        t('plans.features.reports'), 
        t('plans.features.goals'), 
        t('plans.features.schedules'), 
        t('plans.features.vipSupport'), 
        t('plans.features.backup'), 
        t('plans.features.analytics')
      ],
      popular: true,
      planType: 'annual' as const,
    }
  ];

  return (
    <MainLayout title={t('plans.title')}>
      <div className="max-w-6xl mx-auto">
        {/* Subscription Status Card */}
        <SubscriptionStatusCard />

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">{t('plans.title')}</h1>
          <p className="text-muted-foreground">{t('plans.subtitle')}</p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {plans.map((plan) => (
            <PlanCard
              key={plan.planType}
              name={plan.name}
              price={plan.price}
              period={plan.period}
              priceId={plan.priceId}
              originalPrice={plan.originalPrice}
              savings={plan.savings}
              description={plan.description}
              features={plan.features}
              popular={plan.popular}
              planType={plan.planType}
            />
          ))}
        </div>

        {/* Manage Subscription Section */}
        {hasActiveSubscription && (
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">{t('plans.manageSubscription')}</h3>
            <p className="text-muted-foreground mb-4">
              Gerencie sua assinatura, altere a forma de pagamento ou cancele quando quiser.
            </p>
            <div className="max-w-sm mx-auto">
              <ManageSubscriptionButton />
            </div>
          </div>
        )}

        {/* Back Button for non-authenticated users */}
        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default PlansPage;
