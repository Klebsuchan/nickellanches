import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';

const DESTAQUES_PREVIEWS = [
  {
    key: 'magma',
    name: 'Xis Magma',
    image: '/images/destaques-magma-ok.jpg',
    description: 'Xis Magma com muito queijo, calabresa e chapa quente no Nickel Lanches. Peça já!'
  },
  {
    key: 'cemuche',
    name: 'Xis Cemuche',
    image: '/images/destaquecemuche.jpg',
    description: 'Xis Cemuche com 2 carnes e cebola caramelizada artesanal no Nickel Lanches. Peça já!'
  },
  {
    key: 'bomba',
    name: 'Xis Bomba',
    image: '/images/destaquebomba.jpg',
    description: 'Xis Bomba gigante recheado com batata frita, bacon e barbecue no Nickel Lanches. Peça já!'
  },
  {
    key: 'olympus',
    name: 'Xis Olympus',
    image: '/images/olympus-destaque.jpeg',
    description: 'Xis Olympus com catupiry original e bacon crocante no Nickel Lanches. Peça já!'
  }
];

let globalDestaqueCounter = 0;

function injectDestaqueIntoHtml(html: string, req: express.Request): string {
  let host = req.get('x-forwarded-host') || req.get('host') || 'nickellanches.com.br';
  let proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    host = 'nickellanches.com.br';
    proto = 'https';
  }
  const baseUrl = `${proto}://${host}`;

  const queryDestaque = (req.query.destaque || req.query.d || req.query.banner || '') as string;
  let destaque = DESTAQUES_PREVIEWS.find(d => 
    d.key.toLowerCase() === queryDestaque.toLowerCase() ||
    d.name.toLowerCase().includes(queryDestaque.toLowerCase())
  );

  if (!destaque) {
    const idx = globalDestaqueCounter % DESTAQUES_PREVIEWS.length;
    globalDestaqueCounter++;
    destaque = DESTAQUES_PREVIEWS[idx];
  }

  const fullImageUrl = `${baseUrl}${destaque.image}`;
  const title = `Nickel Lanches | ${destaque.name} - O Melhor Lanche de Passo Fundo`;

  let updated = html;
  updated = updated.replace(/<meta property="og:image" content="[^"]*"/i, `<meta property="og:image" content="${fullImageUrl}"`);
  updated = updated.replace(/<meta property="og:image:secure_url" content="[^"]*"/i, `<meta property="og:image:secure_url" content="${fullImageUrl}"`);
  updated = updated.replace(/<meta name="twitter:image" content="[^"]*"/i, `<meta name="twitter:image" content="${fullImageUrl}"`);
  updated = updated.replace(/<meta property="og:title" content="[^"]*"/i, `<meta property="og:title" content="${title}"`);
  updated = updated.replace(/<meta name="twitter:title" content="[^"]*"/i, `<meta name="twitter:title" content="${title}"`);
  updated = updated.replace(/<meta property="og:description" content="[^"]*"/i, `<meta property="og:description" content="${destaque.description}"`);
  updated = updated.replace(/<meta name="twitter:description" content="[^"]*"/i, `<meta name="twitter:description" content="${destaque.description}"`);

  return updated;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const portArgIndex = process.argv.indexOf('--port');
  const portArg = portArgIndex !== -1 ? process.argv[portArgIndex + 1] : undefined;
  // No AI Studio (desenvolvimento), o dev server precisa obrigatoriamente escutar na porta 3000.
  // Em produção (Cloud Run), utiliza a porta injetada pelo ambiente (process.env.PORT || 8080).
  const PORT = process.env.NODE_ENV === 'production'
    ? Number(process.env.PORT || 8080)
    : Number(portArg || 3000);

  app.use(express.json());

  // Armazenamento em arquivo para persistência garantida de pedidos (independente de cota do Firestore)
  const ORDERS_FILE = path.resolve(process.cwd(), 'orders-storage.json');
  let printSignalState: { latestOrderId?: string; orderNumber?: number | string; isPaid?: boolean; updatedAtMs?: number } = {
    updatedAtMs: Date.now()
  };

  function getStoredOrders(): any[] {
    try {
      if (fs.existsSync(ORDERS_FILE)) {
        const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Erro ao ler orders-storage.json:', e);
    }
    return [];
  }

  function saveStoredOrders(orders: any[]) {
    try {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders.slice(0, 300), null, 2), 'utf-8');
    } catch (e) {
      console.warn('Erro ao salvar orders-storage.json:', e);
    }
  }

  // Endpoints para sincronização persistente de pedidos
  app.get('/api/orders', (req, res) => {
    const orders = getStoredOrders();
    res.json(orders);
  });

  app.post('/api/orders', (req, res) => {
    try {
      const body = req.body;
      const currentOrders = getStoredOrders();
      
      if (Array.isArray(body)) {
        // Sincronização em lote
        const existingIds = new Set(currentOrders.map(o => o.id));
        const newOrders = body.filter(b => b && b.id && !existingIds.has(b.id));
        if (newOrders.length > 0) {
          const merged = [...newOrders, ...currentOrders];
          saveStoredOrders(merged);
        }
        return res.json({ success: true, count: newOrders.length });
      }

      if (!body || !body.id) {
        return res.status(400).json({ error: 'Pedido inválido sem ID' });
      }

      const existingIndex = currentOrders.findIndex(o => o.id === body.id);
      let updatedOrders = [...currentOrders];
      if (existingIndex >= 0) {
        updatedOrders[existingIndex] = { ...updatedOrders[existingIndex], ...body };
      } else {
        updatedOrders = [body, ...currentOrders];
      }

      saveStoredOrders(updatedOrders);

      // Se for pedido pago confirmado, atualiza sinal de impressão
      const isPaid = (body.isPaid === true || body.paymentStatus === 'pago');
      if (isPaid) {
        printSignalState = {
          latestOrderId: body.id,
          orderNumber: body.orderNumber || 1,
          isPaid: true,
          updatedAtMs: Date.now()
        };
      }

      return res.json({ success: true, order: body });
    } catch (err: any) {
      console.error('Erro ao salvar pedido na API:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/orders/:id', (req, res) => {
    try {
      const orderId = req.params.id;
      const updates = req.body;
      const currentOrders = getStoredOrders();
      const idx = currentOrders.findIndex(o => o.id === orderId);
      if (idx >= 0) {
        currentOrders[idx] = { ...currentOrders[idx], ...updates };
        saveStoredOrders(currentOrders);

        // Se foi marcado como pago pelo admin, dispara sinal de impressão imediata
        if (updates.isPaid === true || updates.paymentStatus === 'pago') {
          printSignalState = {
            latestOrderId: orderId,
            orderNumber: currentOrders[idx].orderNumber || 1,
            isPaid: true,
            updatedAtMs: Date.now()
          };
        }

        return res.json({ success: true, order: currentOrders[idx] });
      }
      return res.status(404).json({ error: 'Pedido não encontrado' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/orders/:id', (req, res) => {
    try {
      const orderId = req.params.id;
      const currentOrders = getStoredOrders();
      const filtered = currentOrders.filter(o => o.id !== orderId);
      saveStoredOrders(filtered);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Endpoints para sinal de impressão automática
  app.get('/api/print-signal', (req, res) => {
    res.json(printSignalState);
  });

  app.post('/api/print-signal', (req, res) => {
    const body = req.body || {};
    printSignalState = {
      latestOrderId: body.latestOrderId || '',
      orderNumber: body.orderNumber || 1,
      isPaid: Boolean(body.isPaid),
      updatedAtMs: Date.now()
    };
    res.json({ success: true, signal: printSignalState });
  });

  // ====================================================================
  // CONTABILIZAÇÃO DE VISITAS / ABERTURAS DO SITE (ESTILO SEARCH CONSOLE)
  // ====================================================================
  const ANALYTICS_FILE = path.resolve(process.cwd(), 'site-analytics.json');

  interface SiteAnalyticsData {
    totalVisits: number;
    dailyVisits: Record<string, number>;
    hourlyVisits: Record<string, Record<string, number>>;
    lastVisitAt?: string;
    updatedAtMs?: number;
  }

  function getSaoPauloDateHour(d: Date = new Date()): { dateKey: string; hourKey: string } {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false
      });
      const parts = formatter.formatToParts(d);
      const year = parts.find(p => p.type === 'year')?.value || '2026';
      const month = parts.find(p => p.type === 'month')?.value || '01';
      const day = parts.find(p => p.type === 'day')?.value || '01';
      const rawHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10) % 24;
      const hour = String(rawHour).padStart(2, '0');
      return { dateKey: `${year}-${month}-${day}`, hourKey: hour };
    } catch {
      const iso = d.toISOString();
      return { dateKey: iso.slice(0, 10), hourKey: iso.slice(11, 13) };
    }
  }

  function getStoredAnalytics(): SiteAnalyticsData {
    try {
      if (fs.existsSync(ANALYTICS_FILE)) {
        const raw = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const dailyVisits = parsed.dailyVisits && typeof parsed.dailyVisits === 'object' ? parsed.dailyVisits : {};
          const hourlyVisits = parsed.hourlyVisits && typeof parsed.hourlyVisits === 'object' ? parsed.hourlyVisits : {};
          const sumDaily = Object.values(dailyVisits).reduce<number>((acc, v) => acc + (Number(v) || 0), 0);
          return {
            totalVisits: Math.max(Number(parsed.totalVisits) || 0, sumDaily),
            dailyVisits,
            hourlyVisits,
            lastVisitAt: parsed.lastVisitAt || undefined,
            updatedAtMs: Number(parsed.updatedAtMs) || Date.now()
          };
        }
      }
    } catch (e) {
      console.warn('Erro ao ler site-analytics.json:', e);
    }
    return {
      totalVisits: 0,
      dailyVisits: {},
      hourlyVisits: {},
      updatedAtMs: Date.now()
    };
  }

  function saveStoredAnalytics(data: SiteAnalyticsData) {
    try {
      fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Erro ao salvar site-analytics.json:', e);
    }
  }

  app.get('/api/analytics', (req, res) => {
    const data = getStoredAnalytics();
    const { dateKey } = getSaoPauloDateHour();
    res.json({ ...data, todayKey: dateKey });
  });

  app.post('/api/analytics/visit', (req, res) => {
    try {
      const data = getStoredAnalytics();
      const { dateKey, hourKey } = getSaoPauloDateHour();

      data.dailyVisits[dateKey] = (Number(data.dailyVisits[dateKey]) || 0) + 1;
      if (!data.hourlyVisits[dateKey]) {
        data.hourlyVisits[dateKey] = {};
      }
      data.hourlyVisits[dateKey][hourKey] = (Number(data.hourlyVisits[dateKey][hourKey]) || 0) + 1;

      const sumDaily = Object.values(data.dailyVisits).reduce((acc, v) => acc + (Number(v) || 0), 0);
      data.totalVisits = Math.max((Number(data.totalVisits) || 0) + 1, sumDaily);
      data.lastVisitAt = new Date().toISOString();
      data.updatedAtMs = Date.now();

      saveStoredAnalytics(data);
      res.json({ success: true, ...data, todayKey: dateKey });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/analytics/sync', (req, res) => {
    try {
      const incoming = req.body || {};
      const current = getStoredAnalytics();
      const incomingDaily = incoming.dailyVisits && typeof incoming.dailyVisits === 'object' ? incoming.dailyVisits : {};
      const incomingHourly = incoming.hourlyVisits && typeof incoming.hourlyVisits === 'object' ? incoming.hourlyVisits : {};

      const allDates = new Set([...Object.keys(current.dailyVisits), ...Object.keys(incomingDaily)]);
      allDates.forEach(date => {
        current.dailyVisits[date] = Math.max(
          Number(current.dailyVisits[date]) || 0,
          Number(incomingDaily[date]) || 0
        );
      });

      const allHourDates = new Set([...Object.keys(current.hourlyVisits), ...Object.keys(incomingHourly)]);
      allHourDates.forEach(date => {
        if (!current.hourlyVisits[date]) current.hourlyVisits[date] = {};
        const incH = incomingHourly[date] || {};
        Object.keys(incH).forEach(h => {
          current.hourlyVisits[date][h] = Math.max(
            Number(current.hourlyVisits[date][h]) || 0,
            Number(incH[h]) || 0
          );
        });
      });

      const sumDaily = Object.values(current.dailyVisits).reduce((acc, v) => acc + (Number(v) || 0), 0);
      current.totalVisits = Math.max(Number(current.totalVisits) || 0, Number(incoming.totalVisits) || 0, sumDaily);
      if (incoming.lastVisitAt && (!current.lastVisitAt || incoming.lastVisitAt > current.lastVisitAt)) {
        current.lastVisitAt = incoming.lastVisitAt;
      }
      current.updatedAtMs = Date.now();

      saveStoredAnalytics(current);
      const { dateKey } = getSaoPauloDateHour();
      res.json({ success: true, ...current, todayKey: dateKey });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Função utilitária para dar baixa automática em pedidos pagos via Stripe (PIX ou Cartão)
  function markOrderPaidByStripe(sessionId: string, metadata: any, realMethodLabel: string) {
    try {
      const currentOrders = getStoredOrders();
      const idx = currentOrders.findIndex(o =>
        (sessionId && o.stripeSessionId === sessionId) ||
        (metadata?.orderId && o.id === metadata.orderId) ||
        (metadata?.receiptAuthCode && o.receiptAuthCode === metadata.receiptAuthCode)
      );
      if (idx >= 0) {
        const wasAlreadyPaid = currentOrders[idx].isPaid === true && currentOrders[idx].paymentStatus === 'pago';
        currentOrders[idx] = {
          ...currentOrders[idx],
          isPaid: true,
          paymentStatus: 'pago',
          paidAt: currentOrders[idx].paidAt || new Date().toISOString(),
          paymentMethod: realMethodLabel || currentOrders[idx].paymentMethod || 'PIX Online (Aprovado Automaticamente via Stripe)',
          stripeSessionId: sessionId || currentOrders[idx].stripeSessionId
        };
        saveStoredOrders(currentOrders);

        if (!wasAlreadyPaid) {
          printSignalState = {
            latestOrderId: currentOrders[idx].id,
            orderNumber: currentOrders[idx].orderNumber || 1,
            isPaid: true,
            updatedAtMs: Date.now()
          };
          console.log(`[Stripe Auto-Baixa] Pedido #${currentOrders[idx].orderNumber || currentOrders[idx].id} confirmado automaticamente via Stripe!`);
        }
        return currentOrders[idx];
      }
    } catch (e) {
      console.warn('Erro ao dar baixa automática no pedido Stripe:', e);
    }
    return null;
  }

  // Reconciliador automático em segundo plano: verifica sessões Stripe pendentes a cada 4s e dá baixa sozinho
  setInterval(async () => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) return;
    try {
      const currentOrders = getStoredOrders();
      const pendingStripeOrders = currentOrders.filter(
        o => o && o.stripeSessionId && (o.paymentStatus === 'pendente' || o.isPaid === false)
      );
      if (pendingStripeOrders.length === 0) return;

      const stripe = new Stripe(stripeSecretKey);
      for (const ord of pendingStripeOrders.slice(0, 10)) {
        try {
          const session = await stripe.checkout.sessions.retrieve(ord.stripeSessionId, {
            expand: ['payment_intent.payment_method']
          });
          if (session.payment_status === 'paid') {
            const isPix = session.metadata?.paymentType === 'pix_online' ||
              (session.payment_method_types && session.payment_method_types.includes('pix'));
            const isDebit = session.metadata?.paymentType === 'debito_online';
            const label = isPix
              ? 'PIX Online (Aprovado Automaticamente via Stripe)'
              : isDebit
              ? 'Cartão de DÉBITO Online (Aprovado via Stripe)'
              : 'Cartão de CRÉDITO Online (Aprovado via Stripe)';
            markOrderPaidByStripe(session.id, session.metadata, label);
          }
        } catch (_) {}
      }
    } catch (_) {}
  }, 4000);

  app.get('/api/payment-config', async (req, res) => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    let pixStripeActive = false;
    let pixCapabilityStatus = 'unrequested';
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey);
        const acc = await (stripe.accounts as any).retrieve();
        const capStatus = (acc.capabilities as any)?.pix_payments;
        if (capStatus) {
          pixCapabilityStatus = capStatus;
          pixStripeActive = capStatus === 'active';
        }
      } catch (_) {}
    }
    res.json({
      stripeConfigured: !!stripeSecretKey,
      publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY || '',
      pixStripeActive,
      pixCapabilityStatus,
      pixActivationUrl: 'https://dashboard.stripe.com/settings/payment_methods'
    });
  });

  // Diagnóstico em tempo real da conexão com a Stripe (incluindo status do PIX Automático)
  app.get('/api/stripe-status', async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      const publishableKey = process.env.VITE_STRIPE_PUBLIC_KEY || '';
      if (!stripeSecretKey) {
        return res.json({
          configured: false,
          mode: 'none',
          publishableKey,
          pixStripeActive: false,
          pixCapabilityStatus: 'unrequested',
          pixActivationUrl: 'https://dashboard.stripe.com/settings/payment_methods',
          message: 'STRIPE_SECRET_KEY não encontrada nas variáveis de ambiente (.env).'
        });
      }
      const isTest = stripeSecretKey.startsWith('sk_test_') || stripeSecretKey.startsWith('rk_test_');
      const stripe = new Stripe(stripeSecretKey);
      const balance = await stripe.balance.retrieve();

      let pixStripeActive = false;
      let pixCapabilityStatus = 'unrequested';
      try {
        const acc = await (stripe.accounts as any).retrieve();
        const caps = await stripe.accounts.listCapabilities(acc.id);
        const pixCap = caps.data.find(c => c.id === 'pix_payments');
        if (pixCap) {
          pixCapabilityStatus = pixCap.status;
          pixStripeActive = pixCap.status === 'active';
        }
      } catch (_) {}

      return res.json({
        configured: true,
        mode: isTest ? 'test' : 'live',
        livemode: balance.livemode,
        publishableKey,
        pixStripeActive,
        pixCapabilityStatus,
        pixActivationUrl: 'https://dashboard.stripe.com/settings/payment_methods',
        availableCurrencies: balance.available?.map(b => b.currency.toUpperCase()) || ['BRL'],
        message: isTest
          ? 'Stripe conectado com sucesso em Modo Teste! Cartões e PIX de teste aceitos.'
          : pixStripeActive
          ? '🚀 Stripe 100% ativo em MODO PRODUÇÃO (LIVE) com Cartão e PIX Automático habilitados!'
          : '🚀 Stripe ativo em MODO PRODUÇÃO (LIVE)! Para baixa automática de PIX, ative a opção "Pix" com 1 clique no painel da Stripe.'
      });
    } catch (err: any) {
      return res.json({
        configured: false,
        mode: 'error',
        error: err.message,
        pixStripeActive: false,
        pixCapabilityStatus: 'error',
        pixActivationUrl: 'https://dashboard.stripe.com/settings/payment_methods',
        message: `Erro na comunicação com a API da Stripe: ${err.message}`
      });
    }
  });

  // Endpoint para atualizar e validar chaves da Stripe (Live ou Teste)
  app.post('/api/save-stripe-keys', async (req, res) => {
    try {
      const { publishableKey, secretKey } = req.body;
      if (!secretKey || typeof secretKey !== 'string' || (!secretKey.trim().startsWith('sk_') && !secretKey.trim().startsWith('rk_'))) {
        return res.status(400).json({ error: "Chave secreta inválida. Deve começar com 'sk_' ou 'rk_'." });
      }
      if (!publishableKey || typeof publishableKey !== 'string' || !publishableKey.trim().startsWith('pk_')) {
        return res.status(400).json({ error: "Chave publicável inválida. Deve começar com 'pk_live_' ou 'pk_test_'." });
      }

      const cleanSecret = secretKey.trim();
      const cleanPublic = publishableKey.trim();

      // Test key validity against Stripe Balance API
      const stripe = new Stripe(cleanSecret);
      const balance = await stripe.balance.retrieve();
      const isTest = cleanSecret.startsWith('sk_test_');

      // Update in-memory process.env
      process.env.STRIPE_SECRET_KEY = cleanSecret;
      process.env.VITE_STRIPE_PUBLIC_KEY = cleanPublic;

      // Persist to .env file
      const fs = await import('fs');
      const envPath = '.env';
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
      }

      const lines = envContent.split('\n');
      let foundSecret = false;
      let foundPublic = false;

      const newLines = lines.map(line => {
        if (line.startsWith('STRIPE_SECRET_KEY=')) {
          foundSecret = true;
          return `STRIPE_SECRET_KEY=${cleanSecret}`;
        }
        if (line.startsWith('VITE_STRIPE_PUBLIC_KEY=')) {
          foundPublic = true;
          return `VITE_STRIPE_PUBLIC_KEY=${cleanPublic}`;
        }
        return line;
      });

      if (!foundSecret) newLines.push(`STRIPE_SECRET_KEY=${cleanSecret}`);
      if (!foundPublic) newLines.push(`VITE_STRIPE_PUBLIC_KEY=${cleanPublic}`);

      fs.writeFileSync(envPath, newLines.join('\n'));

      return res.json({
        success: true,
        mode: isTest ? 'test' : 'live',
        livemode: balance.livemode,
        publishableKey: cleanPublic,
        message: isTest
          ? 'Chaves Stripe de TESTE salvas e validadas com sucesso!'
          : '🚀 Chaves Stripe de PRODUÇÃO (LIVE) salvas e validadas com sucesso! O site já está pronto para aceitar vendas reais!'
      });
    } catch (err: any) {
      return res.status(500).json({ error: `Falha na validação com a Stripe: ${err.message}` });
    }
  });

  // Webhook assíncrono para notificações de eventos Stripe (Baixa automática de PIX e Cartão)
  app.post('/api/stripe-webhook', (req, res) => {
    try {
      const event = req.body;
      console.log(`[Stripe Webhook] Evento: ${event?.type || 'desconhecido'}`);
      if (
        event?.type === 'checkout.session.completed' ||
        event?.type === 'checkout.session.async_payment_succeeded'
      ) {
        const session = event.data?.object;
        if (session && session.payment_status === 'paid') {
          const isPix = session.metadata?.paymentType === 'pix_online';
          const isDebit = session.metadata?.paymentType === 'debito_online';
          const label = isPix
            ? 'PIX Online (Aprovado Automaticamente via Stripe)'
            : isDebit
            ? 'Cartão de DÉBITO Online (Aprovado via Stripe)'
            : 'Cartão de CRÉDITO Online (Aprovado via Stripe)';
          markOrderPaidByStripe(session.id, session.metadata, label);
        }
      } else if (event?.type === 'payment_intent.succeeded') {
        const pi = event.data?.object;
        if (pi?.metadata) {
          markOrderPaidByStripe('', pi.metadata, 'PIX Online (Aprovado Automaticamente via Stripe)');
        }
      }
      res.json({ received: true });
    } catch (err: any) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // Endpoints para sincronização de horários e status de funcionamento (persistido em store-hours.json)
  const STORE_HOURS_FILE = path.join(process.cwd(), 'store-hours.json');
  function getStoredStoreHours(): any {
    try {
      if (fs.existsSync(STORE_HOURS_FILE)) {
        return JSON.parse(fs.readFileSync(STORE_HOURS_FILE, 'utf-8'));
      }
    } catch (_) {}
    return null;
  }
  function saveStoredStoreHours(settings: any): void {
    try {
      fs.writeFileSync(STORE_HOURS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    } catch (_) {}
  }

  app.get('/api/store-hours', (req, res) => {
    const data = getStoredStoreHours();
    res.json(data || { mode: 'auto' });
  });

  app.post('/api/store-hours', (req, res) => {
    try {
      const settings = req.body;
      if (settings && typeof settings === 'object') {
        saveStoredStoreHours(settings);
      }
      res.json({ success: true, settings });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  function getStripeSecretKey(): string | undefined {
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim()) {
      return process.env.STRIPE_SECRET_KEY.trim();
    }
    try {
      if (fs.existsSync('.env')) {
        const content = fs.readFileSync('.env', 'utf-8');
        for (const line of content.split('\n')) {
          if (line.startsWith('STRIPE_SECRET_KEY=')) {
            const val = line.substring('STRIPE_SECRET_KEY='.length).trim();
            if (val) {
              process.env.STRIPE_SECRET_KEY = val;
              return val;
            }
          }
        }
      }
    } catch (_) {}
    return undefined;
  }

  function getStripePublicKey(): string | undefined {
    if (process.env.VITE_STRIPE_PUBLIC_KEY && process.env.VITE_STRIPE_PUBLIC_KEY.trim()) {
      return process.env.VITE_STRIPE_PUBLIC_KEY.trim();
    }
    try {
      if (fs.existsSync('.env')) {
        const content = fs.readFileSync('.env', 'utf-8');
        for (const line of content.split('\n')) {
          if (line.startsWith('VITE_STRIPE_PUBLIC_KEY=')) {
            const val = line.substring('VITE_STRIPE_PUBLIC_KEY='.length).trim();
            if (val) {
              process.env.VITE_STRIPE_PUBLIC_KEY = val;
              return val;
            }
          }
        }
      }
    } catch (_) {}
    return undefined;
  }

  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const stripeSecretKey = getStripeSecretKey();
      if (!stripeSecretKey) {
        console.error("[Stripe] STRIPE_SECRET_KEY não encontrada no ambiente ou .env");
        return res.status(400).json({ error: "STRIPE_SECRET_KEY não configurada no servidor." });
      }
      const stripe = new Stripe(stripeSecretKey);
      
      const { items, orderDetails, discountAmount } = req.body;
      
      const lineItems = (items || []).map((item: any) => {
        const rawItemPrice = typeof item.price === 'number' ? item.price : parseFloat(String(item.price || 0).replace(',', '.'));
        const extrasCost = (item.extras || []).reduce((acc: number, ex: any) => {
          const p = typeof ex.price === 'number' ? ex.price : parseFloat(String(ex.price || 0).replace(',', '.'));
          return acc + (isNaN(p) ? 0 : Math.max(0, p));
        }, 0);
        const itemPriceNum = isNaN(rawItemPrice) ? 0 : Math.max(0, rawItemPrice);
        const unitCost = Math.round((itemPriceNum + extrasCost) * 100); 
        
        return {
          price_data: {
            currency: 'brl',
            product_data: {
              name: String(item.name || 'Item do Pedido').trim() || 'Item do Pedido',
              description: item.extras?.length > 0 
                ? "Adicionais: " + item.extras.map((e: any) => `${e.name}${Number(e.price) > 0 ? ` (+R$ ${Number(e.price).toFixed(2).replace('.', ',')})` : ''}`).join(', ') 
                : undefined,
            },
            unit_amount: Math.max(50, unitCost),
          },
          quantity: Math.max(1, Number(item.quantity) || 1),
        };
      }).filter((li: any) => li.price_data.unit_amount >= 50);

      const rawDeliveryFee = typeof orderDetails?.deliveryFee === 'number' ? orderDetails.deliveryFee : parseFloat(String(orderDetails?.deliveryFee || 0).replace(',', '.'));
      if (!isNaN(rawDeliveryFee) && rawDeliveryFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Taxa de Entrega (${orderDetails?.region || 'Entrega'})`,
            },
            unit_amount: Math.round(rawDeliveryFee * 100),
          },
          quantity: 1,
        });
      }

      if (lineItems.length === 0) {
        const fallbackTotal = Number(orderDetails?.totalToPay) || 1;
        lineItems.push({
          price_data: {
            currency: 'brl',
            product_data: { name: 'Pedido Nickel Lanches' },
            unit_amount: Math.max(50, Math.round(fallbackTotal * 100)),
          },
          quantity: 1
        });
      }

      // Se houver desconto aplicado, criar cupom efêmero ou abater proporcionalmente
      let discounts: any[] | undefined = undefined;
      const rawDiscount = typeof discountAmount === 'number' ? discountAmount : parseFloat(String(discountAmount || 0).replace(',', '.'));
      if (!isNaN(rawDiscount) && rawDiscount > 0) {
        try {
          const totalLineItemsCents = lineItems.reduce((acc: number, item: any) => acc + (item.price_data.unit_amount * item.quantity), 0);
          const safeDiscountCents = Math.min(Math.round(rawDiscount * 100), Math.max(0, totalLineItemsCents - 100));
          if (safeDiscountCents >= 50) {
            const coupon = await stripe.coupons.create({
              amount_off: safeDiscountCents,
              currency: 'brl',
              duration: 'once',
              name: 'Desconto Cupom Nickel Lanches'
            });
            discounts = [{ coupon: coupon.id }];
          }
        } catch (couponErr) {
          console.warn("Could not create dynamic discount coupon:", couponErr);
        }
      }

      let origin = req.body.origin || req.body.clientOrigin;
      if (!origin || origin === 'null' || origin === 'undefined') origin = req.get('origin');
      if ((!origin || origin === 'null' || origin === 'undefined') && req.get('referer')) {
        try {
          const refUrl = new URL(req.get('referer')!);
          if (refUrl.origin && refUrl.origin !== 'null' && refUrl.origin !== 'undefined') {
            origin = refUrl.origin;
          }
        } catch (_) {}
      }
      if ((!origin || origin === 'null' || origin === 'undefined') && req.get('x-forwarded-host')) {
        const proto = req.get('x-forwarded-proto') || 'https';
        origin = `${proto}://${req.get('x-forwarded-host')}`;
      }
      if (!origin || origin === 'null' || origin === 'undefined' || !origin.startsWith('http')) {
        origin = 'https://ais-dev-t77h3id6uidze7qvfijdbg-385994013673.us-east1.run.app';
      }
      // Em Livemode, Stripe exige HTTPS (exceto localhost)
      if (origin.startsWith('http://') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        origin = origin.replace('http://', 'https://');
      }
      origin = origin.replace(/\/+$/, '');

      const reqPaymentMethod = req.body.paymentMethod || orderDetails?.paymentMethod || '';
      const isPix = reqPaymentMethod === 'pix_online' ||
                    reqPaymentMethod.toLowerCase().includes('pix');
      const isDebit = !isPix && (
        reqPaymentMethod === 'debit_online' || 
        reqPaymentMethod.toLowerCase().includes('débito') || 
        reqPaymentMethod.toLowerCase().includes('debito')
      );

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: isPix ? ['pix'] : ['card'],
        line_items: lineItems,
        discounts: discounts,
        mode: 'payment',
        locale: 'pt-BR',
        payment_intent_data: {
          description: `Pedido #${orderDetails?.orderNumber || ''} - Nickel Lanches`,
          metadata: {
            receiptAuthCode: orderDetails?.receiptAuthCode || '',
            orderId: orderDetails?.orderId || '',
            paymentType: isPix ? 'pix_online' : isDebit ? 'debito_online' : 'credito_online'
          }
        },
        payment_method_options: isPix
          ? {
              pix: {
                expires_after_seconds: 1800
              }
            }
          : {
              card: {
                request_three_d_secure: isDebit ? 'any' : 'automatic'
              }
            },
        custom_text: {
          submit: {
            message: isPix
              ? 'Escaneie o QR Code ou utilize o código PIX Copia e Cola na próxima tela para concluir seu pedido.'
              : isDebit 
              ? 'Pagamento via Cartão de Débito.' 
              : 'Pagamento via Cartão de Crédito.'
          }
        },
        success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/?payment=canceled`,
        customer_email: (orderDetails?.email && typeof orderDetails.email === 'string' && orderDetails.email.includes('@')) ? orderDetails.email : undefined,
        phone_number_collection: { enabled: true },
        metadata: {
          whatsapp: orderDetails?.whatsapp || '',
          name: orderDetails?.name || '',
          address: orderDetails?.address || '',
          region: orderDetails?.region || '',
          orderNumber: orderDetails?.orderNumber ? String(orderDetails.orderNumber) : '',
          orderId: orderDetails?.orderId || '',
          receiptAuthCode: orderDetails?.receiptAuthCode || '',
          paymentType: isPix ? 'pix_online' : isDebit ? 'debito_online' : 'credito_online',
          total: orderDetails?.totalToPay ? String(orderDetails.totalToPay) : ''
        }
      };

      try {
        const session = await stripe.checkout.sessions.create(sessionParams);

        // Vincula o stripeSessionId ao pedido armazenado para que o reconciliador em segundo plano dê baixa automática
        if (orderDetails?.receiptAuthCode || orderDetails?.orderId) {
          const currentOrders = getStoredOrders();
          const idx = currentOrders.findIndex(o =>
            (orderDetails.orderId && o.id === orderDetails.orderId) ||
            (orderDetails.receiptAuthCode && o.receiptAuthCode === orderDetails.receiptAuthCode)
          );
          if (idx >= 0) {
            currentOrders[idx].stripeSessionId = session.id;
            saveStoredOrders(currentOrders);
          }
        }

        return res.json({ id: session.id, url: session.url, paymentType: isPix ? 'pix_online' : 'card' });
      } catch (stripeErr: any) {
        const msg = String(stripeErr?.message || '');
        console.error("[Stripe Session Error]:", stripeErr);
        if (isPix && (msg.includes('pix is invalid') || msg.includes('payment_method_types') || msg.includes('pix'))) {
          return res.status(422).json({
            pixNotEnabledInDashboard: true,
            activationUrl: 'https://dashboard.stripe.com/settings/payment_methods',
            error: 'Para usar o PIX Automático pela Stripe, falta apenas clicar em "Ativar" ao lado de "Pix" no seu Painel da Stripe (Configurações > Formas de pagamento).'
          });
        }
        throw stripeErr;
      }
    } catch (err: any) {
      console.error("[Stripe Internal Error]:", err);
      res.status(500).json({ error: err.message || 'Erro ao processar pagamento na Stripe.' });
    }
  });

  // Rota para conferir status da sessão Stripe e obter o tipo exato de cobrança efetuada (PIX, débito ou crédito)
  app.get('/api/checkout-session/:id', async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(400).json({ error: "STRIPE_SECRET_KEY não configurada." });
      }
      const stripe = new Stripe(stripeSecretKey);
      const session = await stripe.checkout.sessions.retrieve(req.params.id, {
        expand: ['payment_intent.payment_method']
      });

      let actualFunding = 'credit';
      let cardBrand = '';
      let cardLast4 = '';
      let usedPix = session.metadata?.paymentType === 'pix_online' ||
                    (session.payment_method_types && session.payment_method_types.includes('pix'));

      if (session.payment_intent && typeof session.payment_intent === 'object') {
        const pi = session.payment_intent as Stripe.PaymentIntent;
        if (pi.payment_method && typeof pi.payment_method === 'object') {
          const pm = pi.payment_method as Stripe.PaymentMethod;
          if (pm.type === 'pix') {
            usedPix = true;
          } else if (pm.card) {
            actualFunding = pm.card.funding; // 'debit' | 'credit' | 'prepaid'
            cardBrand = pm.card.brand ? pm.card.brand.toUpperCase() : '';
            cardLast4 = pm.card.last4 || '';
          }
        }
      }

      const isRequestedDebit = session.metadata?.paymentType === 'debito_online';

      const realMethodLabel = usedPix
        ? 'PIX Online (Aprovado Automaticamente via Stripe)'
        : (isRequestedDebit || actualFunding === 'debit')
        ? `Cartão de DÉBITO Online (Aprovado via Stripe${cardBrand ? ` - ${cardBrand}` : ''}${cardLast4 ? ` *${cardLast4}` : ''})`
        : `Cartão de CRÉDITO Online (Aprovado via Stripe${cardBrand ? ` - ${cardBrand}` : ''}${cardLast4 ? ` *${cardLast4}` : ''})`;

      // Se a sessão já está paga na Stripe, dá baixa automática imediatamente no banco de pedidos do servidor!
      if (session.payment_status === 'paid') {
        markOrderPaidByStripe(session.id, session.metadata, realMethodLabel);
      }

      res.json({
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        customer_details: session.customer_details,
        actualFunding,
        cardBrand,
        cardLast4,
        usedPix,
        realMethodLabel,
        metadata: session.metadata
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });

    // Intercepta requisições HTML e crawlers (WhatsApp, Facebook, etc.) para alternar as imagens dos destaques
    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      const userAgent = (req.headers['user-agent'] || '').toLowerCase();
      const isSocialCrawler = userAgent.includes('whatsapp') || 
                              userAgent.includes('facebookexternalhit') || 
                              userAgent.includes('twitterbot') || 
                              userAgent.includes('telegrambot') ||
                              userAgent.includes('slackbot') ||
                              userAgent.includes('discordbot');
      const isHtmlRequest = isSocialCrawler || (req.headers.accept && req.headers.accept.includes('text/html'));
      
      if (req.method === 'GET' && isHtmlRequest && !url.startsWith('/api') && !url.startsWith('/@') && !url.includes('.')) {
        try {
          const indexPath = path.resolve(process.cwd(), 'index.html');
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          const customized = injectDestaqueIntoHtml(template, req);
          return res.status(200).set({ 'Content-Type': 'text/html' }).end(customized);
        } catch (e) {
          return next(e);
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      try {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          const template = fs.readFileSync(indexPath, 'utf-8');
          const customized = injectDestaqueIntoHtml(template, req);
          return res.status(200).set({ 'Content-Type': 'text/html' }).send(customized);
        }
      } catch (err) {
        console.error('Error serving index.html:', err);
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.on('error', (err: any) => {
    console.error('Server error:', err);
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/`);
  });
}

startServer();
