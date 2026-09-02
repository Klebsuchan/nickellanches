import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
      }
      const stripe = new Stripe(stripeSecretKey);
      
      const { items, orderDetails } = req.body;
      
      const lineItems = items.map((item: any) => {
        const extrasCost = (item.extras || []).reduce((acc: number, ex: any) => acc + ex.price, 0);
        const unitCost = Math.round((item.price + extrasCost) * 100); 
        
        return {
          price_data: {
            currency: 'brl',
            product_data: {
              name: item.name,
              description: item.extras?.length > 0 ? "Adicionais: " + item.extras.map((e: any)=>e.name).join(', ') : undefined,
            },
            unit_amount: unitCost,
          },
          quantity: item.quantity,
        };
      });

      const origin = req.get('origin') || `http://localhost:${PORT}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${origin}/?payment=success`,
        cancel_url: `${origin}/?payment=canceled`,
        metadata: {
          whatsapp: orderDetails.whatsapp,
          name: orderDetails.name,
          address: orderDetails.address
        }
      });

      res.json({ id: session.id, url: session.url });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
