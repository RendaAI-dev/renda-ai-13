
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, RefreshCw } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface PlanCardProps {
  name: string;
  price: string;
  period: string;
  priceId: string;
  originalPrice?: string;
  savings?: string;
  description: string;
  features: string[];
  popular?: boolean;
  planType: 'monthly' | 'annual';
}

const PlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  period,
  priceId,
  originalPrice,
  savings,
  description,
  features,
  popular = false,
  planType
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { subscription, hasActiveSubscription, checkSubscription } = useSubscription();
  const { t } = usePreferences();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Verifica se é o plano atual e se está ativo
  const isCurrentPlan = subscription?.plan_type === planType && hasActiveSubscription;
  
  // Verifica se é o plano atual mas está vencido (expirado)
  const isExpiredCurrentPlan = subscription?.plan_type === planType && !hasActiveSubscription;
  
  // Verifica se pode fazer upgrade (está no plano mensal e visualizando o anual)
  const canUpgrade = subscription?.plan_type === 'monthly' && planType === 'annual' && hasActiveSubscription;
  
  // Verifica se pode fazer downgrade (está no plano anual e visualizando o mensal)
  const canDowngrade = subscription?.plan_type === 'annual' && planType === 'monthly' && hasActiveSubscription;
  
  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      
      // Verificar se o usuário está autenticado
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Erro ao obter sessão:', sessionError);
        toast({
          title: "Erro de autenticação",
          description: "Erro ao verificar sua sessão. Tente fazer login novamente.",
          variant: "destructive",
        });
        return;
      }

      if (!session?.user) {
        toast({
          title: "Login necessário",
          description: "Você precisa estar logado para fazer uma assinatura.",
          variant: "destructive",
        });
        // Redirecionar para página de registro com o priceId
        navigate(`/register?priceId=${priceId}`);
        return;
      }

      // Verificar se o token está válido
      if (!session.access_token) {
        toast({
          title: "Sessão inválida",
          description: "Sua sessão expirou. Faça login novamente.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      console.log('Usuário autenticado com sucesso');
      console.log('Token disponível:', !!session.access_token);

      // Invocar a função com o token explícito
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          planType,
          priceId,
          successUrl: `${window.location.origin}/payment-success?email=${encodeURIComponent(session.user.email)}`,
          cancelUrl: `${window.location.origin}/plans?canceled=true`
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        
        // Verificar se é erro de autenticação
        if (error.message?.includes('Token de autenticação inválido') || 
            error.message?.includes('User not authenticated') ||
            error.message?.includes('invalid claim')) {
          toast({
            title: "Sessão expirada",
            description: "Sua sessão expirou. Redirecionando para login...",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }
        
        toast({
          title: "Erro no checkout",
          description: `Erro: ${error.message}. Verifique se suas chaves do Stripe estão configuradas.`,
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        
        // Redirecionar para Stripe na mesma aba
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

  const getButtonContent = () => {
    if (isCurrentPlan) {
      return (
        <>
          <Check className="mr-2 h-4 w-4" />
          {t('plans.current')}
        </>
      );
    }
    
    if (isExpiredCurrentPlan) {
      return (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Renovar assinatura
        </>
      );
    }
    
    if (canUpgrade) {
      return t('plans.upgradeToAnnual');
    }
    
    if (canDowngrade) {
      return t('plans.downgrade');
    }
    
    return hasActiveSubscription ? t('plans.upgrade') : t('plans.subscribe');
  };

  const getButtonVariant = () => {
    if (isCurrentPlan) return 'outline';
    if (isExpiredCurrentPlan) return 'default';
    if (canUpgrade) return 'default';
    return 'default';
  };

  return (
    <Card className={`relative ${popular ? 'border-primary shadow-xl' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
            Mais Popular
          </div>
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="success" className="shadow-md">
            {t('plans.current')}
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{name}</CardTitle>
        <div className="mt-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl font-bold">{price}</span>
            <span className="text-muted-foreground">{period}</span>
          </div>
          {originalPrice && (
            <div className="mt-2">
              <span className="text-sm text-muted-foreground line-through">{originalPrice}</span>
              <span className="ml-2 text-sm font-medium text-green-600">{savings}</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground mt-2">{description}</p>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-3 mb-8">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <div className="h-2 w-2 bg-primary rounded-full"></div>
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleCheckout}
          disabled={isLoading || (isCurrentPlan && !isExpiredCurrentPlan)}
          variant={getButtonVariant()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            getButtonContent()
          )}
        </Button>

        {canUpgrade && (
          <p className="text-center text-sm text-muted-foreground mt-2">
            {t('plans.saveWithAnnual')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanCard;
