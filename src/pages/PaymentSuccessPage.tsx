import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Copy, Eye, EyeOff, ArrowRight, Loader2, AlertTriangle, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/integrations/supabase/client';
import { useContactConfig } from '@/hooks/useContactConfig';
import { useAutoLogin } from '@/hooks/useAutoLogin';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { usePreferences } from '@/contexts/PreferencesContext';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = usePreferences();
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [userExists, setUserExists] = useState(false);
  const [userPlanType, setUserPlanType] = useState<string>('premium');
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [systemStatus, setSystemStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  
  const { config: contactConfig, isLoading: configLoading, formatMessage } = useContactConfig();
  const { performAutoLogin, isLoggingIn } = useAutoLogin();
  const { checkSubscription } = useSubscription();
  
  const sessionId = searchParams.get('session_id');
  const email = searchParams.get('email') || 'user@example.com';
  
  

  const checkSystemStatus = async () => {
    try {
      // Verificar se as funções estão respondendo
      const { error: syncError } = await supabase.functions.invoke('sync-subscriptions', {
        body: { test: true }
      });
      
      if (syncError && !syncError.message.includes('test')) {
        throw new Error('Função de sincronização não está respondendo');
      }
      
      setSystemStatus('ready');
      return true;
    } catch (error) {
      console.error('Erro ao verificar sistema:', error);
      setSystemStatus('error');
      return false;
    }
  };

  const checkUserCreation = async (attempt = 1) => {
    if (!email || email === 'user@example.com') {
      setIsCheckingUser(false);
      return;
    }
  
    try {
      // Chamar a função Edge com email no body
      const { data, error } = await supabase.functions.invoke('check-subscription-status', {
        body: { email: email }
      });
      
      if (error) {
        console.error('Erro ao verificar usuário:', error);
        throw new Error(error.message);
      }
      
      if (data.exists && data.hasActiveSubscription) {
        console.log('Usuário e assinatura encontrados!', data);
        setUserExists(true);
        
        // Capturar tipo de plano da assinatura
        if (data.subscription?.plan_type) {
          setUserPlanType(data.subscription.plan_type);
        }
        
        setIsCheckingUser(false);
        return;
      }
      
      // Se não encontrou o usuário ou assinatura e ainda temos tentativas
      if (attempt < 5) {
        const delay = Math.min(2000 * attempt, 8000); // Max 8 segundos
        setTimeout(() => {
          setCheckAttempts(attempt);
          checkUserCreation(attempt + 1);
        }, delay);
      } else {
        setIsCheckingUser(false);
        console.log('Usuário não foi encontrado após 5 tentativas');
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      if (attempt < 5) {
        setTimeout(() => checkUserCreation(attempt + 1), 5000);
      } else {
        setIsCheckingUser(false);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      // Primeiro verificar se o sistema está funcionando
      const systemOk = await checkSystemStatus();
      
      if (systemOk) {
        // Sincronização mais rápida - sem delays desnecessários
        try {
          const { data, error } = await supabase.functions.invoke('sync-subscriptions', {
            body: { 
              email: email
            }
          });
          
          if (error) {
            console.error("Erro ao sincronizar assinatura específica:", error);
          } else {
            console.log("Assinatura sincronizada com sucesso:", data);
            // Atualizar contexto imediatamente após sincronização
            await checkSubscription();
          }
        } catch (error) {
          console.error("Erro ao sincronizar assinatura:", error);
        }
        
        // Verificação imediata sem delay
        checkUserCreation();
      } else {
        setIsCheckingUser(false);
      }
    };

    init();
  }, [email, sessionId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleSyncSubscriptions = async () => {
    try {
      setIsCheckingUser(true);
      
      const { data, error } = await supabase.functions.invoke('sync-subscriptions');
      
      if (error) {
        toast({
          title: "Erro na sincronização",
          description: "Não foi possível sincronizar as assinaturas. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sincronização concluída",
        description: `${data.createdUsersCount || 0} usuários criados, ${data.syncedCount || 0} assinaturas sincronizadas.`,
      });

      // Verificar novamente se o usuário foi criado e atualizar contexto
      await checkSubscription();
      checkUserCreation();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      setIsCheckingUser(false);
    }
  };

  const renderSystemStatus = () => {
    if (systemStatus === 'error') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h4 className="font-medium">Sistema Temporariamente Indisponível</h4>
          </div>
          <p className="text-sm text-red-700 mb-3">
            O sistema de criação automática de usuários está com problemas. 
            Seu pagamento foi processado com sucesso, mas a conta pode precisar ser criada manualmente.
          </p>
          <Button 
            onClick={() => window.open(`https://wa.me/${contactConfig.contactPhone}?text=Preciso%20de%20ajuda%20com%20minha%20conta%20após%20pagamento`, '_blank')}
            className="w-full"
            variant="outline"
          >
            Entrar em Contato para Suporte
          </Button>
        </div>
      );
    }
    return null;
  };

  const handleWhatsAppActivation = () => {
    if (configLoading) {
      toast({
        title: t('errors.loadingSettings'),
        description: t('errors.waitMoment'),
      });
      return;
    }

    const userEmail = email !== 'user@example.com' ? email : '';
    
    // Usar tipo de plano da assinatura se disponível, senão usar fallback
    const planType = userPlanType || searchParams.get('plan_type') || 'premium';
    
    const message = encodeURIComponent(formatMessage(userEmail, planType));
    
    window.open(`https://wa.me/${contactConfig.contactPhone}?text=${message}`, '_blank');
  };

  const handleAccessApp = () => {
    if (email && email !== 'user@example.com') {
      performAutoLogin(email);
    } else {
      navigate('/login');
    }
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <CardTitle className="text-2xl text-green-700 mb-2">
              Pagamento Confirmado!
            </CardTitle>
            <p className="text-muted-foreground">
              Sua assinatura foi ativada com sucesso.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Próximos passos:</h4>
              <p className="text-sm text-blue-800">
                Agora você pode ativar seu número no WhatsApp ou acessar diretamente sua área do usuário.
              </p>
            </div>

            {/* Status da verificação */}
            {isCheckingUser && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">
                    Verificando ativação da conta... (Tentativa {checkAttempts + 1})
                  </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Aguarde enquanto sincronizamos seu pagamento.
                </p>
              </div>
            )}

            {/* Resultado da verificação */}
            {!isCheckingUser && userExists && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Conta ativada com sucesso!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Sua conta foi criada e sua assinatura está ativa.
                </p>
              </div>
            )}

            {!isCheckingUser && !userExists && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Ativação em processamento</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Seu pagamento foi processado, mas a conta ainda está sendo criada. Use o WhatsApp para ativação rápida.
                </p>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="space-y-3">
              <Button 
                onClick={handleWhatsAppActivation}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
                disabled={configLoading}
              >
                {configLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 w-4 h-4" />
                    Ativar Meu Número via WhatsApp
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleAccessApp}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
                disabled={isLoggingIn || (!userExists && !isCheckingUser)}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Fazendo login...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 w-4 h-4" />
                    {userExists ? 'Acessar o App' : 'Aguardar Ativação'}
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleSyncSubscriptions}
                className="w-full"
                disabled={isCheckingUser}
              >
                <Loader2 className={`mr-2 w-4 h-4 ${isCheckingUser ? 'animate-spin' : ''}`} />
                Tentar Sincronizar Novamente
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleGoToHome}
                className="w-full"
              >
                Voltar ao Início
              </Button>
            </div>

            {/* Informações Adicionais */}
            <div className="text-center text-xs text-muted-foreground pt-4 border-t">
              <p className="mt-1">
                Precisa de ajuda? Entre em contato com nosso suporte.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
