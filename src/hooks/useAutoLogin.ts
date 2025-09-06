
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '@/services/authService';
import { useToast } from '@/components/ui/use-toast';

export const useAutoLogin = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const performAutoLogin = async (email: string) => {
    if (!email || email === 'user@example.com') {
      toast({
        title: "Email não encontrado",
        description: "Não foi possível fazer login automático. Faça login manualmente.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setIsLoggingIn(true);
    
    try {
      toast({
        title: "Conta criada com sucesso!",
        description: "Redirecionando para fazer login...",
      });
      
      // Redirecionar para login manual após pagamento
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            email, 
            message: "Sua conta foi criada! Faça login com sua senha." 
          } 
        });
      }, 2000);
    } catch (error: any) {
      console.error('Erro no redirecionamento:', error);
      toast({
        title: "Redirecionando para login",
        description: "Complete seu login para acessar sua conta.",
      });
      
      setTimeout(() => {
        navigate('/login', { state: { email } });
      }, 2000);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return { performAutoLogin, isLoggingIn };
};
