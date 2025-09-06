import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { brandingPreloader } from '@/utils/brandingPreloader';

interface BrandingData {
  companyName: string;
  logoUrl: string;
  faviconUrl: string;
  logoAltText: string;
}

interface BrandingContextType {
  branding: BrandingData;
  isLoading: boolean;
  error: string | null;
  refreshBranding: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  lastUpdated: number;
}

// Usar branding neutro como fallback
const defaultBranding: BrandingData = {
  companyName: '',
  logoUrl: '',
  faviconUrl: '/favicon.ico',
  logoAltText: ''
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingData>(() => {
    // Tentar carregar do cache imediatamente (síncrono)
    const cached = brandingPreloader.getCachedBranding();
    if (cached) {
      return {
        companyName: cached.companyName,
        logoUrl: cached.logoUrl,
        faviconUrl: cached.faviconUrl,
        logoAltText: cached.logoAltText
      };
    }
    return defaultBranding;
  });
  
  const [isLoading, setIsLoading] = useState(() => {
    // Se temos cache, não precisamos mostrar loading
    return !brandingPreloader.getCachedBranding();
  });
  
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const loadBranding = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (forceRefresh) {
        brandingPreloader.invalidateCache();
      }
      
      const cachedBranding = await brandingPreloader.loadBranding();
      
      if (cachedBranding) {
        const newBranding: BrandingData = {
          companyName: cachedBranding.companyName,
          logoUrl: cachedBranding.logoUrl,
          faviconUrl: cachedBranding.faviconUrl,
          logoAltText: cachedBranding.logoAltText
        };
        
        setBranding(newBranding);
        setLastUpdated(Date.now());
        
        // Atualizar favicon se necessário
        if (newBranding.faviconUrl && newBranding.faviconUrl !== '/favicon.ico') {
          const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (link) {
            link.href = newBranding.faviconUrl + `?v=${Date.now()}`;
          }
        }
        
        // Atualizar título da página
        if (newBranding.companyName) {
          document.title = `${newBranding.companyName} - Controle Financeiro`;
        }
      }
    } catch (err) {
      console.error('Erro ao carregar branding:', err);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBranding = async () => {
    await loadBranding();
  };

  const forceRefresh = async () => {
    brandingPreloader.invalidateCache();
    await loadBranding(true);
  };

  useEffect(() => {
    // Se não temos cache, carregar agora
    if (!brandingPreloader.getCachedBranding()) {
      loadBranding();
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleBrandingUpdate = () => {
      forceRefresh();
    };

    window.addEventListener('brandingUpdated', handleBrandingUpdate);
    
    return () => {
      window.removeEventListener('brandingUpdated', handleBrandingUpdate);
    };
  }, []);

  return (
    <BrandingContext.Provider
      value={{
        branding,
        isLoading,
        error,
        refreshBranding,
        forceRefresh,
        lastUpdated,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};