// Utilitário para mapear priceId para planType e vice-versa
import { supabase } from '@/integrations/supabase/client';

// Cache para armazenar as configurações de plano
let planConfigCache: any = null;

/**
 * Busca as configurações de plano do Supabase
 */
export async function getPlanConfig() {
  if (planConfigCache) return planConfigCache;
  
  try {
    console.log('[getPlanConfig] Iniciando busca de configurações...');
    
    // Buscar price IDs das configurações do Stripe
    const { data: priceData, error: priceError } = await supabase.functions.invoke('get-stripe-prices');
    console.log('[getPlanConfig] Resposta get-stripe-prices:', { priceData, priceError });
    
    if (priceError || !priceData?.success) {
      throw new Error(priceError?.message || priceData?.error || 'Failed to fetch price IDs');
    }

    // Buscar configurações públicas de pricing
    const { data: adminData, error: adminError } = await supabase.functions.invoke('get-public-settings', {
      body: { category: 'pricing' }
    });
    console.log('[getPlanConfig] Resposta get-public-settings:', { adminData, adminError });
    
    if (adminError) throw adminError;
    
    if (adminData?.success && adminData?.settings?.pricing) {
      console.log('[getPlanConfig] Processando configurações de pricing:', adminData.settings.pricing);
      
      // Extrair valores da estrutura de pricing
      const pricingSettings = adminData.settings.pricing;
      const settings: any = {};
      Object.keys(pricingSettings).forEach(key => {
        settings[key] = pricingSettings[key].value;
        console.log(`[getPlanConfig] Setting ${key}:`, pricingSettings[key].value);
      });
      
      planConfigCache = {
        prices: {
          monthly: {
            priceId: priceData.prices.monthly,
            price: settings.plan_price_monthly || '',
            displayPrice: settings.plan_price_monthly || 'R$ -',
          },
          annual: {
            priceId: priceData.prices.annual,
            price: settings.plan_price_annual || '',
            originalPrice: settings.plan_price_monthly_equivalent || '',
            savings: settings.plan_discount_percentage || '',
            displayPrice: settings.plan_price_annual || 'R$ -',
            displayOriginalPrice: settings.plan_price_monthly_equivalent || 'R$ -',
            displaySavings: `Economize ${settings.plan_discount_percentage || '-'}%`,
          }
        },
        contact: {
          phone: settings.contact_phone || ''
        }
      };
      
      console.log('[getPlanConfig] Config final criada:', planConfigCache);
      return planConfigCache;
    }
    
    console.log('[getPlanConfig] Nenhuma configuração de pricing encontrada');
    return null;
  } catch (err) {
    console.error('Erro ao carregar configurações de plano:', err);
    return null;
  }
}

/**
 * Converte um priceId para o planType correspondente (monthly ou annual)
 */
export async function getPlanTypeFromPriceId(priceId: string): Promise<'monthly' | 'annual' | null> {
  const config = await getPlanConfig();
  
  if (!config) return null;
  
  if (priceId === config.prices.monthly.priceId) return 'monthly';
  if (priceId === config.prices.annual.priceId) return 'annual';
  
  console.error(`PriceId inválido: ${priceId}. Não corresponde a nenhum plano conhecido.`);
  return null;
}

/**
 * Converte um planType para o priceId correspondente
 */
export async function getPriceIdFromPlanType(planType: 'monthly' | 'annual'): Promise<string | null> {
  const config = await getPlanConfig();
  
  if (!config) return null;
  
  if (planType === 'monthly') return config.prices.monthly.priceId;
  if (planType === 'annual') return config.prices.annual.priceId;
  
  console.error(`PlanType inválido: ${planType}. Deve ser 'monthly' ou 'annual'.`);
  return null;
}

/**
 * Versão síncrona para compatibilidade com código existente
 * Usa o cache se disponível, caso contrário retorna null
 */
export function getPlanTypeFromPriceIdSync(priceId: string): 'monthly' | 'annual' | null {
  if (!planConfigCache) return null;
  
  if (priceId === planConfigCache.prices.monthly.priceId) return 'monthly';
  if (priceId === planConfigCache.prices.annual.priceId) return 'annual';
  
  return null;
}

/**
 * Versão síncrona para compatibilidade com código existente
 * Usa o cache se disponível, caso contrário retorna null
 */
export function getPriceIdFromPlanTypeSync(planType: 'monthly' | 'annual'): string | null {
  if (!planConfigCache) return null;
  
  if (planType === 'monthly') return planConfigCache.prices.monthly.priceId;
  if (planType === 'annual') return planConfigCache.prices.annual.priceId;
  
  return null;
}