/**
 * Utilitários para manipulação de dados de endereço
 */

export interface AddressData {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

/**
 * Formatar CEP no padrão XXXXX-XXX
 */
export const formatCep = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 5) {
    return numbers;
  } else {
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  }
};

/**
 * Validar CEP (deve ter 8 dígitos)
 */
export const validateCep = (cep: string): boolean => {
  const cleanCep = cep.replace(/\D/g, '');
  return cleanCep.length === 8;
};

/**
 * Buscar endereço por CEP usando a API ViaCEP
 */
export const fetchAddressByCep = async (cep: string): Promise<{
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}> => {
  const cleanCep = cep.replace(/\D/g, '');
  
  if (!validateCep(cep)) {
    throw new Error('CEP inválido');
  }

  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar CEP');
  }
  
  const data = await response.json();
  
  if (data.erro) {
    throw new Error('CEP não encontrado');
  }
  
  return data;
};

/**
 * Concatenar endereço completo para exibição
 */
export const formatFullAddress = (address: AddressData): string => {
  const parts = [];
  
  if (address.logradouro) parts.push(address.logradouro);
  if (address.numero) parts.push(address.numero);
  if (address.complemento) parts.push(address.complemento);
  if (address.bairro) parts.push(address.bairro);
  if (address.cidade) parts.push(address.cidade);
  if (address.estado) parts.push(address.estado);
  
  return parts.join(', ');
};

/**
 * Verificar se pelo menos um campo de endereço está preenchido
 */
export const hasAddressData = (address: AddressData): boolean => {
  return !!(
    address.cep ||
    address.logradouro ||
    address.numero ||
    address.bairro ||
    address.cidade ||
    address.estado
  );
};

/**
 * Limpar campos de endereço (remover espaços extras)
 */
export const cleanAddressData = (address: AddressData): AddressData => {
  return {
    cep: address.cep?.trim(),
    logradouro: address.logradouro?.trim(),
    numero: address.numero?.trim(),
    complemento: address.complemento?.trim(),
    bairro: address.bairro?.trim(),
    cidade: address.cidade?.trim(),
    estado: address.estado?.trim(),
  };
};