const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    let orderId = Math.random().toString(36).substring(2, 9).toUpperCase();
    try {
      const uid = user ? user.uid : 'guest';
      orderId = await saveOrder(uid, {
        items: cart,
        totalPrice: totalCart,
        totalPoints: totalPoints,
        status: 'preparando', // initial status
        userName: user?.displayName || 'Anônimo'
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
      status: 'preparando',
      timestamp: new Date()
    };
    
    setActiveOrder(newOrder);
    setOrderHistory(prev => [newOrder, ...prev]);
    setCart([]);
    setAppliedDiscount(null);
    setDiscountCode('');
    setIsCartOpen(false);
    setView('game');
    window.scrollTo(0, 0);
  };`;

const replacement = `  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const paymentMethod = window.prompt("Como será a forma de pagamento? (Pix, Dinheiro, Cartão na Entrega)\\nDeixe em branco se for no balcão.");
    const address = window.prompt("Qual o endereço de entrega?\\nDeixe em branco para retirar no balcão.");
    
    let orderId = Math.random().toString(36).substring(2, 9).toUpperCase();
    try {
      const uid = user ? user.uid : 'guest';
      orderId = await saveOrder(uid, {
        items: cart,
        totalPrice: totalCart,
        totalPoints: totalPoints,
        status: 'preparando',
        userName: user?.displayName || 'Anônimo',
        paymentMethod: paymentMethod || 'Não informado',
        address: address || 'Retirada no Balcão'
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
      status: 'preparando',
      timestamp: new Date()
    };
    
    let itemsText = cart.map(item => {
      let extrasText = item.extras?.map(e => \`+ \${e.name}\`).join(', ') || '';
      return \`\${item.quantity}x \${item.name} \${extrasText ? '('+extrasText+')' : ''}\`;
    }).join('\\n');

    const whatsappMessage = 
\`*Novo Pedido (ID: \${orderId})*
*Cliente:* \${user?.displayName || 'Anônimo'}

*Itens:*
\${itemsText}

*Subtotal:* R$ \${totalCartBase.toFixed(2).replace('.', ',')}
*Desconto:* R$ \${discountAmount.toFixed(2).replace('.', ',')}
*Total:* R$ \${totalCart.toFixed(2).replace('.', ',')}

*Pagamento:* \${paymentMethod || 'Não informado'}
*Entrega:* \${address || 'Retirada no Balcão'}\`;

    const encodedMessage = encodeURIComponent(whatsappMessage);
    // Use window.open instead of changing href, to not break the page reload logic
    window.open(\`https://wa.me/5554999598288?text=\${encodedMessage}\`, '_blank');
    
    setActiveOrder(newOrder);
    setOrderHistory(prev => [newOrder, ...prev]);
    setCart([]);
    setAppliedDiscount(null);
    setDiscountCode('');
    setIsCartOpen(false);
    setView('game');
    window.scrollTo(0, 0);
  };`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);
console.log('Replaced.');
