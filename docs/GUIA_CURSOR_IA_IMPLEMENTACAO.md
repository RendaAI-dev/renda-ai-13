# 🚀 GUIA SIMPLIFICADO - IMPLEMENTAÇÃO COM CURSOR E IA

## 📋 RESUMO EXECUTIVO

Este guia orienta como aplicar **correções específicas** em outras instalações do sistema PoupeJá usando **Cursor com IA** de forma **segura e controlada**.

**IMPORTANTE:** Cada correção deve ser aplicada **uma por vez**, testada localmente e depois enviada para o GitHub.

---

## 🛠️ INSTALAÇÃO INICIAL - LINKS DE DOWNLOAD

### **PASSO 1: INSTALAR O CURSOR**

#### **Links de Download:**
- **Site Oficial:** https://cursor.com/


#### **Processo de Instalação:**
1. Baixe o arquivo `.exe` (Windows) ou `.dmg` (macOS)
2. Execute o instalador
3. Siga as instruções na tela
4. Reinicie o computador se necessário

---

### **PASSO 2: INSTALAR NODE.JS**

#### **Links de Download:**
- **Site Oficial:** https://nodejs.org/pt/download

-

#### **Processo de Instalação:**
1. Baixe a versão LTS (Long Term Support)
2. Execute o instalador
3. **IMPORTANTE:** Marque a opção "Add to PATH"
4. Clique em "Install"
5. Reinicie o terminal após instalação

#### **Verificar Instalação:**
```bash
node --version
npm --version
```

---

### **PASSO 3: INSTALAR GIT**

#### **Links de Download:**

- **Windows:** https://git-scm.com/download/win

#### **Processo de Instalação (Windows):**
1. Baixe o instalador do Git
2. Execute como administrador
3. **Configurações Recomendadas:**
   - Editor: "Use Visual Studio Code as Git's default editor"
   - PATH: "Git from the command line and also from 3rd-party software"
   - HTTPS: "Use the OpenSSL library"
   - Line endings: "Checkout Windows-style, commit Unix-style line endings"
   - Terminal: "Use Windows' default console window"

---

### **PASSO 4: VERIFICAR INSTALAÇÕES**

#### **Comandos de Verificação:**
```bash
# Verificar Node.js
node --version
npm --version

# Verificar Git
git --version

# Verificar Cursor (deve abrir o editor)
cursor --version
```

#### **Resultados Esperados:**
```
node --version
> v20.11.0

npm --version
> 10.2.4

git --version
> git version 2.40.0.windows.1
```

---

### **PASSO 5: CONFIGURAR AMBIENTE**

#### **Clonar Repositório no Cursor:**
```bash
# No Cursor, usar Ctrl+Shift+P e digitar "Git: Clone"
# Ou usar o comando: git clone https://github.com/SEU-USER-GIT/SEU-DIR-GIT.git
```

#### **Instalar Dependências:**
Após o clone, o Cursor abrirá automaticamente o projeto. Para instalar as dependências:
```bash
# No terminal do Cursor (Ctrl + `), executar:
npm install
```

---

### **PASSO 6: VARIÁVEIS DE AMBIENTE PARA TESTE LOCAL**

**IMPORTANTE:** Este arquivo `.env` é apenas para uso local e **NÃO deve ser enviado para o GitHub** pois contém informações sensíveis.

#### **Como Criar o Arquivo .env.local:**

1. **Na raiz do projeto, criar arquivo `.env.local`:**
   - Abra o Cursor
   - Navegue até a pasta raiz do projeto
   - Clique com botão direito → "New File"
   - Digite o nome: `.env.local`

2. **Adicionar as variáveis necessárias:**
```bash
# Supabase Configuration
VITE_SUPABASE_URL=http://SUA-URL-SUPABASE-PROJECT
VITE_SUPABASE_ANON_KEY=SUA-CHAVE-SUPABASE-ANON-KEY
```

3. **Substituir pelos valores reais:**
   - **VITE_SUPABASE_URL:** URL do seu projeto Supabase
   - **VITE_SUPABASE_ANON_KEY:** Chave anônima do seu projeto Supabase

#### **Como Obter as Credenciais do Supabase:**

1. **Acessar o Dashboard do Supabase:**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta

2. **Selecionar o Projeto:**
   - Clique no projeto que você quer usar
   - Ou crie um novo projeto se necessário

### **Abrir o Projeto local e conferir**
**IMPORTANTE:** Faça isso para conferir se o banco de dados está conectado localmente e também para verificar como está o projeto atualmente e conseguir testar todas as atualizações.

```bash
npm run dev

```



## 🎯 CORREÇÕES ESPECÍFICAS

### **1. CORREÇÃO DO SCROLL INFINITO NO MOBILE**

#### **PASSO 1: Abrir documentação**
- Abrir arquivo: `docs/Correções de Bugs com IA/MOBILE_SCROLL_INFINITE_FIX.md`
- Copiar todo o conteúdo

#### **PASSO 2: Prompt para o Cursor com IA**
```
Preciso corrigir o scroll infinito no mobile conforme documentação. 
Aqui está a documentação completa:

[COLE AQUI O CONTEÚDO DE docs/Correções de Bugs com IA/MOBILE_SCROLL_INFINITE_FIX.md]

Por favor, aplique TODAS as mudanças documentadas nos arquivos:
- src/components/layout/MainLayout.tsx
- src/pages/TransactionsPage.tsx
- src/pages/SchedulePage.tsx
- src/pages/ExpensesPage.tsx
- src/pages/Index.tsx
- src/pages/GoalsPage.tsx

Corrija o layout mobile para evitar scroll infinito e tela vazia.
NÃO modifique nada além do que está especificado na documentação.
```

#### **PASSO 3: Verificar mudanças**
```bash
git status
git diff
npm run build
```

**O que faz cada comando:**
- **`git status`** - Mostra quais arquivos foram modificados, adicionados ou removidos
- **`git diff`** - Mostra exatamente o que foi alterado em cada arquivo (diferenças linha por linha)
- **`npm run build`** - Compila o projeto para verificar se não há erros de TypeScript ou build

#### **PASSO 4: Testar localmente**
```bash
npm run dev
```
**Abrir no navegador:** http://localhost:8080
**Testar:** Rolar até o final das páginas no mobile para verificar se o scroll infinito foi corrigido

#### **PASSO 5: Deploy**
```bash
git add .; git commit -m "fix: corrigir scroll infinito no mobile - remover min-h-screen conflitante, ajustar overflow e padding para evitar tela vazia infinita em dispositivos móveis"; git push origin main
```

#### *Execute esse comando caso ao executar o comando acima, apresente a mensagem de erro de usuário no Git. Coloque suas informações de Nome e email do Git* 
git config user.name "Seu Nome"
git config user.email "seu@email.com"
---

### **2. CORREÇÃO DO RESET DE SENHA**

#### **PASSO 1: Abrir documentação**
- Abrir arquivo: `docs/Correções de Bugs com IA/RESET_PASSWORD_CONFIGURATION_PLAN.md`
- Copiar todo o conteúdo

#### **PASSO 2: Prompt para o Cursor com IA**
```
Preciso corrigir o reset de senha conforme documentação. 
Aqui está a documentação completa:

[COLE AQUI O CONTEÚDO DE docs/Correções de Bugs com IA/RESET_PASSWORD_CONFIGURATION_PLAN.md]

Por favor, aplique TODAS as mudanças documentadas no arquivo src/pages/ResetPasswordPage.tsx.
Remova verificação de parâmetros URL e use apenas validação de sessão do Supabase.
NÃO modifique nada além do que está especificado na documentação.
```

#### **PASSO 3: Verificar mudanças**
```bash
git status
git diff
npm run build
```

**O que faz cada comando:**
- **`git status`** - Mostra quais arquivos foram modificados, adicionados ou removidos
- **`git diff`** - Mostra exatamente o que foi alterado em cada arquivo (diferenças linha por linha)
- **`npm run build`** - Compila o projeto para verificar se não há erros de TypeScript ou build

#### **PASSO 4: Testar localmente**
```bash
npm run dev
```
**Abrir no navegador:** http://localhost:5173
**Testar:** Acessar página de reset de senha e verificar se não mostra "Link inválido"

#### **PASSO 5: Deploy**
```bash
git add .; git commit -m "fix: corrigir reset de senha - remover verificação de parâmetros URL e usar apenas validação de sessão do Supabase"; git push origin main
```

---

### **3. CORREÇÃO BUG EDIÇÃO DE METAS**

#### **PASSO 1: Abrir documentação**
- Abrir arquivo: `docs/Correções de Bugs com IA/GOAL_EDIT_BUG_FIX.md`
- Copiar todo o conteúdo

#### **PASSO 2: Prompt para o Cursor com IA**
```
Preciso corrigir o bug de edição de metas conforme documentação. 
Aqui está a documentação completa:

[COLE AQUI O CONTEÚDO DE docs/Correções de Bugs com IA/GOAL_EDIT_BUG_FIX.md]

Por favor, aplique TODAS as mudanças documentadas nos arquivos:
- src/components/common/GoalForm.tsx
- src/pages/GoalsPage.tsx

Adicione useEffect para reset do formulário e corrija formatação monetária.
NÃO modifique nada além do que está especificado na documentação.
```

#### **PASSO 3: Verificar mudanças**
```bash
git status
git diff
npm run build
```

**O que faz cada comando:**
- **`git status`** - Mostra quais arquivos foram modificados, adicionados ou removidos
- **`git diff`** - Mostra exatamente o que foi alterado em cada arquivo (diferenças linha por linha)
- **`npm run build`** - Compila o projeto para verificar se não há erros de TypeScript ou build

#### **PASSO 4: Testar localmente**
```bash
npm run dev
```
**Abrir no navegador:** http://localhost:5173
**Testar:** Editar uma meta existente e verificar se os dados aparecem corretos e se a formatação monetária está com espaço após R$

#### **PASSO 5: Deploy**
```bash
git add .; git commit -m "fix: corrigir bug formulário zerado na edição de metas + formatação monetária - implementar useEffect, melhorar gerenciamento de estado, adicionar espaço após R$ e ajustar padding dos inputs"; git push origin main
```

---

### **4. CORREÇÃO DE TRADUÇÕES - PÁGINAS DE AUTENTICAÇÃO**

#### **PASSO 1: Abrir documentação**
- Abrir arquivo: `docs/Correções de Bugs com IA/TRANSLATION_FIX_AUTH_PAGES.md`
- Copiar todo o conteúdo

#### **PASSO 2: Prompt para o Cursor com IA**
```
Preciso corrigir as traduções das páginas de autenticação conforme documentação. 
Aqui está a documentação completa:

[COLE AQUI O CONTEÚDO DE docs/Correções de Bugs com IA/TRANSLATION_FIX_AUTH_PAGES.md]

Por favor, aplique TODAS as mudanças documentadas nos arquivos listados.
Adicione traduções específicas para reset-password e forgot-password.
NÃO modifique nada além do que está especificado na documentação.
```

#### **PASSO 3: Verificar mudanças**
```bash
git status
git diff
npm run build
```

**O que faz cada comando:**
- **`git status`** - Mostra quais arquivos foram modificados, adicionados ou removidos
- **`git diff`** - Mostra exatamente o que foi alterado em cada arquivo (diferenças linha por linha)
- **`npm run build`** - Compila o projeto para verificar se não há erros de TypeScript ou build

#### **PASSO 4: Testar localmente**
```bash
npm run dev
```
**Abrir no navegador:** http://localhost:5173
**Testar:** Acessar páginas de reset e forgot password e verificar se não mostra "auth.welcomeBack"

#### **PASSO 5: Deploy**
```bash
git add .; git commit -m "fix: corrigir traduções das páginas de autenticação - adicionar traduções específicas para reset-password e forgot-password + atualizar páginas para usar traduções corretas"; git push origin main
```

---

### **5. ADIÇÃO OPÇÃO "CATEGORIAS" NO MENU MOBILE**

#### **PASSO 1: Abrir documentação**
- Abrir arquivo: `docs/Correções de Bugs com IA/MOBILE_CATEGORIES_MENU_ADDITION.md`
- Copiar todo o conteúdo

#### **PASSO 2: Prompt para o Cursor com IA**
```
Preciso adicionar a opção "Categorias" no menu mobile conforme documentação. 
Aqui está a documentação completa:

[COLE AQUI O CONTEÚDO DE docs/Correções de Bugs com IA/MOBILE_CATEGORIES_MENU_ADDITION.md]

Por favor, aplique TODAS as mudanças documentadas no arquivo:
- src/components/layout/MobileNavBar.tsx

Implemente acesso direto à página de categorias com ícone Tag e cores indigo.
NÃO modifique nada além do que está especificado na documentação.
```

#### **PASSO 3: Verificar mudanças**
```bash
git status
git diff
npm run build
```

**O que faz cada comando:**
- **`git status`** - Mostra quais arquivos foram modificados, adicionados ou removidos
- **`git diff`** - Mostra exatamente o que foi alterado em cada arquivo (diferenças linha por linha)
- **`npm run build`** - Compila o projeto para verificar se não há erros de TypeScript ou build

#### **PASSO 4: Testar localmente**
```bash
npm run dev
```
**Abrir no navegador:** http://localhost:5173
**Testar:** No mobile, verificar se a opção "Categorias" aparece no menu e se navega para a página de categorias

#### **PASSO 5: Deploy**
```bash
git add .; git commit -m "feat: adicionar opção 'Categorias' no menu mobile - implementar acesso direto à página de categorias com ícone Tag e cores indigo"; git push origin main
```

---

### **6. CORREÇÃO DA LOGO NO MOBILE**

#### **PASSO 1: Abrir documentação**
- Abrir arquivo: `docs/Correções de Bugs com IA/MOBILE_LOGO_FIX_IMPLEMENTATION.md`
- Copiar todo o conteúdo

#### **PASSO 2: Prompt para o Cursor com IA**
```
Preciso adicionar a logo personalizada no header mobile conforme documentação. 
Aqui está a documentação completa:

[COLE AQUI O CONTEÚDO DE docs/Correções de Bugs com IA/MOBILE_LOGO_FIX_IMPLEMENTATION.md]

Por favor, aplique TODAS as mudanças documentadas no arquivo src/components/layout/MobileHeader.tsx.
Implemente BrandLogo no MobileHeader para exibir marca da empresa.
NÃO modifique nada além do que está especificado na documentação.
```

#### **PASSO 3: Verificar mudanças**
```bash
git status
git diff
npm run build
```

**O que faz cada comando:**
- **`git status`** - Mostra quais arquivos foram modificados, adicionados ou removidos
- **`git diff`** - Mostra exatamente o que foi alterado em cada arquivo (diferenças linha por linha)
- **`npm run build`** - Compila o projeto para verificar se não há erros de TypeScript ou build

#### **PASSO 4: Testar localmente**
```bash
npm run dev
```
**Abrir no navegador:** http://localhost:5173
**Testar:** No mobile, verificar se a logo aparece no header mobile

#### **PASSO 5: Deploy**
```bash
git add .; git commit -m "feat: adicionar logo personalizada no header mobile - implementar BrandLogo no MobileHeader para exibir marca da empresa em dispositivos móveis"; git push origin main
```

---

### **7. CORREÇÃO DO FLASH DA LOGO PADRÃO**

#### **PASSO 1: Abrir documentação**
- Abrir arquivo: `docs/Correções de Bugs com IA/BRANDING_FLASH_FIX_IMPLEMENTATION.md`
- Copiar todo o conteúdo

#### **PASSO 2: Prompt para o Cursor com IA**
```
Preciso corrigir o flash da logo padrão conforme documentação. 
Aqui está a documentação completa:

[COLE AQUI O CONTEÚDO DE docs/Correções de Bugs com IA/BRANDING_FLASH_FIX_IMPLEMENTATION.md]

Por favor, aplique TODAS as mudanças documentadas nos arquivos listados.
Implemente sistema de cache e preload de branding para eliminar flash da logo padrão.
NÃO modifique nada além do que está especificado na documentação.
```

#### **PASSO 3: Verificar mudanças**
```bash
git status
git diff
npm run build
```

**O que faz cada comando:**
- **`git status`** - Mostra quais arquivos foram modificados, adicionados ou removidos
- **`git diff`** - Mostra exatamente o que foi alterado em cada arquivo (diferenças linha por linha)
- **`npm run build`** - Compila o projeto para verificar se não há erros de TypeScript ou build

#### **PASSO 4: Testar localmente**
```bash
npm run dev
```
**Abrir no navegador:** http://localhost:5173
**Testar:** Recarregar a página e verificar se não há flash da logo padrão

#### **PASSO 5: Deploy**
```bash
git add .; git commit -m "feat: corrigir flash da logo padrão - implementar sistema de cache e preload de branding para eliminar exibição temporária da logo padrão"; git push origin main
```

---

### **8. REATIVAÇÃO DO BOTÃO WHATSAPP**

#### **PASSO 1: Abrir documentação**
- Abrir arquivo: `docs/Correções de Bugs com IA/WHATSAPP_BUTTON_ACTIVATION_GUIDE.md`
- Copiar todo o conteúdo

#### **PASSO 2: Prompt para o Cursor com IA**
```
Preciso reativar o botão flutuante do WhatsApp conforme documentação. 
Aqui está a documentação completa:

[COLE AQUI O CONTEÚDO DE docs/Correções de Bugs com IA/WHATSAPP_BUTTON_ACTIVATION_GUIDE.md]

Por favor, aplique TODAS as mudanças documentadas no arquivo src/components/layout/MainLayout.tsx.
Adicione WhatsAppActivationButton no MainLayout.
NÃO modifique nada além do que está especificado na documentação.
```

#### **PASSO 3: Verificar mudanças**
```bash
git status
git diff
npm run build
```

**O que faz cada comando:**
- **`git status`** - Mostra quais arquivos foram modificados, adicionados ou removidos
- **`git diff`** - Mostra exatamente o que foi alterado em cada arquivo (diferenças linha por linha)
- **`npm run build`** - Compila o projeto para verificar se não há erros de TypeScript ou build

#### **PASSO 4: Testar localmente**
```bash
npm run dev
```
**Abrir no navegador:** http://localhost:5173
**Testar:** Verificar se o botão WhatsApp aparece e testar sua funcionalidade

#### **PASSO 5: Deploy**
```bash
git add .; git commit -m "feat: reativar botão flutuante do WhatsApp - adicionar WhatsAppActivationButton no MainLayout para suporte via WhatsApp"; git push origin main
```

---

### **9. PERSONALIZAÇÃO DO NOME DA EMPRESA NO RELATÓRIO PDF**

#### **PASSO 1: Abrir documentação**
- Abrir arquivo: `docs/Correções de Bugs com IA/PDF_REPORT_BRANDING_FIX.md`
- Copiar todo o conteúdo

#### **PASSO 2: Prompt para o Cursor com IA**
```
Preciso personalizar o nome da empresa no relatório PDF conforme documentação. 
Aqui está a documentação completa:

[COLE AQUI O CONTEÚDO DE docs/CorreÇÕES DE BUGS COM IA/PDF_REPORT_BRANDING_FIX.md]

Por favor, aplique TODAS as mudanças documentadas nos arquivos:
- src/utils/reportUtils.ts
- src/pages/ReportsPage.tsx

Integre configurações de branding para título e nome do arquivo do relatório.
NÃO modifique nada além do que está especificado na documentação.
```

#### **PASSO 3: Verificar mudanças**
```bash
git status
git diff
npm run build
```

**O que faz cada comando:**
- **`git status`** - Mostra quais arquivos foram modificados, adicionados ou removidos
- **`git diff`** - Mostra exatamente o que foi alterado em cada arquivo (diferenças linha por linha)
- **`npm run build`** - Compila o projeto para verificar se não há erros de TypeScript ou build

#### **PASSO 4: Testar localmente**
```bash
npm run dev
```
**Abrir no navegador:** http://localhost:5173
**Testar:** Gerar um relatório PDF e verificar se o nome da empresa aparece corretamente

#### **PASSO 5: Deploy**
```bash
git add .; git commit -m "feat: personalizar nome da empresa no relatório PDF - integrar configurações de branding para título e nome do arquivo do relatório"; git push origin main
```

---

### **10. CORREÇÃO DE TIMEZONE NOS GRÁFICOS DO DASHBOARD**

#### **PASSO 1: Abrir documentação**
- Abrir arquivo: `docs/Correções de Bugs com IA/DASHBOARD_CHARTS_TIMEZONE_FIX.md`
- Copiar todo o conteúdo

#### **PASSO 2: Prompt para o Cursor com IA**
```
Preciso corrigir o timezone nos gráficos do dashboard conforme documentação. 
Aqui está a documentação completa:

[COLE AQUI O CONTEÚDO DE docs/Correções de Bugs com IA/DASHBOARD_CHARTS_TIMEZONE_FIX.md]

Por favor, aplique TODAS as mudanças documentadas nos arquivos:
- src/utils/transactionUtils.ts
- src/components/dashboard/DashboardCharts.tsx

Implemente createLocalDate para processamento correto de datas.
NÃO modifique nada além do que está especificado na documentação.
```

#### **PASSO 3: Verificar mudanças**
```bash
git status
git diff
npm run build
```

**O que faz cada comando:**
- **`git status`** - Mostra quais arquivos foram modificados, adicionados ou removidos
- **`git diff`** - Mostra exatamente o que foi alterado em cada arquivo (diferenças linha por linha)
- **`npm run build`** - Compila o projeto para verificar se não há erros de TypeScript ou build

#### **PASSO 4: Testar localmente**
```bash
npm run dev
```
**Abrir no navegador:** http://localhost:5173
**Testar:** Criar uma transação em 01/Ago e verificar se aparece corretamente no gráfico do dashboard

#### **PASSO 5: Deploy**
```bash
git add .; git commit -m "fix: corrigir timezone nos gráficos do dashboard - implementar range de datas com horário específico e logs de debug para evitar exibição incorreta de transações"; git push origin main
```

---

### **11. PERSONALIZAÇÃO DO PWA**

#### **PASSO 1: Abrir documentação**
- Abrir arquivo: `docs/Correções de Bugs com IA/PWA_BRANDING_PERSONALIZATION.md`
- Copiar todo o conteúdo

#### **PASSO 2: Prompt para o Cursor com IA**
```
Preciso implementar um sistema completo de geração dinâmica de PWA manifest baseado nas configurações de branding do banco de dados. 

[COLE AQUI O CONTEÚDO DE docs/Correções de Bugs com IA/PWA_MANIFEST_GENERATOR_IMPLEMENTATION]

O sistema deve incluir:

1. Uma Edge Function Supabase chamada "generate-pwa-manifest" que:
   - Busca configurações de branding da tabela poupeja_settings
   - Gera manifest.json e service worker personalizados
   - Retorna arquivos para download/cópia
   - Trata caracteres UTF-8 corrompidos

2. Um componente React PWAManifestGenerator que:
   - Permite gerar os arquivos PWA
   - Exibe informações da empresa
   - Oferece download e cópia dos arquivos
   - Tem campo para configurar GitHub (USUARIO/REPOSITORIO)
   - Botão para abrir GitHub na pasta public/

3. Integração no painel admin:
   - Nova aba "PWA" no AdminSectionTabs
   - Alterar grid-cols-5 para grid-cols-6
   - Adicionar imports necessários

4. Arquivos PWA padrão:
   - public/manifest.json com configurações básicas
   - public/sw.js com service worker básico

5. Modificação no HTML:
   - Adicionar <link rel="manifest" href="/manifest.json" />

6. Atualização do workflow GitHub Actions:
   - Adicionar deploy da função generate-pwa-manifest

Por favor, implemente todos esses componentes seguindo exatamente as especificações técnicas fornecidas no documento de implementação. Use os códigos completos fornecidos para cada arquivo.
NÃO modifique nada além do que está especificado na documentação.
```

#### **PASSO 3: Verificar mudanças**
```bash
git status
git diff
npm run build
```

**O que faz cada comando:**
- **`git status`** - Mostra quais arquivos foram modificados, adicionados ou removidos
- **`git diff`** - Mostra exatamente o que foi alterado em cada arquivo (diferenças linha por linha)
- **`npm run build`** - Compila o projeto para verificar se não há erros de TypeScript ou build

#### **PASSO 4: Testar localmente**
```bash
npm run dev
```
**Abrir no navegador:** http://localhost:5173
**Testar:** Verificar se o PWA instala corretamente e se o branding personalizado aparece

#### **PASSO 5: Deploy**
```bash
git add .; git commit -m "feat: implementar gerador de manifest PWA personalizado"; git push origin main
```

---

### **12. CORREÇÃO DO NOME HARDCODED NO SUBSCRIPTION GUARD**

#### **PASSO 1: Abrir documentação**
- Abrir arquivo: `docs/Correções de Bugs com IA/12 - SUBSCRIPTION_GUARD_BRANDING_FIX.md`
- Copiar todo o conteúdo

#### **PASSO 2: Prompt para o Cursor com IA**
```
Preciso corrigir o nome hardcoded "PoupeJá" na tela de assinatura necessária (SubscriptionGuard), substituindo-o pelo nome da empresa obtido dinamicamente das configurações de branding.

[COLE AQUI O CONTEÚDO DE docs/Correções de Bugs com IA/12 - SUBSCRIPTION_GUARD_BRANDING_FIX.md]

O sistema deve corrigir:

1. O texto hardcoded "PoupeJá" no componente SubscriptionGuard que aparece quando:
   - O usuário não tem uma assinatura ativa
   - A assinatura do usuário expirou

2. A solução deve:
   - Importar o hook useBrandingConfig
   - Obter o nome da empresa via companyName
   - Substituir o texto hardcoded pelo nome dinâmico da empresa

Por favor, implemente a correção seguindo exatamente as especificações técnicas fornecidas no documento. Modifique apenas o arquivo src/components/subscription/SubscriptionGuard.tsx conforme descrito.
```

#### **PASSO 3: Verificar mudanças**
```bash
git status
git diff src/components/subscription/SubscriptionGuard.tsx
```

**O que faz cada comando:**
- **`git status`** - Confirma que apenas o arquivo SubscriptionGuard.tsx foi modificado
- **`git diff`** - Verifica exatamente o que foi alterado (adição do import, uso do hook e substituição do texto)

#### **PASSO 4: Testar localmente**
```bash
npm run dev
```
**Abrir no navegador:** http://localhost:5173

**Testar:**
1. Abrir o painel de administração e configurar um nome de empresa personalizado
2. Desativar/expirar sua assinatura no banco de dados (ou usar uma conta sem assinatura)
3. Tentar acessar uma funcionalidade protegida
4. Verificar se a mensagem de assinatura necessária exibe o nome da empresa configurado (não "PoupeJá")

#### **PASSO 5: Deploy**
```bash
git add .; git commit -m "fix: corrigir nome hardcoded Poupe Já para usuários que não tem plano ativo, em SubscriptionGuard"; git push origin main
```

---

### **13. CORREÇÃO COMPLETA DO GERADOR DE HTML ESTÁTICO**

#### **PASSO 1: Abrir documentação**
- Abrir arquivo: `docs/Correções de Bugs com IA/13 - STATIC_HTML_GENERATOR_COMPLETE_FIX.md`
- Copiar todo o conteúdo

#### **PASSO 2: Prompt para o Cursor com IA**
```
Preciso corrigir completamente o gerador de HTML estático conforme documentação. 
Aqui está a documentação completa:

[COLE AQUI O CONTEÚDO DE docs/Correções de Bugs com IA/13 - STATIC_HTML_GENERATOR_COMPLETE_FIX.md]

O sistema deve corrigir:

1. **Template HTML Incompleto**: Adicionar tag para manifesto PWA e script de pré-carregamento do branding
2. **Interface Visual Inconsistente**: Corrigir seções com fundo branco/claro para tema escuro
3. **Funcionalidade GitHub Limitada**: Substituir link estático por configuração dinâmica
4. **Fluxo de Trabalho Confuso**: Reordenar seções seguindo lógica de uso

Por favor, aplique TODAS as mudanças documentadas nos arquivos:
- supabase/functions/generate-html/index.ts
- src/components/admin/StaticHtmlGenerator.tsx

Implemente correções de template HTML, interface visual, funcionalidade GitHub e reordenação de seções.
NÃO modifique nada além do que está especificado na documentação.
```

#### **PASSO 3: Verificar mudanças**
```bash
git status
git diff
npm run build
```

**O que faz cada comando:**
- **`git status`** - Mostra quais arquivos foram modificados, adicionados ou removidos
- **`git diff`** - Mostra exatamente o que foi alterado em cada arquivo (diferenças linha por linha)
- **`npm run build`** - Compila o projeto para verificar se não há erros de TypeScript ou build

#### **PASSO 4: Testar localmente**
```bash
npm run dev
```
**Abrir no navegador:** http://localhost:5173

**Testar:**
1. Acessar o painel de administração
2. Ir até "Configurações de Branding"
3. Role até "Gerador de HTML Estático"
4. Clicar em "Gerar HTML Otimizado"
5. Verificar se:
   - O HTML gerado contém a tag do manifesto PWA
   - O HTML gerado contém o script de pré-carregamento
   - Todas as seções têm fundo escuro
   - A ordem das seções segue o fluxo lógico
   - A configuração do GitHub funciona corretamente

#### **PASSO 5: Deploy**
```bash
git add .; git commit -m "fix: corrigir completamente gerador de HTML estático - template HTML, interface visual, funcionalidade GitHub e reordenação de seções"; git push origin main
```

## 🧪 TESTES DE VALIDAÇÃO

### **TESTES OBRIGATÓRIOS APÓS CADA CORREÇÃO:**

#### **1. SCROLL INFINITO MOBILE**
- ✅ Rolar até o final da página no mobile
- ✅ Verificar se não há tela vazia infinita
- ✅ Confirmar que o scroll para no final do conteúdo
- ✅ Testar em todas as páginas principais

#### **2. RESET DE SENHA**
- ✅ Testar reset de senha com link válido
- ✅ Verificar se não mostra "Link inválido"

#### **3. BUG EDIÇÃO DE METAS**
- ✅ Editar meta existente e verificar se dados aparecem corretos
- ✅ Verificar formatação monetária com espaço após R$

#### **4. TRADUÇÕES**
- ✅ Verificar páginas de reset e forgot password
- ✅ Confirmar que não mostra "auth.welcomeBack"

#### **5. MENU MOBILE**
- ✅ Verificar se opção "Categorias" aparece no menu mobile
- ✅ Testar navegação para a página de categorias

#### **6. LOGO MOBILE**
- ✅ Verificar se logo aparece no header mobile
- ✅ Testar em diferentes dispositivos

#### **7. FLASH DA LOGO**
- ✅ Recarregar página e verificar se não há flash da logo padrão
- ✅ Testar em diferentes navegadores

#### **8. BOTÃO WHATSAPP**
- ✅ Verificar se botão WhatsApp aparece
- ✅ Testar funcionalidade do botão

#### **9. RELATÓRIO PDF**
- ✅ Gerar relatório PDF e verificar nome da empresa
- ✅ Confirmar que não mostra "Poupeja" hardcoded

#### **10. TIMEZONE DASHBOARD**
- ✅ Criar transação em 01/Ago e verificar se aparece corretamente no gráfico
- ✅ Navegar entre meses e verificar dados corretos

#### **11. PWA**
- ✅ Verificar se PWA instala corretamente
- ✅ Testar branding personalizado no PWA

#### **12. SUBSCRIPTION GUARD**
- ✅ Verificar se nome da empresa aparece corretamente na tela de assinatura necessária
- ✅ Confirmar que não mostra "PoupeJá" hardcoded

#### **13. GERADOR DE HTML ESTÁTICO**
- ✅ Verificar se HTML gerado contém tag do manifesto PWA
- ✅ Confirmar se HTML gerado contém script de pré-carregamento
- ✅ Testar se todas as seções têm fundo escuro
- ✅ Verificar se ordem das seções segue fluxo lógico
- ✅ Testar se configuração do GitHub funciona corretamente

---

## 🚨 TROUBLESHOOTING

### **SE O BUILD FALHAR:**
1. **Verificar erros de TypeScript** no Cursor
2. **Verificar imports** dos arquivos modificados
3. **Verificar sintaxe** das mudanças aplicadas
4. **Consultar documentação específica** da correção

### **SE A FUNCIONALIDADE NÃO FUNCIONAR:**
1. **Verificar logs do console** do navegador
2. **Verificar se todas as mudanças foram aplicadas** corretamente
3. **Testar em ambiente limpo** (nova aba do navegador)
4. **Consultar documentação específica** da correção

### **SE HOUVER CONFLITOS:**
1. **Fazer backup** das mudanças atuais
2. **Resolver conflitos manualmente** no Cursor
3. **Testar após resolução** (`npm run build`)
4. **Fazer commit da resolução**

---

## 📊 MONITORAMENTO

### **INDICADORES DE SUCESSO:**
- ✅ Build sem erros (`npm run build`)
- ✅ Funcionalidades testadas e funcionando
- ✅ Interface funcionando corretamente
- ✅ Deploy realizado com sucesso

---

## 🎯 RECOMENDAÇÕES FINAIS

### **ANTES DE COMEÇAR:**
1. **Planejar tempo** - Reserve pelo menos 3-4 horas
2. **Preparar ambiente** - Tenha tudo configurado
3. **Fazer backup** - Sempre antes de começar
4. **Testar localmente** - Antes de fazer deploy

### **DURANTE A IMPLEMENTAÇÃO:**
1. **Uma correção por vez** - Não misture correções
2. **Testar cada correção** - Antes de prosseguir
3. **Documentar problemas** - Para referência futura
4. **Manter backup** - Em caso de rollback

### **APÓS A IMPLEMENTAÇÃO:**
1. **Testar tudo** - Funcionalidades principais
2. **Monitorar logs** - Para identificar problemas
3. **Documentar resultado** - Para outras instalações
4. **Planejar próximos passos** - Se necessário

---

## 📞 SUPORTE

### **DOCUMENTAÇÃO DISPONÍVEL:**
- **`docs/Correções de Bugs com IA/MOBILE_SCROLL_INFINITE_FIX.md`** - Correção do scroll infinito no mobile
- **`docs/Correções de Bugs com IA/DASHBOARD_CHARTS_TIMEZONE_FIX.md`** - Correção de timezone
- **`docs/Correções de Bugs com IA/GOAL_EDIT_BUG_FIX.md`** - Correção de metas
- **`docs/Correções de Bugs com IA/PDF_REPORT_BRANDING_FIX.md`** - Correção do PDF
- **`docs/Correções de Bugs com IA/MOBILE_CATEGORIES_MENU_ADDITION.md`** - Adição opção Categorias no menu mobile
- **`docs/Correções de Bugs com IA/12 - SUBSCRIPTION_GUARD_BRANDING_FIX.md`** - Correção do nome hardcoded no SubscriptionGuard
- **`docs/Correções de Bugs com IA/13 - STATIC_HTML_GENERATOR_COMPLETE_FIX.md`** - Correção completa do gerador de HTML estático

### **EM CASO DE PROBLEMAS:**
1. **Consultar documentação específica** da correção
2. **Verificar logs de debug** no console do navegador
3. **Testar em ambiente isolado** (nova aba)
4. **Fazer rollback** se necessário usando git

---

## 🚨 PLANO DE CONTINGÊNCIA

### **SE ALGUMA CORREÇÃO NÃO FUNCIONAR:**

#### **1. VERIFICAÇÃO IMEDIATA:**
- ✅ **Verificar se há conflitos CSS** com outros componentes
- ✅ **Testar em diferentes navegadores** (Chrome, Firefox, Safari)
- ✅ **Verificar se há JavaScript** interferindo na funcionalidade
- ✅ **Considerar usar configurações temporárias** se necessário

#### **2. DIAGNÓSTICO:**
- ✅ **Verificar logs do console** do navegador para erros
- ✅ **Verificar se todas as mudanças foram aplicadas** corretamente
- ✅ **Testar em ambiente limpo** (nova aba do navegador)
- ✅ **Consultar documentação específica** da correção

#### **3. SOLUÇÕES ALTERNATIVAS:**
- ✅ **Reverter para versão anterior** usando git
- ✅ **Aplicar correção em partes** para identificar o problema
- ✅ **Consultar documentação específica** para troubleshooting
- ✅ **Testar em ambiente isolado** se necessário

---

## 🔄 ROLLBACK

### **COMANDOS PARA REVERTER MUDANÇAS:**

#### **ROLLBACK COMPLETO (ÚLTIMA CORREÇÃO):**
```bash
# Desfazer último commit
git reset --hard HEAD~1

# Forçar push para reverter no GitHub
git push origin main --force
```

#### **ROLLBACK PARA VERSÃO ESPECÍFICA:**
```bash
# Ver histórico de commits
git log --oneline

# Reverter para commit específico
git reset --hard [HASH_DO_COMMIT]

# Forçar push para reverter no GitHub
git push origin main --force
```

#### **ROLLBACK PARCIAL (ARQUIVO ESPECÍFICO):**
```bash
# Desfazer mudanças em arquivo específico
git checkout HEAD -- [CAMINHO_DO_ARQUIVO]

# Fazer commit da reversão
git add .
git commit -m "revert: desfazer mudanças em [NOME_DO_ARQUIVO]"
git push origin main
```

---

## 📚 EXPLICAÇÃO DOS COMANDOS IMPORTANTES

### **COMANDOS GIT BÁSICOS:**

#### **`git status`**
- **O que faz:** Mostra o status atual do repositório
- **Quando usar:** Sempre antes de fazer commit para ver quais arquivos foram modificados
- **Resultado esperado:** Lista de arquivos modificados, adicionados ou removidos

#### **`git diff`**
- **O que faz:** Mostra as diferenças entre arquivos modificados e a versão do último commit
- **Quando usar:** Para revisar exatamente o que foi alterado antes de fazer commit
- **Resultado esperado:** Diferenças linha por linha com + (adicionado) e - (removido)

#### **`git add .`**
- **O que faz:** Adiciona todos os arquivos modificados para o próximo commit
- **Quando usar:** Após confirmar que as mudanças estão corretas
- **Resultado esperado:** Arquivos ficam "staged" (prontos para commit)

#### **`git commit -m "mensagem"`**
- **O que faz:** Cria um commit com as mudanças adicionadas
- **Quando usar:** Após `git add .` para salvar as mudanças localmente
- **Resultado esperado:** Commit criado com hash único

#### **`git push origin main`**
- **O que faz:** Envia os commits locais para o repositório remoto no GitHub
- **Quando usar:** Após fazer commit local e testar as mudanças
- **Resultado esperado:** Mudanças aparecem no GitHub

### **COMANDOS NPM:**

#### **`npm run build`**
- **O que faz:** Compila o projeto para produção, verificando erros de TypeScript e build
- **Quando usar:** Sempre após aplicar mudanças para verificar se não há erros
- **Resultado esperado:** Build bem-sucedido sem erros ou warnings críticos

#### **`npm run dev`**
- **O que faz:** Inicia o servidor de desenvolvimento local
- **Quando usar:** Para testar as mudanças no navegador antes de fazer deploy
- **Resultado esperado:** Servidor rodando em http://localhost:5173

#### **`npm install`**
- **O que faz:** Instala todas as dependências do projeto
- **Quando usar:** Após clonar o repositório ou quando há novas dependências
- **Resultado esperado:** Pasta node_modules criada com todas as dependências

### **COMANDOS DE VERIFICAÇÃO:**

#### **`node --version`**
- **O que faz:** Mostra a versão do Node.js instalada
- **Quando usar:** Para verificar se o Node.js está instalado corretamente
- **Resultado esperado:** Versão LTS (ex: v20.11.0)

#### **`npm --version`**
- **O que faz:** Mostra a versão do npm instalada
- **Quando usar:** Para verificar se o npm está funcionando
- **Resultado esperado:** Versão compatível (ex: 10.2.4)

#### **`git --version`**
- **O que faz:** Mostra a versão do Git instalada
- **Quando usar:** Para verificar se o Git está configurado
- **Resultado esperado:** Versão recente (ex: git version 2.40.0.windows.1)

---

**Versão:** 4.0  
**Status:** Simplificado com links de instalação, correções específicas, plano de contingência e explicação de comandos  
**Última atualização:** 07/08/2025 