# Configuração de Secrets para GitHub Actions

Para que o workflow de deploy automático funcione, você precisa configurar as seguintes secrets no seu repositório GitHub:

## Secrets Necessárias

### 1. SUPABASE_ACCESS_TOKEN
- **Onde obter**: Supabase Dashboard → Settings → Access Tokens
- **Como configurar**: 
  1. Vá para Supabase Dashboard
  2. Clique em Settings → Access Tokens
  3. Clique em "Generate new token"
  4. Copie o token gerado

### 2. SUPABASE_PROJECT_ID
- **Onde obter**: URL do seu projeto Supabase ou Dashboard → Settings → General
- **Formato**: É o ID que aparece na URL do seu projeto (ex: `iaeugizsjxwrlpfjutom`)

## Como Configurar no GitHub

1. Vá para o seu repositório no GitHub
2. Clique em **Settings** (na aba superior)
3. No menu lateral, clique em **Secrets and variables** → **Actions**
4. Clique em **New repository secret**
5. Adicione cada secret:
   - Nome: `SUPABASE_ACCESS_TOKEN`
   - Valor: [seu token do Supabase]
   - Nome: `SUPABASE_PROJECT_ID`  
   - Valor: [seu project ID]

## Testando o Deploy

Após configurar as secrets:

1. Faça uma alteração em qualquer arquivo dentro de `supabase/functions/`
2. Commit e push para a branch `main`
3. Vá para a aba **Actions** no GitHub para acompanhar o deploy
4. O workflow irá fazer deploy automático de todas as Edge Functions

## Deploy Manual

Você também pode executar o workflow manualmente:
1. Vá para **Actions** no GitHub
2. Selecione "Deploy Supabase Functions"
3. Clique em **Run workflow**

## Verificação

Após o deploy, verifique no Supabase Dashboard → Edge Functions se as novas funções apareceram:
- `get-admin-settings`
- `update-admin-settings` 
- `migrate-settings`