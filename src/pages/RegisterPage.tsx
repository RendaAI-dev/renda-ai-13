import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { savePendingCheckout, getCheckoutErrorMessage } from '@/utils/checkoutUtils';
import { debugUserRegistration } from '@/utils/debugUtils';

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
  
  // Estados para endereço separado
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const priceId = searchParams.get('priceId');

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

  // Função para formatar CEP como XXXXX-XXX
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 5) {
      return numbers;
    } else {
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
    }
  };

  // Função para buscar endereço por CEP
  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      return;
    }

    setIsLoadingCep(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }
      
      // Preencher campos automaticamente
      setLogradouro(data.logradouro || '');
      setBairro(data.bairro || '');
      setCidade(data.localidade || '');
      setEstado(data.uf || '');
      
      // Focar no campo número após busca bem-sucedida
      setTimeout(() => {
        const numeroField = document.getElementById('numero');
        if (numeroField) {
          numeroField.focus();
        }
      }, 100);
      
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      // Limpar campos em caso de erro
      setLogradouro('');
      setBairro('');
      setCidade('');
      setEstado('');
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Função para lidar com a mudança no campo de CEP
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCep(e.target.value);
    setCep(formattedValue);
    
    // Buscar endereço quando CEP estiver completo
    const cleanCep = formattedValue.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchAddressByCep(formattedValue);
    }
  };
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
      // Normaliza os dados antes de enviar
      const formattedPhone = whatsapp.replace(/\D/g, '');
      const formattedCpf = cpf.replace(/\D/g, '');
      const formattedCep = cep.replace(/\D/g, '');
      
      // Validar CPF antes de prosseguir
      if (!validateCpf(cpf)) {
        throw new Error('CPF inválido. Por favor, verifique o número digitado.');
      }
  
      console.log('Iniciando processo de registro...');
      
      // Registrar usuário
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: formattedPhone,
            cpf: formattedCpf,
            birth_date: birthDate,
            cep: formattedCep,
            logradouro: logradouro,
            numero: numero,
            complemento: complemento,
            bairro: bairro,
            cidade: cidade,
            estado: estado,
          },
        },
      });
   
      if (signUpError) {
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('Usuário não retornado após o cadastro.');
      }

      console.log('✅ Usuário criado com sucesso - ID:', signUpData.user.id);
      console.log('📋 Dados enviados para auth.users:', {
        full_name: fullName,
        phone: formattedPhone,
        cpf: formattedCpf,
        birth_date: birthDate,
        cep: formattedCep,
        logradouro: logradouro,
        numero: numero,
        complemento: complemento,
        bairro: bairro,
        cidade: cidade,
        estado: estado,
      });
      
      // Aguardar um pouco para o trigger processar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se os dados foram salvos na tabela poupeja_users
      console.log('🔍 Verificando se usuário foi criado em poupeja_users...');
      const { data: userData, error: userError } = await supabase
        .from('poupeja_users')
        .select('*')
        .eq('id', signUpData.user.id)
        .single();
        
      if (userError) {
        console.error('❌ Erro ao buscar usuário em poupeja_users:', userError);
      } else {
        console.log('✅ Usuário encontrado em poupeja_users:', userData);
      }
      
      // Executar debug completo
      const debugResult = await debugUserRegistration(signUpData.user.id);
      console.log('🔍 Resultado do debug completo:', debugResult);
      
      // Salvar informações do plano no localStorage para usar após o login
      savePendingCheckout(priceId, email);
      
      // Mostrar feedback de sucesso
      toast({
        title: "Conta criada com sucesso!",
        description: "Redirecionando para login...",
      });
      
      // Redirecionar para login com as informações do plano
      setTimeout(() => {
        navigate(`/login?email=${encodeURIComponent(email)}&checkout=pending`, {
          state: { 
            email,
            message: "Sua conta foi criada! Faça login para completar o pagamento.",
            showCheckoutMessage: true
          }
        });
      }, 1500);
      
    } catch (err: any) {
      console.error('Erro no processo de registro:', err);
      
      // Usar função utilitária para mensagem de erro mais específica
      const errorMessage = getCheckoutErrorMessage(err);
      
      setError(errorMessage);
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
            Criando sua conta...
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

          {/* Seção de Endereço */}
          <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
            <h3 className="text-sm font-semibold text-muted-foreground">Endereço</h3>
            
            <div>
              <Label htmlFor="cep">CEP</Label>
              <div className="relative">
                <Input
                  id="cep"
                  name="cep"
                  type="text"
                  autoComplete="postal-code"
                  required
                  placeholder="XXXXX-XXX"
                  value={cep}
                  onChange={handleCepChange}
                  className="mt-1"
                  maxLength={9}
                />
                {isLoadingCep && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Digite o CEP para buscar o endereço automaticamente.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                  id="logradouro"
                  name="logradouro"
                  type="text"
                  autoComplete="address-line1"
                  required
                  placeholder="Rua, Avenida, etc."
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  name="numero"
                  type="text"
                  autoComplete="address-line2"
                  required
                  placeholder="123"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  name="complemento"
                  type="text"
                  autoComplete="address-line3"
                  placeholder="Apto, Bloco (opcional)"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  name="bairro"
                  type="text"
                  autoComplete="address-level2"
                  required
                  placeholder="Bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  name="cidade"
                  type="text"
                  autoComplete="address-level2"
                  required
                  placeholder="Cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                name="estado"
                type="text"
                autoComplete="address-level1"
                required
                placeholder="Estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="mt-1"
                maxLength={2}
              />
            </div>
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
