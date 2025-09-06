
import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileWarning } from "lucide-react";
import { usePreferences } from '@/contexts/PreferencesContext';

const NotFound = () => {
  const location = useLocation();
  const [showError, setShowError] = useState(false);
  const { t } = usePreferences();
  
  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Apenas mostrar a mensagem de erro após um delay
    // para evitar o flash durante navegação/carregamento normal
    const timer = setTimeout(() => {
      setShowError(true);
    }, 1500); // 1.5 segundos de delay
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Se estamos no período inicial de carregamento, mostrar tela em branco
  if (!showError) {
    return (
      <div className="min-h-screen bg-background">
        {/* Tela em branco - sem conteúdo visível */}
      </div>
    );
  }

  // Após o delay, se ainda estivermos na página 404, mostrar a mensagem de erro
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <FileWarning className="h-12 w-12 text-red-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">{t('errors.pageNotFound')}</h1>
        <p className="text-lg text-muted-foreground mb-6">
          {t('errors.pageNotFoundDescription')}
        </p>
        <Button asChild className="mx-auto" size="lg">
          <Link to="/">{t('errors.returnToDashboard')}</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
