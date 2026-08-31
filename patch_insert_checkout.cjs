const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const checkoutModalJSX = `
      <CheckoutModal
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
          
          const phone = '5551980302275'; // Dummy number
          window.open(\`https://wa.me/\${phone}?text=\${encodeURIComponent(msg)}\`, '_blank');
          
          setCart([]);
          setIsCheckoutOpen(false);
          addToast({ message: 'Pedido enviado para o WhatsApp!', type: 'success' });
        }}
      />
`;

content = content.replace(
  "<CartDrawer",
  checkoutModalJSX + "\n      <CartDrawer"
);

fs.writeFileSync('src/App.tsx', content);
console.log('CheckoutModal inserted in App.tsx');
