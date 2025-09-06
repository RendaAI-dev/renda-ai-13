import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Upload, Loader2, Image, Globe, Palette } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { StaticHtmlGenerator } from './StaticHtmlGenerator';
import { brandingPreloader } from '@/utils/brandingPreloader';

const BrandingConfigManager: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    logoUrl: '',
    faviconUrl: '',
    companyName: '',
    companyDescription: '', // Novo campo
    logoAltText: '',
    landingTheme: 'system',
  });

  const loadBrandingConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-admin-settings');
      
      if (error) {
        console.error('Erro ao carregar configurações de branding:', error);
        return;
      }
      
      if (data?.success && data?.settings) {
        const brandingSettings = data.settings.branding || {};
        setFormData({
          logoUrl: brandingSettings.logo_url?.value || '',
          faviconUrl: brandingSettings.favicon_url?.value || '',
          companyName: brandingSettings.company_name?.value || '',
          companyDescription: brandingSettings.company_description?.value || '', // Novo campo
          logoAltText: brandingSettings.logo_alt_text?.value || '',
          landingTheme: brandingSettings.landing_theme?.value || 'system',
        });
      }
    } catch (err) {
      console.error('Erro ao carregar configurações de branding:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadBrandingConfig();
    }
  }, [isAdmin]);

  const handleFileChange = (file: File | null, type: 'logo' | 'favicon') => {
    if (type === 'logo') {
      setLogoFile(file);
    } else {
      setFaviconFile(file);
    }
  };

  const uploadFile = async (file: File, folder: string = 'branding') => {
    console.log('Iniciando upload do arquivo:', file.name);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    console.log('Tentando upload para:', filePath);

    try {
      // Verificar se o bucket 'uploads' existe primeiro
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Erro ao listar buckets:', listError);
      } else {
        console.log('Buckets disponíveis:', buckets?.map(b => b.name));
      }

      // Tentar upload no bucket 'uploads' primeiro
      let bucketName = 'uploads';
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload (bucket uploads):', error);
        
        // Se falhar, pode ser que o bucket não exista ainda
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          throw new Error('Bucket de storage não encontrado. Execute o deployment do Supabase para criar o bucket "uploads".');
        }
        
        throw new Error(`Erro no upload: ${error.message}`);
      }

      console.log('Upload realizado com sucesso no bucket:', bucketName);

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log('URL pública gerada:', publicUrl);
      return publicUrl;
      
    } catch (uploadError) {
      console.error('Erro durante upload:', uploadError);
      throw uploadError;
    }
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      
      let logoUrl = formData.logoUrl;
      let faviconUrl = formData.faviconUrl;

      // Upload logo se foi selecionado
      if (logoFile) {
        console.log('Fazendo upload da logo...');
        logoUrl = await uploadFile(logoFile, 'logos');
        console.log('Logo uploaded:', logoUrl);
      }

      // Upload favicon se foi selecionado
      if (faviconFile) {
        console.log('Fazendo upload do favicon...');
        faviconUrl = await uploadFile(faviconFile, 'favicons');
        console.log('Favicon uploaded:', faviconUrl);
      }

      // Salvar configurações
      console.log('Salvando configurações...');
      const { data, error } = await supabase.functions.invoke('update-admin-settings', {
        body: {
          category: 'branding',
          updates: {
            logo_url: logoUrl,
            favicon_url: faviconUrl,
            company_name: formData.companyName,
            company_description: formData.companyDescription, // Novo campo
            logo_alt_text: formData.logoAltText,
            landing_theme: formData.landingTheme,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        // Atualizar favicon no documento se foi alterado
        if (faviconUrl && faviconUrl !== formData.faviconUrl) {
          const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (link) {
            link.href = faviconUrl;
          }
        }

        setFormData(prev => ({
          ...prev,
          logoUrl,
          faviconUrl,
        }));

        setLogoFile(null);
        setFaviconFile(null);

        // Invalidar cache do branding
        brandingPreloader.invalidateCache();
        
        // Forçar refresh do branding context
        if (typeof window !== 'undefined') {
          // Disparar evento customizado para refresh
          window.dispatchEvent(new CustomEvent('brandingUpdated'));
        }
        
        toast({
          title: "Configurações de branding salvas!",
          description: "Logo e favicon foram atualizados com sucesso. Atualizando todas as abas...",
        });
        
        // Recarregar configurações após salvar
        await loadBrandingConfig();
      }
    } catch (error: any) {
      console.error('Erro ao salvar configurações de branding:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || 'Não foi possível salvar as configurações de branding.',
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
            <span>Carregando configurações de branding...</span>
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
            Você não tem permissões para acessar as configurações de branding.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Configurações de Branding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informações da Empresa</h3>
          
          <div className="space-y-2">
            <Label htmlFor="companyName">Nome da Empresa</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="PoupeJá"
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyDescription">Descrição da Empresa</Label>
            <Input
              id="companyDescription"
              value={formData.companyDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, companyDescription: e.target.value }))}
              placeholder="Ex: Gerencie suas finanças com o PoupeJá"
              disabled={isUpdating}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Image className="h-5 w-5" />
            Logo da Empresa
          </h3>
          
          {formData.logoUrl && (
            <div className="space-y-2">
              <Label>Logo Atual</Label>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img 
                  src={formData.logoUrl} 
                  alt={formData.logoAltText || "Logo da empresa"}
                  className="max-h-16 max-w-32 object-contain"
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="logoFile">Upload Nova Logo (PNG, JPG, SVG)</Label>
            <Input
              id="logoFile"
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'logo')}
              disabled={isUpdating}
            />
            {logoFile && (
              <p className="text-sm text-green-600">
                Nova logo selecionada: {logoFile.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoAltText">Texto Alternativo da Logo</Label>
            <Input
              id="logoAltText"
              value={formData.logoAltText}
              onChange={(e) => setFormData(prev => ({ ...prev, logoAltText: e.target.value }))}
              placeholder="Logo da empresa PoupeJá"
              disabled={isUpdating}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Tema da Landing Page
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="landingTheme">Tema Forçado da Landing Page</Label>
            <Select 
              value={formData.landingTheme} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, landingTheme: value }))}
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">Sistema (padrão do usuário)</SelectItem>
                <SelectItem value="light">Claro (sempre)</SelectItem>
                <SelectItem value="dark">Escuro (sempre)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define o tema que será sempre usado na página inicial, independente da configuração do usuário.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Favicon
          </h3>
          
          {formData.faviconUrl && (
            <div className="space-y-2">
              <Label>Favicon Atual</Label>
              <div className="border rounded-lg p-4 bg-gray-50 flex items-center gap-2">
                <img 
                  src={formData.faviconUrl} 
                  alt="Favicon"
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-600">Favicon do site</span>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="faviconFile">Upload Novo Favicon (PNG, JPG)</Label>
            <Input
              id="faviconFile"
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'favicon')}
              disabled={isUpdating}
            />
            {faviconFile && (
              <p className="text-sm text-green-600">
                Novo favicon selecionado: {faviconFile.name}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Recomendado: imagem quadrada, mínimo 32x32px
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

    {/* Componente de Geração de HTML Estático */}
    <StaticHtmlGenerator />
  </div>
  );
};

export default BrandingConfigManager;
