import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useApp } from './AppContext';

interface AdminOptimizedContextType {
  // Apenas as funcionalidades essenciais para admin
  user: any;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AdminOptimizedContext = createContext<AdminOptimizedContextType | undefined>(undefined);

export const AdminOptimizedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, logout } = useApp();
  
  // Memoizar valores estáveis para evitar re-renders
  const value = useMemo(() => ({
    user,
    isLoading,
    logout,
  }), [user?.id, isLoading, logout]); // Só re-render se o ID do usuário mudar

  return (
    <AdminOptimizedContext.Provider value={value}>
      {children}
    </AdminOptimizedContext.Provider>
  );
};

export const useAdminOptimized = () => {
  const context = useContext(AdminOptimizedContext);
  if (context === undefined) {
    throw new Error('useAdminOptimized must be used within an AdminOptimizedProvider');
  }
  return context;
};