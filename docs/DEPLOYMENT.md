# 🚀 Guia de Implantação e Deploy - Nickel Lanches

Este guia detalha os diferentes métodos para hospedar e implantar a plataforma **Nickel Lanches** em produção, bem como configurar o computador da lanchonete física.

---

## 📋 Sumário
1. [Variáveis de Ambiente Necessárias](#1-variáveis-de-ambiente-necessárias)
2. [Deploy na Nuvem (Vercel / Cloud Run / Firebase)](#2-deploy-na-nuvem)
3. [Execução com Docker](#3-execução-com-docker)
4. [Configuração do Computador da Lanchonete (Windows)](#4-configuração-do-computador-da-lanchonete)

---

## 1. Variáveis de Ambiente Necessárias

Crie um arquivo `.env` baseado no `.env.example`:

```env
# Configurações do Firebase Client-Side (Obrigatórias)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:...

# Porta do Servidor Node.js (Padrão 3000)
PORT=3000
```

---

## 2. Deploy na Nuvem

### Opção A: Vercel (Recomendado para Frontend SPA)
1. Conecte seu repositório GitHub à [Vercel](https://vercel.com/).
2. A Vercel detectará automaticamente o framework Vite.
3. Configure as variáveis de ambiente (`VITE_FIREBASE_*`) nas configurações do projeto.
4. O arquivo `vercel.json` já existente na raiz cuidará do redirecionamento de rotas SPA:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
5. Clique em **Deploy**.

### Opção B: Google Cloud Run / Container
1. O projeto possui um servidor Node.js/Express (`server.ts`) para servir o build estático e intermediar chamadas quando necessário.
2. Compile a imagem Docker e faça o deploy:
   ```bash
   gcloud builds submit --tag gcr.io/$PROJECT_ID/nickel-lanches
   gcloud run deploy nickel-lanches \
     --image gcr.io/$PROJECT_ID/nickel-lanches \
     --platform managed \
     --port 3000 \
     --allow-unauthenticated
   ```

### Opção C: Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy --only hosting
```

---

## 3. Execução com Docker

Se preferir rodar em um servidor VPS local ou containerizado:

```dockerfile
# Exemplo de Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.ts ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["npm", "run", "start"]
```

Comandos para build e execução:
```bash
docker build -t nickel-lanches .
docker run -d -p 3000:3000 --env-file .env nickel-lanches
```

---

## 4. Configuração do Computador da Lanchonete

Para garantir que as comandas sejam impressas automaticamente assim que os clientes efetuarem o pagamento:

1. **Abra o Navegador:** Acesse o painel do sistema no Google Chrome ou Microsoft Edge no computador do caixa.
2. **Baixe o Aplicativo Windows:** No painel da cozinha ou em Configurações de Impressão, clique em **"Baixar Impressão Automática (PC)"**.
3. **Execute o Arquivo:** Dê dois cliques em `Impressao-Automatica-Nickel.bat`.
4. **Inicialização Automática:** O script adiciona a si mesmo à pasta `Inicializar` do Windows (`shell:startup`), garantindo que se o computador for reiniciado ou faltar luz, o serviço de impressão voltará a rodar sozinho automaticamente!
5. **Configuração de Som:** Conecte uma caixa de som ou mantenha o volume do computador audível para que a sirene de novos pedidos alerte a equipe da cozinha.
