import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getPlanTypeFromPriceId } from '@/utils/subscriptionUtils';
import { getPendingCheckout, clearPendingCheckout, getCheckoutErrorMessage } from '@/utils/checkoutUtils';

export const useCheckoutFlow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const handlePendingCheckout = async () => {
      // Verificar se há checkout pendente na URL
      const checkoutParam = searchParams.get('checkout');
      
      if (checkoutParam === 'pending') {
        const planData = getPendingCheckout();
        
        if (!planData) {
          console.log('Nenhum checkout pendente encontrado ou expirado');
          return;
        }
        
        try {
          // Verificar se o usuário está autenticado
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error || !session) {
            console.log('Usuário não autenticado, aguardando login...');
            return;
          }
          
          console.log('Usuário autenticado, iniciando checkout...');
          
          // Limpar dados salvos
          clearPendingCheckout();
          
          // Converter priceId para planType
          const planType = await getPlanTypeFromPriceId(planData.priceId);
          
          if (!planType) {
            throw new Error("Tipo de plano inválido.");
          }
          
          toast({
            title: "Preparando pagamento...",
            description: "Redirecionando para checkout...",
          });
          
          // Chamar função de checkout
          const { data: functionData, error: functionError } = await supabase.functions.invoke('create-checkout-session', {
            body: { 
              planType,
              successUrl: `${window.location.origin}/payment-success?email=${encodeURIComponent(session.user.email || '')}`,
              cancelUrl: `${window.location.origin}/plans`
            }
          });
          
          if (functionError) {
            console.error('Erro na função de checkout:', functionError);
            throw new Error(`Erro no checkout: ${functionError.message}`);
          }

          if (functionData && functionData.url) {
            console.log('Redirecionando para checkout:', functionData.url);
            
            // Redirecionar para o checkout
            setTimeout(() => {
              window.location.href = functionData.url;
            }, 1000);
          } else {
            throw new Error('Não foi possível obter a URL de checkout.');
          }
          
        } catch (error: any) {
          console.error('Erro no checkout automático:', error);
          
          clearPendingCheckout();
          
          const errorMessage = getCheckoutErrorMessage(error);
          
          toast({
            title: "Erro no checkout",
            description: errorMessage,
            variant: "destructive",
          });
          
          // Redirecionar para plans após erro
          setTimeout(() => {
            navigate('/plans');
          }, 2000);
        }
      }
    };

    handlePendingCheckout();
  }, [searchParams, navigate, toast]);

  return null;
};