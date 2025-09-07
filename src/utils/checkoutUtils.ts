// Utility functions for checkout flow

export const savePendingCheckout = (priceId: string, email: string) => {
  const planData = {
    priceId,
    email,
    timestamp: Date.now()
  };
  localStorage.setItem('pendingCheckout', JSON.stringify(planData));
};

export const getPendingCheckout = () => {
  try {
    const pendingCheckout = localStorage.getItem('pendingCheckout');
    if (!pendingCheckout) return null;
    
    const planData = JSON.parse(pendingCheckout);
    
    // Check if data expired (30 minutes)
    if (Date.now() - planData.timestamp > 30 * 60 * 1000) {
      localStorage.removeItem('pendingCheckout');
      return null;
    }
    
    return planData;
  } catch (error) {
    console.error('Error parsing pending checkout data:', error);
    localStorage.removeItem('pendingCheckout');
    return null;
  }
};

export const clearPendingCheckout = () => {
  localStorage.removeItem('pendingCheckout');
};

export const getCheckoutErrorMessage = (error: any): string => {
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('authsessionmissingerror') || message.includes('anônimo')) {
    return "Sessão expirada. Faça login novamente para continuar.";
  }
  
  if (message.includes('rate_limit') || message.includes('muitas tentativas')) {
    return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
  }
  
  if (message.includes('user already registered') || message.includes('já está cadastrado')) {
    return "Este email já está cadastrado. Tente fazer login ou usar outro email.";
  }
  
  if (message.includes('weak_password') || message.includes('senha muito fraca')) {
    return "Senha muito fraca. Use pelo menos 8 caracteres com números e letras.";
  }
  
  if (message.includes('stripe') || message.includes('payment')) {
    return "Erro no sistema de pagamento. Tente novamente em alguns instantes.";
  }
  
  if (message.includes('network') || message.includes('connection')) {
    return "Erro de conexão. Verifique sua internet e tente novamente.";
  }
  
  return error.message || "Ocorreu um erro inesperado. Tente novamente.";
};