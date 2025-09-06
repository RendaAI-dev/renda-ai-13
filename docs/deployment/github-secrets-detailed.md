# 🔐 Configuração Detalhada dos Secrets do GitHub

Este guia detalha como configurar todos os secrets necessários para o funcionamento completo do sistema de deploy automático.

## 📋 Lista Completa de Secrets Necessários

| Secret | Obrigatório | Descrição | Onde Encontrar |
|--------|-------------|-----------|----------------|
| `SUPABASE_ACCESS_TOKEN` | ✅ | Token pessoal do Supabase | [Dashboard > Account > Access Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_ID` | ✅ | ID único do projeto | URL do projeto (após `https://`) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Chave service_role | Project Settings > API > service_role |
| `SUPABASE_DB_PASSWORD` | ✅ | Senha do banco de dados | Definida na criação do projeto |

## 🚀 Passo a Passo Detalhado

### 1. Obter SUPABASE_ACCESS_TOKEN

1. **Acesse o Dashboard do Supabase**: [supabase.com/dashboard](https://supabase.com/dashboard)
2. **Clique no seu avatar** (canto superior direito)
3. **Selecione "Account"**
4. **Vá para "Access Tokens"**
5. **Clique em "Create New Token"**
6. **Configure:**
   - **Name**: `GitHub Actions PoupeJá`
   - **Expiration**: `Never` (ou defina um período longo)
   - **Scopes**: Selecione todas as permissões disponíveis
7. **Clique em "Create Token"**
8. **⚠️ IMPORTANTE**: Copie o token imediatamente! Ele não será mostrado novamente.

### 2. Obter SUPABASE_PROJECT_ID

1. **Acesse seu projeto no Supabase**
2. **Observe a URL do navegador**: `https://supabase.com/dashboard/project/[PROJECT_ID]`
3. **O PROJECT_ID é a parte após `/project/`**
4. **Exemplo**: Se a URL for `https://supabase.com/dashboard/project/abcd1234efgh5678`, então o PROJECT_ID é `abcd1234efgh5678`

### 3. Obter SUPABASE_SERVICE_ROLE_KEY

1. **Acesse seu projeto no Supabase**
2. **Vá para Settings** (ícone de engrenagem na lateral esquerda)
3. **Clique em "API"**
4. **Na seção "Project API Keys"**, localize **"service_role"**
5. **Clique no ícone de "revelar"** para mostrar a chave
6. **Copie a chave completa** (começa com `eyJ...`)

### 4. Obter SUPABASE_DB_PASSWORD

Esta é a senha que você definiu ao criar o projeto Supabase:

1. **Se você lembra da senha**: Use a senha que definiu durante a criação
2. **Se você esqueceu**: 
   - Vá para **Settings > Database**
   - Clique em **"Reset database password"**
   - Defina uma nova senha
   - **⚠️ ATENÇÃO**: Isso resetará a senha do banco!

## 🔧 Configurar Secrets no GitHub

### Acessar as Configurações

1. **Acesse seu repositório** no GitHub
2. **Clique em "Settings"** (última aba no menu superior)
3. **Na lateral esquerda**, clique em **"Secrets and variables"**
4. **Clique em "Actions"**

### Adicionar Cada Secret

Para cada secret da lista:

1. **Clique em "New repository secret"**
2. **Em "Name"**, digite o nome exato do secret (ex: `SUPABASE_ACCESS_TOKEN`)
3. **Em "Secret"**, cole o valor obtido nas etapas anteriores
4. **Clique em "Add secret"**

## ✅ Verificação de Configuração

### Checklist de Verificação

- [ ] `SUPABASE_ACCESS_TOKEN` está configurado e válido
- [ ] `SUPABASE_PROJECT_ID` corresponde ao ID do seu projeto
- [ ] `SUPABASE_SERVICE_ROLE_KEY` está correto e completo
- [ ] `SUPABASE_DB_PASSWORD` é a senha atual do banco

### Testar a Configuração

1. **Vá para a aba "Actions"** do seu repositório
2. **Execute o workflow "Complete Supabase Deployment"**:
   - Clique no workflow
   - Clique em "Run workflow"
   - Selecione "fresh" se for uma nova instalação
   - Clique em "Run workflow"
3. **Monitore a execução** e verifique se não há erros

## 🚨 Solução de Problemas

### Erro: "Invalid access token"
- **Causa**: Token expirado ou inválido
- **Solução**: Gere um novo token no Supabase e atualize o secret

### Erro: "Project not found"
- **Causa**: PROJECT_ID incorreto
- **Solução**: Verifique o ID na URL do projeto

### Erro: "Authentication failed"
- **Causa**: SERVICE_ROLE_KEY incorreto
- **Solução**: Copie novamente a chave da seção API

### Erro: "Database connection failed"
- **Causa**: Senha do banco incorreta
- **Solução**: Verifique ou reset a senha do banco

## 🔒 Segurança dos Secrets

### Boas Práticas

1. **Nunca compartilhe** os secrets em código ou comentários
2. **Use tokens com escopo limitado** quando possível
3. **Rotacione os tokens** periodicamente
4. **Monitore o uso** dos tokens no dashboard do Supabase

### Revogar Acesso

Se precisar revogar acesso:

1. **Access Token**: Vá para Account > Access Tokens e delete o token
2. **Service Role Key**: Regenere a chave em Settings > API
3. **Database Password**: Reset a senha em Settings > Database

## 📞 Suporte

Se você encontrar problemas:

1. **Verifique os logs** do workflow no GitHub Actions
2. **Consulte a documentação** do Supabase
3. **Abra uma issue** neste repositório com detalhes do erro

---

**💡 Dica**: Mantenha uma cópia backup destes valores em um gerenciador de senhas seguro!