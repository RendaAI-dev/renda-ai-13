
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';

// Interface for the BeforeInstallPromptEvent which isn't in the standard lib
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const InstallPWA = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const { t } = usePreferences();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      // Store the event for later use
      setPromptInstall(e as BeforeInstallPromptEvent);
      setSupportsPWA(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onInstallClick = () => {
    if (!promptInstall) {
      return;
    }
    
    // Show the install prompt
    promptInstall.prompt();
    
    // Wait for the user to respond to the prompt
    promptInstall.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou a instalação do aplicativo');
      } else {
        console.log('Usuário recusou a instalação do aplicativo');
      }
      // Clear the prompt variable, it can't be used twice
      setPromptInstall(null);
      setSupportsPWA(false);
    });
  };

  if (!supportsPWA) {
    return null;
  }

  return (
    <Button
      onClick={onInstallClick}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      {t('pwa.install', 'Instalar App')}
    </Button>
  );
};

export default InstallPWA;
