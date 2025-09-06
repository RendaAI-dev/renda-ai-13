# Estágio de build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Use npm ci para instalações mais rápidas e consistentes em CI/CD
RUN npm ci
COPY . .
RUN npm run build

# Estágio de produção
FROM node:22-alpine
WORKDIR /app
# Copie as variáveis de ambiente de build, se necessário, ou defina-as no Easypanel
ENV NODE_ENV=production
# Copie os artefatos de build do estágio anterior
COPY --from=builder /app/dist ./dist
COPY package*.json ./
# Instale apenas dependências de produção se o preview precisar delas
# Se o 'vite preview' não precisar de node_modules, pode pular esta instalação
RUN npm install --omit=dev

# Exponha a porta que o vite preview usa
EXPOSE 4173
# Comando para rodar a aplicação (usando o script 'start' ou 'preview')
CMD [ "npm", "run", "preview", "--", "--host", "0.0.0.0" ]