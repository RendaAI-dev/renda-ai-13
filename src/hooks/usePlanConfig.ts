
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlanConfig {
  prices: {
    monthly: {
      priceId: string;
      price: string;
      displayPrice: string;
    };
    annual: {
      priceId: string;
      price: string;
      originalPrice: string;
      savings: string;
      displayPrice: string;
      displayOriginalPrice: string;
      displaySavings: string;
    };
  };
  contact: {
    phone: string;
  };
}

export const usePlanConfig = () => {
  const [config, setConfig] = useState<PlanConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        
        // Buscar price IDs do Stripe (dados sensíveis)
        const { data: priceData, error: priceError } = await supabase.functions.invoke('get-stripe-prices');
        if (priceError || !priceData?.success) {
          throw new Error(priceError?.message || priceData?.error || 'Failed to fetch price IDs');
        }
        
        // Buscar configurações públicas (preços de exibição, contato, etc.)
        const { data: publicData, error: publicError } = await supabase.functions.invoke('get-public-settings');
        if (publicError) throw publicError;
        
        // Processar configurações retornadas pela função get-public-settings
        if (publicData?.success && publicData?.settings) {
          const pricingSettings = publicData.settings.pricing || {};
          const contactSettings = publicData.settings.contact || {};
          
          // Extrair valores das configurações
          const settings: any = {};
          Object.keys(pricingSettings).forEach(key => {
            settings[key] = pricingSettings[key].value;
          });
          Object.keys(contactSettings).forEach(key => {
            settings[key] = contactSettings[key].value;
          });
          
          // Calcular valores derivados
          const monthlyPrice = settings.plan_price_monthly || '';
          const annualPrice = settings.plan_price_annual || '';
          const monthlyValue = parseFloat(monthlyPrice.toString().replace(',', '.'));
          const annualValue = parseFloat(annualPrice.toString().replace(',', '.'));
          
          let monthlyEquivalent = '';
          let discountPercentage = '';
          
          if (monthlyValue && annualValue) {
            const yearlyEquivalent = monthlyValue * 12;
            monthlyEquivalent = (yearlyEquivalent).toFixed(2).replace('.', ',');
            const discount = ((yearlyEquivalent - annualValue) / yearlyEquivalent) * 100;
            discountPercentage = discount.toFixed(0);
          }
          
          const planConfig: PlanConfig = {
            prices: {
              monthly: {
                priceId: priceData.prices.monthly || '',
                price: monthlyPrice,
                displayPrice: monthlyPrice ? `R$ ${monthlyPrice}` : 'R$ -',
              },
              annual: {
                priceId: priceData.prices.annual || '',
                price: annualPrice,
                originalPrice: monthlyEquivalent,
                savings: discountPercentage,
                displayPrice: annualPrice ? `R$ ${annualPrice}` : 'R$ -',
                displayOriginalPrice: monthlyEquivalent ? `R$ ${monthlyEquivalent}` : 'R$ -',
                displaySavings: discountPercentage ? `Economize ${discountPercentage}%` : 'Economize -%',
              }
            },
            contact: {
              phone: settings.contact_phone || ''
            }
          };
          
          setConfig(planConfig);
        } else {
          throw new Error('Invalid response format');
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading plan config:', err);
        setError(err instanceof Error ? err.message : 'Failed to load configuration');
        
        // Definir valores vazios em vez de usar variáveis de ambiente
        setConfig({
          prices: {
            monthly: {
              priceId: '',
              price: '',
              displayPrice: 'R$ -',
            },
            annual: {
              priceId: '',
              price: '',
              originalPrice: '',
              savings: '',
              displayPrice: 'R$ -',
              displayOriginalPrice: 'R$ -',
              displaySavings: 'Economize -%',
            }
          },
          contact: {
            phone: ''
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  return { config, isLoading, error };
};
