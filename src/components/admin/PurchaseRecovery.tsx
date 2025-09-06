
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface RecoveryResult {
  success: boolean;
  processedCount: number;
  errorCount: number;
  totalSessions: number;
}

const PurchaseRecovery: React.FC = () => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastRecovery, setLastRecovery] = useState<RecoveryResult | null>(null);
  const [lastRecoveryTime, setLastRecoveryTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const runRecovery = async () => {
    setIsRecovering(true);
    try {
      const { data, error } = await supabase.functions.invoke('recover-purchases');
      
      if (error) {
        toast({
          title: "Erro na recuperação",
          description: `Erro: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      setLastRecovery(data);
      setLastRecoveryTime(new Date());
      
      toast({
        title: "Recuperação concluída",
        description: `${data.processedCount} usuários recuperados de ${data.totalSessions} sessões analisadas`,
      });
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Erro ao executar recuperação de compras",
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
          <Users className="h-5 w-5" />
          Recuperação de Compras
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">O que faz esta função:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Analisa sessões de checkout completadas nas últimas 24 horas</li>
            <li>• Identifica usuários que pagaram mas não foram criados no sistema</li>
            <li>• Cria automaticamente os usuários e suas assinaturas</li>
            <li>• Útil para resolver problemas de webhook</li>
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
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 p-3 rounded">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-bold text-green-600">
                    {lastRecovery.processedCount}
                  </span>
                </div>
                <div className="text-xs text-green-700">Recuperados</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-lg font-bold text-red-600">
                    {lastRecovery.errorCount}
                  </span>
                </div>
                <div className="text-xs text-red-700">Erros</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-lg font-bold text-gray-600">
                    {lastRecovery.totalSessions}
                  </span>
                </div>
                <div className="text-xs text-gray-700">Sessões</div>
              </div>
            </div>
          </div>
        )}

        <Button 
          onClick={runRecovery}
          disabled={isRecovering}
          className="w-full"
          size="lg"
        >
          {isRecovering ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Recuperando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Executar Recuperação de Compras
            </>
          )}
        </Button>

        <div className="text-sm text-muted-foreground">
          <p>Execute esta função se suspeitar que algumas compras não foram processadas corretamente.</p>
          <p className="mt-1">⚠️ Esta função só deve ser executada quando necessário.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseRecovery;
