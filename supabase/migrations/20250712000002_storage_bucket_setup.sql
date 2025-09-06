-- ========================================================================
-- MIGRAÇÃO: Configuração Completa do Storage
-- Data: 2025-07-12
-- Descrição: Setup completo do bucket de storage para uploads
-- ========================================================================

-- 1. CRIAR BUCKET DE STORAGE (SE NÃO EXISTIR)
-- ========================================================================
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'uploads',
    'uploads',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  );
EXCEPTION WHEN unique_violation THEN
  -- Bucket já existe, atualizar configurações
  UPDATE storage.buckets SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  WHERE id = 'uploads';
END $$;

-- 2. REMOVER POLÍTICAS EXISTENTES (SE HOUVER)
-- ========================================================================
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage own files" ON storage.objects;

-- 3. CRIAR POLÍTICAS DE STORAGE
-- ========================================================================

-- Política para visualizar arquivos públicos
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');

-- Política para usuários autenticados fazerem upload
CREATE POLICY "Authenticated users can upload" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' 
    AND auth.role() = 'authenticated'
  );

-- Política para usuários gerenciarem seus próprios arquivos
CREATE POLICY "Users can manage own files" ON storage.objects 
  FOR ALL USING (
    bucket_id = 'uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para service role gerenciar todos os arquivos
CREATE POLICY "Service role full access" ON storage.objects
  FOR ALL USING (
    bucket_id = 'uploads'
    AND auth.jwt() ->> 'role' = 'service_role'
  );

-- 4. FUNÇÕES AUXILIARES PARA STORAGE
-- ========================================================================

-- Função para gerar caminho único para upload
CREATE OR REPLACE FUNCTION public.generate_upload_path(
  user_id UUID,
  file_extension TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN user_id::text || '/' || extract(epoch from now())::text || '_' || gen_random_uuid()::text || '.' || file_extension;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para validar tipo de arquivo
CREATE OR REPLACE FUNCTION public.validate_file_type(
  file_name TEXT,
  allowed_extensions TEXT[] DEFAULT ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf']
) RETURNS BOOLEAN AS $$
DECLARE
  file_extension TEXT;
BEGIN
  -- Extrair extensão do arquivo
  file_extension := lower(substring(file_name from '\.([^.]*)$'));
  
  -- Verificar se a extensão está na lista permitida
  RETURN file_extension = ANY(allowed_extensions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter URL pública do arquivo
CREATE OR REPLACE FUNCTION public.get_file_public_url(
  file_path TEXT
) RETURNS TEXT AS $$
DECLARE
  project_url TEXT;
BEGIN
  -- Obter URL base do projeto (isso deve ser configurado via settings)
  SELECT value INTO project_url 
  FROM public.poupeja_settings 
  WHERE category = 'system' AND key = 'supabase_url';
  
  -- Se não encontrar, usar placeholder
  IF project_url IS NULL THEN
    project_url := 'https://placeholder.supabase.co';
  END IF;
  
  -- Retornar URL completa
  RETURN project_url || '/storage/v1/object/public/uploads/' || file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TABELA PARA REGISTRAR UPLOADS (OPCIONAL)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.poupeja_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.poupeja_users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  purpose TEXT, -- 'avatar', 'logo', 'document', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS na tabela de uploads
ALTER TABLE public.poupeja_uploads ENABLE ROW LEVEL SECURITY;

-- Política para uploads (usuários podem ver apenas seus arquivos)
CREATE POLICY "Users can manage own uploads" ON public.poupeja_uploads
  FOR ALL USING (user_id = auth.uid());

-- Política para admins verem todos os uploads
CREATE POLICY "Admins can view all uploads" ON public.poupeja_uploads
  FOR SELECT USING (public.is_admin());

-- 6. FUNÇÃO PARA REGISTRAR UPLOAD
-- ========================================================================
CREATE OR REPLACE FUNCTION public.register_upload(
  p_file_name TEXT,
  p_file_path TEXT,
  p_file_size INTEGER DEFAULT NULL,
  p_mime_type TEXT DEFAULT NULL,
  p_purpose TEXT DEFAULT 'general'
) RETURNS UUID AS $$
DECLARE
  upload_id UUID;
BEGIN
  INSERT INTO public.poupeja_uploads (
    user_id, file_name, file_path, file_size, mime_type, purpose
  ) VALUES (
    auth.uid(), p_file_name, p_file_path, p_file_size, p_mime_type, p_purpose
  ) RETURNING id INTO upload_id;
  
  RETURN upload_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. TRIGGER PARA LIMPEZA DE ARQUIVOS ÓRFÃOS
-- ========================================================================
CREATE OR REPLACE FUNCTION public.cleanup_storage_on_upload_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Aqui você pode adicionar lógica para remover o arquivo físico do storage
  -- Por enquanto, apenas registrar no log
  RAISE NOTICE 'Upload removido: %', OLD.file_path;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS cleanup_storage_trigger ON public.poupeja_uploads;
CREATE TRIGGER cleanup_storage_trigger
  AFTER DELETE ON public.poupeja_uploads
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_storage_on_upload_delete();

-- 8. ÍNDICES PARA PERFORMANCE
-- ========================================================================
CREATE INDEX IF NOT EXISTS idx_poupeja_uploads_user_id ON public.poupeja_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_poupeja_uploads_purpose ON public.poupeja_uploads(purpose);
CREATE INDEX IF NOT EXISTS idx_poupeja_uploads_created_at ON public.poupeja_uploads(created_at);

-- 9. CONCEDER PERMISSÕES
-- ========================================================================
GRANT EXECUTE ON FUNCTION public.generate_upload_path(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_file_type(TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_file_public_url(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.register_upload(TEXT, TEXT, INTEGER, TEXT, TEXT) TO authenticated;

-- 10. CONFIGURAÇÕES INICIAIS
-- ========================================================================

-- NOTA: Configurações system movidas para 20250712000000_create_admin_settings_system.sql

-- 11. COMENTÁRIOS
-- ========================================================================
COMMENT ON TABLE public.poupeja_uploads IS 'Registro de arquivos enviados pelos usuários';
COMMENT ON FUNCTION public.generate_upload_path(UUID, TEXT) IS 'Gera caminho único para upload de arquivo';
COMMENT ON FUNCTION public.validate_file_type(TEXT, TEXT[]) IS 'Valida se o tipo de arquivo é permitido';
COMMENT ON FUNCTION public.get_file_public_url(TEXT) IS 'Retorna URL pública de um arquivo';
COMMENT ON FUNCTION public.register_upload(TEXT, TEXT, INTEGER, TEXT, TEXT) IS 'Registra um upload no banco de dados';

-- ========================================================================
-- FIM DA MIGRAÇÃO DE STORAGE
-- ========================================================================