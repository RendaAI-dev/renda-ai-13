# ✅ Checklist de Instalação - PoupeJá

Use este checklist para verificar se sua instalação foi concluída com sucesso.

## 🎯 Pré-Instalação

### Contas Necessárias
- [ ] Conta no GitHub criada
- [ ] Conta no Supabase criada
- [ ] Conta no Stripe criada (opcional, para pagamentos)

### Informações Coletadas
- [ ] **Supabase Project ID**: `________________`
- [ ] **Supabase Access Token**: Gerado e salvo
- [ ] **Service Role Key**: Copiado do dashboard
- [ ] **Database Password**: Definido/conhecido

## 🔧 Configuração do GitHub

### Fork e Secrets
- [ ] Repositório forkado para sua conta
- [ ] Secret `SUPABASE_ACCESS_TOKEN` adicionado
- [ ] Secret `SUPABASE_PROJECT_ID` adicionado  
- [ ] Secret `SUPABASE_SERVICE_ROLE_KEY` adicionado
- [ ] Secret `SUPABASE_DB_PASSWORD` adicionado

### Primeiro Deploy
- [ ] Workflow "Complete Supabase Deployment" executado
- [ ] Modo "fresh" selecionado na primeira execução
- [ ] Workflow concluído sem erros
- [ ] Todas as Edge Functions deployadas com sucesso

## 📊 Verificação do Banco de Dados

### Tabelas Criadas
- [ ] `poupeja_users` existe
- [ ] `poupeja_subscriptions` existe
- [ ] `poupeja_categories` existe
- [ ] `poupeja_transactions` existe
- [ ] `poupeja_goals` existe
- [ ] `poupeja_scheduled_transactions` existe
- [ ] `poupeja_settings` existe
- [ ] `poupeja_settings_history` existe
- [ ] `user_roles` existe

### Políticas RLS
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas de segurança configuradas
- [ ] Usuários podem acessar apenas seus próprios dados

### Funções e Triggers
- [ ] Trigger de criação de categorias padrão funciona
- [ ] Função de auditoria de settings configurada
- [ ] Funções auxiliares criadas

## 🔄 Verificação das Edge Functions

### Functions Deployadas
- [ ] `get-admin-settings` - Status: ✅/❌
- [ ] `update-admin-settings` - Status: ✅/❌
- [ ] `migrate-settings` - Status: ✅/❌
- [ ] `check-subscription-status` - Status: ✅/❌
- [ ] `create-admin-user` - Status: ✅/❌
- [ ] `create-checkout-session` - Status: ✅/❌
- [ ] `customer-portal` - Status: ✅/❌
- [ ] `recover-purchases` - Status: ✅/❌
- [ ] `stripe-webhook` - Status: ✅/❌
- [ ] `sync-subscriptions` - Status: ✅/❌

### Teste das Functions
- [ ] Functions respondem sem erro 404
- [ ] CORS configurado corretamente
- [ ] Autenticação funcionando

## 📦 Storage e Assets

### Buckets
- [ ] Bucket "uploads" criado
- [ ] Políticas de storage configuradas
- [ ] Upload de arquivos funcionando

## 👤 Primeiro Acesso

### Usuário Admin
- [ ] Usuário admin criado: `admin@example.com`
- [ ] Login realizado com senha temporária
- [ ] Senha alterada após primeiro login
- [ ] Perfil admin configurado

### Interface
- [ ] Aplicação carrega sem erros
- [ ] Dashboard principal acessível
- [ ] Painel administrativo (`/admin`) acessível
- [ ] Todas as páginas principais carregam

## ⚙️ Configurações Básicas

### Branding
- [ ] Nome da empresa configurado
- [ ] Logo carregado (se desejado)
- [ ] Cores personalizadas definidas
- [ ] Informações de contato atualizadas

### Sistema
- [ ] Idioma padrão configurado
- [ ] Moeda padrão configurada
- [ ] Configurações de email definidas

## 💳 Stripe (Opcional)

### Configuração Básica
- [ ] Chaves do Stripe configuradas
- [ ] Webhook endpoint configurado no Stripe
- [ ] Price IDs definidos
- [ ] Webhook secret configurado

### Teste de Pagamento
- [ ] Página de planos acessível
- [ ] Checkout funciona (teste)
- [ ] Webhook recebe eventos
- [ ] Status de assinatura atualiza

## 🧪 Testes Funcionais

### Autenticação
- [ ] Registro de novo usuário funciona
- [ ] Login/logout funciona
- [ ] Reset de senha funciona
- [ ] Confirmação de email funciona

### Funcionalidades Core
- [ ] Criar/editar categorias
- [ ] Adicionar/editar transações
- [ ] Criar/gerenciar metas
- [ ] Visualizar relatórios
- [ ] Transações agendadas funcionam

### PWA
- [ ] Service worker registrado
- [ ] App instalável
- [ ] Funciona offline (básico)

## 🚀 Deploy em Produção

### Frontend
- [ ] Aplicação deployada (Vercel/Netlify/outro)
- [ ] Domínio personalizado configurado (opcional)
- [ ] HTTPS habilitado
- [ ] Variáveis de ambiente configuradas

### Monitoramento
- [ ] Logs de error configurados
- [ ] Monitoramento de uptime (opcional)
- [ ] Backup automático configurado

## 📋 Pós-Instalação

### Documentação
- [ ] README.md customizado para sua organização
- [ ] Instruções de uso documentadas
- [ ] Contatos de suporte atualizados

### Segurança
- [ ] Secrets rotacionados (recomendado)
- [ ] Permissões verificadas
- [ ] Políticas de backup definidas

## 🔍 Verificação Final

Execute estes testes para confirmar que tudo está funcionando:

```bash
# 1. Verificar se as functions respondem
curl https://SEU_PROJECT_ID.supabase.co/functions/v1/get-admin-settings

# 2. Verificar autenticação (deve retornar erro de auth)
curl https://SEU_PROJECT_ID.supabase.co/functions/v1/check-subscription-status

# 3. Verificar se o site carrega
curl https://SEU_DOMINIO.com
```

### Status Final

- [ ] ✅ **Instalação Completa e Funcional**
- [ ] ⚠️ **Instalação Parcial** (especificar problemas):
  ```
  _________________________________
  _________________________________
  _________________________________
  ```
- [ ] ❌ **Instalação com Problemas** (especificar):
  ```
  _________________________________
  _________________________________
  _________________________________
  ```

## 📞 Próximos Passos

Após completar este checklist:

1. **Se tudo estiver ✅**: Parabéns! Sua instalação está completa
2. **Se houver ⚠️**: Revise as seções com problemas
3. **Se houver ❌**: Consulte a documentação de troubleshooting

---

**Data da Instalação**: _______________
**Responsável**: _______________
**Versão**: _______________