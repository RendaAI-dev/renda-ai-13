import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useContactConfig } from '@/hooks/useContactConfig';

interface WhatsAppActivationButtonProps {
  phone?: string;
  planType?: string;
  email?: string;
}

const WhatsAppActivationButton: React.FC<WhatsAppActivationButtonProps> = ({
  phone,
  planType = 'mensal',
  email = '',
}) => {
  const navigate = useNavigate();
  const { config, isLoading, formatMessage } = useContactConfig();

  const handleActivation = () => {
    // Use dynamic phone and message from config, prioritize config over props
    const phoneNumber = config.contactPhone || phone;
    const message = encodeURIComponent(formatMessage(email, planType));
    
    console.log('WhatsApp activation:', { 
      phoneNumber, 
      configPhone: config.contactPhone, 
      propsPhone: phone,
      originalMessage: formatMessage(email, planType)
    });
    
    // Open WhatsApp in a new tab
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    
    // Redirect to thank-you page after a short delay
    setTimeout(() => {
      navigate('/thank-you');
    }, 500);
  };

  // Don't render if still loading
  if (isLoading) {
    return (
      <Button 
        disabled
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        size="lg"
      >
        <MessageSquare className="mr-2 h-5 w-5" />
        Carregando...
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleActivation}
      className="w-full bg-green-600 hover:bg-green-700 text-white"
      size="lg"
    >
      <MessageSquare className="mr-2 h-5 w-5" />
      Ativar Minha Conta no WhatsApp
    </Button>
  );
};

export default WhatsAppActivationButton;