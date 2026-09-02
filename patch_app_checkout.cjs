const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const newHandleCheckout = `  const handleCheckout = async (details: any) => {
    if (cart.length === 0) return;
    
    // 1. Send WhatsApp message
    let msg = \`Olá! Gostaria de fazer um pedido:\\n\\n*ITENS DO PEDIDO:*\\n\`;
    cart.forEach(item => {
      const itemTotal = (item.price + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0)) * item.quantity;
      msg += \`- \${item.quantity}x \${item.name} (R$ \${itemTotal.toFixed(2).replace('.', ',')})\\n\`;
      if (item.extras && item.extras.length > 0) {
        msg += \`  *Adicionais:* \${item.extras.map(e => e.name).join(', ')}\\n\`;
      }
      if (item.observation) {
        msg += \`  *Obs:* \${item.observation}\\n\`;
      }
      msg += '\\n';
    });
    
    if (discountAmount > 0) {
      msg += \`*Desconto:* -R$ \${discountAmount.toFixed(2).replace('.', ',')}\\n\`;
    }
    msg += \`*TOTAL: R$ \${totalCart.toFixed(2).replace('.', ',')}*\\n\\n\`;
    
    msg += \`*DADOS PARA ENTREGA:*\\n\`;
    msg += \`Nome: \${details.name}\\n\`;
    msg += \`WhatsApp: \${details.whatsapp}\\n\`;
    msg += \`Endereço: \${details.address}\\n\`;
    msg += \`Forma de Pagamento: \${details.paymentMethod}\\n\`;
    
    const phone = '5554999598388';
    window.open(\`https://wa.me/\${phone}?text=\${encodeURIComponent(msg)}\`, '_blank');
    
    // 2. Save order to Firebase
    let orderId = Math.random().toString(36).substring(2, 9).toUpperCase();
    try {
      const uid = user ? user.uid : 'guest';
      orderId = await saveOrder(uid, {
        items: cart,
        totalPrice: totalCart,
        totalPoints: totalPoints,
        status: 'recebido',
        userName: details.name || user?.displayName || 'Anônimo',
        address: details.address,
        paymentMethod: details.paymentMethod,
        whatsapp: details.whatsapp
      });
    } catch(e) {
      console.error("Error saving order", e);
    }

    const newOrder: OrderInfo = {
      id: orderId,
      items: [...cart],
      subtotal: totalCartBase,
      discount: discountAmount,
      total: totalCart,
      pointsEarned: totalPoints,
      status: 'recebido',
      timestamp: new Date()
    };
    
    setActiveOrder(newOrder);
    setOrderHistory(prev => [newOrder, ...prev]);
    setCart([]);
    setAppliedDiscount(null);
    setDiscountCode('');
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    setView('game');
    
    addToast({
      title: 'Pedido Enviado!',
      message: 'Pedido enviado para o WhatsApp e lanche na chapa!',
      type: 'info'
    });
  };`;

content = content.replace(/const handleCheckout = async \(\) => \{[\s\S]*?\}\s*\}\s*setView\('menu'\);\n    setActiveOrder\(null\);/g, (match) => {
  // Wait, I shouldn't replace handleFinishOrder.
  return match; // fallback
});

// A better way: replace the old handleCheckout definition
const oldHandleCheckoutStart = `  const handleCheckout = async () => {`;
const startIdx = content.indexOf(oldHandleCheckoutStart);
if(startIdx !== -1) {
  const endMarker = `  const handleFinishOrder = async () => {`;
  const endIdx = content.indexOf(endMarker, startIdx);
  if(endIdx !== -1) {
    const oldBlock = content.substring(startIdx, endIdx);
    content = content.replace(oldBlock, newHandleCheckout + '\n\n');
  }
}

// Replace the CheckoutModal onConfirm to use handleCheckout
const oldCheckoutModal = `      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        total={totalCart}
        onConfirm={(details) => {
          let msg = \`Olá! Gostaria de fazer um pedido:\\n\\n*ITENS DO PEDIDO:*\\n\`;
          
          cart.forEach(item => {
            const itemTotal = (item.price + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0)) * item.quantity;
            msg += \`- \${item.quantity}x \${item.name} (R$ \${itemTotal.toFixed(2).replace('.', ',')})\\n\`;
            
            if (item.extras && item.extras.length > 0) {
              msg += \`  *Adicionais:* \${item.extras.map(e => e.name).join(', ')}\\n\`;
            }
            if (item.observation) {
              msg += \`  *Obs:* \${item.observation}\\n\`;
            }
            msg += '\\n';
          });
          
          if (discountAmount > 0) {
            msg += \`*Desconto:* -R$ \${discountAmount.toFixed(2).replace('.', ',')}\\n\`;
          }
          
          msg += \`*TOTAL: R$ \${totalCart.toFixed(2).replace('.', ',')}*\\n\\n\`;
          
          msg += \`*DADOS PARA ENTREGA:*\\n\`;
          msg += \`Nome: \${details.name}\\n\`;
          msg += \`WhatsApp: \${details.whatsapp}\\n\`;
          msg += \`Endereço: \${details.address}\\n\`;
          msg += \`Forma de Pagamento: \${details.paymentMethod}\\n\`;
          
          const phone = '5554999598388';
          window.open(\`https://wa.me/\${phone}?text=\${encodeURIComponent(msg)}\`, '_blank');
          
          setCart([]);
          setIsCheckoutOpen(false);
          addToast({ message: 'Pedido enviado para o WhatsApp!', type: 'success' });
        }}
      />`;

const newCheckoutModal = `      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        total={totalCart}
        onConfirm={handleCheckout}
      />`;

content = content.replace(oldCheckoutModal, newCheckoutModal);

fs.writeFileSync('src/App.tsx', content);
