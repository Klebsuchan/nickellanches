import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const portArgIndex = process.argv.indexOf('--port');
  const portArg = portArgIndex !== -1 ? process.argv[portArgIndex + 1] : undefined;
  const PORT = Number(process.env.PORT || portArg || 3000);

  app.use(express.json());

  app.get('/api/payment-config', (req, res) => {
    res.json({
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY || ''
    });
  });

  app.post('/api/create-checkout-session', async (req, res) => {
    try {
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
              description: item.extras?.length > 0 ? "Adicionais: " + item.extras.map((e: any)=>e.name).join(', ') : undefined,
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
          const coupon = await stripe.coupons.create({
            amount_off: Math.round(discountAmount * 100),
            currency: 'brl',
            duration: 'once',
            name: 'Desconto Cupom Nickel Lanches'
          });
          discounts = [{ coupon: coupon.id }];
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

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        discounts: discounts,
        mode: 'payment',
        locale: 'pt-BR',
        success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/?payment=canceled`,
        customer_email: orderDetails?.email || undefined,
        metadata: {
          whatsapp: orderDetails?.whatsapp || '',
          name: orderDetails?.name || '',
          address: orderDetails?.address || '',
          region: orderDetails?.region || '',
          orderNumber: orderDetails?.orderNumber || '',
          receiptAuthCode: orderDetails?.receiptAuthCode || '',
          total: orderDetails?.totalToPay ? String(orderDetails.totalToPay) : ''
        }
      });

      res.json({ id: session.id, url: session.url });
    } catch (err: any) {
      console.error("Stripe error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Rota para conferir status da sessão Stripe se necessário
  app.get('/api/checkout-session/:id', async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(400).json({ error: "STRIPE_SECRET_KEY não configurada." });
      }
      const stripe = new Stripe(stripeSecretKey);
      const session = await stripe.checkout.sessions.retrieve(req.params.id);
      res.json({
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        customer_details: session.customer_details,
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
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
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
