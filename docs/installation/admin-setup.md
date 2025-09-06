# Guia de Instalação e Configuração do Admin - PoupeJá

## 📋 Visão Geral

Este documento descreve o processo de instalação do sistema PoupeJá em um novo projeto Supabase e a configuração do usuário administrador padrão.

## 🚀 Instalação Automática

### Pré-requisitos
- Projeto Supabase criado
- GitHub Actions configurado
- Variáveis de ambiente definidas no GitHub Secrets

### Processo de Deploy

1. **Push para branch `main` ou `developer`** - O deploy acontece automaticamente
2. **Deploy manual** - Use o workflow "Deploy Supabase Complete" no GitHub Actions

### Usuário Admin Padrão

Durante a instalação, o sistema cria automaticamente:
- **Email:** `admin@admin.com`
- **Senha:** `admin123!`
- **Role:** `admin`

⚠️ **IMPORTANTE:** Altere a senha padrão no primeiro login!

## 🔧 Configuração Manual (se necessário)

### Se o admin não foi criado automaticamente:

1. **Chame a Edge Function create-admin-user:**
   - Via curl:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/create-admin-user \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
   ```
   
2. **Ou use o SQL Editor do Supabase:**
   - Execute o arquivo `VERIFICAR_ADMIN.sql` que contém instruções detalhadas
   
3. **Verificar se funcionou:**
```sql
SELECT * FROM public.verify_installation();
```

### Promover usuário existente a admin:

Se você já tem um usuário registrado e quer torná-lo admin:

```sql
-- Substitua 'seu-email@exemplo.com' pelo email do usuário
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'seu-email@exemplo.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

## 🛠️ Troubleshooting

### Problema: "User admin@admin.com not found"
**Solução:**
1. Chame a edge function: `POST /functions/v1/create-admin-user`
2. Ou execute o script `VERIFICAR_ADMIN.sql` no SQL Editor

### Problema: Admin não consegue acessar painel administrativo
**Verificações:**
1. Confirme que o usuário tem role 'admin':
```sql
SELECT u.email, ur.role 
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@admin.com';
```

2. Se não aparecer resultado, execute:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-admin-user \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Problema: Erro de login
**Solução:**
1. Verifique se o email está confirmado:
```sql
SELECT email, email_confirmed_at 
FROM auth.users 
WHERE email = 'admin@admin.com';
```

2. Se `email_confirmed_at` for null, execute:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW(), confirmed_at = NOW()
WHERE email = 'admin@admin.com';
```

## 📊 Verificação do Sistema

Use esta query para verificar se tudo está funcionando:

```sql
-- Verificação completa do sistema
SELECT * FROM public.verify_installation();
```

**Resultado esperado:**
- Admin User: OK
- Admin Role: OK  
- Default Categories: OK
- Storage Bucket: OK

## 🔒 Segurança

### Após a instalação:
1. **Altere a senha padrão** (`admin123!`) imediatamente
2. **Configure autenticação em dois fatores** (se disponível)
3. **Revise as permissões** do usuário admin
4. **Monitore os logs** de acesso administrativo

### Criação de novos admins:
1. **Registre o usuário** normalmente no sistema
2. **Use a Edge Function** `promote-to-admin` ou execute SQL manualmente
3. **Notifique o usuário** sobre suas novas permissões

## 📞 Suporte

Se encontrar problemas durante a instalação:

1. **Verifique os logs** do GitHub Actions
2. **Execute as queries de diagnóstico** listadas neste documento
3. **Consulte a documentação** do Supabase sobre autenticação
4. **Verifique as variáveis de ambiente** no projeto

## 🔄 Atualizações

Para atualizar uma instalação existente:
1. Use o modo "update" no GitHub Actions workflow
2. As migrações são aplicadas incrementalmente
3. Dados existentes são preservados

---

**Última atualização:** 2025-07-12
**Versão:** 1.0