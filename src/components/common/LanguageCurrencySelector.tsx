
import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePreferences, Currency, Language } from '@/contexts/PreferencesContext';
import { Flag, Globe } from 'lucide-react';

const LanguageCurrencySelector = () => {
  const { currency, setCurrency, language, setLanguage, t } = usePreferences();

  const handleCurrencyChange = (value: string) => {
    setCurrency(value as Currency);
  };
  
  const handleLanguageChange = (value: string) => {
    setLanguage(value as Language);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col space-y-2">
        <label htmlFor="language-select" className="text-sm font-medium">
          {t('settings.language')}
        </label>
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger id="language-select" className="w-[200px]">
            <Globe className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t('settings.language')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="pt">Português</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex flex-col space-y-2">
        <label htmlFor="currency-select" className="text-sm font-medium">
          {t('settings.currency')}
        </label>
        <Select value={currency} onValueChange={handleCurrencyChange}>
          <SelectTrigger id="currency-select" className="w-[200px]">
            <Flag className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t('settings.currency')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="BRL">BRL (R$)</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LanguageCurrencySelector;
