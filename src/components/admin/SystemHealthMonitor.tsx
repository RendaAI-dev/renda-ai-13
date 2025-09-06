import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  lastChecked: Date;
  message: string;
}

const SystemHealthMonitor: React.FC = () => {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const runHealthChecks = async () => {
    setIsChecking(true);
    const checks: HealthCheck[] = [];

    try {
      // Verificar webhook do Stripe
      try {
        const webhookTest = await fetch('/api/test-webhook', { method: 'POST' });
        checks.push({
          service: 'Stripe Webhook',
          status: webhookTest.ok ? 'healthy' : 'error',
          lastChecked: new Date(),
          message: webhookTest.ok ? 'Webhook respondendo corretamente' : 'Webhook não está respondendo'
        });
      } catch {
        checks.push({
          service: 'Stripe Webhook',
          status: 'error',
          lastChecked: new Date(),
          message: 'Não foi possível conectar com o webhook'
        });
      }

      // Verificar função de sincronização
      try {
        const { error } = await supabase.functions.invoke('sync-subscriptions', {
          body: { test: true }
        });
        checks.push({
          service: 'Sync Function',
          status: error ? 'warning' : 'healthy',
          lastChecked: new Date(),
          message: error ? 'Função com problemas' : 'Função de sincronização operacional'
        });
      } catch {
        checks.push({
          service: 'Sync Function',
          status: 'error',
          lastChecked: new Date(),
          message: 'Função de sincronização não encontrada'
        });
      }

      // Verificar banco de dados
      try {
        const { error } = await supabase.from('poupeja_users').select('count').limit(1);
        checks.push({
          service: 'Database',
          status: error ? 'error' : 'healthy',
          lastChecked: new Date(),
          message: error ? 'Erro ao conectar com banco' : 'Banco de dados operacional'
        });
      } catch {
        checks.push({
          service: 'Database',
          status: 'error',
          lastChecked: new Date(),
          message: 'Não foi possível conectar com o banco'
        });
      }

      // Verificar autenticação
      try {
        const { data } = await supabase.auth.getSession();
        checks.push({
          service: 'Authentication',
          status: 'healthy',
          lastChecked: new Date(),
          message: 'Sistema de autenticação operacional'
        });
      } catch {
        checks.push({
          service: 'Authentication',
          status: 'error',
          lastChecked: new Date(),
          message: 'Erro no sistema de autenticação'
        });
      }

      setHealthChecks(checks);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runHealthChecks();
    // Removido o interval automático para evitar refresh desnecessário
    // Usuário pode usar o botão "Verificar Novamente" para atualizar manualmente
  }, []);

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'error' | 'unknown') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'unknown':
        return 'bg-gray-100 text-gray-800';
    }
  };

  const overallStatus = healthChecks.length === 0 ? 'unknown' :
    healthChecks.some(check => check.status === 'error') ? 'error' :
    healthChecks.some(check => check.status === 'warning') ? 'warning' : 'healthy';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitoramento do Sistema
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(overallStatus)}>
              Status Geral: {overallStatus === 'healthy' ? 'Saudável' : overallStatus === 'warning' ? 'Atenção' : 'Crítico'}
            </Badge>
            <Button
              onClick={runHealthChecks}
              disabled={isChecking}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {healthChecks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <div>
                  <h4 className="font-medium">{check.service}</h4>
                  <p className="text-sm text-muted-foreground">{check.message}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className={getStatusColor(check.status)}>
                  {check.status === 'healthy' ? 'OK' : check.status === 'warning' ? 'Atenção' : 'Erro'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {check.lastChecked.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {healthChecks.length === 0 && !isChecking && (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma verificação executada ainda
            </div>
          )}
          
          {isChecking && (
            <div className="text-center text-muted-foreground py-8">
              Executando verificações de saúde...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthMonitor;
