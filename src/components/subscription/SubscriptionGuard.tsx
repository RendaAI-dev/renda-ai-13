
import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, ArrowRight } from 'lucide-react';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature?: string;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ 
  children, 
  feature = "esta funcionalidade" 
}) => {
  const { subscription, isLoading } = useSubscription();
  const navigate = useNavigate();
  const { companyName } = useBrandingConfig();
  
  // Verificar se a assinatura está dentro do período válido
  const isSubscriptionValid = React.useMemo(() => {
    if (!subscription || subscription.status !== 'active') {
      return false;
    }
    
    // Verificar se current_period_end existe e se a data atual está dentro do período
    if (subscription.current_period_end) {
      const currentDate = new Date();
      const periodEndDate = new Date(subscription.current_period_end);
      
      // Se a data atual for maior que a data de fim do período, a assinatura expirou
      if (currentDate > periodEndDate) {
        return false;
      }
    }
    
    return true;
  }, [subscription]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSubscriptionValid) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Assinatura Necessária</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {!subscription || subscription.status !== 'active' 
                ? `Para acessar ${feature}, você precisa de uma assinatura ativa do ${companyName}.`
                : `Sua assinatura expirou. Para continuar acessando ${feature}, você precisa renovar sua assinatura.`
              }
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/plans')}
                className="w-full"
                size="lg"
              >
                Ver Planos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGuard;
