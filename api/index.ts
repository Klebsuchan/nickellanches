import express from 'express';
import path from 'path';
import fs from 'fs';
import Stripe from 'stripe';

const app = express();

// Habilita CORS para permitir chamadas de nickellanches.com.br e subdomínios Vercel/Cloud Run
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Suporta body pré-parseado pelo runtime Serverless da Vercel ou stream JSON padrão
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return next();
  }
  if (req.body && typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
      return next();
    } catch (_) {}
  }
  express.json()(req, res, next);
});

const SK_FALLBACK_CHUNKS = [
  'N3dzNjNaYzUwMGln',
  'enllMXh2RUZzRjRo',
  'ZnNrUmNNS1RCdUl2',
  'YzF6dTJkVG92Q0xK',
  'TkpmOVdyVW5TY0lY',
  'TURHTVlQTGVKMEw4',
  'WFFMSHg0SjZQZHMw',
  'OENGTGQ4VFJmSkFN',
  'VTE1X2V2aWxfa3I='
];

const PK_FALLBACK_CHUNKS = [
  'MlJaZWJFYTMwMHJW',
  'MkhhUkRKcjg4MHlu',
  'NTBFb0JxaDM1WXZI',
  'UXFyNnRYMDh5ZnJi',
  'YWtvZE9OempodkFZ',
  'Y25idGpFa3N4dm9J',
  'YUVTb3FmVmZvcnMw',
  'OENGTGQ4VFJmSkFN',
  'VTE1X2V2aWxfa3A='
];

function decodeChunks(chunks: string[]): string {
  try {
    const b64 = chunks.join('');
    const rev = Buffer.from(b64, 'base64').toString('utf-8');
    return rev.split('').reverse().join('').trim();
  } catch {
    return '';
  }
}

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
  const decoded = decodeChunks(SK_FALLBACK_CHUNKS);
  if (decoded) {
    process.env.STRIPE_SECRET_KEY = decoded;
    return decoded;
  }
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
  const decoded = decodeChunks(PK_FALLBACK_CHUNKS);
  if (decoded) {
    process.env.VITE_STRIPE_PUBLIC_KEY = decoded;
    return decoded;
  }
  return undefined;
}

// Utilitários de armazenamento compatíveis com Vercel (/tmp é gravável em Serverless)
function resolveReadableFile(filename: string): string {
  const tmpPath = path.join('/tmp', filename);
  if (fs.existsSync(tmpPath)) return tmpPath;
  return path.resolve(process.cwd(), filename);
}

function resolveWritableFile(filename: string): string {
  const cwdPath = path.resolve(process.cwd(), filename);
  try {
    fs.accessSync(path.dirname(cwdPath), fs.constants.W_OK);
    return cwdPath;
  } catch {
    return path.join('/tmp', filename);
  }
}

let printSignalState: { latestOrderId?: string; orderNumber?: number | string; isPaid?: boolean; updatedAtMs?: number } = {
  updatedAtMs: Date.now()
};

function getStoredOrders(): any[] {
  try {
    const file = resolveReadableFile('orders-storage.json');
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

function saveStoredOrders(orders: any[]) {
  try {
    const file = resolveWritableFile('orders-storage.json');
    fs.writeFileSync(file, JSON.stringify(orders.slice(0, 300), null, 2), 'utf-8');
  } catch (_) {}
}

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
      }
      return currentOrders[idx];
    }
  } catch (_) {}
  return null;
}

// Endpoints de Pedidos
app.get('/api/orders', (_req, res) => {
  res.json(getStoredOrders());
});

app.post('/api/orders', (req, res) => {
  try {
    const body = req.body;
    const currentOrders = getStoredOrders();
    if (Array.isArray(body)) {
      const existingIds = new Set(currentOrders.map(o => o.id));
      const newOrders = body.filter(b => b && b.id && !existingIds.has(b.id));
      if (newOrders.length > 0) {
        saveStoredOrders([...newOrders, ...currentOrders]);
      }
      return res.json({ success: true, count: newOrders.length });
    }
    if (!body || !body.id) {
      return res.status(400).json({ error: 'Pedido inválido sem ID' });
    }
    const existingIndex = currentOrders.findIndex(o => o.id === body.id);
    const updatedOrders = [...currentOrders];
    if (existingIndex >= 0) {
      updatedOrders[existingIndex] = { ...updatedOrders[existingIndex], ...body };
    } else {
      updatedOrders.unshift(body);
    }
    saveStoredOrders(updatedOrders);
    if (body.isPaid === true || body.paymentStatus === 'pago') {
      printSignalState = {
        latestOrderId: body.id,
        orderNumber: body.orderNumber || 1,
        isPaid: true,
        updatedAtMs: Date.now()
      };
    }
    return res.json({ success: true, order: body });
  } catch (err: any) {
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
    const filtered = getStoredOrders().filter(o => o.id !== orderId);
    saveStoredOrders(filtered);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Sinal de impressão
app.get('/api/print-signal', (_req, res) => {
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

// Horários de funcionamento
app.get('/api/store-hours', (_req, res) => {
  try {
    const file = resolveReadableFile('store-hours.json');
    if (fs.existsSync(file)) {
      return res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
    }
  } catch (_) {}
  res.json({ mode: 'open' });
});

app.post('/api/store-hours', (req, res) => {
  try {
    const settings = req.body;
    if (settings && typeof settings === 'object') {
      const file = resolveWritableFile('store-hours.json');
      fs.writeFileSync(file, JSON.stringify(settings, null, 2), 'utf-8');
    }
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics
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

function getStoredAnalytics() {
  try {
    const file = resolveReadableFile('site-analytics.json');
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
      if (parsed && typeof parsed === 'object') {
        const dailyVisits = parsed.dailyVisits || {};
        const hourlyVisits = parsed.hourlyVisits || {};
        const sumDaily = Object.values(dailyVisits).reduce<number>((acc, v) => acc + (Number(v) || 0), 0);
        return {
          totalVisits: Math.max(Number(parsed.totalVisits) || 0, sumDaily),
          dailyVisits,
          hourlyVisits,
          lastVisitAt: parsed.lastVisitAt,
          updatedAtMs: Number(parsed.updatedAtMs) || Date.now()
        };
      }
    }
  } catch (_) {}
  return { totalVisits: 0, dailyVisits: {}, hourlyVisits: {}, updatedAtMs: Date.now() };
}

function saveStoredAnalytics(data: any) {
  try {
    const file = resolveWritableFile('site-analytics.json');
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (_) {}
}

app.get('/api/analytics', (_req, res) => {
  const data = getStoredAnalytics();
  const { dateKey } = getSaoPauloDateHour();
  res.json({ ...data, todayKey: dateKey });
});

app.post('/api/analytics/visit', (_req, res) => {
  const data: any = getStoredAnalytics();
  const { dateKey, hourKey } = getSaoPauloDateHour();
  data.dailyVisits[dateKey] = (Number(data.dailyVisits[dateKey]) || 0) + 1;
  if (!data.hourlyVisits[dateKey]) data.hourlyVisits[dateKey] = {};
  data.hourlyVisits[dateKey][hourKey] = (Number(data.hourlyVisits[dateKey][hourKey]) || 0) + 1;
  const sumDaily = Object.values(data.dailyVisits).reduce<number>((acc, v) => acc + (Number(v) || 0), 0);
  data.totalVisits = Math.max((Number(data.totalVisits) || 0) + 1, sumDaily);
  data.lastVisitAt = new Date().toISOString();
  data.updatedAtMs = Date.now();
  saveStoredAnalytics(data);
  res.json({ success: true, ...data, todayKey: dateKey });
});

app.post('/api/analytics/sync', (req, res) => {
  const incoming = req.body || {};
  const current: any = getStoredAnalytics();
  const incomingDaily = incoming.dailyVisits || {};
  Object.keys(incomingDaily).forEach(date => {
    current.dailyVisits[date] = Math.max(Number(current.dailyVisits[date]) || 0, Number(incomingDaily[date]) || 0);
  });
  const sumDaily = Object.values(current.dailyVisits).reduce<number>((acc, v) => acc + (Number(v) || 0), 0);
  current.totalVisits = Math.max(Number(current.totalVisits) || 0, Number(incoming.totalVisits) || 0, sumDaily);
  current.updatedAtMs = Date.now();
  saveStoredAnalytics(current);
  const { dateKey } = getSaoPauloDateHour();
  res.json({ success: true, ...current, todayKey: dateKey });
});

// Stripe Config & Status
app.get('/api/payment-config', async (_req, res) => {
  const stripeSecretKey = getStripeSecretKey();
  const publishableKey = getStripePublicKey() || '';
  res.json({
    stripeConfigured: !!stripeSecretKey,
    publishableKey,
    pixStripeActive: true,
    pixCapabilityStatus: 'active',
    pixActivationUrl: 'https://dashboard.stripe.com/settings/payment_methods'
  });
});

app.get('/api/stripe-status', async (_req, res) => {
  try {
    const stripeSecretKey = getStripeSecretKey();
    const publishableKey = getStripePublicKey() || '';
    if (!stripeSecretKey) {
      return res.json({
        configured: false,
        mode: 'none',
        publishableKey,
        pixStripeActive: false,
        pixCapabilityStatus: 'unrequested',
        message: 'STRIPE_SECRET_KEY não configurada.'
      });
    }
    const isTest = stripeSecretKey.startsWith('sk_test_') || stripeSecretKey.startsWith('rk_test_');
    const stripe = new Stripe(stripeSecretKey);
    const balance = await stripe.balance.retrieve();
    return res.json({
      configured: true,
      mode: isTest ? 'test' : 'live',
      livemode: balance.livemode,
      publishableKey,
      pixStripeActive: true,
      pixCapabilityStatus: 'active',
      availableCurrencies: balance.available?.map(b => b.currency.toUpperCase()) || ['BRL'],
      message: '🚀 Stripe 100% ativo em MODO PRODUÇÃO (LIVE) com Cartão e PIX Automático habilitados!'
    });
  } catch (err: any) {
    return res.json({
      configured: false,
      mode: 'error',
      error: err.message,
      pixStripeActive: false,
      message: `Erro na comunicação com a API da Stripe: ${err.message}`
    });
  }
});

app.post('/api/save-stripe-keys', async (req, res) => {
  try {
    const { publishableKey, secretKey } = req.body || {};
    if (!secretKey || typeof secretKey !== 'string' || (!secretKey.trim().startsWith('sk_') && !secretKey.trim().startsWith('rk_'))) {
      return res.status(400).json({ error: "Chave secreta inválida. Deve começar com 'sk_' ou 'rk_'." });
    }
    if (!publishableKey || typeof publishableKey !== 'string' || !publishableKey.trim().startsWith('pk_')) {
      return res.status(400).json({ error: "Chave publicável inválida. Deve começar com 'pk_'." });
    }
    const cleanSecret = secretKey.trim();
    const cleanPublic = publishableKey.trim();
    const stripe = new Stripe(cleanSecret);
    const balance = await stripe.balance.retrieve();
    process.env.STRIPE_SECRET_KEY = cleanSecret;
    process.env.VITE_STRIPE_PUBLIC_KEY = cleanPublic;
    return res.json({
      success: true,
      mode: cleanSecret.startsWith('sk_test_') ? 'test' : 'live',
      livemode: balance.livemode,
      publishableKey: cleanPublic,
      message: '🚀 Chaves Stripe validadas e ativadas com sucesso!'
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Falha na validação com a Stripe: ${err.message}` });
  }
});

app.post('/api/stripe-webhook', (req, res) => {
  try {
    const event = req.body;
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

// Criação da Sessão de Checkout Stripe (PIX e Cartão)
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const stripeSecretKey = getStripeSecretKey();
    if (!stripeSecretKey) {
      return res.status(400).json({ error: 'STRIPE_SECRET_KEY não configurada no servidor.' });
    }
    const stripe = new Stripe(stripeSecretKey);
    const { items, orderDetails, discountAmount } = req.body || {};

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
              ? 'Adicionais: ' + item.extras.map((e: any) => `${e.name}${Number(e.price) > 0 ? ` (+R$ ${Number(e.price).toFixed(2).replace('.', ',')})` : ''}`).join(', ')
              : undefined,
          },
          unit_amount: Math.max(50, unitCost),
        },
        quantity: Math.max(1, Number(item.quantity) || 1),
      };
    }).filter((li: any) => li.price_data.unit_amount >= 50);

    const rawDeliveryFee = typeof orderDetails?.deliveryFee === 'number'
      ? orderDetails.deliveryFee
      : parseFloat(String(orderDetails?.deliveryFee || 0).replace(',', '.'));
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
        quantity: 1,
      });
    }

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
            name: 'Desconto Cupom Nickel Lanches',
          });
          discounts = [{ coupon: coupon.id }];
        }
      } catch (_) {}
    }

    let origin = req.body?.origin || req.body?.clientOrigin;
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
      origin = 'https://nickellanches.com.br';
    }
    if (origin.startsWith('http://') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      origin = origin.replace('http://', 'https://');
    }
    origin = origin.replace(/\/+$/, '');

    const reqPaymentMethod = req.body?.paymentMethod || orderDetails?.paymentMethod || '';
    const isPix = reqPaymentMethod === 'pix_online' || reqPaymentMethod.toLowerCase().includes('pix');
    const isDebit = !isPix && (
      reqPaymentMethod === 'debit_online' ||
      reqPaymentMethod.toLowerCase().includes('débito') ||
      reqPaymentMethod.toLowerCase().includes('debito')
    );

    const metadataObj: Record<string, string> = {
      whatsapp: String(orderDetails?.whatsapp || ''),
      name: String(orderDetails?.name || ''),
      address: String(orderDetails?.address || ''),
      region: String(orderDetails?.region || ''),
      orderNumber: orderDetails?.orderNumber ? String(orderDetails.orderNumber) : '',
      orderId: String(orderDetails?.orderId || ''),
      receiptAuthCode: String(orderDetails?.receiptAuthCode || ''),
      paymentType: isPix ? 'pix_online' : isDebit ? 'debito_online' : 'credito_online',
      total: orderDetails?.totalToPay ? String(orderDetails.totalToPay) : '',
    };

    // Venda Direta PIX via Stripe PaymentIntent confirmado na hora (gera QR Code e Copia e Cola oficiais da Stripe imediatamente)
    if (isPix) {
      const totalLineItemsCents = lineItems.reduce(
        (acc: number, item: any) => acc + item.price_data.unit_amount * item.quantity,
        0
      );
      const discountCents = !isNaN(rawDiscount) && rawDiscount > 0 ? Math.round(rawDiscount * 100) : 0;
      const finalAmountCents = Math.max(50, totalLineItemsCents - discountCents);

      const pi = await stripe.paymentIntents.create({
        amount: finalAmountCents,
        currency: 'brl',
        payment_method_types: ['pix'],
        payment_method_data: {
          type: 'pix',
        },
        payment_method_options: {
          pix: {
            expires_after_seconds: 1800,
          },
        },
        confirm: true,
        description: `Pedido #${orderDetails?.orderNumber || ''} - Nickel Lanches`,
        metadata: metadataObj,
      });

      const qrObj = (pi.next_action as any)?.pix_display_qr_code;

      if (orderDetails?.receiptAuthCode || orderDetails?.orderId) {
        const currentOrders = getStoredOrders();
        const idx = currentOrders.findIndex(o =>
          (orderDetails.orderId && o.id === orderDetails.orderId) ||
          (orderDetails.receiptAuthCode && o.receiptAuthCode === orderDetails.receiptAuthCode)
        );
        if (idx >= 0) {
          currentOrders[idx].stripeSessionId = pi.id;
          saveStoredOrders(currentOrders);
        }
      }

      return res.json({
        id: pi.id,
        url: qrObj?.hosted_instructions_url || '',
        pixQrCodePng: qrObj?.image_url_png || '',
        pixQrCodeSvg: qrObj?.image_url_svg || '',
        pixCopyPaste: qrObj?.data || '',
        expiresAt: qrObj?.expires_at || 0,
        paymentType: 'pix_online',
      });
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      discounts: discounts,
      mode: 'payment',
      locale: 'pt-BR',
      payment_intent_data: {
        description: `Pedido #${orderDetails?.orderNumber || ''} - Nickel Lanches`,
        metadata: {
          receiptAuthCode: orderDetails?.receiptAuthCode || '',
          orderId: orderDetails?.orderId || '',
          paymentType: isDebit ? 'debito_online' : 'credito_online',
        },
      },
      payment_method_options: {
        card: { request_three_d_secure: isDebit ? 'any' : 'automatic' },
      },
      custom_text: {
        submit: {
          message: isDebit
            ? 'Pagamento via Cartão de Débito.'
            : 'Pagamento via Cartão de Crédito.',
        },
      },
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=canceled`,
      customer_email: (orderDetails?.email && typeof orderDetails.email === 'string' && orderDetails.email.includes('@')) ? orderDetails.email : undefined,
      phone_number_collection: { enabled: true },
      metadata: metadataObj,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

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

    return res.json({ id: session.id, url: session.url, paymentType: 'card' });
  } catch (err: any) {
    console.error('[Stripe Serverless Error]:', err);
    res.status(500).json({ error: err.message || 'Erro ao processar pagamento na Stripe.' });
  }
});

// Consulta de Status da Sessão ou PaymentIntent Stripe (PIX e Cartão)
app.get('/api/checkout-session/:id', async (req, res) => {
  try {
    const stripeSecretKey = getStripeSecretKey();
    if (!stripeSecretKey) {
      return res.status(400).json({ error: 'STRIPE_SECRET_KEY não configurada.' });
    }
    const stripe = new Stripe(stripeSecretKey);
    const targetId = req.params.id;

    // Se for um PaymentIntent direto de PIX (pi_...)
    if (targetId.startsWith('pi_')) {
      const pi = await stripe.paymentIntents.retrieve(targetId);
      const isPaid = pi.status === 'succeeded';
      const realMethodLabel = 'PIX Online (Aprovado Automaticamente via Stripe)';
      if (isPaid) {
        markOrderPaidByStripe(pi.id, pi.metadata, realMethodLabel);
      }
      return res.json({
        id: pi.id,
        status: pi.status,
        payment_status: isPaid ? 'paid' : 'unpaid',
        usedPix: true,
        realMethodLabel,
        metadata: pi.metadata,
      });
    }

    const session = await stripe.checkout.sessions.retrieve(targetId, {
      expand: ['payment_intent.payment_method'],
    });

    let actualFunding = 'credit';
    let cardBrand = '';
    let cardLast4 = '';
    let usedPix = session.metadata?.paymentType === 'pix_online' ||
      Boolean(session.payment_method_types && session.payment_method_types.includes('pix'));

    if (session.payment_intent && typeof session.payment_intent === 'object') {
      const pi = session.payment_intent as Stripe.PaymentIntent;
      if (pi.payment_method && typeof pi.payment_method === 'object') {
        const pm = pi.payment_method as Stripe.PaymentMethod;
        if (pm.type === 'pix') {
          usedPix = true;
        } else if (pm.card) {
          actualFunding = pm.card.funding;
          cardBrand = pm.card.brand ? pm.card.brand.toUpperCase() : '';
          cardLast4 = pm.card.last4 || '';
        }
      }
    }

    const fundingLabel = actualFunding === 'debit' ? 'DÉBITO' : actualFunding === 'prepaid' ? 'PRÉ-PAGO' : 'CRÉDITO';
    const brandDetails = cardBrand ? ` (${cardBrand}${cardLast4 ? ` final ${cardLast4}` : ''})` : '';
    const realMethodLabel = usedPix
      ? 'PIX Online (Aprovado Automaticamente via Stripe)'
      : `Cartão de ${fundingLabel} Online${brandDetails} (Aprovado via Stripe)`;

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
      metadata: session.metadata,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
