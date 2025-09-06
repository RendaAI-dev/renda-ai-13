
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, Eye, EyeOff, Save, Loader2, AlertTriangle, CheckCircle, RefreshCw, Settings } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

// ... manter o início do arquivo até a linha ~20

const SecretKeyManager: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [secretKeys, setSecretKeys] = useState({
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    stripePriceIdMonthly: '',
    stripePriceIdAnnual: ''
  });

  // Carregar as chaves da Stripe do Supabase quando o componente é montado
  useEffect(() => {
    if (isAdmin) {
      loadSecrets();
    }
  }, [isAdmin]);

  // Função para carregar as chaves da Stripe do Supabase
  const loadSecrets = async () => {
    try {
      setIsLoading(true);
      // console.log('SecretKeyManager: Loading secrets from Supabase'); // Remover log
      
      const { data, error } = await supabase.functions.invoke('get-admin-settings');
      
      if (error) {
        console.error('SecretKeyManager: Error loading secrets:', error);
        throw error;
      }
      
      if (data?.success && data?.data) {
        // console.log('SecretKeyManager: Secrets loaded successfully'); // Remover log
        
        // Atualizar o estado com as chaves carregadas
        setSecretKeys({
          stripeSecretKey: data.data.STRIPE_SECRET_KEY || '',
          stripeWebhookSecret: data.data.STRIPE_WEBHOOK_SECRET || '',
          stripePriceIdMonthly: data.data.STRIPE_PRICE_ID_MONTHLY || '',
          stripePriceIdAnnual: data.data.STRIPE_PRICE_ID_ANNUAL || ''
        });
      }
    } catch (error: any) {
      console.error('SecretKeyManager: Error loading secrets:', error);
      
      let errorMessage = error.message || 'Não foi possível carregar as chaves.';
      
      // Handle specific error cases
      if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        errorMessage = 'Você não tem permissões de administrador para esta ação.';
      } else if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }
      
      toast({
        title: "Erro ao carregar chaves",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowSecret = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setSecretKeys(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateSecrets = () => {
    const errors = [];
    
    if (secretKeys.stripeSecretKey && !secretKeys.stripeSecretKey.startsWith('sk_')) {
      errors.push('Stripe Secret Key deve começar com "sk_"');
    }
    
    if (secretKeys.stripeWebhookSecret && !secretKeys.stripeWebhookSecret.startsWith('whsec_')) {
      errors.push('Stripe Webhook Secret deve começar com "whsec_"');
    }
    
    if (secretKeys.stripePriceIdMonthly && !secretKeys.stripePriceIdMonthly.startsWith('price_')) {
      errors.push('Stripe Price ID Mensal deve começar com "price_"');
    }
    
    if (secretKeys.stripePriceIdAnnual && !secretKeys.stripePriceIdAnnual.startsWith('price_')) {
      errors.push('Stripe Price ID Anual deve começar com "price_"');
    }
    
    if (!secretKeys.stripeSecretKey && !secretKeys.stripeWebhookSecret && 
        !secretKeys.stripePriceIdMonthly && !secretKeys.stripePriceIdAnnual) {
      errors.push('Pelo menos uma chave deve ser fornecida');
    }
    
    return errors;
  };

  const handleSaveSecrets = async () => {
    try {
      setIsUpdating(true);
      
      // console.log('SecretKeyManager: Starting save process'); // Remover log
      
      // Validate secrets before sending
      const validationErrors = validateSecrets();
      if (validationErrors.length > 0) {
        // console.log('SecretKeyManager: Validation errors:', validationErrors); // Remover log
        toast({
          title: "Erro de validação",
          description: validationErrors.join(', '),
          variant: "destructive",
        });
        return;
      }

      // console.log('SecretKeyManager: Attempting to save secrets'); // Remover log
      
      const { data, error } = await supabase.functions.invoke('update-secrets', {
        body: {
          secrets: secretKeys
        }
      });

      // console.log('SecretKeyManager: Function response:', { data, error }); // Remover log

      if (error) {
        console.error('SecretKeyManager: Error from edge function:', error);
        throw error;
      }

      if (data?.success) {
        // console.log('SecretKeyManager: Success response:', data); // Remover log
        
        const isProduction = data.environment === 'production';
        
        toast({
          title: isProduction ? "Chaves secretas salvas!" : "Chaves secretas processadas",
          description: data.message || (isProduction ? "Chaves salvas no Supabase" : "Chaves validadas com sucesso"),
        });
        
        // Recarregar as chaves em vez de limpar o formulário
        if (isProduction) {
          loadSecrets();
        }
      } else {
        console.error('SecretKeyManager: Function returned error:', data);
        throw new Error(data?.error || 'Erro desconhecido');
      }
      
    } catch (error: any) {
      console.error('SecretKeyManager: Error saving secrets:', error);
      
      let errorMessage = error.message || 'Não foi possível salvar as chaves.';
      
      // Handle specific error cases
      if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        errorMessage = 'Você não tem permissões de administrador para esta ação.';
      } else if (error.message?.includes('começar com')) {
        errorMessage = error.message;
      } else if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }
      
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      // console.log('SecretKeyManager: Testing connection...'); // Remover log
      const session = await supabase.auth.getSession();
      // console.log('SecretKeyManager: Current session:', session); // Remover log
      
      toast({
        title: "Teste de Conexão",
        description: session.data.session ? "Conectado com sucesso" : "Não autenticado",
      });
    } catch (error) {
      console.error('SecretKeyManager: Connection test failed:', error);
      toast({
        title: "Teste de Conexão",
        description: "Erro na conexão",
        variant: "destructive",
      });
    }
  };

  // Show loading while checking user role or loading secrets
  if (roleLoading || isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>{roleLoading ? "Verificando permissões..." : "Carregando configurações..."}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Acesso Negado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Você não tem permissões de administrador para acessar o gerenciamento de chaves secretas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Gerenciamento de Chaves do Stripe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Setup Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-blue-800 text-sm font-medium mb-2">📋 Configuração das Chaves do Stripe</p>
              <div className="text-blue-700 text-sm">
                <p>Configure as chaves do Stripe para habilitar o processamento de pagamentos.</p>
                <p className="mt-2">Todas as chaves serão armazenadas de forma segura no Supabase.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Stripe Secret Key */}
          <div className="space-y-2">
            <Label htmlFor="stripeSecretKey">STRIPE_SECRET_KEY</Label>
            <div className="relative">
              <Input
                id="stripeSecretKey"
                type={showSecrets.stripeSecretKey ? 'text' : 'password'}
                value={secretKeys.stripeSecretKey}
                onChange={(e) => handleInputChange('stripeSecretKey', e.target.value)}
                placeholder="sk_test_... ou sk_live_..."
                className="pr-10"
                disabled={isUpdating}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2"
                onClick={() => toggleShowSecret('stripeSecretKey')}
                disabled={isUpdating}
              >
                {showSecrets.stripeSecretKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">Chave secreta da API do Stripe</p>
          </div>

          {/* Stripe Webhook Secret */}
          <div className="space-y-2">
            <Label htmlFor="stripeWebhookSecret">STRIPE_WEBHOOK_SECRET</Label>
            <div className="relative">
              <Input
                id="stripeWebhookSecret"
                type={showSecrets.stripeWebhookSecret ? 'text' : 'password'}
                value={secretKeys.stripeWebhookSecret}
                onChange={(e) => handleInputChange('stripeWebhookSecret', e.target.value)}
                placeholder="whsec_..."
                className="pr-10"
                disabled={isUpdating}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2"
                onClick={() => toggleShowSecret('stripeWebhookSecret')}
                disabled={isUpdating}
              >
                {showSecrets.stripeWebhookSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">Chave secreta para validar webhooks do Stripe</p>
          </div>

          {/* Stripe Price IDs */}
          <div className="space-y-2">
            <Label htmlFor="stripePriceIdMonthly">STRIPE_PRICE_ID_MONTHLY</Label>
            <div className="relative">
              <Input
                id="stripePriceIdMonthly"
                type={showSecrets.stripePriceIdMonthly ? 'text' : 'password'}
                value={secretKeys.stripePriceIdMonthly}
                onChange={(e) => handleInputChange('stripePriceIdMonthly', e.target.value)}
                placeholder="price_..."
                className="pr-10"
                disabled={isUpdating}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2"
                onClick={() => toggleShowSecret('stripePriceIdMonthly')}
                disabled={isUpdating}
              >
                {showSecrets.stripePriceIdMonthly ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">ID do preço mensal no Stripe</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripePriceIdAnnual">STRIPE_PRICE_ID_ANNUAL</Label>
            <div className="relative">
              <Input
                id="stripePriceIdAnnual"
                type={showSecrets.stripePriceIdAnnual ? 'text' : 'password'}
                value={secretKeys.stripePriceIdAnnual}
                onChange={(e) => handleInputChange('stripePriceIdAnnual', e.target.value)}
                placeholder="price_..."
                className="pr-10"
                disabled={isUpdating}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2"
                onClick={() => toggleShowSecret('stripePriceIdAnnual')}
                disabled={isUpdating}
              >
                {showSecrets.stripePriceIdAnnual ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">ID do preço anual no Stripe</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button 
            onClick={handleSaveSecrets}
            disabled={isUpdating}
            className="flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Chaves Secretas
              </>
            )}
          </Button>
        </div>

        {/* Help Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-800 text-sm mb-2">
            <strong>💡 Onde encontrar suas chaves do Stripe:</strong>
          </p>
          <ul className="text-gray-600 text-sm space-y-1">
            <li>
              • <strong>Secret Key:</strong>{' '}
              <a 
                href="https://dashboard.stripe.com/apikeys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Dashboard Stripe → API Keys
              </a>
            </li>
            <li>
              • <strong>Webhook Secret:</strong>{' '}
              <a 
                href="https://dashboard.stripe.com/webhooks" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Dashboard Stripe → Webhooks → Endpoint → Signing Secret
              </a>
            </li>
            <li>
              • <strong>Price IDs:</strong>{' '}
              <a 
                href="https://dashboard.stripe.com/products" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Dashboard Stripe → Products → Selecione o produto → Price ID
              </a>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecretKeyManager;
