const fs = require('fs');
let code = fs.readFileSync('src/components/DogGame.tsx', 'utf8');

const regex = /\/\/ Status subscription[\s\S]*?\/\/ Trigger completion for real orders/;

const replacement = `// Status subscription
  useEffect(() => {
    if (!order?.id) return;

    const unsub = subscribeToOrder(order.id, (orderData) => {
      if (orderData.status) {
        const status = orderData.status as any;
        setOrderStatus(status);
        
        switch(status) {
          case 'pendente': setProgress(10); break;
          case 'cozinha_confirmou': setProgress(30); break;
          case 'em_preparo': setProgress(60); break;
          case 'a_caminho': setProgress(85); break;
          case 'entregue': setProgress(100); break;
        }
      }
    });

    return () => unsub();
  }, [order?.id]);

  // Trigger completion for real orders`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/DogGame.tsx', code);
