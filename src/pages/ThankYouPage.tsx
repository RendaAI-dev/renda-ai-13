import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';

const ThankYouPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <CardTitle className="text-2xl text-green-700 mb-2">
              Obrigado por Ativar sua Conta!
            </CardTitle>
            <p className="text-muted-foreground">
              Sua solicitação de ativação foi recebida com sucesso.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Próximos passos:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Nossa equipe irá ativar sua conta em até 24 horas</li>
                <li>2. Você receberá um email de confirmação</li>
                <li>3. Faça login com o email e senha fornecidos</li>
                <li>4. Aproveite todos os recursos premium!</li>
              </ol>
            </div>

            <div className="space-y-3">
              <Button 
                asChild
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Link to="/login">
                  Ir para Login
                  <ArrowRight className="ml-2 w-4 w-4" />
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                asChild
                className="w-full"
              >
                <Link to="/">Voltar ao Início</Link>
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-4 border-t">
              <p>
                Precisa de ajuda? Entre em contato com nosso suporte.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThankYouPage; 