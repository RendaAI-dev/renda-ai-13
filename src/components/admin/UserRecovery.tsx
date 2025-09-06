
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, UserCheck, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface RecoveryResult {
  recovered_count: number;
}

const UserRecovery: React.FC = () => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastRecovery, setLastRecovery] = useState<RecoveryResult | null>(null);
  const [lastRecoveryTime, setLastRecoveryTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const runUserRecovery = async () => {
    setIsRecovering(true);
    try {
      // Call the function directly using rpc with any type since it's not in the generated types yet
      const { data, error } = await (supabase as any).rpc('recover_missing_users');
      
      if (error) {
        toast({
          title: "Erro na recuperação",
          description: `Erro: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Handle the response data safely
      const recoveredCount = Array.isArray(data) && data.length > 0 ? data[0] : 0;
      const recoveryResult = { recovered_count: recoveredCount };
      setLastRecovery(recoveryResult);
      setLastRecoveryTime(new Date());
      
      toast({
        title: "Recuperação de usuários concluída",
        description: `${recoveryResult.recovered_count} usuários recuperados`,
      });
    } catch (error) {
      console.error('Recovery error:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro ao executar recuperação de usuários",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Recuperação de Usuários
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="font-medium text-orange-900 mb-2">O que faz esta função:</h4>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Identifica usuários no auth.users que não existem em poupeja_users</li>
            <li>• Cria automaticamente os registros faltantes</li>
            <li>• Útil quando o trigger de criação automática falha</li>
            <li>• Corrige problemas de sincronização entre as tabelas</li>
          </ul>
        </div>

        {lastRecovery && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Última Recuperação</h4>
              <Badge variant="outline">
                {lastRecoveryTime?.toLocaleString()}
              </Badge>
            </div>
            <div className="text-center">
              <div className="bg-green-50 p-3 rounded">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-bold text-green-600">
                    {lastRecovery.recovered_count}
                  </span>
                </div>
                <div className="text-xs text-green-700">Usuários Recuperados</div>
              </div>
            </div>
          </div>
        )}

        <Button 
          onClick={runUserRecovery}
          disabled={isRecovering}
          className="w-full"
          size="lg"
        >
          {isRecovering ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Recuperando usuários...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Executar Recuperação de Usuários
            </>
          )}
        </Button>

        <div className="text-sm text-muted-foreground">
          <p>Execute esta função se suspeitar que alguns usuários registrados não aparecem na plataforma.</p>
          <p className="mt-1">⚠️ Esta função é segura e pode ser executada a qualquer momento.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserRecovery;
