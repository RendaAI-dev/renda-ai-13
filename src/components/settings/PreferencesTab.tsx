
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePreferences } from '@/contexts/PreferencesContext';
import LanguageCurrencySelector from '@/components/common/LanguageCurrencySelector';

const PreferencesTab: React.FC = () => {
  const { t } = usePreferences();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.preferences')}</CardTitle>
        <CardDescription>{t('settings.managePreferences')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LanguageCurrencySelector />
      </CardContent>
    </Card>
  );
};

export default PreferencesTab;
