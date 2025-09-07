import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { getPlanTypeFromPriceId } from '@/utils/subscriptionUtils';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { companyName, logoUrl, logoAltText } = useBrandingConfig();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const priceId = searchParams.get('priceId');

  // Função para aguardar uma sessão válida ser estabelecida
  const waitForValidSession = async (maxRetries = 20, retryDelay = 1500): Promise<any> => {
    console.log(`[waitForValidSession] Iniciando com ${maxRetries} tentativas a cada ${retryDelay}ms`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[waitForValidSession] Tentativa ${attempt}/${maxRetries} - Verificando sessão...`);
      
      try {
        // Verificação dupla: getSession E getUser
        const [sessionResult, userResult] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser()
        ]);
        
        const { data: { session }, error: sessionError } = sessionResult;
        const { data: { user }, error: userError } = userResult;
        
        if (sessionError) {
          console.error(`[waitForValidSession] Erro de sessão na tentativa ${attempt}:`, sessionError);
          if (attempt === maxRetries) throw sessionError;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        if (userError) {
          console.error(`[waitForValidSession] Erro de usuário na tentativa ${attempt}:`, userError);
          if (attempt === maxRetries) throw userError;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // Verificar se temos sessão E usuário válidos
        if (session?.access_token && session?.user?.id && user?.id) {
          console.log(`[waitForValidSession] ✅ Sessão e usuário válidos encontrados na tentativa ${attempt}:`, {
            sessionUserId: session.user.id,
            userDataId: user.id,
            email: session.user.email,
            tokenLength: session.access_token.length,
            userConfirmed: user.email_confirmed_at ? 'Sim' : 'Não'
          });
          return session;
        }
        
        console.log(`[waitForValidSession] ⏳ Tentativa ${attempt}: Aguardando sessão e usuário serem estabelecidos`, {
          hasSession: !!session,
          hasToken: !!session?.access_token,
          hasSessionUser: !!session?.user?.id,
          hasUser: !!user?.id
        });
        
        // Tentar refresh da sessão nas últimas tentativas
        if (attempt > maxRetries - 3) {
          console.log(`[waitForValidSession] 🔄 Tentativa ${attempt}: Fazendo refresh da sessão`);
          await supabase.auth.refreshSession();
        }
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } catch (error) {
        console.error(`[waitForValidSession] Erro inesperado na tentativa ${attempt}:`, error);
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    throw new Error('Timeout: Não foi possível estabelecer uma sessão válida após 30 segundos');
  };

  // Função para formatar o número de telefone como (XX) XXXXX-XXXX
  const formatPhoneNumber = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a formatação
    if (numbers.length <= 2) {
      return numbers.length ? `(${numbers}` : '';
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // Função para lidar com a mudança no campo de WhatsApp
  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setWhatsapp(formattedValue);
  };

  // Função para formatar CPF como XXX.XXX.XXX-XX
  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    } else {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    }
  };

  // Função para lidar com a mudança no campo de CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCpf(e.target.value);
    setCpf(formattedValue);
  };

  // Função para validar CPF
  const validateCpf = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    
    if (numbers.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 >= 10) digit1 = 0;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 >= 10) digit2 = 0;
    
    return parseInt(numbers[9]) === digit1 && parseInt(numbers[10]) === digit2;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Adicionar classe de loading ao formulário
    const formElement = document.getElementById('register-form');
    if (formElement) {
      formElement.classList.add('form-loading');
    }
  
    if (!priceId) {
      setError("Price ID não encontrado na URL. Por favor, selecione um plano.");
      setIsLoading(false);
      formElement?.classList.remove('form-loading');
      navigate('/plans');
      return;
    }
  
    try {
      // Normaliza o número de telefone antes de enviar (remove caracteres não numéricos)
      const formattedPhone = whatsapp.replace(/\D/g, '');
      const formattedCpf = cpf.replace(/\D/g, '');
      
      // Validar CPF antes de prosseguir
      if (!validateCpf(cpf)) {
        throw new Error('CPF inválido. Por favor, verifique o número digitado.');
      }
  
      console.log('Iniciando processo de registro...');
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: formattedPhone,
            cpf: formattedCpf,
            birth_date: birthDate,
            address: address,
          },
        },
      });
  
      if (signUpError) {
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('Usuário não retornado após o cadastro.');
      }

      console.log('Usuário criado com sucesso');
      
      // Mostrar feedback de progresso
      toast({
        title: "Conta criada com sucesso!",
        description: "Aguardando estabelecer sessão...",
      });

      // Aguardar que a sessão seja estabelecida
      console.log('🚀 Aguardando estabelecer sessão após registro...');
      let validSession;
      try {
        validSession = await waitForValidSession(20, 1500);
        console.log('✅ Sessão estabelecida com sucesso!');
      } catch (sessionError) {
        console.error('❌ Erro ao aguardar sessão:', sessionError);
        
        // FALLBACK: Tentar login automático
        console.log('🔄 Tentando fallback com login automático...');
        try {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (loginError) throw loginError;
          
          if (loginData.session) {
            console.log('✅ Login automático bem-sucedido!');
            validSession = loginData.session;
            
            toast({
              title: "Conta criada e login realizado!",
              description: "Prosseguindo para checkout...",
            });
          } else {
            throw new Error('Login automático falhou');
          }
        } catch (loginError) {
          console.error('❌ Fallback de login também falhou:', loginError);
          
          // Último recurso: redirecionar para login manual
          toast({
            title: "Conta criada com sucesso!",
            description: "Redirecionando para fazer login...",
          });
          
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                email, 
                message: "Sua conta foi criada! Faça login para continuar com o pagamento." 
              } 
            });
          }, 2000);
          return;
        }
      }

      // Verificar se temos uma sessão válida
      if (!validSession?.access_token || !validSession?.user?.id) {
        throw new Error('Sessão inválida após registro. Tente fazer login manualmente.');
      }

      console.log('Sessão estabelecida com sucesso, preparando checkout...');
      
      // Converter priceId para planType
      const planType = await getPlanTypeFromPriceId(priceId);
      
      if (!planType) {
        throw new Error("Tipo de plano inválido. Verifique as configurações.");
      }
      
      // Atualizar feedback de progresso
      toast({
        title: "Sessão estabelecida!",
        description: "Preparando checkout...",
      });
      
      // Chamar a Supabase Function para criar a sessão de checkout do Stripe
      console.log('Chamando create-checkout-session com sessão válida...');
      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          planType,
          successUrl: `${window.location.origin}/payment-success?email=${encodeURIComponent(validSession.user.email || '')}`,
          cancelUrl: `${window.location.origin}/register?canceled=true`
        },
        headers: {
          Authorization: `Bearer ${validSession.access_token}`,
        }
      });
      
      if (functionError) {
        console.error('Erro na função de checkout:', functionError);
        throw new Error(`Erro no checkout: ${functionError.message}`);
      }

      console.log('Dados retornados pela função create-checkout-session:', functionData);

      if (functionData && functionData.url) {
        console.log('Redirecionando para:', functionData.url);
        
        // Garantir que o overlay de carregamento permaneça visível
        document.body.classList.add('overflow-hidden');
        
        // Adicionar um pequeno atraso antes do redirecionamento para garantir que o overlay seja exibido
        setTimeout(() => {
          window.location.href = functionData.url;
        }, 500);
        
        return;
      } else {
        throw new Error('Não foi possível obter a URL de checkout.');
      }
    } catch (err: any) {
      console.error('Erro no processo de registro ou checkout:', err);
      setError(err.message || 'Ocorreu um erro desconhecido.');
      setIsLoading(false);
      
      // Remover classe de loading em caso de erro
      const formElement = document.getElementById('register-form');
      if (formElement) {
        formElement.classList.remove('form-loading');
      }
    }
  };

  // Adicione este componente dentro do RegisterPage, antes do return
  const LoadingOverlay = () => {
    if (!isLoading) return null;
    
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium">
            {isLoading && error ? 'Processando...' : 'Criando conta e preparando checkout...'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col items-center justify-center p-4">
      {/* Renderizar o LoadingOverlay fora do container do formulário */}
      {isLoading && <LoadingOverlay />}
      
      {/* Container do formulário com largura máxima e sombra */}
      <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-2xl relative">
        {/* Logo e Título Centralizados */}
        <div className="flex flex-col items-center mb-8">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt={logoAltText}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  const nextSibling = target.nextElementSibling as HTMLElement;
                  if (nextSibling) {
                    nextSibling.style.display = 'block';
                  }
                }}
              />
              <span className="text-white font-bold text-lg" style={{ display: 'none' }}>
                {companyName.charAt(0)}
              </span>
            </div>
            <span className="text-2xl font-bold text-primary">{companyName}</span>
          </div>
          <h1 className="text-3xl font-bold text-center text-foreground">Criar Conta</h1>
          <p className="text-muted-foreground text-center mt-2">
            Preencha os campos abaixo para criar sua conta.
          </p>
        </div>

        {error && (
          <p className="text-sm text-center text-red-600 mb-4">{error}</p>
        )}

        <form id="register-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              placeholder="Digite seu nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              autoComplete="tel"
              required
              placeholder="(XX) XXXXX-XXXX"
              value={whatsapp}
              onChange={handleWhatsappChange}
              className="mt-1"
              maxLength={16}
            />
            <p className="mt-2 text-xs text-gray-500">
              Este número será utilizado para enviar mensagens e notificações importantes via WhatsApp.
            </p>
          </div>

          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              name="cpf"
              type="text"
              autoComplete="off"
              required
              placeholder="XXX.XXX.XXX-XX"
              value={cpf}
              onChange={handleCpfChange}
              className="mt-1"
              maxLength={14}
            />
            <p className="mt-2 text-xs text-gray-500">
              Digite seu CPF para validação de identidade.
            </p>
          </div>

          <div>
            <Label htmlFor="birthDate">Data de Nascimento</Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              autoComplete="bday"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="address">Endereço Completo</Label>
            <Input
              id="address"
              name="address"
              type="text"
              autoComplete="street-address"
              required
              placeholder="Rua, número, bairro, cidade, estado"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1"
            />
            <p className="mt-2 text-xs text-gray-500">
              Endereço completo com rua, número, bairro, cidade e estado.
            </p>
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Cadastre sua senha de acesso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Criando conta...' : 'Criar Conta e Ir para Pagamento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
