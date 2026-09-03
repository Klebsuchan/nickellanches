const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /if \(paymentStatus === 'success'\) \{[\s\S]*?\/\/ Clean up URL\s*window.history.replaceState\(\{\}, document.title, window.location.pathname\);\s*\}/;

const newSuccess = `if (paymentStatus === 'success') {
      const pendingStr = localStorage.getItem('pendingStripeOrder');
      if (pendingStr) {
        try {
          const pendingOrder = JSON.parse(pendingStr);
          
          // Calculate totals
          const subtotal = pendingOrder.cart.reduce((acc: number, item: any) => {
            const extrasCost = (item.extras || []).reduce((sum: number, e: any) => sum + e.price, 0);
            return acc + (item.price + extrasCost) * item.quantity;
          }, 0);
          
          const uid = user ? user.uid : 'guest';
          
          saveOrder(uid, {
            items: pendingOrder.cart,
            totalPrice: subtotal,
            totalPoints: Math.floor(subtotal),
            status: 'recebido',
            userName: pendingOrder.details.name,
            whatsapp: pendingOrder.details.whatsapp,
            address: pendingOrder.details.address,
            paymentMethod: pendingOrder.details.paymentMethod,
          }).then(orderId => {
            // Re-construct the order info object to add to orderHistory if possible, or just let DB listener do it if user is logged in
            // To make sure guest sees it immediately:
            const newOrder: OrderInfo = {
              id: orderId,
              items: pendingOrder.cart,
              subtotal: subtotal,
              discount: 0,
              total: subtotal,
              pointsEarned: Math.floor(subtotal),
              status: 'recebido',
              timestamp: new Date()
            };
            setOrderHistory(prev => [newOrder, ...prev]);
            setActiveOrder(newOrder); // For tracking status immediately
          }).catch(e => console.error("Error saving Stripe order:", e));
          
        } catch (e) {
          console.error('Error processing pending order:', e);
        }
        localStorage.removeItem('pendingStripeOrder');
      }

      addToast({ message: 'Pagamento online realizado com sucesso! Acompanhe seu pedido.', type: 'success', title: 'Pagamento Confirmado!' });
      setCart([]);
      setView('profile');
      window.scrollTo(0,0);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }`;

content = content.replace(regex, newSuccess);
fs.writeFileSync('src/App.tsx', content);
