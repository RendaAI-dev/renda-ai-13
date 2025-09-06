
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '@/services/authService';
import { useToast } from '@/components/ui/use-toast';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const { t } = usePreferences();
  const { logoUrl, logoAltText, companyName } = useBrandingConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
      toast({
        title: t('common.success'),
        description: 'Email de redefinição de senha enviado. Verifique sua caixa de entrada.',
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: t('common.error'),
        description: 'Erro ao enviar email de redefinição de senha. Tente novamente.',
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
          <h1 className="text-4xl font-bold text-white mb-4">{t('auth.forgotPasswordTitle')}</h1>
          <p className="text-white/80">
            {t('auth.forgotPasswordDescription')}
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
            <h2 className="text-3xl font-bold">{emailSent ? 'Email Enviado' : 'Esqueceu sua senha?'}</h2>
            <p className="text-muted-foreground mt-2">
              {emailSent 
                ? 'Verifique seu email para redefinir sua senha' 
                : 'Digite seu email para receber um link de redefinição de senha'}
            </p>
          </div>
          
          {emailSent ? (
            <div className="text-center">
              <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
                <p>Um email com instruções para redefinir sua senha foi enviado para {email}.</p>
                <p className="mt-2">Verifique sua caixa de entrada e spam.</p>
              </div>
              <div className="flex flex-col gap-4">
                <Button 
                  onClick={() => setEmailSent(false)} 
                  variant="outline"
                >
                  Tentar com outro email
                </Button>
                <Link to="/login" className="text-primary hover:underline text-center">
                  Voltar para o login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    type="email" 
                    placeholder={t('auth.emailPlaceholder')} 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full py-5 bg-primary text-white" 
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar link de redefinição'}
              </Button>
              
              <div className="text-center">
                <Link to="/login" className="text-primary hover:underline">
                  Voltar para o login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
