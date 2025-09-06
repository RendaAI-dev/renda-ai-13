import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import { Save, Loader2, CreditCard, Key, Webhook } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';


const StripeConfigManager: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    stripePriceIdMonthly: '',
    stripePriceIdAnnual: '',
  });

  useEffect(() => {
    const loadStripeConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-admin-settings', {
          body: { category: 'stripe' }
        });
        
        if (error) {
          console.error('Erro ao carregar configurações do Stripe:', error);
          return;
        }
        
        if (data?.success && data?.settings) {
          // A função get-admin-settings retorna settings estruturadas por categoria
          const stripeSettings = data.settings.stripe || {};
          
          setFormData({
            stripeSecretKey: stripeSettings.stripe_secret_key?.value || '',
            stripeWebhookSecret: stripeSettings.stripe_webhook_secret?.value || '',
            stripePriceIdMonthly: stripeSettings.stripe_price_id_monthly?.value || '',
            stripePriceIdAnnual: stripeSettings.stripe_price_id_annual?.value || '',
          });
        }
      } catch (err) {
        console.error('Erro ao carregar configurações do Stripe:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAdmin) {
      loadStripeConfig();
    }
  }, [isAdmin]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      
      const { data, error } = await supabase.functions.invoke('update-admin-settings', {
        body: {
          category: 'stripe',
          updates: {
            stripe_secret_key: formData.stripeSecretKey,
            stripe_webhook_secret: formData.stripeWebhookSecret,
            stripe_price_id_monthly: formData.stripePriceIdMonthly,
            stripe_price_id_annual: formData.stripePriceIdAnnual,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Configurações do Stripe salvas!",
          description: "Todas as configurações do Stripe foram atualizadas.",
        });
      }
    } catch (error: any) {
      console.error('Erro ao salvar configurações do Stripe:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || 'Não foi possível salvar as configurações do Stripe.',
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (roleLoading || isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando configurações do Stripe...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            Acesso Negado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Você não tem permissões para acessar as configurações do Stripe.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Configurações do Stripe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-blue-800 text-sm font-medium mb-2">💳 Configuração do Stripe</p>
                <div className="text-blue-700 text-sm space-y-2">
                  <p>Para processar pagamentos, configure suas chaves do Stripe:</p>
                  <div className="bg-blue-100 p-3 rounded text-xs space-y-1">
                    <p><strong>1. Acesse:</strong> Dashboard do Stripe → Desenvolvedores → Chaves da API</p>
                    <p><strong>2. Secret Key:</strong> Copie a chave secreta (sk_live_ ou sk_test_)</p>
                    <p><strong>3. Webhook Secret:</strong> Configure webhook em Stripe → Desenvolvedores → Webhooks</p>
                    <p><strong>4. Price IDs:</strong> Crie produtos no Stripe e copie os Price IDs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Key className="h-5 w-5" />
              Chaves de API
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
              <Input
                id="stripeSecretKey"
                type="password"
                value={formData.stripeSecretKey}
                onChange={(e) => handleInputChange('stripeSecretKey', e.target.value)}
                placeholder="sk_live_... ou sk_test_..."
                disabled={isUpdating}
              />
              <p className="text-xs text-gray-500">
                Chave secreta do Stripe para processar pagamentos
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stripeWebhookSecret">Stripe Webhook Secret</Label>
              <Input
                id="stripeWebhookSecret"
                type="password"
                value={formData.stripeWebhookSecret}
                onChange={(e) => handleInputChange('stripeWebhookSecret', e.target.value)}
                placeholder="whsec_..."
                disabled={isUpdating}
              />
              <p className="text-xs text-gray-500">
                Secret do webhook para verificar autenticidade dos eventos
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Price IDs dos Produtos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stripePriceIdMonthly">Price ID Plano Mensal</Label>
                <Input
                  id="stripePriceIdMonthly"
                  value={formData.stripePriceIdMonthly}
                  onChange={(e) => handleInputChange('stripePriceIdMonthly', e.target.value)}
                  placeholder="price_..."
                  disabled={isUpdating}
                />
                <p className="text-xs text-gray-500">
                  ID do preço do plano mensal no Stripe
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripePriceIdAnnual">Price ID Plano Anual</Label>
                <Input
                  id="stripePriceIdAnnual"
                  value={formData.stripePriceIdAnnual}
                  onChange={(e) => handleInputChange('stripePriceIdAnnual', e.target.value)}
                  placeholder="price_..."
                  disabled={isUpdating}
                />
                <p className="text-xs text-gray-500">
                  ID do preço do plano anual no Stripe
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              onClick={handleSave}
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">URL do Webhook no Stripe:</h4>
            <code className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm block text-gray-900 dark:text-gray-100 border">
              {SUPABASE_URL}/functions/v1/stripe-webhook
            </code>
            <p className="text-blue-800 mt-2 text-sm">
              Configure esta URL no dashboard do Stripe para receber eventos de pagamento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeConfigManager;
