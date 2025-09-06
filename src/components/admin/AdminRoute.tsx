
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isLoading: authLoading } = useAppContext();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  // Se ainda está carregando autenticação ou role
  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não está logado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se não é admin, mostra página de acesso negado
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Acesso Negado
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Você não tem permissão para acessar esta área. 
                Apenas administradores podem visualizar esta página.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Shield className="h-4 w-4" />
                <span>Área restrita para administradores</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se é admin, renderiza o conteúdo
  return <>{children}</>;
};

export default AdminRoute;
