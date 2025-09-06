
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, EyeOff, Eye } from 'lucide-react';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const { t } = usePreferences();
  const { logoUrl, logoAltText } = useBrandingConfig();
  const navigate = useNavigate();

  // Verificar se o usuário tem um token válido de redefinição de senha
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      
      // Para reset de senha, se chegou aqui com sessão, é válido
      // O Supabase já validou o token durante o redirecionamento
      if (!data.session) {
        toast({
          title: 'Link inválido',
          description: 'O link de redefinição de senha é inválido ou expirou.',
          variant: 'destructive',
        });
        navigate('/forgot-password');
      }
    };

    // Verificar auth state changes para capturar sessions de recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        // Usuário chegou via link de reset, sessão é válida
        console.log('Password recovery session detected');
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('common.error'),
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: t('common.success'),
        description: 'Senha atualizada com sucesso!',
      });
      
      // Redirecionar para o login após alguns segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: t('common.error'),
        description: 'Erro ao atualizar senha. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side with image/branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-lg text-center">
          <img 
            src={logoUrl} 
            alt={logoAltText} 
            className="mx-auto mb-8 h-16"
          />
          <h1 className="text-4xl font-bold text-white mb-4">{t('auth.resetPasswordTitle')}</h1>
          <p className="text-white/80">
            {t('auth.resetPasswordDescription')}
          </p>
        </div>
      </div>
      
      {/* Right side with form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-card">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <img 
              src={logoUrl} 
              alt={logoAltText} 
              className="h-12"
            />
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">Redefinir Senha</h2>
            <p className="text-muted-foreground mt-2">
              Digite sua nova senha abaixo
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Nova Senha
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Confirmar Senha
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full py-5 bg-primary text-white" 
              disabled={isLoading}
            >
              {isLoading ? 'Atualizando...' : 'Atualizar Senha'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
