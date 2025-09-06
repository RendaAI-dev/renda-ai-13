
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PreferencesTab from '@/components/settings/PreferencesTab';
import { usePreferences } from '@/contexts/PreferencesContext';

const SettingsPage = () => {
  const { t } = usePreferences();

  return (
    <MainLayout>
      <div className="w-full px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Configurações</h1>
        
        <PreferencesTab />
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
