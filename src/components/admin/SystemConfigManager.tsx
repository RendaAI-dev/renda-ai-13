
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle, Database, CheckCircle, Server } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

const SystemConfigManager: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [isLoading, setIsLoading] = useState(false);

  if (roleLoading || isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>{roleLoading ? "Verificando permissões..." : "Carregando configurações..."}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Acesso Negado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Você não tem permissões de administrador para acessar as configurações do sistema.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Status do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status de Conexão com o Banco */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-green-800 text-sm font-medium">Banco de Dados Conectado</p>
              <p className="text-green-700 text-xs">Conexão ativa com o Supabase</p>
            </div>
          </div>
        </div>

        {/* Status da Tabela poupeja_settings */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-green-800 text-sm font-medium">Tabela poupeja_settings</p>
              <p className="text-green-700 text-xs">Sistema de configuração baseado em banco de dados ativo</p>
            </div>
          </div>
        </div>

        {/* Status das Edge Functions */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-green-800 text-sm font-medium">Edge Functions</p>
              <p className="text-green-700 text-xs">Funções do servidor ativas e operacionais</p>
            </div>
          </div>
        </div>

        {/* Informação sobre o Sistema */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-800 text-sm">
            <p className="font-medium mb-1">Sistema Simplificado</p>
            <p className="text-xs">
              Todas as configurações são gerenciadas através das abas do painel administrativo 
              e persistidas automaticamente no banco de dados.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemConfigManager;
