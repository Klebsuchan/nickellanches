const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldSuccess = `      addToast({ message: 'Pagamento online realizado com sucesso! Seu pedido já está sendo preparado.', type: 'success', title: 'Pagamento Confirmado!' });
      setCart([]);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);`;

const newSuccess = `      addToast({ message: 'Pagamento online realizado com sucesso! Acompanhe seu pedido.', type: 'success', title: 'Pagamento Confirmado!' });
      setCart([]);
      setView('profile');
      window.scrollTo(0,0);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);`;

content = content.replace(oldSuccess, newSuccess);
fs.writeFileSync('src/App.tsx', content);
