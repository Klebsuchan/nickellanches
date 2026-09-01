const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const toastEffect = `
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeOrder?.id) return;
    
    const unsub = subscribeToOrder(activeOrder.id, (orderData) => {
      if (orderData.status && orderData.status !== prevStatusRef.current) {
        const newStatus = orderData.status;
        
        if (prevStatusRef.current !== null) { // only if it's a change, not initial load
          if (newStatus === 'em_preparo') {
            addToast({
              title: 'Oba!',
              message: 'Seu lanche entrou em preparo. A chapa tá quente!',
              type: 'info'
            });
            playSound('powerup');
          } else if (newStatus === 'a_caminho') {
            addToast({
              title: 'Partiu!',
              message: 'O motoboy saiu para entrega. Fique atento!',
              type: 'success'
            });
            playSound('powerup');
          } else if (newStatus === 'entregue') {
            addToast({
              title: 'Entrega Concluída',
              message: 'Seu lanche chegou. Bom apetite!',
              type: 'success'
            });
            playSound('powerup');
          }
        }
        
        prevStatusRef.current = newStatus;
      }
    });
    
    return () => unsub();
  }, [activeOrder?.id, addToast]);
`;

// Insert after useEffects
content = content.replace("const handleAcceptCookies = () => {", toastEffect + "\n\n  const handleAcceptCookies = () => {");
content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect, useRef } from 'react';");
content = content.replace("import { subscribeToProducts, subscribeToPromos", "import { subscribeToOrder, getLatestOrders, subscribeToProducts, subscribeToPromos");
fs.writeFileSync('src/App.tsx', content);
