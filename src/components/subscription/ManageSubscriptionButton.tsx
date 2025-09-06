
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';

const ManageSubscriptionButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { hasActiveSubscription } = useSubscription();

  // Só mostra o botão se houver assinatura ativa
  if (!hasActiveSubscription) {
    return null;
  }

  const handleManageSubscription = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        console.error('Error creating customer portal session:', error);
        
        // Mensagem de erro mais específica baseada no tipo de erro
        let errorMessage = "Não foi possível abrir o portal de gerenciamento.";
        
        if (error.message?.includes("No active subscription")) {
          errorMessage = "Assinatura não encontrada. Verifique se sua assinatura está ativa.";
        } else if (error.message?.includes("Payment system not configured")) {
          errorMessage = "Sistema de pagamento temporariamente indisponível. Contate o suporte.";
        } else if (error.message?.includes("Database error")) {
          errorMessage = "Erro de conexão. Tente novamente em alguns instantes.";
        }
        
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Sucesso",
          description: "Portal de gerenciamento aberto em nova aba.",
        });
      }
    } catch (error) {
      console.error('Customer portal error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado. Tente novamente ou contate o suporte.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleManageSubscription}
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Carregando...
        </>
      ) : (
        <>
          <Settings className="mr-2 h-4 w-4" />
          Gerenciar Assinatura
        </>
      )}
    </Button>
  );
};

export default ManageSubscriptionButton;
