const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8');

const oldConfirm = `    if (paymentMethod === 'Pagamento Online Seguro (Stripe)') {
      setIsProcessing(true);
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart,
            orderDetails: {
              name: name.trim(),
              whatsapp: whatsapp.trim(),
              address: address.trim(),
            }
          }),
        });`;

const newConfirm = `    if (paymentMethod === 'Pagamento Online Seguro (Stripe)') {
      setIsProcessing(true);
      try {
        // Save pending order to localStorage to recover after Stripe redirect
        localStorage.setItem('pendingStripeOrder', JSON.stringify({
          cart,
          details: {
            name: name.trim(),
            whatsapp: whatsapp.trim(),
            address: address.trim(),
            paymentMethod: 'Stripe Online'
          }
        }));

        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart,
            orderDetails: {
              name: name.trim(),
              whatsapp: whatsapp.trim(),
              address: address.trim(),
            }
          }),
        });`;

content = content.replace(oldConfirm, newConfirm);
fs.writeFileSync('src/components/CheckoutModal.tsx', content);
