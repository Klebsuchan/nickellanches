const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldSuccess = `    if (paymentStatus === 'success') {
      addToast({ message: 'Pagamento online realizado com sucesso! Seu pedido já está sendo preparado.', type: 'success', title: 'Pagamento Confirmado!' });
      setCart([]);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }`;

const newSuccess = `    if (paymentStatus === 'success') {
      const pendingStr = localStorage.getItem('pendingStripeOrder');
      if (pendingStr) {
        try {
          const pendingOrder = JSON.parse(pendingStr);
          
          // Calculate totals
          const subtotal = pendingOrder.cart.reduce((acc: number, item: any) => {
            const extrasCost = (item.extras || []).reduce((sum: number, e: any) => sum + e.price, 0);
            return acc + (item.price + extrasCost) * item.quantity;
          }, 0);
          
          let discount = 0;
          // Just simplify and use subtotal if we don't have the coupon logic saved
          
          saveOrder({
            items: pendingOrder.cart,
            subtotal: subtotal,
            discount: 0,
            total: subtotal,
            pointsEarned: Math.floor(subtotal),
            status: 'recebido',
            timestamp: new Date(),
            customer: {
              name: pendingOrder.details.name,
              whatsapp: pendingOrder.details.whatsapp,
              address: pendingOrder.details.address,
            }
          });
          
          // Send WhatsApp message
          let msg = \`Olá! Acabei de fazer um pedido pago via Stripe (Online):\\n\\n*ITENS DO PEDIDO:*\\n\`;
          pendingOrder.cart.forEach((item: any) => {
            const itemTotal = (item.price + (item.extras?.reduce((sum: number, e: any) => sum + e.price, 0) || 0)) * item.quantity;
            msg += \`- \${item.quantity}x \${item.name} (R$ \${itemTotal.toFixed(2).replace('.', ',')})\\n\`;
            if (item.extras && item.extras.length > 0) {
              msg += \`  *Adicionais:* \${item.extras.map((e: any) => e.name).join(', ')}\\n\`;
            }
            if (item.observation) {
              msg += \`  *Obs:* \${item.observation}\\n\`;
            }
            msg += '\\n';
          });
          msg += \`*TOTAL PAGO: R$ \${subtotal.toFixed(2).replace('.', ',')}*\\n\\n\`;
          msg += \`*DADOS PARA ENTREGA:*\\nNome: \${pendingOrder.details.name}\\nWhatsApp: \${pendingOrder.details.whatsapp}\\nEndereço: \${pendingOrder.details.address}\\nForma de Pagamento: \${pendingOrder.details.paymentMethod}\\n\`;
          
          const phone = '5554999598389';
          window.open(\`https://wa.me/\${phone}?text=\${encodeURIComponent(msg)}\`, '_blank');
          
        } catch (e) {
          console.error('Error processing pending order:', e);
        }
        localStorage.removeItem('pendingStripeOrder');
      }

      addToast({ message: 'Pagamento online realizado com sucesso! Seu pedido já está sendo preparado.', type: 'success', title: 'Pagamento Confirmado!' });
      setCart([]);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }`;

content = content.replace(oldSuccess, newSuccess);
fs.writeFileSync('src/App.tsx', content);
