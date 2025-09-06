
import { usePreferences } from '@/contexts/PreferencesContext';

/**
 * Custom hook para acessar as traduções baseado na preferência de idioma atual
 * 
 * @returns {Object} Objeto com a função t para traduzir texto
 */
export const useTranslations = () => {
  const { t } = usePreferences();

  return { t };
};
