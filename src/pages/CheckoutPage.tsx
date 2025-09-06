
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { usePlanConfig } from '@/hooks/usePlanConfig';

const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { config, isLoading: configLoading } = usePlanConfig();

  const plan = searchParams.get('plan');
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    if (success === 'true') {
      toast({
        title: "Pagamento realizado com sucesso!",
        description: "Sua assinatura foi ativada. Bem-vindo ao PoupeJá!",
      });
      navigate('/dashboard');
    } else if (canceled === 'true') {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [success, canceled, navigate, toast]);
  
  const handleCheckout = async (priceId: string, planType: string) => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para fazer uma assinatura.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          planType,
          priceId, // Passando o priceId diretamente também
          successUrl: `${window.location.origin}/payment-success?email=${encodeURIComponent(user.email || '')}`,
          cancelUrl: `${window.location.origin}/checkout?canceled=true`
        }
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        toast({
          title: "Erro no checkout",
          description: `Erro: ${error.message}. Verifique se suas chaves do Stripe estão configuradas.`,
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        // Redirecionar na mesma aba em vez de abrir uma nova
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Erro no checkout",
        description: "Algo deu errado. Verifique suas configurações do Stripe.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (configLoading || !config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const plans = [
    {
      name: "Mensal",
      price: config.prices.monthly.displayPrice,
      period: "/mês",
      priceId: config.prices.monthly.priceId,
      planType: "monthly",
      description: "Para uso pessoal completo",
      features: ["Movimentos ilimitados", "Dashboard completo", "Todos os relatórios", "Metas ilimitadas", "Agendamentos", "Suporte prioritário"],
    },
    {
      name: "Anual",
      price: config.prices.annual.displayPrice,
      period: "/ano",
      priceId: config.prices.annual.priceId,
      planType: "annual",
      originalPrice: config.prices.annual.displayOriginalPrice,
      savings: config.prices.annual.displaySavings,
      description: "Melhor custo-benefício",
      features: ["Movimentos ilimitados", "Dashboard completo", "Todos os relatórios", "Metas ilimitadas", "Agendamentos", "Suporte VIP", "Backup automático", "Análises avançadas"],
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Escolha seu plano</h1>
          <p className="text-muted-foreground">Selecione o plano que melhor se adapta às suas necessidades</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((planItem) => (
            <Card key={planItem.name} className={`relative ${planItem.popular ? 'border-primary shadow-xl' : ''}`}>
              {planItem.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Mais Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{planItem.name}</CardTitle>
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-bold">{planItem.price}</span>
                    <span className="text-muted-foreground">{planItem.period}</span>
                  </div>
                  {planItem.originalPrice && (
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground line-through">{planItem.originalPrice}</span>
                      <span className="ml-2 text-sm font-medium text-green-600">{planItem.savings}</span>
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground mt-2">{planItem.description}</p>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {planItem.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="h-2 w-2 bg-primary rounded-full"></div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => handleCheckout(planItem.priceId, planItem.planType)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Assinar Agora'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => navigate('/')}>
            Voltar
          </Button>
        </div>

        {/* Debug info - remover em produção */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <p>Plan: {plan}</p>
            <p>Success: {success}</p>
            <p>Canceled: {canceled}</p>
            <p>URL: {window.location.href}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
