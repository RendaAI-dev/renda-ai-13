
import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useContactConfig } from '@/hooks/useContactConfig';

const WhatsAppActivationButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Move hook to component level
  const { config, isLoading } = useContactConfig();

  const handleActivateAccount = () => {
    if (isLoading) return;
    
    const phoneNumber = config.contactPhone;
    const message = encodeURIComponent('Quero ativar minha conta');
    
    console.log('WhatsApp activation (common):', { 
      phoneNumber,
      configPhone: config.contactPhone,
      isLoading 
    });
    
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    setIsOpen(false);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleAlreadyActivated = () => {
    setIsDismissed(true);
    setIsOpen(false);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <>
      {/* Botão flutuante - movido mais para cima */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="fixed bottom-24 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50 group" 
        aria-label="Ativar conta WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
        
        {/* Botão X para fechar */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          aria-label="Fechar"
        >
          <X className="h-3 w-3" />
        </div>
      </button>

      {/* Popup/Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                </svg>
              </div>
            </div>
            <DialogTitle className="text-xl font-semibold text-green-600 mb-2 text-center">
              Ativação no WhatsApp
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <p className="text-gray-700 font-medium">
              Já ativou sua conta no WhatsApp? 🎉
            </p>
            
            <p className="text-gray-500 text-sm">
              Se ainda não ativou, clique no botão abaixo para entrar em contato e ativar sua conta!
            </p>
            
            <div className="space-y-2">
              <Button 
                onClick={handleActivateAccount} 
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Carregando...' : 'Ativar minha conta'}
              </Button>
              
              <Button 
                onClick={handleAlreadyActivated}
                variant="outline" 
                className="w-full py-3 rounded-lg font-medium"
              >
                Já ativei minha conta
              </Button>
            </div>
            
            <p className="text-xs text-gray-400">
              Você receberá uma mensagem com todos os detalhes da sua ativação.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WhatsAppActivationButton;
