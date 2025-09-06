
import { useBranding } from '@/contexts/BrandingContext';

export const useBrandingConfig = () => {
  // Sempre usar o BrandingContext, independente do estado de autenticação
  // Isso é essencial para a landing page funcionar corretamente
  const { branding, isLoading, error, refreshBranding, forceRefresh, lastUpdated } = useBranding();
  
  return {
    companyName: branding.companyName,
    logoUrl: branding.logoUrl,
    faviconUrl: branding.faviconUrl,
    logoAltText: branding.logoAltText,
    isLoading,
    error,
    refreshBranding,
    forceRefresh,
    lastUpdated
  };
};
