
import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';

interface SupabaseInitializerProps {
  children: React.ReactNode;
}

export const SupabaseInitializer: React.FC<SupabaseInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showConfigWarning, setShowConfigWarning] = useState(false);

  useEffect(() => {
    const initialize = () => {
      const configured = isSupabaseConfigured();
      
      if (!configured) {
        console.log('Supabase não configurado, executando em modo demonstração');
        setShowConfigWarning(true);
      }
      
      setIsInitialized(true);
    };

    initialize();
  }, []);

  // Mostrar indicador de carregamento
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showConfigWarning && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                Sistema executando em modo demonstração. Para usar todas as funcionalidades, configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
              </p>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
};

