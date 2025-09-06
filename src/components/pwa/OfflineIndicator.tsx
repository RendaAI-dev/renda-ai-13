
import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { usePreferences } from '@/contexts/PreferencesContext';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { t } = usePreferences();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: t('offline.backOnline', 'Você está online novamente'),
        description: t('offline.allAvailable', 'Todas as funcionalidades estão disponíveis'),
        variant: "default",
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: t('offline.offline', 'Você está offline'),
        description: t('offline.limitedAccess', 'Acesso limitado disponível'),
        variant: "destructive",
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Only show the offline banner when the user is offline
  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 left-0 right-0 mx-auto w-11/12 max-w-md bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-md shadow-md z-50 flex items-center gap-2">
      <WifiOff className="h-5 w-5" />
      <span>{t('offline.limitedAccess', 'Acesso limitado disponível')}</span>
    </div>
  );
};

export default OfflineIndicator;
