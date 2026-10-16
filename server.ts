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

  app.get('/api/payment-config', (req, res) => {
    res.json({
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY || ''
    });
  });

  // Diagnóstico em tempo real da conexão com a Stripe
  app.get('/api/stripe-status', async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      const publishableKey = process.env.VITE_STRIPE_PUBLIC_KEY || '';
      if (!stripeSecretKey) {
        return res.json({
          configured: false,
          mode: 'none',
          publishableKey,
          message: 'STRIPE_SECRET_KEY não encontrada nas variáveis de ambiente (.env).'
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
        availableCurrencies: balance.available?.map(b => b.currency.toUpperCase()) || ['BRL'],
        message: isTest
          ? 'Stripe conectado com sucesso em Modo Teste! Cartões de teste aceitos.'
          : '🚀 Stripe 100% ativo e operacional em MODO PRODUÇÃO (LIVE)! Pagamentos reais ativados!'
      });
    } catch (err: any) {
      return res.json({
        configured: false,
        mode: 'error',
        error: err.message,
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
          : '🚀 Chaves Stripe de PRODUÇÃO (LIVE) salvas e validadas com sucesso! O site já está pronto para aceitar vendas reais com cartão!'
      });
    } catch (err: any) {
      return res.status(500).json({ error: `Falha na validação com a Stripe: ${err.message}` });
    }
  });

  // Webhook assíncrono para notificações de eventos Stripe
  app.post('/api/stripe-webhook', (req, res) => {
    try {
      const event = req.body;
      console.log(`[Stripe Webhook] Evento: ${event?.type || 'desconhecido'}`);
      res.json({ received: true });
    } catch (err: any) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      // Bloqueia pagamentos nas segundas-feiras (delivery em manutenção)
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        weekday: 'short',
      });
      const weekday = formatter.format(new Date());
      if (weekday === 'Mon') {
        return res.status(400).json({ 
          error: "Loja fechada segunda-feira. O delivery está em manutenção hoje e não está aceitando pedidos." 
        });
      }

      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(400).json({ error: "STRIPE_SECRET_KEY não configurada no servidor." });
      }
      const stripe = new Stripe(stripeSecretKey);
      
      const { items, orderDetails, discountAmount } = req.body;
      
      const lineItems = (items || []).map((item: any) => {
        const extrasCost = (item.extras || []).reduce((acc: number, ex: any) => acc + ex.price, 0);
        const unitCost = Math.round((item.price + extrasCost) * 100); 
        
        return {
          price_data: {
            currency: 'brl',
            product_data: {
              name: item.name,
              description: item.extras?.length > 0 
                ? "Adicionais: " + item.extras.map((e: any) => `${e.name}${e.price > 0 ? ` (+R$ ${Number(e.price).toFixed(2).replace('.', ',')})` : ''}`).join(', ') 
                : undefined,
            },
            unit_amount: Math.max(0, unitCost),
          },
          quantity: item.quantity,
        };
      });

      // Se houver desconto, aplica como um item com valor deduzido ou ajuste proporcional
      // No Stripe Checkout, cupons ou descontos negativos podem ser tratados ou ajustados
      if (orderDetails?.deliveryFee && orderDetails.deliveryFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Taxa de Entrega (${orderDetails.region || 'Entrega'})`,
            },
            unit_amount: Math.round(orderDetails.deliveryFee * 100),
          },
          quantity: 1,
        });
      }

      // Se houver desconto aplicado, criar cupom efêmero ou abater proporcionalmente
      let discounts: any[] | undefined = undefined;
      if (discountAmount && discountAmount > 0) {
        try {
          const totalLineItemsCents = lineItems.reduce((acc: number, item: any) => acc + (item.price_data.unit_amount * item.quantity), 0);
          const safeDiscountCents = Math.min(Math.round(discountAmount * 100), Math.max(0, totalLineItemsCents - 100));
          if (safeDiscountCents > 0) {
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
      if (!origin) origin = req.get('origin');
      if (!origin && req.get('referer')) {
        try {
          const refUrl = new URL(req.get('referer')!);
          origin = refUrl.origin;
        } catch (_) {}
      }
      if (!origin && req.get('x-forwarded-host')) {
        const proto = req.get('x-forwarded-proto') || 'https';
        origin = `${proto}://${req.get('x-forwarded-host')}`;
      }
      if (!origin) origin = `http://localhost:${PORT}`;
      origin = origin.replace(/\/+$/, '');

      const reqPaymentMethod = req.body.paymentMethod || orderDetails?.paymentMethod || '';
      const isDebit = reqPaymentMethod === 'debit_online' || 
                      reqPaymentMethod.toLowerCase().includes('débito') || 
                      reqPaymentMethod.toLowerCase().includes('debito');

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        discounts: discounts,
        mode: 'payment',
        locale: 'pt-BR',
        payment_intent_data: {
          description: isDebit
            ? `Pedido #${orderDetails?.orderNumber || ''} [CARTÃO DE DÉBITO ONLINE - 3D SECURE] - Nickel Lanches`
            : `Pedido #${orderDetails?.orderNumber || ''} [CARTÃO DE CRÉDITO ONLINE] - Nickel Lanches`,
        },
        payment_method_options: {
          card: {
            request_three_d_secure: isDebit ? 'challenge' : 'automatic'
          }
        },
        custom_text: {
          submit: {
            message: isDebit 
              ? '💳 OPÇÃO SELECIONADA: DÉBITO ONLINE. Na etapa de confirmação, seu banco (Nubank, Inter, Itaú, Bradesco, etc.) solicitará autenticação 3D Secure para debitar diretamente da conta corrente.' 
              : '💳 OPÇÃO SELECIONADA: CRÉDITO ONLINE. Pagamento em cartão de crédito.'
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
          orderNumber: orderDetails?.orderNumber || '',
          receiptAuthCode: orderDetails?.receiptAuthCode || '',
          paymentType: isDebit ? 'debito_online' : 'credito_online',
          total: orderDetails?.totalToPay ? String(orderDetails.totalToPay) : ''
        }
      });

      res.json({ id: session.id, url: session.url });
    } catch (err: any) {
      console.error("Stripe error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Rota para conferir status da sessão Stripe e obter o tipo exato de cobrança efetuada (débito ou crédito)
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

      if (session.payment_intent && typeof session.payment_intent === 'object') {
        const pi = session.payment_intent as Stripe.PaymentIntent;
        if (pi.payment_method && typeof pi.payment_method === 'object') {
          const pm = pi.payment_method as Stripe.PaymentMethod;
          if (pm.card) {
            actualFunding = pm.card.funding; // 'debit' | 'credit' | 'prepaid'
            cardBrand = pm.card.brand ? pm.card.brand.toUpperCase() : '';
            cardLast4 = pm.card.last4 || '';
          }
        }
      }

      const isRequestedDebit = session.metadata?.paymentType === 'debito_online';

      const realMethodLabel = (isRequestedDebit || actualFunding === 'debit')
        ? `Cartão de DÉBITO Online (Aprovado via Stripe${cardBrand ? ` - ${cardBrand}` : ''}${cardLast4 ? ` *${cardLast4}` : ''})`
        : `Cartão de CRÉDITO Online (Aprovado via Stripe${cardBrand ? ` - ${cardBrand}` : ''}${cardLast4 ? ` *${cardLast4}` : ''})`;

      res.json({
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        customer_details: session.customer_details,
        actualFunding,
        cardBrand,
        cardLast4,
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
