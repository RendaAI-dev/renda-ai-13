import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlanPricing {
  monthlyPrice: string;
  annualPrice: string;
  originalAnnualPrice: string; // Preço anual sem desconto (12 * mensal)
  discountPercentage: string; // Porcentagem de desconto
  isLoading: boolean;
  error: string | null;
}

export const usePlanPricing = (): PlanPricing => {
  const [pricing, setPricing] = useState<PlanPricing>({
    monthlyPrice: '',
    annualPrice: '',
    originalAnnualPrice: '',
    discountPercentage: '',
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-public-settings');

        if (error) throw error;

        if (data?.success && data?.settings?.pricing) {
          const monthlyPrice = data.settings.pricing.plan_price_monthly?.value || '';
          const annualPrice = data.settings.pricing.plan_price_annual?.value || '';
          
          // Converter strings para números, tratando formatação brasileira
          const monthlyValue = parseFloat(monthlyPrice.replace(',', '.'));
          const annualValue = parseFloat(annualPrice.replace(',', '.'));
          
          // Calcular preço anual original (12 * mensal)
          const originalAnnualValue = monthlyValue * 12;
          
          // Calcular porcentagem de desconto
          let discountPercentage = '0';
          if (monthlyValue > 0 && annualValue > 0) {
            const discount = ((originalAnnualValue - annualValue) / originalAnnualValue) * 100;
            discountPercentage = discount.toFixed(2);
          }
          
          setPricing({
            monthlyPrice,
            annualPrice,
            originalAnnualPrice: originalAnnualValue.toFixed(2).replace('.', ','),
            discountPercentage,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Erro ao carregar preços dos planos:', error);
        setPricing(prev => ({
          ...prev,
          isLoading: false,
          error: 'Não foi possível carregar os preços dos planos.'
        }));
      }
    };

    fetchPricing();
  }, []);

  return pricing;
};