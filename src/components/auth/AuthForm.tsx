
import React, { useState } from 'react';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

interface AuthFormProps {
  onSubmit: (email: string, password: string, name?: string, phone?: string) => void;
  isLogin: boolean;
  isLoading?: boolean;
  submitText?: string;
  showResetPassword?: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ 
  onSubmit, 
  isLogin, 
  isLoading = false, 
  submitText, 
  showResetPassword = false 
}) => {
  const { t } = usePreferences();
  const [showPassword, setShowPassword] = useState(false);
  
  // Form schema validation using zod
  const loginSchema = z.object({
    email: z.string().email(t('auth.emailValid')),
    password: z.string().min(6, t('auth.passwordLength')),
  });

  const registerSchema = z.object({
    name: z.string().min(2, t('auth.nameRequired')),
    phone: z.string().optional(),
    email: z.string().email(t('auth.emailValid')),
    password: z.string().min(6, t('auth.passwordLength')),
  });
  
  // Initialize form with react-hook-form and zod validation
  const form = useForm<any>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
    defaultValues: isLogin 
      ? { email: '', password: '' }
      : { name: '', phone: '', email: '', password: '' },
  });

  const handleSubmit = (values: any) => {
    if (isLogin) {
      onSubmit(values.email, values.password);
    } else {
      onSubmit(values.email, values.password, values.name, values.phone);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-4">
        {!isLogin && (
          <>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.name')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        {...field}
                        placeholder={t('auth.namePlaceholder')}
                        className="pl-10"
                        type="text"
                        autoComplete="name"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.phone') || 'Phone'}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        {...field}
                        placeholder="5511999999999"
                        className="pl-10"
                        type="tel"
                        autoComplete="tel"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    {t('auth.phoneFormat') || 'Format: country code + area code + number (e.g. 5511999999999)'}
                  </p>
                </FormItem>
              )}
            />
          </>
        )}
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.email')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    {...field}
                    placeholder={t('auth.emailPlaceholder')}
                    className="pl-10"
                    type="email"
                    autoComplete="email"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.password')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    {...field}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="pl-10 pr-10"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isLogin && showResetPassword && (
          <div className="flex justify-end">
            <a href="/forgot-password" className="text-sm text-primary font-medium hover:underline">
              {t('auth.forgotPassword')}
            </a>
          </div>
        )}
        
        <Button type="submit" className="w-full mt-6" disabled={isLoading}>
          {submitText || (isLogin ? t('auth.login') : t('auth.signUp'))}
          {isLoading && <span className="ml-2">...</span>}
        </Button>
      </form>
    </Form>
  );
};

export default AuthForm;
