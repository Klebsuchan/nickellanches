const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldUseEffect = `  useEffect(() => {
    // Scroll handling for floating header`;
const newUseEffect = `  useEffect(() => {
    // Stripe Payment Success/Cancel handling
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      showToast('Pagamento online realizado com sucesso! Seu pedido já está sendo preparado.', 'success');
      setCart([]);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'canceled') {
      showToast('Pagamento cancelado. Você ainda pode tentar novamente.', 'error');
      setIsCartOpen(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Scroll handling for floating header`;

content = content.replace(oldUseEffect, newUseEffect);
fs.writeFileSync('src/App.tsx', content);
