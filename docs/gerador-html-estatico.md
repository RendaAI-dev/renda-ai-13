# Gerador de HTML Estático - Solução Simplificada

Esta implementação permite gerar HTML otimizado com meta tags dinâmicas para WhatsApp e redes sociais, sem deploy automático.

## Arquivos da Solução

### 1. `supabase/functions/generate-html/index.ts`
- **Função**: Edge Function pública (sem JWT)
- **Funcionalidade**: Gera HTML com meta tags personalizadas baseadas nas configurações de branding
- **Endpoint**: `GET /functions/v1/generate-html`
- **Retorna**: JSON com HTML completo e instruções

### 2. `src/components/admin/StaticHtmlGenerator.tsx`
- **Função**: Interface React no painel admin
- **Funcionalidades**:
  - Chama a Edge Function
  - Exibe HTML gerado
  - Botão "Copiar HTML"
  - Link direto para GitHub
  - Instruções passo-a-passo

### 3. `supabase/functions/_shared/cors.ts`
- **Função**: Configurações CORS compartilhadas
- **Funcionalidade**: Headers padronizados para Edge Functions

### 4. `src/components/admin/BrandingConfigManager.tsx`
- **Modificação**: Integra o StaticHtmlGenerator
- **Localização**: Abaixo das configurações de branding

## Como Usar

### Configuração Inicial
1. Configure as settings de branding no painel admin:
   - `company_name`: Nome da empresa
   - `company_description`: Descrição da empresa  
   - `company_logo`: URL do logo da empresa

### Gerar HTML Otimizado
1. Acesse **Admin → Configurações de Branding**
2. Role até **"Gerador de HTML Estático"**
3. Clique em **"🚀 Gerar HTML Otimizado"**
4. Clique em **"📋 Copiar HTML"**
5. Clique em **"🔗 Editar no GitHub"**
6. Cole o HTML no arquivo `index.html`
7. Faça commit das mudanças
8. Deploy automático será executado

### Processo Manual
```bash
1. [Admin] Gera HTML otimizado
2. [Admin] Copia HTML
3. [Admin] Edita index.html no GitHub
4. [Admin] Faz commit
5. [Vercel] Deploy automático
6. [WhatsApp] Meta tags corretas ✅
```

## Benefícios da Nova Solução

✅ **Simplicidade**: Sem dependências externas  
✅ **Segurança**: Sem tokens GitHub necessários  
✅ **UTF-8 Perfeito**: Caracteres acentuados corretos  
✅ **WhatsApp Ready**: Meta tags otimizadas  
✅ **Interface Intuitiva**: Copy-paste fácil  
✅ **Sempre Funciona**: Sem falhas de API externa  

## Exemplo de HTML Gerado

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Sua Empresa</title>
    <meta name="description" content="Descrição da sua empresa" />
    
    <!-- Open Graph / WhatsApp -->
    <meta property="og:title" content="Sua Empresa" />
    <meta property="og:description" content="Descrição da sua empresa" />
    <meta property="og:image" content="/logo.png" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Sua Empresa" />
    
    <!-- App Scripts -->
    <script src="/src/main.tsx"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

## Migração da Solução Anterior

### ❌ Removido (render-page):
- Função complexa `render-page`
- Dependência de `GITHUB_TOKEN`
- Deploy automático no GitHub
- Detecção de bots
- Redirecionamentos automáticos

### ✅ Nova Solução (generate-html):
- Função simples e pública
- Interface admin intuitiva
- Processo manual controlado
- Sem dependências externas
- Mais confiável e seguro

## Vantagens vs Desvantagens

### ✅ Vantagens:
- **Simplicidade**: Fácil de entender e manter
- **Confiabilidade**: Sempre funciona
- **Segurança**: Sem tokens expostos
- **Controle**: Admin controla quando atualizar
- **UTF-8**: Funciona perfeitamente

### ⚠️ Considerações:
- **Manual**: Requer ação do admin
- **Steps**: Mais passos no processo
- **Educação**: Admin precisa entender o fluxo

## Replicação em Outros Projetos

Para replicar:

1. Copie `supabase/functions/generate-html/`
2. Copie `src/components/admin/StaticHtmlGenerator.tsx`
3. Integre no painel admin
4. Configure settings de branding
5. Atualize `.deploy-trigger`

**Dependências**: Supabase Edge Functions, tabela `poupeja_settings` 