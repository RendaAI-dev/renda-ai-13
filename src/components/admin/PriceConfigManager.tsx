import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, RefreshCw, Loader2, AlertTriangle, CheckCircle, Shield, UserCheck, Settings } from 'lucide-react';
import { usePlanConfig } from '@/hooks/usePlanConfig';

// ... manter o início do arquivo até a linha ~20

const PriceConfigManager: React.FC = () => {
  const { config, isLoading: configLoading, error } = usePlanConfig();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGrantingAdmin, setIsGrantingAdmin] = useState(false);
  const [formData, setFormData] = useState({
    monthlyPriceId: '',
    annualPriceId: '',
    monthlyPrice: '',
    annualPrice: '',
    annualOriginalPrice: '',
    annualSavings: '',
    contactPhone: ''
  });

  React.useEffect(() => {
    if (config) {
      setFormData({
        monthlyPriceId: config.prices.monthly.priceId || '',
        annualPriceId: config.prices.annual.priceId || '',
        monthlyPrice: config.prices.monthly.price || '',
        annualPrice: config.prices.annual.price || '',
        annualOriginalPrice: config.prices.annual.originalPrice || '',
        annualSavings: config.prices.annual.savings || '',
        contactPhone: config.contact.phone || ''
      });
    }
  }, [config]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGrantAdminAccess = async () => {
    try {
      setIsGrantingAdmin(true);
      
      console.log('PriceConfigManager: Granting admin access...');
      
      const { data, error } = await supabase.functions.invoke('grant-admin-access');

      console.log('PriceConfigManager: Grant admin response:', { data, error });

      if (error) {
        console.error('PriceConfigManager: Error granting admin access:', error);
        throw error;
      }

      if (data?.success) {
        console.log('PriceConfigManager: Admin access granted successfully');
        toast({
          title: "Acesso concedido",
          description: "Você agora tem permissões de administrador",
        });
      } else {
        throw new Error(data?.error || 'Erro desconhecido ao conceder acesso');
      }
      
    } catch (error: any) {
      console.error('PriceConfigManager: Error granting admin access:', error);
      
      toast({
        title: "Erro ao conceder acesso",
        description: error.message || 'Não foi possível conceder acesso de administrador',
        variant: "destructive",
      });
    } finally {
      setIsGrantingAdmin(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setIsUpdating(true);
      
      console.log('PriceConfigManager: Starting save process');
      console.log('PriceConfigManager: Form data:', formData);
      
      const { data, error } = await supabase.functions.invoke('update-plan-config', {
        body: {
          monthlyPriceId: formData.monthlyPriceId,
          annualPriceId: formData.annualPriceId,
          monthlyPrice: formData.monthlyPrice,
          annualPrice: formData.annualPrice,
          annualOriginalPrice: formData.annualOriginalPrice,
          annualSavings: formData.annualSavings,
          contactPhone: formData.contactPhone
        }
      });

      console.log('PriceConfigManager: Function response:', { data, error });

      if (error) {
        console.error('PriceConfigManager: Error from edge function:', error);
        throw error;
      }

      if (data?.success) {
        console.log('PriceConfigManager: Success response:', data);
        
        const isProduction = data.environment === 'production';
        
        toast({
          title: isProduction ? "Configurações salvas!" : "Configurações processadas",
          description: data.message || (isProduction ? "Configurações salvas no Supabase" : "Configurações validadas com sucesso"),
        });

        if (data.updatedSecrets && data.updatedSecrets.length > 0) {
          console.log('PriceConfigManager: Updated secrets:', data.updatedSecrets);
        }

        if (data.note) {
          console.log('PriceConfigManager: Note from server:', data.note);
        }

        if (data.nextSteps && data.nextSteps.length > 0) {
          console.log('PriceConfigManager: Next steps:', data.nextSteps);
        }
      } else {
        console.error('PriceConfigManager: Function returned error:', data);
        throw new Error(data?.error || 'Erro desconhecido');
      }
      
    } catch (error: any) {
      console.error('PriceConfigManager: Error saving config:', error);
      
      let errorMessage = error.message || 'Não foi possível salvar as configurações.';
      
      // Handle specific error cases
      if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        errorMessage = 'Você não tem permissões de administrador. Clique em "Conceder Acesso Admin" primeiro.';
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

  if (configLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando configurações...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Configurações de Preços e Contato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Admin Access Section - manter como está */}
        
        {/* Production Setup Status - manter como está */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plano Mensal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Plano Mensal</h3>
            <div className="space-y-2">
              <Label htmlFor="monthlyPriceId">PLAN_PRICE_MONTHLY (R$)</Label>
              <Input
                id="monthlyPrice"
                value={formData.monthlyPrice}
                onChange={(e) => handleInputChange('monthlyPrice', e.target.value)}
                placeholder="29,90"
                disabled={isUpdating}
              />
              <p className="text-xs text-gray-500">Valor exibido para o plano mensal</p>
            </div>
          </div>

          {/* Plano Anual */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Plano Anual</h3>
            <div className="space-y-2">
              <Label htmlFor="annualPrice">PLAN_PRICE_ANNUAL (R$)</Label>
              <Input
                id="annualPrice"
                value={formData.annualPrice}
                onChange={(e) => handleInputChange('annualPrice', e.target.value)}
                placeholder="177,00"
                disabled={isUpdating}
              />
              <p className="text-xs text-gray-500">Valor exibido para o plano anual</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualOriginalPrice">Preço Original Anual (R$)</Label>
              <Input
                id="annualOriginalPrice"
                value={formData.annualOriginalPrice}
                onChange={(e) => handleInputChange('annualOriginalPrice', e.target.value)}
                placeholder="238,80"
                disabled={isUpdating}
              />
              <p className="text-xs text-gray-500">Valor original antes do desconto (opcional)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualSavings">Desconto Anual (%)</Label>
              <Input
                id="annualSavings"
                value={formData.annualSavings}
                onChange={(e) => handleInputChange('annualSavings', e.target.value)}
                placeholder="25"
                disabled={isUpdating}
              />
              <p className="text-xs text-gray-500">Percentual de desconto exibido (opcional)</p>
            </div>
          </div>
        </div>

        {/* Configurações de Contato */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Configurações de Contato</h3>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">CONTACT_PHONE</Label>
            <Input
              id="contactPhone"
              value={formData.contactPhone}
              onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              placeholder="5511945676825"
              disabled={isUpdating}
            />
            <p className="text-xs text-gray-500">Número de telefone para contato (com código do país)</p>
          </div>
        </div>

        {/* Botões de Ação - manter como está */}
        
        {/* Mensagem de erro - manter como está */}
        
        {/* Setup Instructions - manter como está */}
      </CardContent>
    </Card>
  );
};

export default PriceConfigManager;
