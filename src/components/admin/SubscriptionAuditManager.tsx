import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, RefreshCw, Users, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useUserRole } from '@/hooks/useUserRole';

interface AuditResult {
  totalCustomers: number;
  usersWithMultipleSubscriptions: Array<{
    userId: string;
    stripeCustomerId: string;
    activeSubscriptions: number;
    subscriptions: Array<{
      id: string;
      status: string;
      planType: string;
      created: string;
    }>;
  }>;
  inconsistencies: Array<{
    userId: string;
    stripeCount: number;
    dbCount: number;
    issue: string;
  }>;
  fixedSubscriptions: number;
  errors: Array<{
    userId: string;
    subscriptionId?: string;
    error: string;
  }>;
}

const SubscriptionAuditManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [lastAuditTime, setLastAuditTime] = useState<string | null>(null);
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();

  const runAudit = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('subscription-audit');
      
      if (error) {
        throw error;
      }
      
      if (data?.success) {
        setAuditResult(data.audit);
        setLastAuditTime(new Date().toLocaleString('pt-BR'));
        toast({
          title: "Auditoria concluída",
          description: `${data.audit.fixedSubscriptions} assinaturas foram corrigidas.`,
        });
      } else {
        throw new Error(data?.error || 'Erro desconhecido na auditoria');
      }
      
    } catch (error: any) {
      console.error('Audit error:', error);
      toast({
        title: "Erro na auditoria",
        description: error.message || 'Falha ao executar auditoria de assinaturas',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Acesso Negado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Apenas administradores podem acessar esta funcionalidade.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Auditoria de Assinaturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Verificar Múltiplas Assinaturas</h3>
                <p className="text-sm text-muted-foreground">
                  Identifica e corrige usuários com mais de uma assinatura ativa no Stripe
                </p>
              </div>
              <Button 
                onClick={runAudit}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Auditando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Executar Auditoria
                  </>
                )}
              </Button>
            </div>

            {lastAuditTime && (
              <div className="text-sm text-muted-foreground">
                Última auditoria: {lastAuditTime}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {auditResult && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Total de Clientes</p>
                  <p className="text-2xl font-bold">{auditResult.totalCustomers}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Múltiplas Assinaturas</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {auditResult.usersWithMultipleSubscriptions.length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Corrigidas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {auditResult.fixedSubscriptions}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Erros</p>
                  <p className="text-2xl font-bold text-red-600">
                    {auditResult.errors.length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {auditResult?.usersWithMultipleSubscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Usuários com Múltiplas Assinaturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditResult.usersWithMultipleSubscriptions.map((user, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Usuário: {user.userId}</span>
                    <Badge variant="destructive">
                      {user.activeSubscriptions} assinaturas ativas
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Customer ID: {user.stripeCustomerId}
                  </div>
                  <div className="mt-2 space-y-1">
                    {user.subscriptions.map((sub, subIndex) => (
                      <div key={subIndex} className="flex items-center justify-between text-sm">
                        <span>{sub.id}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={sub.planType === 'annual' ? 'default' : 'secondary'}>
                            {sub.planType}
                          </Badge>
                          <span className="text-muted-foreground">
                            {new Date(sub.created).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {auditResult?.inconsistencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Inconsistências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditResult.inconsistencies.map((inconsistency, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Usuário: {inconsistency.userId}</span>
                    <Badge variant="outline">
                      Stripe: {inconsistency.stripeCount} | DB: {inconsistency.dbCount}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {inconsistency.issue}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {auditResult?.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Erros Durante Auditoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditResult.errors.map((error, index) => (
                <div key={index} className="border rounded p-3 bg-red-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Usuário: {error.userId}</span>
                    {error.subscriptionId && (
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {error.subscriptionId}
                      </code>
                    )}
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    {error.error}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionAuditManager;