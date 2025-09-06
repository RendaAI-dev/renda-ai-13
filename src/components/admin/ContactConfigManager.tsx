
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Loader2, Phone, Mail, MessageCircle } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

const ContactConfigManager: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    contactPhone: '',
    supportEmail: '',
    whatsappMessage: '',
  });

  const loadContactConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-admin-settings');
      
      if (error) {
        console.error('Erro ao carregar configurações de contato:', error);
        return;
      }
      
      if (data?.success && data?.settings) {
        const contactSettings = data.settings.contact || {};
        setFormData({
          contactPhone: contactSettings.contact_phone?.value || '',
          supportEmail: contactSettings.support_email?.value || '',
          whatsappMessage: contactSettings.whatsapp_message?.value || 'Olá! Preciso de ajuda com o PoupeJá.',
        });
      }
    } catch (err) {
      console.error('Erro ao carregar configurações de contato:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadContactConfig();
    }
  }, [isAdmin]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      
      const { data, error } = await supabase.functions.invoke('update-admin-settings', {
        body: {
          category: 'contact',
          updates: {
            contact_phone: formData.contactPhone,
            support_email: formData.supportEmail,
            whatsapp_message: formData.whatsappMessage,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Configurações de contato salvas!",
          description: "Todas as informações de contato foram atualizadas.",
        });
        
        // Recarregar configurações após salvar
        await loadContactConfig();
      }
    } catch (error: any) {
      console.error('Erro ao salvar configurações de contato:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || 'Não foi possível salvar as configurações de contato.',
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (roleLoading || isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando configurações de contato...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            Acesso Negado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Você não tem permissões para acessar as configurações de contato.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Configurações de Contato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <MessageCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-green-800 text-sm font-medium mb-2">📞 Configurações de Contato</p>
              <div className="text-green-700 text-sm space-y-2">
                <p>Configure os canais de comunicação disponíveis para os usuários.</p>
                <p>Essas informações serão usadas nos botões de contato e redirecionamentos.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Número do WhatsApp</Label>
            <Input
              id="contactPhone"
              value={formData.contactPhone}
              onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              placeholder="5511945676825"
              disabled={isUpdating}
            />
            <p className="text-xs text-gray-500">
              Número com código do país (ex: 55 para Brasil + DDD + número)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappMessage">Mensagem Padrão do WhatsApp</Label>
            <Input
              id="whatsappMessage"
              value={formData.whatsappMessage}
              onChange={(e) => handleInputChange('whatsappMessage', e.target.value)}
              placeholder="Olá! Preciso de ajuda com o PoupeJá."
              disabled={isUpdating}
            />
            <p className="text-xs text-gray-500">
              Mensagem que será pré-preenchida quando o usuário abrir o WhatsApp
            </p>
          </div>

          {formData.contactPhone && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm font-medium mb-1">Preview do Link:</p>
              <p className="text-blue-700 text-xs font-mono break-all">
                https://wa.me/{formData.contactPhone}?text={encodeURIComponent(formData.whatsappMessage)}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Email de Suporte</Label>
            <Input
              id="supportEmail"
              type="email"
              value={formData.supportEmail}
              onChange={(e) => handleInputChange('supportEmail', e.target.value)}
              placeholder="suporte@poupeja.com"
              disabled={isUpdating}
            />
            <p className="text-xs text-gray-500">
              Email para onde os usuários podem enviar dúvidas e problemas
            </p>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button 
            onClick={handleSave}
            disabled={isUpdating}
            className="flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactConfigManager;
