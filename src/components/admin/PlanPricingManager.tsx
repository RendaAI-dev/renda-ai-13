
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Loader2, DollarSign, Calculator } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

const PlanPricingManager: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    planPriceMonthly: '',
    planPriceAnnual: '',
  });

  const loadPricingConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-admin-settings');
      
      if (error) {
        console.error('Erro ao carregar configurações de preços:', error);
        return;
      }
      
      if (data?.success && data?.settings) {
        const pricingSettings = data.settings.pricing || {};
        setFormData({
          planPriceMonthly: String(pricingSettings.plan_price_monthly?.value || ''),
          planPriceAnnual: String(pricingSettings.plan_price_annual?.value || ''),
        });
      }
    } catch (err) {
      console.error('Erro ao carregar configurações de preços:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadPricingConfig();
    }
  }, [isAdmin]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateDiscount = () => {
    if (!formData.planPriceMonthly || !formData.planPriceAnnual) {
      return '0';
    }
    
    const monthly = parseFloat(String(formData.planPriceMonthly).replace(',', '.'));
    const annual = parseFloat(String(formData.planPriceAnnual).replace(',', '.'));
    
    if (monthly && annual) {
      const yearlyEquivalent = monthly * 12;
      const discount = ((yearlyEquivalent - annual) / yearlyEquivalent) * 100;
      return discount.toFixed(0);
    }
    return '0';
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      
      const { data, error } = await supabase.functions.invoke('update-admin-settings', {
        body: {
          category: 'pricing',
          updates: {
            plan_price_monthly: formData.planPriceMonthly,
            plan_price_annual: formData.planPriceAnnual,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Configurações de preços salvas!",
          description: "Os valores dos planos foram atualizados.",
        });
        
        // Recarregar configurações após salvar
        await loadPricingConfig();
      }
    } catch (error: any) {
      console.error('Erro ao salvar configurações de preços:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || 'Não foi possível salvar as configurações de preços.',
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
            <span>Carregando configurações de preços...</span>
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
            Você não tem permissões para acessar as configurações de preços.
          </p>
        </CardContent>
      </Card>
    );
  }

  const discount = calculateDiscount();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Configurações de Preços dos Planos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-green-800 text-sm font-medium mb-2">💰 Configuração de Preços</p>
              <div className="text-green-700 text-sm space-y-2">
                <p>Configure os valores que serão exibidos aos usuários na página de planos.</p>
                <p><strong>Importante:</strong> Estes valores devem corresponder aos preços configurados no Stripe.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="planPriceMonthly">Valor do Plano Mensal (R$)</Label>
            <Input
              id="planPriceMonthly"
              value={formData.planPriceMonthly}
              onChange={(e) => handleInputChange('planPriceMonthly', e.target.value)}
              placeholder="29,90"
              disabled={isUpdating}
              type="text"
              inputMode="decimal"
            />
            <p className="text-xs text-gray-500">Valor cobrado mensalmente</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="planPriceAnnual">Valor do Plano Anual (R$)</Label>
            <Input
              id="planPriceAnnual"
              value={formData.planPriceAnnual}
              onChange={(e) => handleInputChange('planPriceAnnual', e.target.value)}
              placeholder="177,00"
              disabled={isUpdating}
              type="text"
              inputMode="decimal"
            />
            <p className="text-xs text-gray-500">Valor cobrado anualmente</p>
          </div>
        </div>

        {formData.planPriceMonthly && formData.planPriceAnnual && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-800">Cálculo de Desconto</h4>
            </div>
            <div className="text-blue-700 text-sm space-y-1">
              <p>Valor mensal × 12: R$ {(parseFloat(String(formData.planPriceMonthly).replace(',', '.')) * 12).toFixed(2).replace('.', ',')}</p>
              <p>Valor anual: R$ {formData.planPriceAnnual}</p>
              <p className="font-medium">Desconto anual: {discount}%</p>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-amber-800 text-sm">
            <strong>Lembre-se:</strong> Após alterar os preços aqui, você também deve:
          </p>
          <ul className="text-amber-700 text-sm mt-2 space-y-1 list-disc list-inside">
            <li>Atualizar os preços no Dashboard do Stripe</li>
            <li>Verificar se os Price IDs na seção Stripe estão corretos</li>
            <li>Testar o fluxo de pagamento</li>
          </ul>
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
  );
};

export default PlanPricingManager;
