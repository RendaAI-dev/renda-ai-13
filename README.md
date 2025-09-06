# 💰 PoupeJá - Sistema Completo de Gestão Financeira

Sistema completo de gestão financeira pessoal com foco em facilidade de uso, automação e redistribuição para múltiplas organizações.

## 🚀 Características Principais

- **💳 Gestão Financeira Completa**: Receitas, despesas, categorias personalizáveis
- **🎯 Metas Financeiras**: Sistema de metas com acompanhamento visual
- **📅 Transações Recorrentes**: Agendamento e automação de pagamentos
- **📊 Relatórios Avançados**: Dashboards e análises detalhadas
- **💼 Assinaturas Premium**: Integração completa com Stripe
- **👤 Sistema de Admin**: Painel administrativo completo
- **🌍 Multi-idioma**: Português e Inglês
- **📱 PWA**: Funciona offline e instalável
- **🔄 Redistribuição Automática**: Deploy automático para novas organizações

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** + **shadcn/ui** para interface
- **React Router** para navegação
- **React Hook Form** + **Zod** para formulários
- **Recharts** para gráficos
- **Framer Motion** para animações

### Backend & Database
- **Supabase** (PostgreSQL + Auth + Storage + Edge Functions)
- **Row Level Security (RLS)** para segurança
- **Edge Functions** para APIs serverless
- **Stripe** para pagamentos

### DevOps & Deploy
- **GitHub Actions** para CI/CD automático
- **Vercel** para frontend
- **Supabase** para backend
- **Docker** ready para self-hosting

## 📋 Pré-requisitos para Instalação

### Para Desenvolvedores
- Node.js 18+ e npm
- Conta no Supabase
- Conta no Stripe (para pagamentos)
- Conta no GitHub (para CI/CD)

### Para Redistribuição
- Conta no Supabase (gratuita)
- Conta no GitHub (gratuita)
- Opcional: Conta no Stripe (para monetização)

## ⚡ Instalação Rápida (Redistribuição)

### 1. Preparar Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Anote as seguintes informações:
   - **Project URL**: `https://[PROJECT_ID].supabase.co`
   - **Project ID**: encontrado na URL acima
   - **API Key (anon/public)**: Em Settings > API
   - **Service Role Key**: Em Settings > API
   - **Database Password**: definida durante criação

### 2. Fazer Fork do Repositório

1. Acesse este repositório no GitHub
2. Clique em "Fork" no canto superior direito
3. Clone seu fork localmente:

```bash
git clone https://github.com/SEU_USUARIO/poupeja.git
cd poupeja
```

### 3. Configurar Secrets do GitHub

No seu repositório forkado, vá em **Settings > Secrets and variables > Actions** e adicione:

| Secret | Descrição | Onde Encontrar |
|--------|-----------|----------------|
| `SUPABASE_ACCESS_TOKEN` | Token de acesso pessoal | [Dashboard Supabase > Account > Access Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_ID` | ID do projeto | URL do projeto (parte após https://) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role | Project Settings > API > service_role |
| `SUPABASE_DB_PASSWORD` | Senha do banco | Definida na criação do projeto |

### 4. Deploy Automático

1. **Para Nova Instalação** (primeira vez):
   ```bash
   # No seu repositório forkado, vá em Actions
   # Execute o workflow "Complete Supabase Deployment"
   # Escolha "fresh" no setup_mode
   ```

2. **Para Atualizações** (instalações existentes):
   ```bash
   # Push qualquer alteração para a branch main
   # O deploy será automático
   ```

### 5. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` (para desenvolvimento local):

```env
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[SUA_ANON_KEY]
```

### 6. Executar Localmente (Opcional)

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Acessar: http://localhost:5173
```

## 🔐 Configuração Inicial

### Primeiro Acesso (Admin)

1. Acesse sua aplicação
2. Registre-se com o email: `admin@example.com`
3. Use a senha temporária: `admin123456`
4. **IMPORTANTE**: Altere a senha imediatamente após o primeiro login

### Configurar Integração Stripe (Opcional)

1. Acesse o painel administrativo (`/admin`)
2. Vá em "Configurações do Stripe"
3. Configure:
   - **Secret Key**: `sk_test_...` ou `sk_live_...`
   - **Webhook Secret**: Endpoint secret do webhook
   - **Price ID Monthly**: ID do preço mensal
   - **Price ID Annual**: ID do preço anual

### Personalizar Branding

1. No painel admin, vá em "Configurações de Marca"
2. Configure:
   - Nome da empresa
   - Logo (URL)
   - Cores personalizadas
   - Informações de contato

## 📁 Estrutura do Projeto

```
poupeja/
├── src/
│   ├── components/          # Componentes React
│   │   ├── admin/          # Painel administrativo
│   │   ├── auth/           # Autenticação
│   │   ├── common/         # Componentes reutilizáveis
│   │   ├── dashboard/      # Dashboard principal
│   │   ├── landing/        # Página inicial
│   │   └── ui/             # Componentes UI (shadcn)
│   ├── contexts/           # Contextos React
│   ├── hooks/             # Custom hooks
│   ├── pages/             # Páginas principais
│   ├── services/          # Serviços (API calls)
│   ├── translations/      # Arquivos de tradução
│   └── utils/             # Utilitários
├── supabase/
│   ├── functions/         # Edge Functions
│   └── migrations/        # Migrações SQL
├── .github/
│   └── workflows/         # GitHub Actions
└── public/               # Arquivos estáticos
```

## 🔄 Atualizações e Manutenção

### Atualizar da Versão Original

```bash
# Adicionar repositório original como remote
git remote add upstream https://github.com/REPO_ORIGINAL/poupeja.git

# Buscar atualizações
git fetch upstream

# Fazer merge das atualizações
git merge upstream/main

# Push para seu fork
git push origin main
```

### Backup do Banco de Dados

```bash
# Via CLI do Supabase
supabase db dump --linked > backup.sql

# Via interface web: Dashboard > Settings > Database > Backup
```

## 🚨 Solução de Problemas

### Erros Comuns

1. **"CORS Error" ou "Function not found"**
   - Verifique se as Edge Functions foram deployadas
   - Execute o workflow de deploy novamente

2. **"Database connection error"**
   - Verifique as configurações do Supabase
   - Confirme que as migrações foram aplicadas

3. **"Stripe webhook failed"**
   - Verifique se o webhook está configurado no Stripe
   - Confirme o endpoint: `https://[PROJECT_ID].supabase.co/functions/v1/stripe-webhook`

### Logs e Debug

```bash
# Ver logs das Edge Functions
supabase functions serve --debug

# Ver logs do banco
# Acesse: Dashboard > Logs > Database
```

## 📚 Documentação

### 📋 Instalação e Configuração
- **[Checklist de Instalação](./docs/installation/checklist.md)** - Lista completa de verificação
- **[Configuração do Admin](./docs/installation/admin-setup.md)** - Setup inicial do administrador

### 🚀 Deploy e CI/CD
- **[Configurar Secrets GitHub](./docs/deployment/github-secrets.md)** - Configuração básica
- **[Secrets Detalhados](./docs/deployment/github-secrets-detailed.md)** - Guia completo de configuração

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 💬 Suporte

- **Issues**: [GitHub Issues](./issues)
- **Discussões**: [GitHub Discussions](./discussions)
- **Email**: support@poupeja.com

## 🏆 Créditos

Desenvolvido com ❤️ usando as melhores tecnologias open source disponíveis.

---

**Nota**: Este projeto foi desenvolvido para ser facilmente redistribuível. Sinta-se livre para personalizá-lo e adaptá-lo às suas necessidades!